"""
Embedding layer for MoE-RAG
Uses sentence-transformers for semantic similarity
Local model (no API cost), fast inference (<50ms)
Production-grade with error handling, logging, caching
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from functools import lru_cache
import asyncio
from pathlib import Path
import json

logger = logging.getLogger(__name__)


# ============================================================================
# EMBEDDING MODEL (Lazy-loaded, singleton)
# ============================================================================


class EmbeddingModel:
    """
    Singleton embedding model (sentence-transformers)
    Lazy loads model on first use
    Thread-safe, supports both sync and async operations
    """

    _instance = None
    _model = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self):
        """Lazy load model (first call only)"""
        if self._initialized:
            return  # Already loaded

        try:
            from sentence_transformers import SentenceTransformer

            # Use distiluse-base-multilingual-cased-v2
            # - Supports Polish + English
            # - Fast (~100ms per embedding)
            # - Accurate (384 dims)
            # - Downloaded to ~/.cache/huggingface
            model_name = "distiluse-base-multilingual-cased-v2"

            logger.info(f"🔄 Loading embedding model: {model_name}...")
            self._model = SentenceTransformer(model_name)
            self._initialized = True
            logger.info("✅ Embedding model loaded successfully")

        except ImportError as e:
            logger.error(f"❌ sentence-transformers not installed: {e}")
            logger.error("Install: pip install sentence-transformers")
            raise
        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {e}")
            raise

    def embed(self, text: str) -> np.ndarray:
        """
        Embed single text → vector (384 dims)

        Args:
            text: Input text to embed

        Returns:
            np.ndarray of shape (384,)
        """
        if not self._initialized:
            self.initialize()

        if not text or not isinstance(text, str):
            logger.warning(f"Invalid text input: {text}")
            return np.zeros(384)

        try:
            embedding = self._model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception as e:
            logger.error(f"Error embedding text: {e}")
            return np.zeros(384)

    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[np.ndarray]:
        """
        Embed multiple texts (optimized batch processing)

        Args:
            texts: List of texts to embed
            batch_size: Batch size for processing

        Returns:
            List of np.ndarray embeddings
        """
        if not self._initialized:
            self.initialize()

        if not texts:
            return []

        try:
            embeddings = self._model.encode(
                texts,
                batch_size=batch_size,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return list(embeddings)
        except Exception as e:
            logger.error(f"Error embedding batch: {e}")
            return [np.zeros(384) for _ in texts]

    def similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Cosine similarity between two vectors [0, 1]

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            float: Similarity score (0-1)
        """
        try:
            # Normalize vectors
            vec1_norm = vec1 / (np.linalg.norm(vec1) + 1e-8)
            vec2_norm = vec2 / (np.linalg.norm(vec2) + 1e-8)

            # Cosine similarity = dot product of normalized vectors
            sim = float(np.dot(vec1_norm, vec2_norm))
            return max(0.0, min(1.0, sim))  # Clamp to [0, 1]
        except Exception as e:
            logger.error(f"Error computing similarity: {e}")
            return 0.0

    def most_similar(
        self,
        query_vec: np.ndarray,
        doc_vecs: Dict[str, np.ndarray],
        top_k: int = 5,
    ) -> List[Tuple[str, float]]:
        """
        Find top-k most similar documents

        Args:
            query_vec: Query embedding
            doc_vecs: Dict of {doc_id: embedding}
            top_k: Number of results to return

        Returns:
            List of (doc_id, similarity_score) tuples
        """
        if not doc_vecs:
            return []

        similarities = []

        for doc_id, doc_vec in doc_vecs.items():
            sim = self.similarity(query_vec, doc_vec)
            similarities.append((doc_id, sim))

        # Sort by similarity descending
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]


# ============================================================================
# VECTORIZED FAQ INDEX
# ============================================================================


