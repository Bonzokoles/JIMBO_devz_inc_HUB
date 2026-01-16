"""
FastAPI routes for MoE-RAG endpoint
GET /api/moe-rag/health
POST /api/moe-rag
POST /api/moe-rag/debug
"""

import logging
import time
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Import from existing code
try:
    from ..moe_rag.graph_state import GraphState, RoutingDecision
    from ..moe_rag.gating_network import GatingNetwork, QuerySignals
    from ..moe_rag.indices_registry import get_indices_registry

    # from ..moe_rag.expert_groups import get_expert_groups  # Not needed for minimal version
    from ..moe_rag.graph_definition import run_moe_rag
    from ..security.input_validator import InputValidator

    GRAPH_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Graph components not available: {e}")
    GRAPH_AVAILABLE = False

# Import embeddings (new implementation)
try:
    from ..moe_rag.embeddings import get_indices_registry as get_vectorized_registry

    EMBEDDINGS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Embeddings not available: {e}")
    EMBEDDINGS_AVAILABLE = False

# Import LLM client for AI models
try:
    from ..ai.llm_client import get_llm_client

    LLM_AVAILABLE = True
except ImportError as e:
    logging.warning(f"LLM client not available: {e}")
    LLM_AVAILABLE = False

# Import helpers
from .moe_rag_helpers import _generate_fallback_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/moe-rag", tags=["moe-rag"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================


class MoERAGRequest(BaseModel):
    """Request model for MoE-RAG endpoint"""

    query: str = Field(..., description="User query", min_length=2, max_length=2000)
    user_id: Optional[str] = Field(None, description="Optional user ID")
    session_id: Optional[str] = Field(None, description="Optional session ID")
    use_cache: bool = Field(True, description="Whether to use cache")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "What is the price of ergonomic chairs?",
                "user_id": "user123",
                "session_id": "session456",
            }
        }


class MoERAGResponse(BaseModel):
    """Response model for MoE-RAG endpoint"""

    response: str = Field(..., description="Generated response")
    confidence: float = Field(..., description="Response confidence score (0-1)")
    agents_used: List[str] = Field(
        default_factory=list, description="List of agents used"
    )
    routing_path: str = Field(
        ..., description="Routing path taken (fast/expert/hybrid)"
    )
    latency_ms: int = Field(..., description="Total latency in milliseconds")
    tokens_used: Dict[str, int] = Field(default_factory=dict, description="Token usage")
    cost_usd: float = Field(0.0, description="Estimated cost in USD")
    sources: List[str] = Field(default_factory=list, description="Data sources used")
    cache_hit: bool = Field(False, description="Whether result came from cache")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )


# ============================================================================
# HEALTH CHECK
# ============================================================================


@router.get("/health")
async def health_check():
    """
    Health check endpoint

    Returns service status and component availability
    """
    return {
        "status": "healthy",
        "service": "moe-rag",
        "version": "0.2.0",
        "components": {
            "graph": GRAPH_AVAILABLE,
            "embeddings": EMBEDDINGS_AVAILABLE,
            "input_validation": True,  # Always available
        },
        "timestamp": time.time(),
    }


# ============================================================================
# MAIN ENDPOINT (Simplified - no LangGraph yet)
# ============================================================================


