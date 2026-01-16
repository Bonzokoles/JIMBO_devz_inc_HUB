"""
Indices Registry
Manages 3 retrieval indices for MoE-RAG system.
"""

from typing import List, Dict, Any
from enum import Enum
from dataclasses import dataclass


class IndexType(str, Enum):
    """Types of retrieval indices"""

    FAQ = "faq"  # Frequent questions + answers (sparse)
    TECHNICAL = "technical"  # Technical docs, code, architecture (dense)
    DOMAIN = "domain"  # Domain-specific: PUMO products, e-commerce (hybrid)


@dataclass
class RetrievalResult:
    """Result from index search"""

    index_type: IndexType
    document_id: str
    content: str
    score: float
    metadata: Dict[str, Any]


class IndicesRegistry:
    """
    Registry for managing multiple retrieval indices.

    Indices:
    - Index 0 (FAQ): Top 1k frequent questions + answers (sparse BM25)
    - Index 1 (Technical): Detailed docs, code snippets, architecture (dense vector)
    - Index 2 (Domain): PUMO products, e-commerce data (hybrid sparse+dense)
    """

    def __init__(self):
        """Initialize indices registry"""
        self.indices = {
            IndexType.FAQ: FAQIndex(),
            IndexType.TECHNICAL: TechnicalIndex(),
            IndexType.DOMAIN: DomainIndex(),
        }

    def search(
        self, query: str, index_types: List[IndexType], top_k: int = 5
    ) -> List[RetrievalResult]:
        """
        Search across specified indices.

        Args:
            query: Search query
            index_types: Which indices to search
            top_k: Number of results per index

        Returns:
            List of RetrievalResults, sorted by score
        """
        all_results = []

        for index_type in index_types:
            index = self.indices[index_type]
            results = index.search(query, top_k=top_k)
            all_results.extend(results)

        # Sort by score (descending)
        all_results.sort(key=lambda x: x.score, reverse=True)

        return all_results

    def get_index_stats(self) -> Dict[IndexType, Dict[str, Any]]:
        """Get statistics for all indices"""
        return {
            index_type: index.get_stats() for index_type, index in self.indices.items()
        }


