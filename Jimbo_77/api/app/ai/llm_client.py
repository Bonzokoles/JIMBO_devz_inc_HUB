"""
LLM Client for MoE-RAG - AI Models Integration
Supports: OpenRouter (Qwen 2.5 72B), DeepSeek R1, OpenAI GPT-4
"""

import os
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI, AsyncOpenAI

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified LLM client for multiple AI providers"""

    def __init__(self):
        # OpenRouter (Qwen 2.5 72B - główny model)
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_client = None
        if self.openrouter_key:
            self.openrouter_client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_key,
            )

        # DeepSeek R1 (reasoning model)
        self.deepseek_key = os.getenv("DEEPSEEK_API_KEY")
        self.deepseek_client = None
        if self.deepseek_key:
            self.deepseek_client = AsyncOpenAI(
                base_url="https://api.deepseek.com",
                api_key=self.deepseek_key,
            )

        # OpenAI (fallback)
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openai_client = None
        if self.openai_key:
            self.openai_client = AsyncOpenAI(api_key=self.openai_key)

        logger.info(
            f"LLM Client initialized - OpenRouter: {bool(self.openrouter_client)}, "
            f"DeepSeek: {bool(self.deepseek_client)}, OpenAI: {bool(self.openai_client)}"
        )

    async def generate_response(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        model: str = "qwen",
        max_tokens: int = 1500,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Generate response using LLM with retrieved context

        Args:
            query: User query
            retrieved_docs: List of retrieved documents with 'content' and 'score'
            model: 'qwen', 'deepseek', or 'openai'
            max_tokens: Maximum response length
            temperature: Sampling temperature

        Returns:
            Dict with:
            - response: Generated text
            - model_name: Model used
            - tokens_input: Input tokens
            - tokens_output: Output tokens
            - cost_usd: Estimated cost
        """
        # Build context from retrieved docs
        context = self._build_context(retrieved_docs)

        # Build messages
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful AI assistant with expertise in software development, "
                    "Cloudflare Workers, AI agents, and web technologies. Provide accurate, "
                    "concise, and helpful answers based on the provided context."
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:",
            },
        ]

        # Choose model and generate
        if model == "qwen" and self.openrouter_client:
            return await self._generate_openrouter(messages, max_tokens, temperature)
        elif model == "deepseek" and self.deepseek_client:
            return await self._generate_deepseek(messages, max_tokens, temperature)
        elif model == "openai" and self.openai_client:
            return await self._generate_openai(messages, max_tokens, temperature)
        else:
            # Fallback to available model
            if self.openrouter_client:
                return await self._generate_openrouter(
                    messages, max_tokens, temperature
                )
            elif self.openai_client:
                return await self._generate_openai(messages, max_tokens, temperature)
            elif self.deepseek_client:
                return await self._generate_deepseek(messages, max_tokens, temperature)
            else:
                raise ValueError("No LLM API keys configured")

    def _build_context(
        self, retrieved_docs: List[Dict[str, Any]], max_docs: int = 5
    ) -> str:
        """Build context string from retrieved documents"""
        if not retrieved_docs:
            return "No relevant context found."

        context_parts = []
        for i, doc in enumerate(retrieved_docs[:max_docs], 1):
            content = doc.get("content", "")
            score = doc.get("score", 0.0)
            source = doc.get("source", "Unknown")

            context_parts.append(
                f"[Document {i}] (Relevance: {score:.2f}, Source: {source})\n{content}"
            )

        return "\n\n".join(context_parts)

    async def _generate_openrouter(
        self, messages: List[Dict], max_tokens: int, temperature: float
    ) -> Dict[str, Any]:
        """Generate using OpenRouter (Qwen 2.5 72B)"""
        try:
            response = await self.openrouter_client.chat.completions.create(
                model="qwen/qwen-2.5-72b-instruct",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            tokens_input = response.usage.prompt_tokens
            tokens_output = response.usage.completion_tokens
            # Qwen 2.5 72B: $0.35/1M input, $0.40/1M output
            cost_usd = (tokens_input * 0.35 + tokens_output * 0.40) / 1_000_000

            return {
                "response": response.choices[0].message.content,
                "model_name": "qwen/qwen-2.5-72b-instruct",
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "cost_usd": cost_usd,
            }

        except Exception as e:
            logger.error(f"OpenRouter generation error: {e}")
            raise

    async def _generate_deepseek(
        self, messages: List[Dict], max_tokens: int, temperature: float
    ) -> Dict[str, Any]:
        """Generate using DeepSeek R1"""
        try:
            response = await self.deepseek_client.chat.completions.create(
                model="deepseek-reasoner",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            tokens_input = response.usage.prompt_tokens
            tokens_output = response.usage.completion_tokens
            # DeepSeek R1: ~$0.55/1M input, $2.19/1M output
            cost_usd = (tokens_input * 0.55 + tokens_output * 2.19) / 1_000_000

            return {
                "response": response.choices[0].message.content,
                "model_name": "deepseek-reasoner",
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "cost_usd": cost_usd,
            }

        except Exception as e:
            logger.error(f"DeepSeek generation error: {e}")
            raise

    async def _generate_openai(
        self, messages: List[Dict], max_tokens: int, temperature: float
    ) -> Dict[str, Any]:
        """Generate using OpenAI GPT-4 Turbo"""
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            tokens_input = response.usage.prompt_tokens
            tokens_output = response.usage.completion_tokens
            # GPT-4 Turbo: $10/1M input, $30/1M output
            cost_usd = (tokens_input * 10 + tokens_output * 30) / 1_000_000

            return {
                "response": response.choices[0].message.content,
                "model_name": "gpt-4-turbo-preview",
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "cost_usd": cost_usd,
            }

        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise

    def is_available(self) -> bool:
        """Check if any LLM provider is available"""
        return bool(
            self.openrouter_client or self.deepseek_client or self.openai_client
        )


# Singleton instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Get LLM client singleton"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
