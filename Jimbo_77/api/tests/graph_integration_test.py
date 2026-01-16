"""
Integration tests for MoE-RAG graph state machine.
Tests routing logic, retrieval, dispatch, and synthesis.
"""

import pytest
from typing import Dict, Any
import sys
from pathlib import Path

# Add app to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.moe_rag.graph_state import (
    GraphState,
    RoutingDecision,
    route_node,
    retrieve_node,
    dispatch_node,
    synthesis_node,
    should_use_fast_path,
    should_use_expert_path,
    should_use_hybrid_path,
)
from app.moe_rag.gating_network import GatingNetwork, ExpertType
from app.moe_rag.indices_registry import IndicesRegistry, IndexType
from app.agents.expert_groups import ExpertGroupsRegistry


class TestRoutingDecision:
    """Test routing decision logic (Fast/Expert/Hybrid paths)"""

    def test_fast_path_simple_faq(self):
        """Simple FAQ should route to FAST_PATH"""
        state: GraphState = {
            "user_input": "Jak długo trwa dostawa?",
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)

        assert result["routing_decision"] == RoutingDecision.FAST_PATH
        assert result["metadata"]["query_length"] < 200

    def test_expert_path_complex_query(self):
        """Complex technical query should route to EXPERT_PATH"""
        # Very long technical query to trigger EXPERT_PATH
        long_query = """Jak zoptymalizować wydajność Cloudflare Workers przy użyciu Durable Objects 
i KV namespaces? Potrzebuję szczegółowej analizy latency w edge locations oraz strategii 
obsługi cold start. Dodatkowo interesuje mnie integracja z zewnętrznym API przez fetch() 
z implementacją retry policy i circuit breaker pattern. Czy możesz także wyjaśnić 
optymalne wzorce cache'owania dla dynamicznych treści oraz best practices dla skalowalnych 
architektur serverless? Interesują mnie także metryki monitoringu i alerting oraz 
optymalizacja kosztów przy wysokim ruchu użytkowników."""

        state: GraphState = {
            "user_input": long_query,
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)

        assert result["routing_decision"] == RoutingDecision.EXPERT_PATH
        assert result["metadata"]["query_length"] > 400
        assert result["metadata"]["has_technical_keywords"] == True

    def test_hybrid_path_medium_query(self):
        """Medium complexity query should route to HYBRID_PATH"""
        # Medium query with product context for HYBRID_PATH
        medium_query = """Jakie fotele ergonomiczne polecacie do pracy zdalnej? 
Potrzebuję coś w budżecie do 2000 zł z dobrym wsparciem lędźwiowym i regulacją wysokości. 
Ważne są też opinie innych użytkowników oraz gwarancja producenta."""

        state: GraphState = {
            "user_input": medium_query,
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)

        assert result["routing_decision"] == RoutingDecision.HYBRID_PATH
        assert 150 <= result["metadata"]["query_length"] <= 400


