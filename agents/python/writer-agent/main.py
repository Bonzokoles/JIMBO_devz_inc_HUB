"""
Writer Agent with MOA (Mixture of Agents) Power
Capabilities: content-creation, copywriting, seo-writing, proofreading
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env from parent directory (agents/python/.env)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent, AgentConfig, create_agent_cli
from typing import Dict, Any, Optional
from moa_engine import MOAEngine

class WriterAgent(BaseAgent):
    """Agent for content creation using MOA (Mixture of Agents)"""
    
    async def startup(self):
        """Initialize MOA engine"""
        await super().startup()
        
        config = {
            "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY"),
            "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID"),
            "CLOUDFLARE_API_TOKEN": os.getenv("CLOUDFLARE_API_TOKEN"),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        }
        
        self.moa = MOAEngine(config)
        self.logger.info("MOA Engine initialized")
        self.writing_styles = ["professional", "casual", "technical", "marketing"]
    
    async def execute(self, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute writing task"""
        if not data:
            raise ValueError("No data provided for writing")
        
        task_type = data.get("type", "content")
        prompt = data.get("prompt", "")
        style = data.get("style", "professional")
        
        if task_type in ["content", "seo"]:
            return await self.create_content(prompt, style, task_type)
        elif task_type == "proofread":
            return await self.proofread(data.get("text", ""))
        else:
            raise ValueError(f"Unknown writing task: {task_type}")
    
    async def create_content(self, prompt: str, style: str = "professional", task_type: str = "content") -> Dict[str, Any]:
        """Create content using MOA"""
        self.logger.info(f"MOA Writing ({style}): {prompt[:50]}...")
        
        try:
            # Enhance prompt with style instructions
            full_prompt = f"Napisz artykuł w stylu '{style}' na temat: {prompt}. "
            if task_type == "seo":
                full_prompt += "Uwzględnij zasady SEO, słowa kluczowe i logiczną strukturę nagłówków."
            
            content = await self.moa.generate_response(full_prompt, task_type)
            
            return {
                "prompt": prompt,
                "style": style,
                "content": content,
                "word_count": len(content.split()),
                "status": "completed",
                "engine": "MOA (DeepSeek/Cloudflare/OpenAI)"
            }
        except Exception as e:
            self.logger.error(f"Writing failed: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def proofread(self, text: str) -> Dict[str, Any]:
        """Proofread using MOA"""
        self.logger.info(f"Proofreading {len(text)} characters")
        
        prompt = f"Sprawdź poniższy tekst pod kątem błędów językowych, stylistycznych i literówek. Wypisz tylko poprawioną wersję:\n\n{text}"
        result = await self.moa.generate_response(prompt, "proofread")
        
        return {
            "original_length": len(text),
            "corrections": result,
            "status": "completed"
        }


if __name__ == "__main__":
    config = {
        "id": "writer-agent",
        "name": "Writer Agent (MOA Powered)",
        "description": "Content creation using Mixture of Agents (DeepSeek + Cloudflare + OpenAI)",
        "port": 6030,
        "capabilities": ["content-creation", "seo-writing", "proofreading"]
    }
    
    create_agent_cli(WriterAgent, config)
