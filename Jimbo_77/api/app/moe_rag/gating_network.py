"""
MoE Gating Network
Intelligent routing logic that decides which expert to use based on query signals.
"""

import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple
from enum import Enum


class ExpertType(str, Enum):
    """Available experts in MoE system"""

    RESEARCH = "research"  # Group A: research, deepseek, qa agents
    WRITING = "writing"  # Group B: writer, SEO, content agents
    SYSTEM = "system"  # Group C: analytics, ecommerce, code agents
    FALLBACK = "fallback"  # Simple single-agent path


@dataclass
class QuerySignals:
    """
    Features extracted from user query for gating decision.
    """

    query_length: int
    keyword_count: int
    similarity_to_faq: float  # 0-1, based on FAQ corpus similarity
    has_technical_terms: bool
    has_writing_terms: bool  # Signals for writing/content creation
    has_ecommerce_terms: bool
    prev_error_rate: float  # historical accuracy for similar queries
    complexity_score: float  # 0-1, based on NLP analysis


class GatingNetwork:
    """
    Gating network that routes queries to appropriate experts.

    Version 1: Heuristic-based (simple weighted signals)
    Version 2: Learned classifier (DistilBERT 3-class) - optional upgrade
    """

    def __init__(self, mode: str = "heuristic"):
        """
        Initialize gating network.

        Args:
            mode: "heuristic" or "learned" (ML-based)
        """
        self.mode = mode

        # Weights for heuristic mode (tuned based on Phase 2 benchmarks)
        self.expert_weights = {
            ExpertType.RESEARCH: {
                "query_length": 0.2,
                "keyword_count": 0.1,
                "has_technical_terms": 0.7,  # Strong signal for research
                "complexity_score": 0.0,
            },
            ExpertType.WRITING: {
                "query_length": 0.4,  # Writing queries tend to be longer
                "keyword_count": 0.3,
                "has_writing_terms": 0.7,  # Strong signal for writing
                "complexity_score": 0.1,
                "has_technical_terms": -0.3,  # Negative weight
                "has_ecommerce_terms": -0.2,  # Negative weight
            },
            ExpertType.SYSTEM: {
                "has_ecommerce_terms": 0.8,  # Strong signal for system/ecommerce
                "has_technical_terms": 0.2,
                "complexity_score": 0.0,
            },
        }

        # Fallback threshold (reduced to allow more expert routing)
        self.fallback_threshold = 0.25

    def extract_signals(self, query: str, context: Dict = None) -> QuerySignals:
        """
        Extract features from query for gating decision.

        Args:
            query: User input query
            context: Optional context (previous queries, user profile)

        Returns:
            QuerySignals object
        """
        # Basic signals
        query_length = len(query)
        words = query.split()
        keyword_count = len([w for w in words if len(w) > 4])

        # Technical terms detection
        technical_terms = [
            "api",
            "kod",
            "code",
            "deploy",
            "docker",
            "framework",
            "algorithm",
            "optimization",
            "architecture",
            "database",
            "cloudflare",
            "workers",
            "edge",
        ]
        has_technical = any(term in query.lower() for term in technical_terms)

        # Writing/content terms detection
        writing_terms = [
            "napisz",
            "artykuł",
            "treść",
            "content",
            "copywriting",
            "storytelling",
            "marketing",
            "brand",
            "marka",
            "komunikacja",
        ]
        has_writing = any(term in query.lower() for term in writing_terms)

        # E-commerce terms detection
        ecommerce_terms = [
            "produkt",
            "cena",
            "koszyk",
            "zamówienie",
            "dostawa",
            "meble",
            "fotel",
            "krzesło",
            "biurko",
            "promocja",
            "sklep",
        ]
        has_ecommerce = any(term in query.lower() for term in ecommerce_terms)

        # FAQ similarity (placeholder - will use vector similarity in production)
        similarity_to_faq = 0.5  # TODO: implement semantic similarity

        # Complexity score (based on query length + structure)
        complexity_score = min(1.0, (query_length / 500) + (keyword_count / 20))

        # Previous error rate (from context)
        prev_error_rate = context.get("prev_error_rate", 0.0) if context else 0.0

        return QuerySignals(
            query_length=query_length,
            keyword_count=keyword_count,
            similarity_to_faq=similarity_to_faq,
            has_technical_terms=has_technical,
            has_writing_terms=has_writing,
            has_ecommerce_terms=has_ecommerce,
            prev_error_rate=prev_error_rate,
            complexity_score=complexity_score,
        )

    def compute_expert_scores(self, signals: QuerySignals) -> Dict[ExpertType, float]:
        """
        Compute scores for each expert based on query signals.

        Returns:
            Dict mapping expert type to score (0-1)
        """
        if self.mode == "heuristic":
            return self._heuristic_scoring(signals)
        else:
            return self._learned_scoring(signals)

    def _heuristic_scoring(self, signals: QuerySignals) -> Dict[ExpertType, float]:
        """
        Heuristic-based scoring using weighted signals.
        """
        scores = {}

        # Normalize signals
        signal_values = {
            "query_length": min(1.0, signals.query_length / 500),
            "keyword_count": min(1.0, signals.keyword_count / 20),
            "has_technical_terms": 1.0 if signals.has_technical_terms else 0.0,
            "has_writing_terms": 1.0 if signals.has_writing_terms else 0.0,
            "has_ecommerce_terms": 1.0 if signals.has_ecommerce_terms else 0.0,
            "complexity_score": signals.complexity_score,
        }

        # Compute weighted scores for each expert
        for expert, weights in self.expert_weights.items():
            score = sum(
                signal_values.get(signal, 0.0) * weight
                for signal, weight in weights.items()
            )
            scores[expert] = max(0.0, min(1.0, score))  # clamp to [0,1]

        return scores

    def _learned_scoring(self, signals: QuerySignals) -> Dict[ExpertType, float]:
        """
        ML-based scoring using trained classifier.
        TODO: Implement DistilBERT classifier
        """
        # Placeholder for ML model
        raise NotImplementedError("Learned mode requires DistilBERT model training")

    def select_expert(
        self, query: str, context: Dict = None
    ) -> Tuple[ExpertType, float]:
        """
        Select the best expert for the given query.

        Args:
            query: User input
            context: Optional context

        Returns:
            (selected_expert, confidence_score)
        """
        signals = self.extract_signals(query, context)
        scores = self.compute_expert_scores(signals)

        # Select expert with highest score
        best_expert = max(scores.items(), key=lambda x: x[1])
        expert_type, confidence = best_expert

        # Fallback to simple path if confidence too low
        if confidence < self.fallback_threshold:
            return ExpertType.FALLBACK, confidence

        return expert_type, confidence

    def get_routing_explanation(self, query: str) -> Dict:
        """
        Get detailed explanation of routing decision (for debugging/monitoring).

        Returns:
            Dict with signals, scores, selected expert
        """
        signals = self.extract_signals(query)
        scores = self.compute_expert_scores(signals)
        expert, confidence = self.select_expert(query)

        return {
            "query": query,
            "signals": {
                "query_length": signals.query_length,
                "keyword_count": signals.keyword_count,
                "has_technical_terms": signals.has_technical_terms,
                "has_ecommerce_terms": signals.has_ecommerce_terms,
                "complexity_score": signals.complexity_score,
            },
            "expert_scores": {str(k): v for k, v in scores.items()},
            "selected_expert": str(expert),
            "confidence": confidence,
        }


# Example usage
if __name__ == "__main__":
    gate = GatingNetwork(mode="heuristic")

    # Test queries
    test_queries = [
        "Jakie fotele ergonomiczne macie w promocji?",  # E-commerce
        "Jak zoptymalizować algorytm wyszukiwania w bazie danych?",  # Technical/Research
        "Napisz artykuł SEO o meblach biurowych",  # Writing
    ]

    for query in test_queries:
        explanation = gate.get_routing_explanation(query)
        print(f"\nQuery: {query}")
        print(f"Expert: {explanation['selected_expert']}")
        print(f"Confidence: {explanation['confidence']:.2f}")
        print(f"Scores: {explanation['expert_scores']}")
