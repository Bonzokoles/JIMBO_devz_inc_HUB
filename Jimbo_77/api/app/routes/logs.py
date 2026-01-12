from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
import httpx
from ..project_config import PROJECTS

router = APIRouter()

# Helper to find project config
def _get_project(project_id: str):
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    raise HTTPException(404, "project_not_found")

# Helper to find agent URL
def _get_agent_url(project_cfg, agent_id):
    for a in project_cfg.get("agents", []):
        if a["id"] == agent_id:
            return a["url"]
    # MVP fallback: jeśli nie znaleziono, a kind=python_process/hub, zwróć localhost (mock)
    if agent_id == "hub-agent-1": 
        # W realu tu byłoby IP agenta. Na devie agent nie chodzi, więc logi będą 502/ConnectError
        # Ale to OK, UI to obsłuży.
        return "http://localhost:8787"
    raise HTTPException(500, f"agent_not_configured: {agent_id}")

@router.get("/projects/{project_id}/services/{service_id}/logs")
async def get_service_logs(
    project_id: str,
    service_id: str,
    lines: int = Query(200, ge=10, le=2000),
    timestamps: bool = True
):
    project = _get_project(project_id)
    
    # Znajdź serwis
    service = next((s for s in project["services"] if s["id"] == service_id), None)
    if not service:
        raise HTTPException(404, "service_not_found")
        
    agent_id = service["agentId"]
    target = service["target"]
    url = _get_agent_url(project, agent_id)
    
    # Proxy do agenta
    # Agent API: GET /logs/{container}?lines=...&timestamps=...
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"{url}/logs/{target}", params={"lines": lines, "timestamps": str(timestamps).lower()})
            
            if resp.status_code == 404:
                # Jeśli agent działa ale nie ma kontenera -> 404
                return {"text": f"[AGENT] Container '{target}' looking suspect (not found)."}
            if resp.status_code != 200:
                return {"text": f"[AGENT] Error {resp.status_code}: {resp.text}"}
                
            data = resp.json()
            return {"text": data.get("text", "")}
            
    except httpx.ConnectError:
        # Mock behavior for Demo if agent is down
        return {"text": f"[SYSTEM] Could not connect to agent at {url}.\n[SYSTEM] Ideally, an OPS Agent would be running there.\n[SYSTEM] Attempted to fetch logs for: {target}"}
    except Exception as e:
        return {"text": f"[SYSTEM] Proxy Error: {str(e)}"}