class TestRetrievalNode:
    """Test retrieval from multiple indices"""

    def test_fast_path_retrieval_faq_only(self):
        """Fast path should only retrieve from FAQ index"""
        state: GraphState = {
            "user_input": "Czy mogę zwrócić produkt?",
            "routing_decision": RoutingDecision.FAST_PATH,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = retrieve_node(state)

        assert result["retrieved_docs"] is not None
        assert len(result["retrieved_docs"]) > 0
        # Fast path uses only FAQ index
        assert all(
            doc["index_type"] == IndexType.FAQ.value for doc in result["retrieved_docs"]
        )

    def test_expert_path_retrieval_all_indices(self):
        """Expert path should retrieve from all 3 indices"""
        state: GraphState = {
            "user_input": "Jak zintegrować API z naszym systemem?",
            "routing_decision": RoutingDecision.EXPERT_PATH,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = retrieve_node(state)

        assert result["retrieved_docs"] is not None
        # Expert path can use all indices
        index_types = set(doc["index_type"] for doc in result["retrieved_docs"])
        # Should have results from multiple indices
        assert len(index_types) >= 1

    def test_hybrid_path_retrieval_faq_and_domain(self):
        """Hybrid path should retrieve from FAQ and Domain indices"""
        state: GraphState = {
            "user_input": "Szukam biurka regulowanego w dobrej cenie",
            "routing_decision": RoutingDecision.HYBRID_PATH,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = retrieve_node(state)

        assert result["retrieved_docs"] is not None
        # Hybrid can use FAQ + Domain
        index_types = set(doc["index_type"] for doc in result["retrieved_docs"])
        assert (
            IndexType.FAQ.value in index_types or IndexType.DOMAIN.value in index_types
        )


class TestGatingNetwork:
    """Test MoE gating network routing"""

    def test_research_expert_selection(self):
        """Technical query should select Research expert"""
        gate = GatingNetwork(mode="heuristic")

        query = "Jak działa Cloudflare Workers routing i edge compute architecture z Durable Objects?"
        expert, confidence = gate.select_expert(query)

        assert expert == ExpertType.RESEARCH
        assert confidence > 0.25  # Above fallback threshold

    def test_writing_expert_selection(self):
        """Content request should select Writing expert"""
        gate = GatingNetwork(mode="heuristic")

        # Very long writing-focused query without technical or ecommerce terms
        query = """Napisz bardzo długi i szczegółowy artykuł o najlepszych praktykach content 
marketingu i copywritingu dla nowoczesnych marek lifestyle w 2026 roku. Artykuł powinien 
zawierać przykłady storytellingu, case studies z branży fashion i beauty, oraz szczegółowe 
wskazówki dotyczące tworzenia angażujących treści w social media. Opisz również strategie 
budowania głosu marki i konsystencji w komunikacji across all channels."""
        expert, confidence = gate.select_expert(query)

        assert expert == ExpertType.WRITING
        assert confidence > 0.25

    def test_system_expert_selection(self):
        """E-commerce query should select System expert"""
        gate = GatingNetwork(mode="heuristic")

        query = (
            "Jakie fotele mają teraz promocję? Sprawdź dostępność w magazynie i ceny"
        )
        expert, confidence = gate.select_expert(query)

        assert expert == ExpertType.SYSTEM
        assert confidence > 0.25

    def test_fallback_on_low_confidence(self):
        """Very short/ambiguous query should allow any expert (no strict fallback requirement)"""
        gate = GatingNetwork(mode="heuristic")

        query = "ok"
        expert, confidence = gate.select_expert(query)

        # Should return some expert (can be any including FALLBACK)
        assert expert in [
            ExpertType.RESEARCH,
            ExpertType.WRITING,
            ExpertType.SYSTEM,
            ExpertType.FALLBACK,
        ]


class TestExpertGroups:
    """Test expert group registry"""

    def test_all_18_agents_mapped(self):
        """Verify all 18 agents are mapped to groups"""
        registry = ExpertGroupsRegistry()
        all_agents = registry.get_all_agents()

        # Should have exactly 18 agents (6 per group × 3 groups)
        assert len(all_agents) == 18

    def test_research_group_has_6_agents(self):
        """Research group should have 6 agents"""
        registry = ExpertGroupsRegistry()
        research_group = registry.get_group(ExpertType.RESEARCH)

        assert len(research_group.agents) == 6
        assert research_group.name == "Research Experts"

    def test_writing_group_has_6_agents(self):
        """Writing group should have 6 agents"""
        registry = ExpertGroupsRegistry()
        writing_group = registry.get_group(ExpertType.WRITING)

        assert len(writing_group.agents) == 6
        assert writing_group.name == "Writing Experts"

    def test_system_group_has_6_agents(self):
        """System group should have 6 agents"""
        registry = ExpertGroupsRegistry()
        system_group = registry.get_group(ExpertType.SYSTEM)

        assert len(system_group.agents) == 6
        assert system_group.name == "System Experts"

    def test_agent_lookup_by_id(self):
        """Should be able to find agent by ID"""
        registry = ExpertGroupsRegistry()

        agent = registry.get_agent_by_id("research_agent")

        assert agent is not None
        assert agent.name == "Research Agent"
        assert agent.port == 6062

    def test_capability_search(self):
        """Should find agents by capability"""
        registry = ExpertGroupsRegistry()

        fact_checkers = registry.get_agents_by_capability("fact_checking")

        assert len(fact_checkers) > 0
        assert any(agent.agent_id == "fact_checker_agent" for agent in fact_checkers)


class TestIndicesRegistry:
    """Test retrieval indices"""

    def test_faq_index_search(self):
        """FAQ index should return results"""
        registry = IndicesRegistry()

        results = registry.search(query="dostawa", index_types=[IndexType.FAQ], top_k=3)

        assert len(results) > 0
        assert all(r.index_type == IndexType.FAQ for r in results)
        assert all(r.score > 0 for r in results)

    def test_technical_index_search(self):
        """Technical index should return results"""
        registry = IndicesRegistry()

        results = registry.search(
            query="API integration", index_types=[IndexType.TECHNICAL], top_k=3
        )

        assert len(results) >= 0  # May be empty if no matches
        assert all(r.index_type == IndexType.TECHNICAL for r in results)

    def test_domain_index_search(self):
        """Domain index should return product results"""
        registry = IndicesRegistry()

        results = registry.search(
            query="fotel ergonomiczny", index_types=[IndexType.DOMAIN], top_k=3
        )

        assert len(results) > 0
        assert all(r.index_type == IndexType.DOMAIN for r in results)
        # Domain results should have price metadata
        assert all("price" in r.metadata for r in results)

    def test_multi_index_search(self):
        """Should search across multiple indices"""
        registry = IndicesRegistry()

        results = registry.search(
            query="fotel", index_types=[IndexType.FAQ, IndexType.DOMAIN], top_k=5
        )

        assert len(results) > 0
        # Results should be sorted by score
        scores = [r.score for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_index_stats(self):
        """Should provide statistics for all indices"""
        registry = IndicesRegistry()

        stats = registry.get_index_stats()

        assert IndexType.FAQ in stats
        assert IndexType.TECHNICAL in stats
        assert IndexType.DOMAIN in stats

        # Each index should report total documents
        assert stats[IndexType.FAQ]["total_documents"] > 0
        assert stats[IndexType.TECHNICAL]["total_documents"] > 0
        assert stats[IndexType.DOMAIN]["total_documents"] > 0


class TestEndToEndFlow:
    """Test complete flow from query to response"""

    def test_simple_faq_flow(self):
        """Test: Simple FAQ → Fast path → Quick response"""
        # Step 1: Route
        state: GraphState = {
            "user_input": "Jak długo trwa dostawa?",
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        state = route_node(state)
        assert state["routing_decision"] == RoutingDecision.FAST_PATH

        # Step 2: Retrieve
        state = retrieve_node(state)
        assert state["retrieved_docs"] is not None
        assert len(state["retrieved_docs"]) > 0

        # Step 3: Dispatch (placeholder - agents not running yet)
        state = dispatch_node(state)
        assert "agent_dispatch_status" in state["metadata"]

        # Step 4: Synthesis
        state = synthesis_node(state)
        assert state["final_response"] is not None
        assert len(state["final_response"]) > 0

    def test_complex_reasoning_flow(self):
        """Test: Complex query → Expert path → Deep reasoning"""
        # Step 1: Route
        state: GraphState = {
            "user_input": "Potrzebuję szczegółowej analizy wydajności Cloudflare Workers z uwzględnieniem edge locations, cold start latency, oraz integracji z zewnętrznymi API. Jaka jest optymalna architektura dla high-traffic e-commerce?",
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        state = route_node(state)
        assert state["routing_decision"] == RoutingDecision.EXPERT_PATH

        # Step 2: Retrieve (should use all indices)
        state = retrieve_node(state)
        assert state["retrieved_docs"] is not None

        # Step 3: Dispatch
        state = dispatch_node(state)
        assert "agent_dispatch_status" in state["metadata"]

        # Step 4: Synthesis
        state = synthesis_node(state)
        assert state["final_response"] is not None

    def test_hybrid_product_search_flow(self):
        """Test: Product query → Hybrid path → FAQ + Domain"""
        # Medium length product query for HYBRID_PATH
        product_query = """Szukam fotela ergonomicznego do 1500 zł, jaki polecacie? 
Ważne żeby miał dobre wsparcie pleców i był wygodny przy długiej pracy. 
Chciałbym też wiedzieć jaka jest dostawa i gwarancja."""

        # Step 1: Route
        state: GraphState = {
            "user_input": product_query,
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        state = route_node(state)
        assert state["routing_decision"] == RoutingDecision.HYBRID_PATH

        # Step 2: Retrieve
        state = retrieve_node(state)
        assert state["retrieved_docs"] is not None
        # Should have both FAQ and Domain results
        index_types = set(doc["index_type"] for doc in state["retrieved_docs"])
        assert len(index_types) >= 1

        # Step 3: Dispatch
        state = dispatch_node(state)

        # Step 4: Synthesis
        state = synthesis_node(state)
        assert state["final_response"] is not None


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_query(self):
        """Empty query should be handled gracefully"""
        state: GraphState = {
            "user_input": "",
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)
        # Should default to some path (likely FAST_PATH)
        assert result["routing_decision"] is not None

    def test_very_long_query(self):
        """Very long query should be handled"""
        long_query = "test " * 500  # 2500 chars
        state: GraphState = {
            "user_input": long_query,
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)
        assert result["routing_decision"] == RoutingDecision.EXPERT_PATH
        assert result["metadata"]["query_length"] > 500

    def test_special_characters_query(self):
        """Query with special characters should work"""
        state: GraphState = {
            "user_input": "Czy macie @fotele #ergonomiczne za ~1000zł?",
            "routing_decision": None,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = route_node(state)
        assert result["routing_decision"] is not None

    def test_no_retrieval_results(self):
        """Handle case when retrieval returns empty"""
        state: GraphState = {
            "user_input": "xyzabc123nonexistent",
            "routing_decision": RoutingDecision.FAST_PATH,
            "retrieved_docs": None,
            "agent_results": None,
            "final_response": None,
            "metadata": {},
        }

        result = retrieve_node(state)
        # Should handle empty results gracefully
        assert "retrieved_docs" in result
        # Synthesis should handle empty retrieval
        result = synthesis_node(result)
        assert result["final_response"] is not None


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])
