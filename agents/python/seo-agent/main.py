"""
SEO Agent
Capabilities: keyword-research, on-page-seo, strategy
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent, AgentConfig, create_agent_cli
from moa_engine import MOAEngine
from typing import Dict, Any, Optional

class SEOAgent(BaseAgent):
    """Agent for SEO using MOA"""
    
    async def startup(self):
        await super().startup()
        config = {
            "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY"),
            "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID"),
            "CLOUDFLARE_API_TOKEN": os.getenv("CLOUDFLARE_API_TOKEN"),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        }
        self.moa = MOAEngine(config)
        self.logger.info("SEO Agent MOA initialized")
    
    async def execute(self, data: Optional[Dict] = None) -> Dict[str, Any]:
        task_type = data.get("type", "keywords")
        query = data.get("query", "") # seed keyword or url
        
        self.logger.info(f"SEO Task: {task_type} - {query}")
        
        prompt = ""
        if task_type == "keywords":
            prompt = f"Generate a list of high-potential SEO keywords related to: '{query}'. Include search intent (Informational, Transactional) and suggested long-tail variations."
        elif task_type == "on-page":
             prompt = f"Provide an on-page SEO checklist and optimization strategy for specific content about: '{query}'."
        else:
            prompt = f"SEO advice for: {query}"
            
        try:
            result = await self.moa.generate_response(prompt, f"seo/{task_type}")
            return {
                "query": query,
                "type": task_type,
                "content": result,
                "status": "success"
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    config = {
        "id": "seo-agent",
        "name": "SEO Agent (MOA)",
        "description": "SEO strategy and keyword intelligence via MOA",
        "port": 6031,
        "capabilities": ["keywords", "on-page"]
    }
    create_agent_cli(SEOAgent, config)