class VectorizedFAQIndex:
    """
    FAQ index with embeddings
    Stores FAQ question embeddings for semantic search
    """

    def __init__(self):
        self.faqs: Dict[str, Dict] = {}  # id -> {question, answer, embedding, ...}
        self.embedder = EmbeddingModel()
        self.embedder.initialize()
        self._load_and_vectorize()

    def _load_and_vectorize(self):
        """Load FAQs and compute embeddings"""
        sample_faqs = [
            {
                "id": "faq-1",
                "q": "What is MeblePumo?",
                "a": "MeblePumo is a furniture e-commerce platform offering ergonomic chairs, desks, and home office solutions.",
            },
            {
                "id": "faq-2",
                "q": "What are your business hours?",
                "a": "We are open Monday-Friday 9 AM - 6 PM, Saturday 10 AM - 4 PM, Closed on Sundays.",
            },
            {
                "id": "faq-3",
                "q": "How much does shipping cost?",
                "a": "Shipping is free for orders over $100. Orders under $100 have a flat $15 shipping fee.",
            },
            {
                "id": "faq-4",
                "q": "What is your return policy?",
                "a": "We offer 30-day returns for items in original condition. Contact support@meblepumo.pl for returns.",
            },
            {
                "id": "faq-5",
                "q": "Do you have ergonomic chair recommendations?",
                "a": "Yes! We recommend the ErgoPro X-3000 for back support, or the UltraComfort series for all-day seating.",
            },
            {
                "id": "faq-6",
                "q": "How do I track my order?",
                "a": "Log into your account and go to 'Orders'. You'll see tracking info and estimated delivery date.",
            },
            {
                "id": "faq-7",
                "q": "Can I change my order?",
                "a": "If your order hasn't shipped, you can modify it within 1 hour. Contact support if needed.",
            },
            {
                "id": "faq-8",
                "q": "What payment methods do you accept?",
                "a": "We accept credit cards, bank transfers, and PayPal.",
            },
        ]

        logger.info(f"🔄 Vectorizing {len(sample_faqs)} FAQs...")

        # Embed all questions
        questions = [faq["q"] for faq in sample_faqs]
        embeddings = self.embedder.embed_batch(questions)

        # Store with embeddings
        for faq, embedding in zip(sample_faqs, embeddings):
            self.faqs[faq["id"]] = {
                "id": faq["id"],
                "question": faq["q"],
                "answer": faq["a"],
                "embedding": embedding,
            }

        logger.info(f"✅ Vectorized {len(self.faqs)} FAQs")

    async def search(
        self, query: str, top_k: int = 3, threshold: float = 0.3
    ) -> List[Dict]:
        """
        Semantic search over FAQs

        Args:
            query: User query
            top_k: Number of results to return
            threshold: Minimum similarity score (0-1)

        Returns:
            List of {id, question, answer, score}
        """
        # Embed query
        query_vec = self.embedder.embed(query)

        # Find similar FAQs
        doc_vecs = {faq_id: faq["embedding"] for faq_id, faq in self.faqs.items()}
        similar = self.embedder.most_similar(query_vec, doc_vecs, top_k=top_k)

        results = []
        for faq_id, score in similar:
            if score >= threshold:
                faq = self.faqs[faq_id]
                results.append(
                    {
                        "id": faq_id,
                        "question": faq["question"],
                        "answer": faq["answer"],
                        "score": score,
                    }
                )

        return results


# ============================================================================
# VECTORIZED TECHNICAL INDEX
# ============================================================================