class FAQIndex:
    """
    FAQ Index - Sparse retrieval for common questions.

    Storage: In-memory dict (will be replaced with vector DB)
    Method: BM25 keyword matching
    Size: ~1,000 FAQ pairs
    """

    def __init__(self):
        """Initialize FAQ index with sample data"""
        self.documents = [
            {
                "id": "faq_001",
                "question": "Jakie fotele ergonomiczne polecacie?",
                "answer": "Polecamy fotele z serii ErgoComfort i ProSit...",
                "category": "products",
            },
            {
                "id": "faq_002",
                "question": "Jak długo trwa dostawa?",
                "answer": "Standardowa dostawa zajmuje 2-3 dni robocze...",
                "category": "shipping",
            },
            {
                "id": "faq_003",
                "question": "Czy mogę zwrócić produkt?",
                "answer": "Tak, masz 14 dni na zwrot bez podania przyczyny...",
                "category": "returns",
            },
            # TODO: Load full FAQ database
        ]

    def search(self, query: str, top_k: int = 5) -> List[RetrievalResult]:
        """
        Search FAQ index using keyword matching.
        """
        results = []
        query_lower = query.lower()

        for doc in self.documents:
            # Simple keyword scoring (will be replaced with BM25)
            score = self._compute_bm25_score(query_lower, doc)

            if score > 0:
                results.append(
                    RetrievalResult(
                        index_type=IndexType.FAQ,
                        document_id=doc["id"],
                        content=f"Q: {doc['question']}\nA: {doc['answer']}",
                        score=score,
                        metadata={"category": doc["category"]},
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _compute_bm25_score(self, query: str, doc: Dict) -> float:
        """Compute BM25 score (simplified version)"""
        # Count matching words
        query_words = set(query.split())
        doc_text = f"{doc['question']} {doc['answer']}".lower()
        doc_words = set(doc_text.split())

        matches = len(query_words & doc_words)
        return matches / max(len(query_words), 1)

    def get_stats(self) -> Dict:
        """Get FAQ index statistics"""
        return {
            "total_documents": len(self.documents),
            "categories": list(set(doc["category"] for doc in self.documents)),
            "index_type": "sparse_bm25",
        }


class TechnicalIndex:
    """
    Technical Index - Dense vector retrieval for technical docs.

    Storage: Vector database (Weaviate/Milvus)
    Method: Semantic similarity (embeddings)
    Size: ~5,000 technical documents
    """

    def __init__(self):
        """Initialize technical index"""
        self.documents = [
            {
                "id": "tech_001",
                "title": "API Integration Guide",
                "content": "To integrate with our API, use the following endpoints...",
                "category": "api",
                "tags": ["api", "integration", "guide"],
            },
            {
                "id": "tech_002",
                "title": "Docker Deployment",
                "content": "Deploy using docker-compose with the following configuration...",
                "category": "devops",
                "tags": ["docker", "deployment", "devops"],
            },
            # TODO: Load full technical docs
        ]

    def search(self, query: str, top_k: int = 5) -> List[RetrievalResult]:
        """
        Search technical index using semantic similarity.
        """
        # Placeholder - will use vector embeddings
        results = []
        query_lower = query.lower()

        for doc in self.documents:
            # Simple keyword matching (will be replaced with embeddings)
            score = self._compute_semantic_score(query_lower, doc)

            if score > 0:
                results.append(
                    RetrievalResult(
                        index_type=IndexType.TECHNICAL,
                        document_id=doc["id"],
                        content=f"{doc['title']}\n\n{doc['content']}",
                        score=score,
                        metadata={"category": doc["category"], "tags": doc["tags"]},
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _compute_semantic_score(self, query: str, doc: Dict) -> float:
        """Compute semantic similarity score (placeholder)"""
        # TODO: Use actual embeddings (sentence-transformers, OpenAI)
        query_words = set(query.split())
        doc_text = f"{doc['title']} {doc['content']}".lower()
        doc_words = set(doc_text.split())

        matches = len(query_words & doc_words)
        return matches / max(len(query_words), 1) * 0.8  # Lower weight than exact match

    def get_stats(self) -> Dict:
        """Get technical index statistics"""
        return {
            "total_documents": len(self.documents),
            "categories": list(set(doc["category"] for doc in self.documents)),
            "index_type": "dense_vector",
        }


class DomainIndex:
    """
    Domain Index - Hybrid retrieval for domain-specific data (PUMO products).

    Storage: Hybrid (sparse + dense)
    Method: BM25 + semantic similarity
    Size: ~2,500 products + metadata
    """

    def __init__(self):
        """Initialize domain index"""
        self.documents = [
            {
                "id": "prod_001",
                "title": "Fotel ergonomiczny ErgoComfort Pro",
                "description": "Fotel biurowy z regulowaną wysokością...",
                "price": 1299.00,
                "category": "fotele",
                "stock": 15,
            },
            {
                "id": "prod_002",
                "title": "Biurko regulowane StandDesk 3000",
                "description": "Biurko z elektryczną regulacją wysokości...",
                "price": 2499.00,
                "category": "biurka",
                "stock": 8,
            },
            # TODO: Load from PUMO database
        ]

    def search(self, query: str, top_k: int = 5) -> List[RetrievalResult]:
        """
        Search domain index using hybrid retrieval.
        """
        results = []
        query_lower = query.lower()

        for doc in self.documents:
            # Hybrid scoring: BM25 + semantic
            bm25_score = self._compute_bm25(query_lower, doc)
            semantic_score = self._compute_semantic(query_lower, doc)

            # Weighted combination
            final_score = 0.6 * bm25_score + 0.4 * semantic_score

            if final_score > 0:
                results.append(
                    RetrievalResult(
                        index_type=IndexType.DOMAIN,
                        document_id=doc["id"],
                        content=f"{doc['title']}\n{doc['description']}\nCena: {doc['price']} zł",
                        score=final_score,
                        metadata={
                            "category": doc["category"],
                            "price": doc["price"],
                            "stock": doc["stock"],
                        },
                    )
                )

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _compute_bm25(self, query: str, doc: Dict) -> float:
        """BM25 score for product"""
        query_words = set(query.split())
        doc_text = f"{doc['title']} {doc['description']}".lower()
        doc_words = set(doc_text.split())

        matches = len(query_words & doc_words)
        return matches / max(len(query_words), 1)

    def _compute_semantic(self, query: str, doc: Dict) -> float:
        """Semantic similarity for product"""
        # Placeholder for embedding similarity
        return 0.5

    def get_stats(self) -> Dict:
        """Get domain index statistics"""
        return {
            "total_documents": len(self.documents),
            "categories": list(set(doc["category"] for doc in self.documents)),
            "index_type": "hybrid_sparse_dense",
        }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_registry_instance = None


def get_indices_registry() -> IndicesRegistry:
    """
    Get singleton instance of IndicesRegistry

    Returns:
        IndicesRegistry: Shared registry instance
    """
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = IndicesRegistry()
    return _registry_instance


# ============================================================================
# TEST/DEMO
# ============================================================================

# Example usage
if __name__ == "__main__":
    registry = IndicesRegistry()

    # Test search
    query = "Jakie fotele ergonomiczne polecacie?"

    # Search FAQ only
    faq_results = registry.search(query, [IndexType.FAQ], top_k=3)
    print(f"\n=== FAQ Results ({len(faq_results)}) ===")
    for result in faq_results:
        print(f"[{result.score:.2f}] {result.content[:100]}...")

    # Search all indices
    all_results = registry.search(
        query, [IndexType.FAQ, IndexType.TECHNICAL, IndexType.DOMAIN], top_k=2
    )
    print(f"\n=== All Indices Results ({len(all_results)}) ===")
    for result in all_results:
        print(f"[{result.index_type}] [{result.score:.2f}] {result.content[:100]}...")

    # Get stats
    stats = registry.get_index_stats()
    print(f"\n=== Index Statistics ===")
    for index_type, stat in stats.items():
        print(f"{index_type}: {stat}")
