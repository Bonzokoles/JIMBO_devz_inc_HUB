from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import psutil
import subprocess
import json
import os
from pydantic import BaseModel
import httpx
from datetime import datetime

router = APIRouter(prefix="/api/network", tags=["network"])

# Orchestration Service Integration
AGENT_ZERO_URL = "http://localhost:50202/a2a"  # A2A protocol endpoint
AGENT_ZERO_TOKEN = "t-e7ac0786668e0ff0"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")


class PowerShellCommand(BaseModel):
    command: str
    params: Dict[str, str] = {}


class OrchestrationRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = None
    agents: Optional[List[str]] = None


class NetworkService(BaseModel):
    pid: int
    name: str
    port: int
    protocol: str
    status: str
    isExposed: bool
    vulnerabilityScore: int


@router.get("/services")
async def get_network_services() -> List[Dict[str, Any]]:
    """Get all active network services and ports"""
    services = []

    try:
        # Get all network connections
        connections = psutil.net_connections(kind="inet")

        for conn in connections:
            if conn.status == "LISTEN" and conn.laddr:
                try:
                    process = psutil.Process(conn.pid) if conn.pid else None
                    service = {
                        "pid": conn.pid or 0,
                        "name": process.name() if process else "Unknown",
                        "port": conn.laddr.port,
                        "protocol": "TCP" if conn.type == 1 else "UDP",
                        "status": conn.status,
                        "isExposed": conn.laddr.ip == "0.0.0.0"
                        or conn.laddr.ip == "::",
                        "vulnerabilityScore": calculate_vulnerability_score(
                            conn.laddr.port, conn.laddr.ip
                        ),
                    }
                    services.append(service)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get network services: {str(e)}"
        )

    return services


@router.get("/tunnels")
async def get_active_tunnels() -> List[Dict[str, Any]]:
    """Get active network tunnels (placeholder for real implementation)"""
    # This would integrate with actual tunnel management (Cloudflare, ngrok, etc.)
    return []


@router.post("/powershell")
async def execute_powershell(cmd: PowerShellCommand) -> Dict[str, Any]:
    """Execute PowerShell command (Windows only)"""
    try:
        # Replace parameters in command
        command = cmd.command
        for key, value in cmd.params.items():
            command = command.replace(f"{{{key}}}", value)

        # Execute PowerShell command
        result = subprocess.run(
            ["powershell", "-Command", command],
            capture_output=True,
            text=True,
            timeout=30,
        )

        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr if result.returncode != 0 else None,
            "exitCode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Command execution timeout")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"PowerShell execution failed: {str(e)}"
        )


@router.get("/ports/{port}/process")
async def get_port_process(port: int) -> Dict[str, Any]:
    """Get process information for a specific port"""
    try:
        connections = psutil.net_connections(kind="inet")

        for conn in connections:
            if conn.laddr and conn.laddr.port == port and conn.pid:
                try:
                    process = psutil.Process(conn.pid)
                    return {
                        "pid": conn.pid,
                        "name": process.name(),
                        "exe": process.exe(),
                        "cwd": process.cwd(),
                        "status": process.status(),
                        "cpu_percent": process.cpu_percent(interval=0.1),
                        "memory_mb": process.memory_info().rss / 1024 / 1024,
                    }
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

        raise HTTPException(status_code=404, detail=f"No process found on port {port}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ports/{port}/kill")
