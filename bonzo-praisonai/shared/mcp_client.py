"""MCP Client for connecting to agent-zero's MCP servers"""

import httpx
import os
import logging
from typing import Dict, Any, List, Optional
import json

logger = logging.getLogger(__name__)


class MCPClient:
    """Client for interacting with agent-zero's MCP servers"""
    
    def __init__(self):
        self.agent_zero_url = os.getenv("AGENT_ZERO_URL", "http://localhost:50100")
        self.mcp_token = os.getenv("AGENT_ZERO_MCP_TOKEN", "")
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info(f"MCP Client initialized for {self.agent_zero_url}")
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available MCP tools from agent-zero"""
        try:
            response = await self.client.get(
                f"{self.agent_zero_url}/api/tools/list",
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json().get("tools", [])
        except Exception as e:
            logger.error(f"Failed to list MCP tools: {e}")
            return []
    
    async def call_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Call an MCP tool through agent-zero"""
        try:
            response = await self.client.post(
                f"{self.agent_zero_url}/api/tools/call",
                json={
                    "tool": tool_name,
                    "arguments": arguments
                },
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to call tool {tool_name}: {e}")
            return {"error": str(e)}
    
    async def query_knowledge(self, query: str) -> Dict[str, Any]:
        """Query knowledge graph through MCP"""
        return await self.call_tool(
            "knowledge-graph",
            {"query": query, "operation": "search"}
        )
    
    async def search_web(self, query: str, engine: str = "tavily") -> Dict[str, Any]:
        """Search web through MCP servers (Tavily/Brave)"""
        tool_name = f"{engine}-search" if engine != "tavily" else "tavily"
        return await self.call_tool(tool_name, {"query": query})
    
    async def analyze_with_deepseek(self, prompt: str) -> Dict[str, Any]:
        """Use DeepSeek model through MCP"""
        return await self.call_tool(
            "deepseek",
            {"prompt": prompt, "model": "deepseek-chat"}
        )
    
    async def cloudflare_analytics(
        self, 
        metric: str, 
        time_range: str = "1d"
    ) -> Dict[str, Any]:
        """Get Cloudflare analytics through MCP"""
        return await self.call_tool(
            "cloudflare",
            {
                "operation": "analytics",
                "metric": metric,
                "time_range": time_range
            }
        )
    
    async def github_operation(
        self, 
        operation: str, 
        **kwargs
    ) -> Dict[str, Any]:
        """Perform GitHub operations through MCP"""
        return await self.call_tool(
            "github",
            {"operation": operation, **kwargs}
        )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token"""
        headers = {"Content-Type": "application/json"}
        if self.mcp_token:
            headers["Authorization"] = f"Bearer {self.mcp_token}"
        return headers
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
        logger.info("MCP Client closed")
