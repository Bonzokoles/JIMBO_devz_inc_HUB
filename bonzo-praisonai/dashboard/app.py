"""
Bonzo PraisonAI Dashboard - Monitoring Interface
Port 6100 - Real-time agent monitoring and metrics
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import asyncio
import logging

sys.path.append(str(Path(__file__).parent.parent))
from shared import get_redis_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bonzo PraisonAI Dashboard",
    description="Monitoring interface for AI agents",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
COST_OPTIMIZER_URL = os.getenv("COST_OPTIMIZER_URL", "http://localhost:6002")
GUARDIAN_URL = os.getenv("GUARDIAN_URL", "http://localhost:6004")
HEALTH_MONITOR_URL = os.getenv("HEALTH_MONITOR_URL", "http://localhost:6003")

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
redis_client = None


async def fetch_agent_status(url: str, agent_name: str) -> Dict:
    """Fetch status from an agent"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{url}/health")
            if response.status_code == 200:
                data = response.json()
                return {
                    "name": agent_name,
                    "status": "healthy",
                    "url": url,
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat()
                }
    except Exception as e:
        logger.warning(f"Failed to fetch {agent_name} status: {e}")
    
    return {
        "name": agent_name,
        "status": "offline",
        "url": url,
        "data": {},
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard page"""
    
    # Fetch all agent statuses
    agents = await asyncio.gather(
        fetch_agent_status(COST_OPTIMIZER_URL, "Cost Optimizer AI"),
        fetch_agent_status(GUARDIAN_URL, "Guardian AI"),
        fetch_agent_status(HEALTH_MONITOR_URL, "Health Monitor AI")
    )
    
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "agents": agents,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
    )


@app.get("/api/status")
async def get_all_status():
    """Get status of all agents (JSON)"""
    
    agents = await asyncio.gather(
        fetch_agent_status(COST_OPTIMIZER_URL, "Cost Optimizer AI"),
        fetch_agent_status(GUARDIAN_URL, "Guardian AI"),
        fetch_agent_status(HEALTH_MONITOR_URL, "Health Monitor AI")
    )
    
    healthy_count = sum(1 for a in agents if a["status"] == "healthy")
    
    return {
        "agents": agents,
        "healthy_count": healthy_count,
        "total_count": len(agents),
        "overall_status": "healthy" if healthy_count == len(agents) else "degraded" if healthy_count > 0 else "critical",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/cost-analysis")
async def get_cost_analysis():
    """Proxy to cost optimizer analysis"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{COST_OPTIMIZER_URL}/analyze",
                json={"period": "daily", "deep_analysis": False}
            )
            return response.json()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/system-status")
async def get_system_status():
    """Proxy to guardian system status"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{GUARDIAN_URL}/status")
            return response.json()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/worker-health/{worker_name}")
async def get_worker_health(worker_name: str):
    """Proxy to health monitor worker check"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{HEALTH_MONITOR_URL}/check/{worker_name}")
            return response.json()
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
async def health_check():
    """Dashboard health check"""
    return {
        "status": "healthy",
        "service": "Bonzo PraisonAI Dashboard",
        "agents_monitored": 3
    }


@app.on_event("startup")
async def startup():
    """Initialize dashboard"""
    global redis_client
    try:
        redis_client = get_redis_client()
        logger.info("✅ Bonzo PraisonAI Dashboard started")
        logger.info(f"📊 Monitoring: Cost Optimizer, Guardian, Health Monitor")
        logger.info(f"🌐 Dashboard: http://localhost:{os.getenv('DASHBOARD_PORT', '6100')}")
    except Exception as e:
        logger.warning(f"Dashboard startup warning: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("DASHBOARD_PORT", "6100"))
    uvicorn.run(app, host="0.0.0.0", port=port)
