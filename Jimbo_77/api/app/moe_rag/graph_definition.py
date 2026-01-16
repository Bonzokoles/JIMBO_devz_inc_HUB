"""
MoE-RAG Graph Definition (Minimal Implementation)
Provides core routing → retrieval → response flow without LangGraph

This is a simplified version that:
- Uses heuristic routing (GatingNetwork)
- Uses vectorized semantic search (embeddings)
- Generates template-based responses
- Returns structured GraphState

Future: Upgrade to full LangGraph DAG with agent dispatch
"""

import logging
import time
from typing import Optional

from .graph_state import GraphState, RoutingDecision
from .gating_network import GatingNetwork, ExpertType
from .embeddings import get_indices_registry

logger = logging.getLogger(__name__)


async def run_moe_rag(
    query: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> GraphState:
    """
    Main MoE-RAG execution flow (simplified)

    Flow:
    1. Route: Decide fast/expert/hybrid path
    2. Retrieve: Semantic search across indices
    3. Synthesize: Generate response from retrieved docs

    Args:
        query: User query string
        user_id: Optional user identifier
        session_id: Optional session identifier

    Returns:
        GraphState with results
    """

    start_time = time.time()

    # Initialize state
    state: GraphState = {
        "user_input": query,
        "routing_decision": None,
        "retrieved_docs": None,
        "agent_results": None,
        "final_response": None,
        "metadata": {
            "user_id": user_id,
            "session_id": session_id,
            "start_time": start_time,
        },
    }

    try:
        # ====================================================================
        # STEP 1: ROUTING - Decide which path to take
        # ====================================================================

        logger.info(f"[ROUTE] Query: {query[:100]}...")

        gating = GatingNetwork(mode="heuristic")
        expert_type, routing_confidence = gating.select_expert(query)

        # Map ExpertType to RoutingDecision
        # ExpertType.RESEARCH/WRITING/SYSTEM → RoutingDecision.EXPERT_PATH
        # ExpertType.FALLBACK → RoutingDecision.FAST_PATH
        if expert_type.value == "fallback":
            routing_decision = RoutingDecision.FAST_PATH
        else:
            # All expert types use expert path (can be refined later)
            routing_decision = RoutingDecision.EXPERT_PATH

        # Get routing explanation for metadata
        routing_explanation = gating.get_routing_explanation(query)

        state["routing_decision"] = routing_decision
        state["metadata"]["routing_confidence"] = routing_confidence
        state["metadata"]["routing_signals"] = routing_explanation.get("signals", {})
        state["metadata"]["expert_type"] = expert_type.value

        logger.info(
            f"[ROUTE] Decision: {routing_decision.value} (expert: {expert_type.value}, confidence: {routing_confidence:.2f})"
        )

        # ====================================================================
        # STEP 2: RETRIEVAL - Semantic search
        # ====================================================================

        logger.info(f"[RETRIEVE] Searching indices for: {routing_decision.value} path")

        retrieval_start = time.time()

        # Get vectorized indices registry
        registry = get_indices_registry()

        # Search based on routing decision
        docs = []
        sources = []

        if routing_decision == RoutingDecision.FAST_PATH:
            # FAQ only - fast path
            faq_results = await registry.search_by_index(
                "faq", query, top_k=3, threshold=0.3
            )
            docs = faq_results
            sources = ["FAQ"]
        elif routing_decision == RoutingDecision.EXPERT_PATH:
            # All indices - comprehensive search
            all_results = await registry.search_all(
                query, top_k_per_index=2, threshold=0.3
            )
            docs = (
                all_results.get("faq", [])
                + all_results.get("technical", [])
                + all_results.get("domain", [])
            )
            sources = ["FAQ", "Technical", "PUMO"]
        else:  # HYBRID_PATH
            # FAQ + Domain - balanced approach
            faq_results = await registry.search_by_index(
                "faq", query, top_k=2, threshold=0.3
            )
            domain_results = await registry.search_by_index(
                "domain", query, top_k=2, threshold=0.3
            )
            docs = faq_results + domain_results
            sources = ["FAQ", "PUMO"]

        retrieval_time = int((time.time() - retrieval_start) * 1000)

        # Convert to GraphState format
        retrieved_docs = []
        for doc in docs:
            retrieved_docs.append(
                {
                    "id": doc.get("id", "unknown"),
                    "content": doc.get("answer")
                    or doc.get("content")
                    or doc.get("title", ""),
                    "source": doc.get("source", "unknown"),
                    "score": doc.get("score", 0.0),
                    "metadata": doc,
                }
            )

        state["retrieved_docs"] = retrieved_docs
        state["metadata"]["retrieval_time_ms"] = retrieval_time
        state["metadata"]["indices_queried"] = sources
        state["metadata"]["documents_retrieved"] = len(retrieved_docs)

        logger.info(
            f"[RETRIEVE] Found {len(retrieved_docs)} docs from {sources} in {retrieval_time}ms"
        )

        # ====================================================================
        # STEP 3: SYNTHESIS - Generate response
        # ====================================================================

        logger.info("[SYNTHESIS] Generating response...")

        synthesis_start = time.time()

        if not retrieved_docs:
            # No relevant docs found
            state["final_response"] = (
                "Przepraszam, nie znalazłem odpowiednich informacji dla tego zapytania. "
                "Spróbuj przeformułować pytanie lub zapytać o coś innego."
            )
            state["metadata"]["response_confidence"] = 0.3
        else:
            # Generate response from top documents
            top_doc = retrieved_docs[0]
            source = top_doc["source"]
            content = top_doc["content"]
            score = top_doc["score"]

            # Template-based response (simple for now)
            if source == "FAQ":
                state["final_response"] = f"{content}"
                confidence = min(score, 0.95)
            elif source == "PUMO":
                # Product information
                metadata = top_doc.get("metadata", {})
                price = metadata.get("price")
                stock = metadata.get("stock", 0)

                response_parts = [content]
                if price:
                    response_parts.append(f"Cena: ${price}")
                if stock > 0:
                    response_parts.append(f"Dostępność: {stock} szt.")
                else:
                    response_parts.append("Produkt chwilowo niedostępny.")

                state["final_response"] = " | ".join(response_parts)
                confidence = score * 0.9
            else:
                # Technical or other content
                state["final_response"] = content
                confidence = score * 0.85

            state["metadata"]["response_confidence"] = confidence

            # Add source attribution
            if len(retrieved_docs) > 1:
                other_sources = [doc["source"] for doc in retrieved_docs[1:3]]
                unique_sources = list(set(other_sources))
                if unique_sources:
                    state[
                        "final_response"
                    ] += f"\n\n(Dodatkowe źródła: {', '.join(unique_sources)})"

        synthesis_time = int((time.time() - synthesis_start) * 1000)
        state["metadata"]["synthesis_time_ms"] = synthesis_time

        # ====================================================================
        # FINALIZE - Calculate metrics
        # ====================================================================

        total_time = int((time.time() - start_time) * 1000)

        state["metadata"]["total_latency_ms"] = total_time
        state["metadata"]["timestamp"] = time.time()

        # Mock cost calculation (simplified)
        # In real version, this would sum actual LLM token costs
        estimated_cost = 0.001 * (len(query) / 100)  # ~$0.001 per 100 chars
        state["metadata"]["cost_usd"] = estimated_cost

        # Mock tokens (for compatibility)
        state["metadata"]["tokens_used"] = {
            "input": len(query.split()),
            "output": (
                len(state["final_response"].split()) if state["final_response"] else 0
            ),
        }

        # Cache hit (always false in this simple version)
        state["metadata"]["cache_hit"] = False

        logger.info(
            f"[COMPLETE] Total: {total_time}ms, Confidence: {state['metadata'].get('response_confidence', 0):.2f}"
        )

        return state

    except Exception as e:
        logger.error(f"[ERROR] MoE-RAG execution failed: {e}", exc_info=True)

        # Return error state
        state["final_response"] = (
            f"Wystąpił błąd podczas przetwarzania zapytania: {str(e)}"
        )
        state["metadata"]["error"] = str(e)
        state["metadata"]["total_latency_ms"] = int((time.time() - start_time) * 1000)
        state["metadata"]["response_confidence"] = 0.0

        return state


# ============================================================================
# HELPER FUNCTION - For backwards compatibility
# ============================================================================


async def execute_moe_rag(query: str, user_id: Optional[str] = None) -> GraphState:
    """
    Alias for run_moe_rag (for compatibility with existing code)
    """
    return await run_moe_rag(query=query, user_id=user_id)