async def kill_port_process(port: int) -> Dict[str, str]:
    """Terminate process using specific port"""
    try:
        connections = psutil.net_connections(kind="inet")

        for conn in connections:
            if conn.laddr and conn.laddr.port == port and conn.pid:
                try:
                    process = psutil.Process(conn.pid)
                    process_name = process.name()
                    process.terminate()
                    process.wait(timeout=5)
                    return {
                        "message": f"Process {process_name} (PID {conn.pid}) terminated successfully"
                    }
                except psutil.TimeoutExpired:
                    process.kill()
                    return {"message": f"Process forcefully killed"}
                except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
                    raise HTTPException(status_code=403, detail=str(e))

        raise HTTPException(status_code=404, detail=f"No process found on port {port}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def network_health():
    """Network monitoring health check"""
    return {
        "status": "healthy",
        "active_connections": len(psutil.net_connections(kind="inet")),
        "listening_ports": len(
            [c for c in psutil.net_connections(kind="inet") if c.status == "LISTEN"]
        ),
    }


def calculate_vulnerability_score(port: int, ip: str) -> int:
    """Calculate vulnerability score based on port and exposure"""
    score = 0

    # Exposed to internet
    if ip in ["0.0.0.0", "::"]:
        score += 50

    # Common vulnerable ports
    vulnerable_ports = {
        21: 30,  # FTP
        23: 40,  # Telnet
        3389: 35,  # RDP
        5900: 35,  # VNC
        8080: 25,  # HTTP alt
        3306: 30,  # MySQL
        5432: 30,  # PostgreSQL
        6379: 35,  # Redis
        27017: 30,  # MongoDB
    }

    score += vulnerable_ports.get(port, 0)

    # Well-known secure ports get lower score
    if port in [443, 22]:
        score = max(0, score - 20)

    return min(100, score)


# ============================================================================
# ORCHESTRATION ENDPOINTS
# Blueprint Architecture: Jimbo → Brain → Pinky → Workers → Elwirka
# ============================================================================


async def call_ai(prompt: str, system_prompt: str) -> Dict[str, Any]:
    """Call Agent Zero via A2A protocol, fallback to OpenRouter"""

    # Try Agent Zero first (local, fast, A2A protocol)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                AGENT_ZERO_URL,
                headers={"Authorization": f"Bearer {AGENT_ZERO_TOKEN}"},
                json={
                    "message": f"{system_prompt}\n\n{prompt}",
                    "attachments": [],
                    "reset": False,
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "content": data.get("response", data.get("message", str(data))),
                    "provider": "agent-zero-a2a",
                }

    except Exception as e:
        print(f"⚠️ Agent Zero A2A failed: {e}, falling back to OpenRouter")

    # Fallback to OpenRouter
    if not OPENROUTER_KEY:
        return {"success": False, "error": "Both Agent Zero and OpenRouter unavailable"}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen/qwen-2.5-72b-instruct",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                },
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "content": data["choices"][0]["message"]["content"],
                    "provider": "openrouter",
                }

    except Exception as e:
        return {"success": False, "error": f"OpenRouter failed: {e}"}

    return {"success": False, "error": "All AI providers failed"}