@router.post("/", response_model=MoERAGResponse)
async def moe_rag_endpoint(request: MoERAGRequest) -> MoERAGResponse:
    """
    Main MoE-RAG endpoint

    POST /api/moe-rag
    {
      "query": "What is MoE-RAG?"
    }

    Returns comprehensive response with routing, retrieval, and synthesis
    """

    start_time = time.time()

    # Step 1: Input Validation
    is_valid, error, cleaned_query = InputValidator.validate_query(request.query)
    if not is_valid:
        logger.warning(f"Invalid query rejected: {error}")
        raise HTTPException(status_code=400, detail=f"Invalid query: {error}")

    logger.info(f"📨 MoE-RAG request: {cleaned_query[:100]}...")

    if not GRAPH_AVAILABLE:
        logger.error("Graph components not available")
        raise HTTPException(
            status_code=503,
            detail="MoE-RAG system not initialized. Check logs and dependencies.",
        )

    try:
        # Execute MoE-RAG graph
        state = await run_moe_rag(
            query=cleaned_query,
            user_id=request.user_id,
            session_id=request.session_id,
        )

        # Extract response data from state
        final_response = state.get("final_response", "No response generated")
        metadata = state.get("metadata") or {}
        retrieved_docs = state.get("retrieved_docs") or []
        routing_decision = state.get("routing_decision")

        # Calculate latency
        latency_ms = metadata.get(
            "total_latency_ms", int((time.time() - start_time) * 1000)
        )

        # Extract agents (mock for now if not in state)
        agent_results = state.get("agent_results") or {}
        agents_used = agent_results.get("agents_used", [])
        if not agents_used:
            # Fallback based on routing
            if routing_decision and routing_decision.value == "fast_path":
                agents_used = ["faq-retriever"]
            elif routing_decision and routing_decision.value == "expert_path":
                agents_used = ["research-agent-1", "writing-agent-1"]
            else:
                agents_used = ["hybrid-agent"]

        # Build response
        response = MoERAGResponse(
            response=final_response,
            confidence=metadata.get("response_confidence", 0.7),
            agents_used=agents_used,
            routing_path=routing_decision.value if routing_decision else "unknown",
            latency_ms=latency_ms,
            tokens_used=metadata.get("tokens_used", {"input": 0, "output": 0}),
            cost_usd=metadata.get("cost_usd", 0.0),
            sources=metadata.get("indices_queried", []),
            cache_hit=metadata.get("cache_hit", False),
            metadata={
                "routing_confidence": metadata.get("routing_confidence", 0.0),
                "documents_retrieved": metadata.get(
                    "documents_retrieved", len(retrieved_docs)
                ),
                "retrieval_time_ms": metadata.get("retrieval_time_ms", 0),
                "synthesis_time_ms": metadata.get("synthesis_time_ms", 0),
                "embeddings_mode": EMBEDDINGS_AVAILABLE,
            },
        )

        logger.info(
            f"✅ MoE-RAG response: {response.routing_path} ({latency_ms}ms, {len(retrieved_docs)} docs)"
        )
        return response

    except Exception as e:
        logger.error(f"❌ Error in MoE-RAG: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"MoE-RAG error: {str(e)}")


# ============================================================================
# DEBUG ENDPOINT
# ============================================================================


@router.post("/debug")
async def debug_endpoint(request: MoERAGRequest):
    """
    Debug endpoint - returns detailed routing info without full execution

    POST /api/moe-rag/debug
    {
      "query": "What is MoE?"
    }

    Returns detailed signal extraction and routing scores
    """

    try:
        if not GRAPH_AVAILABLE:
            raise HTTPException(
                status_code=503, detail="Graph components not available"
            )

        # Extract signals
        gating = GatingNetwork()
        signals = gating.extract_signals(request.query)
        decision = gating.route(signals)

        # Get expert groups
        expert_groups = get_expert_groups()

        return {
            "query": request.query,
            "query_length": len(request.query),
            "routing_decision": decision.value,
            "query_signals": {
                "query_length": signals.query_length,
                "has_technical_terms": signals.has_technical_terms,
                "has_writing_terms": signals.has_writing_terms,
                "has_ecommerce_terms": signals.has_ecommerce_terms,
                "has_data_terms": signals.has_data_terms,
                "needs_research": signals.needs_research,
                "needs_multi_agent": signals.needs_multi_agent,
            },
            "available_agents": {
                "research": [a["id"] for a in expert_groups.research_experts],
                "writing": [a["id"] for a in expert_groups.writing_experts],
                "system": [a["id"] for a in expert_groups.system_experts],
            },
            "components_status": {
                "graph": GRAPH_AVAILABLE,
                "embeddings": EMBEDDINGS_AVAILABLE,
                "llm": LLM_AVAILABLE,
                "validation": True,
            },
            "estimated_path": {
                "fast_path": decision == RoutingDecision.FAST_PATH,
                "expert_path": decision == RoutingDecision.EXPERT_PATH,
                "hybrid_path": decision == RoutingDecision.HYBRID_PATH,
            },
        }

    except Exception as e:
        logger.error(f"Debug error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
