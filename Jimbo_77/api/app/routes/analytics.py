from fastapi import APIRouter
from ..services.system_monitor import SystemMonitorService

router = APIRouter(prefix="/v1/analytics", tags=["analytics"])

@router.get("/system")
async def get_system_stats():
    """Get real-time system statistics (CPU, RAM, Uptime)"""
    return SystemMonitorService.get_system_stats()