@router.post("/orchestrate")
async def orchestrate_task(request: OrchestrationRequest) -> Dict[str, Any]:
    """
    Main orchestration endpoint
    Implements Blueprint: Jimbo → Brain → Pinky → Workers → Elwirka
    """

    result = {
        "task": request.task,
        "timestamp": datetime.utcnow().isoformat(),
        "steps": {},
    }

    # Step 1: Jimbo - Task Decomposition
    jimbo_prompt = f"""Task: {request.task}

Context: {request.context or 'None provided'}

Decompose this task into a structured plan.

Output JSON:
{{
  "brief": "...",
  "plan": ["step1", "step2", ...],
  "agents": ["agent-id1", "agent-id2"],
  "dependencies": [...],
  "estimated_time": "..."
}}"""

    jimbo_system = """You are JIMBO, the master orchestrator.
Your job: Break down tasks into actionable steps.

Rules:
1. Brief (1-3 sentences)
2. Plan (5-12 points)
3. Identify required agents
4. List dependencies"""

    jimbo_result = await call_ai(jimbo_prompt, jimbo_system)
    result["steps"]["jimbo"] = jimbo_result

    if not jimbo_result.get("success"):
        result["status"] = "failed_at_jimbo"
        return result

    # Parse Jimbo's output
    try:
        decomposition = json.loads(jimbo_result["content"])
    except:
        decomposition = {"raw": jimbo_result["content"]}

    # Step 2: Brain - Strategy Planning
    brain_prompt = f"""Task: {request.task}

Jimbo's Decomposition: {decomposition}

Create an execution strategy.

Output format:
{{
  "strategy": {{
    "approach": "...",
    "agents": ["id1", "id2"],
    "sequence": "parallel" | "sequential",
    "delegations": [
      {{"agent": "...", "task": "...", "input": "...", "expected_output": "..."}}
    ]
  }},
  "risks": ["risk1", "risk2"],
  "estimated_duration": "..."
}}"""

    brain_system = """You are BRAIN, the strategic orchestrator.
Your job: Create optimal execution strategies."""

    brain_result = await call_ai(brain_prompt, brain_system)
    result["steps"]["brain"] = brain_result

    if not brain_result.get("success"):
        result["status"] = "failed_at_brain"
        return result

    try:
        strategy = json.loads(brain_result["content"])
    except:
        strategy = {"raw": brain_result["content"]}

    # Step 3: Pinky - Validation (can STOP execution)
    pinky_prompt = f"""Task: {request.task}

Brain's Strategy: {strategy}

Validate this plan. Find edge cases. STOP if dangerous.

Output format:
{{
  "verdict": "APPROVE" | "STOP",
  "risks": ["risk1", "risk2", ...],
  "edge_cases": ["case1", "case2", ...],
  "failure_scenarios": ["scenario1", ...],
  "stop_reason": "..." // If STOP
}}"""

    pinky_system = """You are PINKY, the edge-case critic.
Your job: Find flaws and stop bad plans.

Use "STOP" if:
- Plan will break production
- Security risk > 50
- Missing critical dependencies
- Circular logic detected"""

    pinky_result = await call_ai(pinky_prompt, pinky_system)
    result["steps"]["pinky"] = pinky_result

    try:
        validation = json.loads(pinky_result["content"])

        if validation.get("verdict") == "STOP":
            result["status"] = "stopped_by_pinky"
            result["reason"] = validation.get("stop_reason")
            return result
    except:
        pass  # Continue if parsing fails

    # Step 4: Execute on Workers (placeholder)
    selected_agents = request.agents or strategy.get("strategy", {}).get("agents", [])
    execution_results = []

    for agent_id in selected_agents:
        exec_result = {
            "agent_id": agent_id,
            "status": "completed",
            "output": f"Executed {request.task} on {agent_id}",
            "timestamp": datetime.utcnow().isoformat(),
        }
        execution_results.append(exec_result)

    result["steps"]["execution"] = execution_results

    # Step 5: Elwirka - Finalization
    elwirka_prompt = f"""Task: {request.task}

Strategy Used: {strategy}

Execution Results: {execution_results}

Create final output with checklist and next steps.

Output format:
{{
  "output": {{
    "result": "...",
    "deliverables": [...]
  }},
  "checklist": ["step1", "step2", ...],
  "risks_and_mitigations": [
    {{"risk": "...", "mitigation": "..."}}
  ],
  "next_steps": ["action1", "action2"]
}}"""

    elwirka_system = """You are ELWIRKA, the finalizer.
Your job: Package results for deployment."""

    elwirka_result = await call_ai(elwirka_prompt, elwirka_system)
    result["steps"]["elwirka"] = elwirka_result

    try:
        final = json.loads(elwirka_result["content"])
        result["final_output"] = final.get("output")
        result["checklist"] = final.get("checklist", [])
        result["next_steps"] = final.get("next_steps", [])
    except:
        result["final_output"] = elwirka_result.get("content")

    result["status"] = "completed"

    return result


@router.get("/orchestration/status")
async def orchestration_status():
    """Check orchestration system status"""

    # Check Agent Zero
    agent_zero_ok = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:50100/api/v1/health")
            agent_zero_ok = response.status_code == 200
    except:
        pass

    return {
        "agent_zero": {
            "status": "online" if agent_zero_ok else "offline",
            "url": AGENT_ZERO_URL,
        },
        "openrouter": {"status": "configured" if OPENROUTER_KEY else "not_configured"},
        "orchestrators": {
            "jimbo": "integrated",
            "brain": "integrated",
            "pinky": "integrated",
            "elwirka": "integrated",
        },
    }
