/**
 * RAG Engine - Core logic for query processing
 *
 * Flow:
 * 1. Embed user query using Workers AI
 * 2. Search Vectorize for relevant products
 * 3. Build context from top matches
 * 4. Call LLM (OpenRouter DeepSeek R1 with Workers AI fallback)
 * 5. Return structured response
 */



