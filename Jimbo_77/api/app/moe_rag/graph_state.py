"""
MoE-RAG Graph State Machine
Defines the state structure and transitions for the intelligent routing system.
"""

from typing import TypedDict, List, Dict, Any, Optional
from enum import Enum


class RoutingDecision(str, Enum):
    """Routing path decisions"""

    FAST_PATH = "fast"
    EXPERT_PATH = "expert"
    HYBRID_PATH = "hybrid"


class GraphState(TypedDict):
    """
    State machine for MoE-RAG orchestration.

    Attributes:
        user_input: Original user query
        routing_decision: Which path to take (fast/expert/hybrid)
        retrieved_docs: Documents retrieved from indices
        agent_results: Results from dispatched agents
        final_response: Synthesized response
        metadata: Additional tracking data (latency, cost, confidence)
    """

    user_input: str
    routing_decision: Optional[RoutingDecision]
    retrieved_docs: Optional[List[Dict[str, Any]]]
    agent_results: Optional[Dict[str, Any]]
    final_response: Optional[str]
    metadata: Optional[Dict[str, Any]]


# Node type definitions
def route_node(state: GraphState) -> GraphState:
    """
    Router node - decides which path to take based on query characteristics.

    Logic:
    - If query length < 200 chars AND matches FAQ → FAST_PATH
    - If query contains technical keywords OR length > 500 → EXPERT_PATH
    - Otherwise → HYBRID_PATH (MoE routing)
    """
    query = state["user_input"]
    query_len = len(query)

    # Simple heuristics (will be replaced by gating network)
    if query_len < 200 and is_faq_style(query):
        decision = RoutingDecision.FAST_PATH
    elif query_len > 500 or has_technical_keywords(query):
        decision = RoutingDecision.EXPERT_PATH
    else:
        decision = RoutingDecision.HYBRID_PATH

    state["routing_decision"] = decision
    state["metadata"] = {
        "query_length": query_len,
        "has_technical_keywords": has_technical_keywords(query),
        "route_timestamp": __import__("datetime").datetime.now().isoformat(),
    }

    return state


def retrieve_node(state: GraphState) -> GraphState:
    """
    Retrieval node - fetches relevant documents from indices based on routing decision.

    FAST_PATH: Query FAQ index only (top-3)
    EXPERT_PATH: Query all 3 indices (FAQ + Technical + Domain, top-5 each)
    HYBRID_PATH: Query 2 indices (FAQ + Domain, top-4 each)
    """
    # Placeholder - will be implemented with actual vector stores
    decision = state["routing_decision"]
    docs = []

    if decision == RoutingDecision.FAST_PATH:
        docs = [{"index_type": "faq", "source": "FAQ", "content": "Sample FAQ doc"}]
    elif decision == RoutingDecision.EXPERT_PATH:
        docs = [
            {"index_type": "faq", "source": "FAQ", "content": "Sample FAQ"},
            {
                "index_type": "technical",
                "source": "Technical",
                "content": "Sample tech doc",
            },
            {
                "index_type": "domain",
                "source": "Domain",
                "content": "Sample domain doc",
            },
        ]
    else:  # HYBRID
        docs = [
            {"index_type": "faq", "source": "FAQ", "content": "Sample FAQ"},
            {
                "index_type": "domain",
                "source": "Domain",
                "content": "Sample domain doc",
            },
        ]

    state["retrieved_docs"] = docs
    return state


def dispatch_node(state: GraphState) -> GraphState:
    """
    Dispatch node - routes to appropriate AI agents based on query type.
    Will be implemented in dispatcher.py
    """
    # Placeholder - will call actual agent dispatcher
    state["agent_results"] = {"agent_ids": [], "outputs": [], "latency_ms": 0}
    state["metadata"]["agent_dispatch_status"] = "success"
    return state


def synthesis_node(state: GraphState) -> GraphState:
    """
    Synthesis node - combines retrieval results + agent outputs into final response.
    """
    docs = state.get("retrieved_docs", [])
    agent_results = state.get("agent_results")

    # Simple synthesis (will be enhanced with verification agent)
    response = f"Based on {len(docs)} documents"
    if agent_results and agent_results.get("outputs"):
        response += f" and {len(agent_results['outputs'])} agents"

    state["final_response"] = response
    return state


# Edge condition helpers
def should_use_fast_path(state: GraphState) -> bool:
    """Edge condition: check if fast path should be used"""
    return state.get("routing_decision") == RoutingDecision.FAST_PATH


def should_use_expert_path(state: GraphState) -> bool:
    """Edge condition: check if expert path should be used"""
    return state.get("routing_decision") == RoutingDecision.EXPERT_PATH


def should_use_hybrid_path(state: GraphState) -> bool:
    """Edge condition: check if hybrid path should be used"""
    return state.get("routing_decision") == RoutingDecision.HYBRID_PATH


# Helper functions
def is_faq_style(query: str) -> bool:
    """Check if query looks like a FAQ (simple question)"""
    faq_keywords = ["jak", "co", "gdzie", "kiedy", "dlaczego", "ile"]
    query_lower = query.lower()
    return any(kw in query_lower for kw in faq_keywords) and len(query.split()) < 15


def has_technical_keywords(query: str) -> bool:
    """Check if query contains technical/complex keywords"""
    technical_keywords = [
        "api",
        "kod",
        "implementacja",
        "architektura",
        "framework",
        "deploy",
        "docker",
        "kubernetes",
        "optimization",
        "algorithm",
    ]
    query_lower = query.lower()
    return any(kw in query_lower for kw in technical_keywords)
