import psutil
import time
import platform
from datetime import datetime, timedelta

_boot_time = datetime.fromtimestamp(psutil.boot_time())

class SystemMonitorService:
    @staticmethod
    def get_system_stats():
        cpu_usage = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Calculate uptime
        uptime_seconds = (datetime.now() - _boot_time).total_seconds()
        
        return {
            "cpu_percent": cpu_usage,
            "memory_percent": memory.percent,
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "disk_percent": disk.percent,
            "uptime_seconds": int(uptime_seconds),
            "uptime_human": str(timedelta(seconds=int(uptime_seconds))),
            "platform": platform.system(),
            "boot_time": _boot_time.isoformat(),
            "timestamp": datetime.now().isoformat()
        }

    @staticmethod
    def get_processes_summary():
        # TODO: Implement process filtering for JIMBO agents
        return {
            "total_processes": len(psutil.pids()),
            # Placeholder for tracked services
            "active_services": 0
        }
