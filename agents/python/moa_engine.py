
import os
import json
import logging
import asyncio
import aiohttp
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MOAEngine")

@dataclass
class MOAResponse:
    content: str
    provider: str
    model: str
    tokens: int = 0
    latency: float = 0.0

class MOAEngine:
    def __init__(self, config: Dict[str, str]):
        """
        Initialize MOA Engine with API keys
        config: {
            "OPENROUTER_API_KEY": str,
            "CLOUDFLARE_ACCOUNT_ID": str,
            "CLOUDFLARE_API_TOKEN": str,
            "OPENAI_API_KEY": str (optional)
        }
        """
        self.config = config
        self.logger = logger

    async def generate_response(self, prompt: str, task_type: str = "general") -> str:
        """
        Main entry point for MOA generation.
        Orchestrates parallel calls to models and synthesizes the result.
        """
        self.logger.info(f"🐱 MOA Engine starting for task: {task_type}")
        
        # 1. Define Strategy (which models to call)
        # We use a robust mix: 
        # - DeepSeek (via OpenRouter) for reasoning
        # - Cloudflare (Llama 3) for speed/drafting
        # - OpenAI (GPT-4o) for quality/synthesis (if key exists)
        
        providers = ["deepseek", "cloudflare"]
        if self.config.get("OPENAI_API_KEY"):
            providers.append("openai")
            
        self.logger.info(f"Selected providers: {providers}")

        # 2. Parallel Execution
        tasks = [self._call_model(p, prompt) for p in providers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful_responses: List[MOAResponse] = []
        
        for res in results:
            if isinstance(res, MOAResponse):
                successful_responses.append(res)
            else:
                self.logger.error(f"Model call failed: {str(res)}")

        if not successful_responses:
            return "Error: All models failed to generate a response."

        self.logger.info(f"✅ MOA: {len(successful_responses)}/{len(providers)} models responded")

        # 3. Aggregation / Synthesis
        if len(successful_responses) == 1:
            return successful_responses[0].content
        
        return await self._aggregate_responses(successful_responses, prompt)

    async def _call_model(self, provider: str, prompt: str) -> MOAResponse:
        """Dispatcher for model calls"""
        start_time = time.time()
        try:
            if provider == "deepseek":
                return await self._call_deepseek(prompt, start_time)
            elif provider == "cloudflare":
                return await self._call_cloudflare(prompt, start_time)
            elif provider == "openai":
                return await self._call_openai(prompt, start_time)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except Exception as e:
            self.logger.error(f"❌ {provider} failed: {str(e)}")
            raise e

    async def _call_deepseek(self, prompt: str, start_time: float) -> MOAResponse:
        """Call DeepSeek via OpenRouter"""
        api_key = self.config.get("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY missing")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://jimbo77.com", 
            "X-Title": "Jimbo Writer Agent"
        }
        data = {
            "model": "deepseek/deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise Exception(f"OpenRouter Error: {text}")
                result = await resp.json()
                content = result['choices'][0]['message']['content']
                
                return MOAResponse(
                    content=content, 
                    provider="deepseek", 
                    model="deepseek-chat",
                    latency=time.time() - start_time
                )

    async def _call_cloudflare(self, prompt: str, start_time: float) -> MOAResponse:
        """Call Cloudflare Workers AI (Llama 3)"""
        account_id = self.config.get("CLOUDFLARE_ACCOUNT_ID")
        api_token = self.config.get("CLOUDFLARE_API_TOKEN")
        
        if not account_id or not api_token:
            raise ValueError("CLOUDFLARE credentials missing")

        # Using Llama 3 8B Instruct (fast & cheap/free tier)
        model_id = "@cf/meta/llama-3-8b-instruct"
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_id}"
        
        headers = {"Authorization": f"Bearer {api_token}"}
        data = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant writing in Polish."},
                {"role": "user", "content": prompt}
            ]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise Exception(f"Cloudflare AI Error: {text}")
                result = await resp.json()
                # Cloudflare AI structure might vary slightly, usually result.result.response
                content = result.get('result', {}).get('response', '')
                
                return MOAResponse(
                    content=content,
                    provider="cloudflare",
                    model="llama-3-8b-instruct",
                    latency=time.time() - start_time
                )

    async def _call_openai(self, prompt: str, start_time: float) -> MOAResponse:
        """Call OpenAI GPT-4o"""
        api_key = self.config.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY missing")
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as resp:
                result = await resp.json()
                content = result['choices'][0]['message']['content']
                return MOAResponse(
                    content=content,
                    provider="openai",
                    model="gpt-4o", 
                    latency=time.time() - start_time
                )

    async def _aggregate_responses(self, responses: List[MOAResponse], original_prompt: str) -> str:
        """Synthesize multiple responses into one"""
        self.logger.info("🔀 Aggregating MOA results...")
        
        combined_text = "\n\n---\n\n".join(
            [f"Model: {r.provider}\nResponse:\n{r.content}" for r in responses]
        )
        
        synthesis_prompt = f"""
        Jesteś Redaktorem Naczelnym-Ekspertem. Masz {len(responses)} wersje tekstu na temat: "{original_prompt}".
        
        TWOJE ZADANIE:
        Stwórz JEDEN, idealny artykuł, łącząc najlepsze elementy z poniższych wersji.
        
        ZASADY:
        1. Język: Polski (Profesjonalny, ale angażujący).
        2. Struktura: Markdown (Nagłówki H2, H3, pogrubienia).
        3. Styl: Ekspercki poradnik/blog post.
        4. Wyeliminuj halucynacje i powtórzenia.
        5. Dodaj sekcję "Kluczowe Wnioski" na końcu.
        
        MATERIAŁ ŹRÓDŁOWY:
        {combined_text}
        
        Wygeneruj TYLKO gotowy artykuł:
        """

        # We prefer OpenAI for synthesis if available, otherwise DeepSeek
        synthesizer = "openai" if self.config.get("OPENAI_API_KEY") else "deepseek"
        
        try:
            res = await self._call_model(synthesizer, synthesis_prompt)
            return res.content
        except Exception as e:
            self.logger.error(f"Aggregation failed: {e}")
            # Fallback: return the longest response
            return max(responses, key=lambda x: len(x.content)).content
