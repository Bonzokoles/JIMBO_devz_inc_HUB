"""
Research Agent
Capabilities: search, trends, data-mining, market-intelligence
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

sys.path.append(str(Path(__file__).parent.parent))

try:
    from base_agent import BaseAgent, AgentConfig, create_agent_cli
    from moa_engine import MOAEngine
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

from typing import Dict, Any, Optional
import json

class ResearchAgent(BaseAgent):
    """Agent for research using MOA"""
    
    async def startup(self):
        await super().startup()
        
        config = {
            "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY"),
            "CLOUDFLARE_ACCOUNT_ID": os.getenv("CLOUDFLARE_ACCOUNT_ID"),
            "CLOUDFLARE_API_TOKEN": os.getenv("CLOUDFLARE_API_TOKEN"),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        }
        self.moa = MOAEngine(config)
        self.logger.info("Research Agent MOA initialized")
    
    async def execute(self, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute research task"""
        if not data:
            raise ValueError("No data provided")
        
        # Log incoming data for debugging
        self.logger.info(f"Received Execution Data: {json.dumps(data)}")

        task_type = data.get("type", "search")
        query = data.get("query", "")
        
        # Fallback if query is missing but present in 'prompt' (compatibility)
        if not query and "prompt" in data:
            query = data["prompt"]
            
        if not query:
             # Just in case, return a clear error matching our system
            return {"status": "error", "message": "Missing 'query' or 'prompt' field in data"}

        self.logger.info(f"Research Task: {task_type} - {query}")
        
        prompt = ""
        if task_type == "search":
            prompt = f"Provide a comprehensive summary and key facts about: {query}. Include data points and recent context if known."
        elif task_type == "trends":
            prompt = f"Identify current trends and emerging topics related to: {query}. Focus on 2024-2025 perspective."
        elif task_type == "market-intelligence":
            prompt = f"Perform a market analysis for: {query}. Identify competitors, opportunities, and risks."
        else:
            prompt = f"Research: {query}"
            
        try:
            result = await self.moa.generate_response(prompt, f"research/{task_type}")
            return {
                "query": query,
                "type": task_type,
                "content": result,
                "status": "success"
            }
        except Exception as e:
            self.logger.error(f"MOA Error: {e}")
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    config = {
        "id": "research-agent",
        "name": "Research Agent (MOA)",
        "description": "Deep research and trend analysis via MOA",
        "port": 6062,
        "capabilities": ["search", "trends", "market-intelligence"]
    }
    create_agent_cli(ResearchAgent, config)
