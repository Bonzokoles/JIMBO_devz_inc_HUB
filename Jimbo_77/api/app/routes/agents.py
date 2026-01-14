"""
Agent Management API
Endpoints for starting, stopping, configuring, and monitoring agents
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
import subprocess
import psutil
import os
import signal
import json
from pathlib import Path
from ..agent_monitor import get_monitor, get_log_aggregator

router = APIRouter()

# Agent process registry (in production, use Redis or DB)
AGENT_PROCESSES: Dict[str, dict] = {}

# Get monitor instance
monitor = get_monitor()
log_aggregator = get_log_aggregator()

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent.parent
PYTHON_AGENTS_DIR = BASE_DIR / "agents" / "python"
TS_AGENTS_DIR = BASE_DIR / "DOCUMentacja" / "agents"

class AgentStartRequest(BaseModel):
    agent_id: str
    config: Optional[Dict] = None

class AgentConfigRequest(BaseModel):
    agent_id: str
    config: Dict

class AgentResponse(BaseModel):
    agent_id: str
    status: Literal["active", "idle", "error", "disabled"]
    message: str
    pid: Optional[int] = None

class AgentStatusResponse(BaseModel):
    agent_id: str
    status: Literal["active", "idle", "error", "disabled"]
    pid: Optional[int] = None
    port: Optional[int] = None
    uptime: Optional[float] = None
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None

class AgentLogsResponse(BaseModel):
    agent_id: str
    logs: List[str]
    total_lines: int


def get_agent_info(agent_id: str) -> Optional[dict]:
    """Get agent metadata from registry"""
    # Import here to avoid circular dependency
    import sys
    frontend_core = BASE_DIR / "Jimbo_77" / "frontend" / "packages" / "core"
    
    # Read registry.ts and parse (simplified - in production use proper parser)
    registry_path = frontend_core / "src" / "agents" / "registry.ts"
    if not registry_path.exists():
        return None
    
    # For now, return hardcoded mapping (TODO: parse registry.ts properly)
    agents = {
        "research-agent": {"id": "research-agent", "language": "python", "port": 6062},
        "writer-agent": {"id": "writer-agent", "language": "python", "port": 6030},
        "seo-agent": {"id": "seo-agent", "language": "python", "port": 6031},
        "finance-agent": {"id": "finance-agent", "language": "python", "port": 6040},
        "graphics-agent": {"id": "graphics-agent", "language": "python", "port": 6050},
        "market-research-agent": {"id": "market-research-agent", "language": "python", "port": 6070},
        "company-analysis-agent": {"id": "company-analysis-agent", "language": "python", "port": 6071},
        "planner-agent": {"id": "planner-agent", "language": "python", "port": 6080},
        "analytics-prophet": {"id": "analytics-prophet", "language": "typescript", "port": 6000},
        "system-monitor": {"id": "system-monitor", "language": "typescript", "port": 6001},
        "security-guard": {"id": "security-guard", "language": "typescript", "port": 6002},
        "web-crawler": {"id": "web-crawler", "language": "typescript", "port": 6010},
        "file-manager": {"id": "file-manager", "language": "typescript", "port": 6011},
        "database-query": {"id": "database-query", "language": "typescript", "port": 6012},
        "email-handler": {"id": "email-handler", "language": "typescript", "port": 6020},
        "content-guardian": {"id": "content-guardian", "language": "typescript", "port": 6021},
        "marketing-maestro": {"id": "marketing-maestro", "language": "typescript", "port": 6025},
        "webmaster": {"id": "webmaster", "language": "typescript", "port": 6026},
    }
    return agents.get(agent_id)


def start_python_agent(agent_id: str, port: int, config: Optional[Dict] = None) -> subprocess.Popen:
    """Start a Python agent process"""
    agent_dir = PYTHON_AGENTS_DIR / agent_id
    main_file = agent_dir / "main.py"
    
    if not main_file.exists():
        raise FileNotFoundError(f"Agent main file not found: {main_file}")
    
    # Build command
    cmd = ["python", str(main_file), "--port", str(port)]
    
    if config:
        config_file = agent_dir / "config.json"
        with open(config_file, "w") as f:
            json.dump(config, f, indent=2)
        cmd.extend(["--config", str(config_file)])
    
    # Start process
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(agent_dir)
    )
    
    return process


def start_typescript_agent(agent_id: str, port: int, config: Optional[Dict] = None) -> subprocess.Popen:
    """Start a TypeScript agent process"""
    agent_dir = TS_AGENTS_DIR / agent_id
    
    if not agent_dir.exists():
        raise FileNotFoundError(f"Agent directory not found: {agent_dir}")
    
    # Build command (assumes npm scripts are set up)
    cmd = ["npm", "run", "start", "--", "--port", str(port)]
    
    if config:
        config_file = agent_dir / "config.json"
        with open(config_file, "w") as f:
            json.dump(config, f, indent=2)
    
    # Start process
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(agent_dir),
        shell=True if os.name == 'nt' else False
    )
    
    return process


@router.post("/start/{agent_id}", response_model=AgentResponse)
async def start_agent(agent_id: str, request: Optional[AgentStartRequest] = None):
    """Start an agent process"""
    # Check if already running
    if agent_id in AGENT_PROCESSES:
        pid = AGENT_PROCESSES[agent_id]["pid"]
        if psutil.pid_exists(pid):
            return AgentResponse(
                agent_id=agent_id,
                status="active",
                message="Agent already running",
                pid=pid
            )
    
    # Get agent info
    agent_info = get_agent_info(agent_id)
    if not agent_info:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    try:
        # Start agent based on language
        config = request.config if request else None
        
        if agent_info["language"] == "python":
            process = start_python_agent(agent_id, agent_info["port"], config)
        else:  # typescript
            process = start_typescript_agent(agent_id, agent_info["port"], config)
        
        # Register process
        AGENT_PROCESSES[agent_id] = {
            "pid": process.pid,
            "port": agent_info["port"],
            "language": agent_info["language"],
            "process": process
        }
        
        # Register with monitor for health checks
        monitor.register_agent(agent_id, process.pid, agent_info["port"], auto_restart=True)
        
        return AgentResponse(
            agent_id=agent_id,
            status="active",
            message="Agent started successfully",
            pid=process.pid
        )
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start agent: {str(e)}")


@router.post("/stop/{agent_id}", response_model=AgentResponse)
async def stop_agent(agent_id: str):
    """Stop an agent process"""
    if agent_id not in AGENT_PROCESSES:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} is not running")
    
    try:
        pid = AGENT_PROCESSES[agent_id]["pid"]
        
        # Terminate process gracefully
        if psutil.pid_exists(pid):
            process = psutil.Process(pid)
            process.terminate()
            
            # Wait for termination (with timeout)
            try:
                process.wait(timeout=5)
            except psutil.TimeoutExpired:
                # Force kill if not terminated
                process.kill()
        
        # Remove from registry
        del AGENT_PROCESSES[agent_id]
        
        # Unregister from monitor
        monitor.unregister_agent(agent_id)
        
        return AgentResponse(
            agent_id=agent_id,
            status="idle",
            message="Agent stopped successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop agent: {str(e)}")


@router.post("/configure/{agent_id}", response_model=AgentResponse)
async def configure_agent(agent_id: str, request: AgentConfigRequest):
    """Update agent configuration (requires restart if running)"""
    agent_info = get_agent_info(agent_id)
    if not agent_info:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    try:
        # Determine agent directory
        if agent_info["language"] == "python":
            agent_dir = PYTHON_AGENTS_DIR / agent_id
        else:
            agent_dir = TS_AGENTS_DIR / agent_id
        
        # Save configuration
        config_file = agent_dir / "config.json"
        with open(config_file, "w") as f:
            json.dump(request.config, f, indent=2)
        
        # If agent is running, restart it
        is_running = agent_id in AGENT_PROCESSES
        if is_running:
            await stop_agent(agent_id)
            await start_agent(agent_id, AgentStartRequest(agent_id=agent_id, config=request.config))
            message = "Configuration updated and agent restarted"
        else:
            message = "Configuration saved (agent not running)"
        
        return AgentResponse(
            agent_id=agent_id,
            status="active" if is_running else "idle",
            message=message
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure agent: {str(e)}")


@router.get("/status/{agent_id}", response_model=AgentStatusResponse)
async def get_agent_status(agent_id: str):
    """Get current status of an agent"""
    agent_info = get_agent_info(agent_id)
    if not agent_info:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Check if running
    if agent_id not in AGENT_PROCESSES:
        return AgentStatusResponse(
            agent_id=agent_id,
            status="idle",
            port=agent_info["port"]
        )
    
    pid = AGENT_PROCESSES[agent_id]["pid"]
    
    # Check if process exists
    if not psutil.pid_exists(pid):
        # Process died - clean up
        del AGENT_PROCESSES[agent_id]
        return AgentStatusResponse(
            agent_id=agent_id,
            status="error",
            port=agent_info["port"]
        )
    
    # Get process metrics
    try:
        process = psutil.Process(pid)
        
        return AgentStatusResponse(
            agent_id=agent_id,
            status="active",
            pid=pid,
            port=AGENT_PROCESSES[agent_id]["port"],
            uptime=process.create_time(),
            cpu_percent=process.cpu_percent(interval=0.1),
            memory_mb=process.memory_info().rss / 1024 / 1024
        )
    except psutil.NoSuchProcess:
        del AGENT_PROCESSES[agent_id]
        return AgentStatusResponse(
            agent_id=agent_id,
            status="error",
            port=agent_info["port"]
        )


@router.get("/logs/{agent_id}", response_model=AgentLogsResponse)
async def get_agent_logs(agent_id: str, lines: int = 100):
    """Get recent logs from an agent"""
    agent_info = get_agent_info(agent_id)
    if not agent_info:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Determine log file path
    if agent_info["language"] == "python":
        log_file = PYTHON_AGENTS_DIR / agent_id / "agent.log"
    else:
        log_file = TS_AGENTS_DIR / agent_id / "agent.log"
    
    if not log_file.exists():
        return AgentLogsResponse(
            agent_id=agent_id,
            logs=["No logs available"],
            total_lines=0
        )
    
    # Read last N lines
    try:
        with open(log_file, "r") as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        return AgentLogsResponse(
            agent_id=agent_id,
            logs=[line.strip() for line in recent_lines],
            total_lines=len(all_lines)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read logs: {str(e)}")


@router.get("/", response_model=List[AgentStatusResponse])
async def list_all_agents():
    """List all agents with their current status"""
    # Get all agent IDs from hardcoded mapping (TODO: parse registry.ts)
    agent_ids = [
        "research-agent", "writer-agent", "seo-agent", "finance-agent", "graphics-agent",
        "market-research-agent", "company-analysis-agent", "planner-agent",
        "analytics-prophet", "system-monitor", "security-guard", "web-crawler",
        "file-manager", "database-query", "email-handler", "content-guardian",
        "marketing-maestro", "webmaster"
    ]
    
    statuses = []
    for agent_id in agent_ids:
        try:
            status = await get_agent_status(agent_id)
            statuses.append(status)
        except HTTPException:
            continue
    
    return statuses


@router.post("/restart/{agent_id}", response_model=AgentResponse)
async def restart_agent(agent_id: str):
    """Restart an agent (stop then start)"""
    try:
        # Stop if running
        if agent_id in AGENT_PROCESSES:
            await stop_agent(agent_id)
        
        # Start again
        response = await start_agent(agent_id)
        response.message = "Agent restarted successfully"
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart agent: {str(e)}")


@router.post("/stop-all", response_model=Dict[str, str])
async def stop_all_agents():
    """Stop all running agents"""
    results = {}
    
    for agent_id in list(AGENT_PROCESSES.keys()):
        try:
            await stop_agent(agent_id)
            results[agent_id] = "stopped"
        except Exception as e:
            results[agent_id] = f"error: {str(e)}"
    
    return results


@router.get("/monitor/status")
async def get_monitor_status():
    """Get monitoring system status"""
    return {
        "monitoring": monitor.running,
        "agents": monitor.get_status(),
        "total_agents": len(monitor.agents)
    }


@router.get("/monitor/metrics/{agent_id}")
async def get_agent_metrics(agent_id: str):
    """Get detailed metrics for an agent"""
    metrics = await monitor.get_metrics(agent_id)
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found in monitor")
    
    return metrics


@router.get("/logs/aggregated")
async def get_aggregated_logs(level: str = "ERROR", minutes: int = 60):
    """Get aggregated logs from all agents"""
    logs = await log_aggregator.get_aggregated_logs(level, minutes)
    
    return {
        "level": level,
        "time_window_minutes": minutes,
        "total_logs": len(logs),
        "logs": logs
    }


@router.get("/logs/search/{agent_id}")
async def search_agent_logs(agent_id: str, pattern: str):
    """Search logs for a specific pattern"""
    results = await log_aggregator.search_logs(agent_id, pattern)
    
    return {
        "agent_id": agent_id,
        "pattern": pattern,
        "matches": len(results),
        "results": results
    }

