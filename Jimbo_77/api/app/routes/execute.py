"""
Agent Execution API
Single endpoint for Orchestrator to execute agent tasks
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import aiohttp
import asyncio

router = APIRouter()

class ExecuteRequest(BaseModel):
    action: str
    data: Dict[str, Any]

class ExecuteResponse(BaseModel):
    success: bool
    agent_id: str
    action: str
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float

# Agent port mapping
AGENT_PORTS = {
    "research-agent": 6062,
    "writer-agent": 6030,
    "seo-agent": 6031,
    "finance-agent": 6040,
    "graphics-agent": 6050,
    "market-research-agent": 6070,
    "company-analysis-agent": 6071,
    "planner-agent": 6080,
    "analytics-prophet": 6000,
    "system-monitor": 6001,
    "security-guard": 6002,
    "web-crawler": 6010,
    "file-manager": 6011,
    "database-query": 6012,
    "email-handler": 6020,
    "content-guardian": 6021,
    "marketing-maestro": 6025,
    "webmaster": 6026,
}

@router.post("/execute/{agent_id}", response_model=ExecuteResponse)
async def execute_agent_task(agent_id: str, request: ExecuteRequest):
    """
    Execute a single task on an agent
    Called by Orchestrator worker
    """
    import time
    start_time = time.time()
    
    if agent_id not in AGENT_PORTS:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
    
    port = AGENT_PORTS[agent_id]
    url = f"http://localhost:{port}/api"
    
    try:
        # Call agent's API endpoint
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json={
                    "action": request.action,
                    "data": request.data
                },
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    return ExecuteResponse(
                        success=False,
                        agent_id=agent_id,
                        action=request.action,
                        error=f"Agent returned {response.status}: {error_text}",
                        execution_time=time.time() - start_time
                    )
                
                result = await response.json()
                
                return ExecuteResponse(
                    success=result.get("success", False),
                    agent_id=agent_id,
                    action=request.action,
                    data=result.get("data"),
                    error=result.get("error"),
                    execution_time=time.time() - start_time
                )
    
    except aiohttp.ClientConnectorError:
        # Agent not running - try to start it
        from .agents import get_agent_info, start_python_agent, start_typescript_agent, AGENT_PROCESSES
        
        agent_info = get_agent_info(agent_id)
        if not agent_info:
            raise HTTPException(status_code=500, detail=f"Agent info not found: {agent_id}")
        
        # Start agent
        try:
            if agent_info["language"] == "python":
                process = start_python_agent(agent_id, port)
            else:
                process = start_typescript_agent(agent_id, port)
            
            AGENT_PROCESSES[agent_id] = {
                "process": process,
                "port": port,
                "language": agent_info["language"]
            }
            
            # Wait for agent to start (max 5 seconds)
            await asyncio.sleep(2)
            
            # Retry the request
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json={
                        "action": request.action,
                        "data": request.data
                    },
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    result = await response.json()
                    return ExecuteResponse(
                        success=result.get("success", False),
                        agent_id=agent_id,
                        action=request.action,
                        data=result.get("data"),
                        error=result.get("error"),
                        execution_time=time.time() - start_time
                    )
        
        except Exception as e:
            return ExecuteResponse(
                success=False,
                agent_id=agent_id,
                action=request.action,
                error=f"Failed to start agent: {str(e)}",
                execution_time=time.time() - start_time
            )
    
    except asyncio.TimeoutError:
        return ExecuteResponse(
            success=False,
            agent_id=agent_id,
            action=request.action,
            error="Agent timeout (60s)",
            execution_time=time.time() - start_time
        )
    
    except Exception as e:
        return ExecuteResponse(
            success=False,
            agent_id=agent_id,
            action=request.action,
            error=str(e),
            execution_time=time.time() - start_time
        )


@router.get("/execute/health")
async def execute_health():
    """Health check for execute endpoint"""
    return {
        "status": "healthy",
        "endpoint": "/api/agents/execute/{agent_id}",
        "agents": len(AGENT_PORTS),
        "auto_start": True
    }