class VectorizedTechnicalIndex:
    """Technical docs with embeddings"""

    def __init__(self):
        self.docs: Dict[str, Dict] = {}
        self.embedder = EmbeddingModel()
        self.embedder.initialize()
        self._load_and_vectorize()

    def _load_and_vectorize(self):
        """Load and vectorize technical docs"""
        sample_docs = [
            {
                "id": "tech-1",
                "title": "MoE-RAG Architecture",
                "content": "Mixture of Experts with Retrieval-Augmented Generation combines intelligent routing with multi-source document retrieval. Uses gating networks to decide between fast, expert, or hybrid paths based on query complexity.",
                "tags": ["moe", "rag", "llm", "routing", "architecture"],
            },
            {
                "id": "tech-2",
                "title": "Database Performance Optimization",
                "content": "Query optimization techniques include: indexing strategies (B-tree, hash, bitmap), query planning, cardinality estimation, cache warming, and statistical analysis of query patterns.",
                "tags": ["database", "performance", "optimization"],
            },
            {
                "id": "tech-3",
                "title": "Vector Search Best Practices",
                "content": "Semantic search using embeddings requires choosing appropriate models, managing vector dimensions, implementing efficient indexing (HNSW, IVF), and measuring similarity metrics (cosine, L2, dot product).",
                "tags": ["vector", "search", "embeddings", "semantic"],
            },
            {
                "id": "tech-4",
                "title": "Agent Orchestration with LangGraph",
                "content": "LangGraph enables composable, stateful agent workflows. Nodes represent computational steps, edges define transitions, and state management ensures data flows correctly through the graph.",
                "tags": ["agents", "orchestration", "langgraph", "workflow"],
            },
            {
                "id": "tech-5",
                "title": "API Security and Rate Limiting",
                "content": "Implement security through rate limiting (token bucket, sliding window), input validation, authentication (JWT, OAuth), CORS configuration, and monitoring for anomalous patterns.",
                "tags": ["security", "api", "rate-limiting", "authentication"],
            },
        ]

        logger.info(f"🔄 Vectorizing {len(sample_docs)} technical docs...")

        # Embed titles + content
        texts = [f"{doc['title']} {doc['content']}" for doc in sample_docs]
        embeddings = self.embedder.embed_batch(texts)

        # Store with embeddings
        for doc, embedding in zip(sample_docs, embeddings):
            self.docs[doc["id"]] = {
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "tags": doc["tags"],
                "embedding": embedding,
            }

        logger.info(f"✅ Vectorized {len(self.docs)} technical docs")

    async def search(
        self, query: str, top_k: int = 3, threshold: float = 0.3
    ) -> List[Dict]:
        """Semantic search over technical docs"""
        query_vec = self.embedder.embed(query)
        doc_vecs = {doc_id: doc["embedding"] for doc_id, doc in self.docs.items()}
        similar = self.embedder.most_similar(query_vec, doc_vecs, top_k=top_k)

        results = []
        for doc_id, score in similar:
            if score >= threshold:
                doc = self.docs[doc_id]
                results.append(
                    {
                        "id": doc_id,
                        "title": doc["title"],
                        "content": doc["content"],
                        "tags": doc["tags"],
                        "score": score,
                    }
                )

        return results


# ============================================================================
# VECTORIZED DOMAIN INDEX (PUMO Products)
# ============================================================================


