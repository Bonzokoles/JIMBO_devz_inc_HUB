"""
Helper functions for MoE-RAG route
"""

from typing import Dict, Any


def _generate_fallback_response(state: Dict[str, Any], decision) -> Dict[str, Any]:
    """
    Generate fallback response when LLM is not available
    Uses retrieved documents to create a simple response
    """
    if state["retrieved_docs"]:
        # Extract content from retrieved docs
        doc_contents = []
        for doc in state["retrieved_docs"][:5]:  # Top 5
            if isinstance(doc, dict):
                content = doc.get("content", doc.get("answer", ""))
                score = doc.get("score", 0.0)
                doc_contents.append(f"- {content} (relevance: {score:.2f})")

        if doc_contents:
            state["final_response"] = (
                f"Based on the retrieved information:\n\n"
                + "\n".join(doc_contents)
                + f"\n\nQuery analyzed via {decision.value} path using {len(state['selected_agents'])} agents."
            )
            state["response_confidence"] = 0.7
        else:
            state["final_response"] = (
                f"I found {len(state['retrieved_docs'])} relevant documents but couldn't extract specific answers. "
                f"Query routed via {decision.value}."
            )
            state["response_confidence"] = 0.5
    else:
        state["final_response"] = (
            f"No relevant information found for your query. Routing: {decision.value}"
        )
        state["response_confidence"] = 0.3

    # Set default metrics
    state["metrics"]["total_tokens_in"] = 0
    state["metrics"]["total_tokens_out"] = 0
    state["metrics"]["total_cost_usd"] = 0.0

    return state
