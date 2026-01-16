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
    from ..moe_rag.expert_groups import get_expert_groups
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
        # Initialize state
        state: GraphState = {
            "user_input": cleaned_query,
            "routing_decision": None,
            "routing_confidence": 0.0,
            "query_signals": None,
            "retrieved_docs": [],
            "selected_agents": [],
            "agent_responses": [],
            "final_response": None,
            "response_confidence": 0.0,
            "cache_hit": False,
            "indices_queried": [],
            "metrics": {
                "total_tokens_in": 0,
                "total_tokens_out": 0,
                "total_cost_usd": 0.0,
            },
        }

        # Step 2: Routing (using GatingNetwork)
        gating = GatingNetwork()
        signals = gating.extract_signals(cleaned_query)
        decision = gating.route(signals)

        state["routing_decision"] = decision
        state["routing_confidence"] = max(
            signals.query_length / 1000, 0.5
        )  # Simple confidence
        state["query_signals"] = signals

        logger.info(
            f"🧭 Routing: {decision.value} (signals: length={signals.query_length}, technical={signals.has_technical_terms})"
        )

        # Step 3: Retrieval (using embeddings if available, fallback to placeholder)
        if EMBEDDINGS_AVAILABLE:
            registry = get_vectorized_registry()

            if decision == RoutingDecision.FAST_PATH:
                # FAQ only
                results = await registry.faq_index.search(
                    cleaned_query, top_k=3, threshold=0.3
                )
                state["retrieved_docs"] = results
                state["indices_queried"] = ["faq"]
            elif decision == RoutingDecision.EXPERT_PATH:
                # All indices
                all_results = await registry.search_all(
                    cleaned_query, top_k_per_index=5, threshold=0.3
                )
                state["retrieved_docs"] = (
                    all_results.get("faq", [])
                    + all_results.get("technical", [])
                    + all_results.get("domain", [])
                )
                state["indices_queried"] = ["faq", "technical", "domain"]
            else:  # HYBRID_PATH
                # FAQ + Domain
                faq_results = await registry.faq_index.search(
                    cleaned_query, top_k=4, threshold=0.3
                )
                domain_results = await registry.domain_index.search(
                    cleaned_query, top_k=4, threshold=0.3
                )
                state["retrieved_docs"] = faq_results + domain_results
                state["indices_queried"] = ["faq", "domain"]

            logger.info(
                f"📚 Retrieved {len(state['retrieved_docs'])} documents from {state['indices_queried']}"
            )
        else:
            # Fallback to placeholder indices
            old_registry = get_indices_registry()
            if decision == RoutingDecision.FAST_PATH:
                state["retrieved_docs"] = old_registry.search(
                    "faq", cleaned_query, top_k=3
                )
                state["indices_queried"] = ["faq"]
            else:
                state["retrieved_docs"] = old_registry.search_all(
                    cleaned_query, top_k_per_index=5
                )
                state["indices_queried"] = ["faq", "technical", "domain"]

            logger.info(
                f"📚 Retrieved {len(state['retrieved_docs'])} documents (placeholder mode)"
            )

        # Step 4: Agent Selection (using expert groups)
        expert_groups = get_expert_groups()

        if decision == RoutingDecision.FAST_PATH:
            # Use research agents only
            state["selected_agents"] = [
                a["id"] for a in expert_groups.research_experts[:2]
            ]
        elif decision == RoutingDecision.EXPERT_PATH:
            # Use all agent groups
            state["selected_agents"] = (
                [a["id"] for a in expert_groups.research_experts[:2]]
                + [a["id"] for a in expert_groups.writing_experts[:2]]
                + [a["id"] for a in expert_groups.system_experts[:1]]
            )
        else:  # HYBRID
            # Research + Writing
            state["selected_agents"] = [
                a["id"] for a in expert_groups.research_experts[:2]
            ] + [a["id"] for a in expert_groups.writing_experts[:1]]

        logger.info(
            f"🤖 Selected {len(state['selected_agents'])} agents: {state['selected_agents']}"
        )

        # Step 5: Response Synthesis with LLM
        if LLM_AVAILABLE and state["retrieved_docs"]:
            try:
                llm_client = get_llm_client()

                # Generate AI response using retrieved documents
                llm_result = await llm_client.generate_response(
                    query=cleaned_query,
                    retrieved_docs=state["retrieved_docs"],
                    model="qwen",  # Default to Qwen 2.5 72B
                    max_tokens=1500,
                    temperature=0.7,
                )

                state["final_response"] = llm_result["response"]
                state["response_confidence"] = 0.85  # Higher confidence with LLM
                state["metrics"]["total_tokens_in"] = llm_result["tokens_input"]
                state["metrics"]["total_tokens_out"] = llm_result["tokens_output"]
                state["metrics"]["total_cost_usd"] = llm_result["cost_usd"]

                logger.info(
                    f"🤖 LLM response generated: {llm_result['model_name']} "
                    f"({llm_result['tokens_input']} + {llm_result['tokens_output']} tokens, "
                    f"${llm_result['cost_usd']:.6f})"
                )

            except Exception as e:
                logger.warning(f"LLM generation failed, using fallback: {e}")
                # Fallback to document-based response
                state = _generate_fallback_response(state, decision)
        else:
            # No LLM or no docs - use fallback
            state = _generate_fallback_response(state, decision)

        # Calculate metrics
        latency_ms = int((time.time() - start_time) * 1000)

        # Mock tokens (in production, these come from actual LLM calls)
        state["metrics"]["total_tokens_in"] = len(cleaned_query.split())
        state["metrics"]["total_tokens_out"] = len(state["final_response"].split())
        state["metrics"]["total_cost_usd"] = (
            state["metrics"]["total_tokens_in"] + state["metrics"]["total_tokens_out"]
        ) * 0.000001

        # Build response
        response = MoERAGResponse(
            response=state["final_response"],
            confidence=state["response_confidence"],
            agents_used=state["selected_agents"],
            routing_path=decision.value,
            latency_ms=latency_ms,
            tokens_used={
                "input": state["metrics"]["total_tokens_in"],
                "output": state["metrics"]["total_tokens_out"],
            },
            cost_usd=state["metrics"]["total_cost_usd"],
            sources=state["indices_queried"],
            cache_hit=False,
            metadata={
                "routing_confidence": state["routing_confidence"],
                "documents_retrieved": len(state["retrieved_docs"]),
                "query_signals": {
                    "length": signals.query_length,
                    "technical": signals.has_technical_terms,
                    "writing": signals.has_writing_terms,
                    "ecommerce": signals.has_ecommerce_terms,
                },
                "embeddings_mode": EMBEDDINGS_AVAILABLE,
            },
        )

        logger.info(
            f"✅ MoE-RAG response: {response.routing_path} ({latency_ms}ms, {len(state['retrieved_docs'])} docs)"
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