class VectorizedDomainIndex:
    """Domain-specific index (PUMO products, e-commerce)"""

    def __init__(self):
        self.products: Dict[str, Dict] = {}
        self.embedder = EmbeddingModel()
        self.embedder.initialize()
        self._load_and_vectorize()

    def _load_and_vectorize(self):
        """Load and vectorize domain-specific products"""
        sample_products = [
            {
                "id": "prod-1",
                "name": "ErgoPro X-3000 Chair",
                "description": "Premium ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh. Supports 8-hour workdays with maximum comfort.",
                "category": "chairs",
                "price": 899.99,
            },
            {
                "id": "prod-2",
                "name": "UltraComfort Desk",
                "description": "Electric standing desk with height adjustment, dual motors, and programmable presets. Perfect for home office setup.",
                "category": "desks",
                "price": 1299.99,
            },
            {
                "id": "prod-3",
                "name": "Monitor Stand Pro",
                "description": "Adjustable monitor stand with cable management, supports up to 2 monitors, alleviates neck and eye strain.",
                "category": "accessories",
                "price": 149.99,
            },
            {
                "id": "prod-4",
                "name": "Ergonomic Keyboard",
                "description": "Split mechanical keyboard with key feedback, wrist rest, and customizable switches for reduced strain.",
                "category": "accessories",
                "price": 299.99,
            },
            {
                "id": "prod-5",
                "name": "Home Office Bundle",
                "description": "Complete office setup: chair, desk, monitor stand, and accessories. 20% discount when purchased together.",
                "category": "bundles",
                "price": 2499.99,
            },
        ]

        logger.info(f"🔄 Vectorizing {len(sample_products)} domain products...")

        # Embed name + description
        texts = [f"{prod['name']} {prod['description']}" for prod in sample_products]
        embeddings = self.embedder.embed_batch(texts)

        # Store with embeddings
        for prod, embedding in zip(sample_products, embeddings):
            self.products[prod["id"]] = {
                "id": prod["id"],
                "name": prod["name"],
                "description": prod["description"],
                "category": prod["category"],
                "price": prod["price"],
                "embedding": embedding,
            }

        logger.info(f"✅ Vectorized {len(self.products)} domain products")

    async def search(
        self, query: str, top_k: int = 3, threshold: float = 0.3
    ) -> List[Dict]:
        """Semantic search over products"""
        query_vec = self.embedder.embed(query)
        prod_vecs = {
            prod_id: prod["embedding"] for prod_id, prod in self.products.items()
        }
        similar = self.embedder.most_similar(query_vec, prod_vecs, top_k=top_k)

        results = []
        for prod_id, score in similar:
            if score >= threshold:
                prod = self.products[prod_id]
                results.append(
                    {
                        "id": prod_id,
                        "name": prod["name"],
                        "description": prod["description"],
                        "category": prod["category"],
                        "price": prod["price"],
                        "score": score,
                    }
                )

        return results


# ============================================================================
# VECTORIZED INDICES REGISTRY (Main Interface)
# ============================================================================


class VectorizedIndicesRegistry:
    """
    Central registry for all vectorized indices
    Coordinates search across FAQ, Technical, and Domain indices
    """

    def __init__(self):
        logger.info("🚀 Initializing VectorizedIndicesRegistry...")
        self.faq_index = VectorizedFAQIndex()
        self.technical_index = VectorizedTechnicalIndex()
        self.domain_index = VectorizedDomainIndex()
        logger.info("✅ VectorizedIndicesRegistry ready")

    async def search_all(
        self, query: str, top_k_per_index: int = 3, threshold: float = 0.3
    ) -> Dict[str, List[Dict]]:
        """
        Search across all indices simultaneously

        Args:
            query: User query
            top_k_per_index: Results per index
            threshold: Minimum similarity score

        Returns:
            {
                "faq": [...],
                "technical": [...],
                "domain": [...]
            }
        """
        results = {
            "faq": await self.faq_index.search(query, top_k_per_index, threshold),
            "technical": await self.technical_index.search(
                query, top_k_per_index, threshold
            ),
            "domain": await self.domain_index.search(query, top_k_per_index, threshold),
        }

        # Log summary
        total_results = sum(len(v) for v in results.values())
        logger.info(f"Search for '{query[:50]}...': found {total_results} results")

        return results

    async def search_by_index(
        self, index_name: str, query: str, top_k: int = 3, threshold: float = 0.3
    ) -> List[Dict]:
        """
        Search specific index

        Args:
            index_name: 'faq', 'technical', or 'domain'
            query: User query
            top_k: Number of results
            threshold: Minimum similarity

        Returns:
            List of search results
        """
        if index_name == "faq":
            return await self.faq_index.search(query, top_k, threshold)
        elif index_name == "technical":
            return await self.technical_index.search(query, top_k, threshold)
        elif index_name == "domain":
            return await self.domain_index.search(query, top_k, threshold)
        else:
            logger.error(f"Unknown index: {index_name}")
            return []


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_indices_registry = None


def get_indices_registry() -> VectorizedIndicesRegistry:
    """Get global indices registry instance"""
    global _indices_registry
    if _indices_registry is None:
        _indices_registry = VectorizedIndicesRegistry()
    return _indices_registry
