"""
Agent Process Manager
System for monitoring, auto-restart, and health checks
"""
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import psutil
import aiohttp
from pathlib import Path

logger = logging.getLogger(__name__)


class AgentMonitor:
    """Monitor and manage agent processes"""
    
    def __init__(self):
        self.agents: Dict[str, dict] = {}
        self.health_checks: Dict[str, datetime] = {}
        self.restart_attempts: Dict[str, int] = {}
        self.max_restart_attempts = 3
        self.health_check_interval = 60  # seconds
        self.running = False
    
    def register_agent(self, agent_id: str, pid: int, port: int, auto_restart: bool = True):
        """Register an agent for monitoring"""
        self.agents[agent_id] = {
            "pid": pid,
            "port": port,
            "auto_restart": auto_restart,
            "registered_at": datetime.now(),
            "last_restart": None,
            "health_status": "unknown"
        }
        self.restart_attempts[agent_id] = 0
        logger.info(f"Registered agent {agent_id} (PID: {pid}, Port: {port})")
    
    def unregister_agent(self, agent_id: str):
        """Unregister an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            del self.restart_attempts[agent_id]
            if agent_id in self.health_checks:
                del self.health_checks[agent_id]
            logger.info(f"Unregistered agent {agent_id}")
    
    async def check_process_alive(self, agent_id: str) -> bool:
        """Check if agent process is alive"""
        if agent_id not in self.agents:
            return False
        
        pid = self.agents[agent_id]["pid"]
        
        try:
            process = psutil.Process(pid)
            return process.is_running()
        except psutil.NoSuchProcess:
            return False
    
    async def check_health_endpoint(self, agent_id: str) -> bool:
        """Check agent health via HTTP endpoint"""
        if agent_id not in self.agents:
            return False
        
        port = self.agents[agent_id]["port"]
        url = f"http://localhost:{port}/health"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.agents[agent_id]["health_status"] = "healthy"
                        return True
                    else:
                        self.agents[agent_id]["health_status"] = f"unhealthy (HTTP {response.status})"
                        return False
        except Exception as e:
            self.agents[agent_id]["health_status"] = f"unreachable ({type(e).__name__})"
            logger.warning(f"Health check failed for {agent_id}: {e}")
            return False
    
    async def restart_agent(self, agent_id: str) -> bool:
        """Restart a failed agent"""
        if agent_id not in self.agents:
            return False
        
        # Check restart attempts
        if self.restart_attempts[agent_id] >= self.max_restart_attempts:
            logger.error(f"Max restart attempts reached for {agent_id}, giving up")
            self.agents[agent_id]["health_status"] = "failed"
            return False
        
        self.restart_attempts[agent_id] += 1
        logger.info(f"Restarting {agent_id} (attempt {self.restart_attempts[agent_id]})")
        
        # TODO: Call start_agent API
        # For now, just log
        self.agents[agent_id]["last_restart"] = datetime.now()
        
        return True
    
    async def monitor_loop(self):
        """Main monitoring loop"""
        self.running = True
        logger.info("Agent monitor started")
        
        while self.running:
            for agent_id in list(self.agents.keys()):
                # Check process
                is_alive = await self.check_process_alive(agent_id)
                
                if not is_alive:
                    logger.warning(f"Agent {agent_id} process died")
                    
                    if self.agents[agent_id]["auto_restart"]:
                        await self.restart_agent(agent_id)
                    else:
                        logger.info(f"Auto-restart disabled for {agent_id}")
                    
                    continue
                
                # Check health endpoint
                is_healthy = await self.check_health_endpoint(agent_id)
                
                if not is_healthy:
                    logger.warning(f"Agent {agent_id} health check failed")
                    # Could implement restart logic here too
                
                # Update last check time
                self.health_checks[agent_id] = datetime.now()
            
            # Wait before next cycle
            await asyncio.sleep(self.health_check_interval)
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        logger.info("Agent monitor stopped")
    
    def get_status(self) -> List[dict]:
        """Get status of all monitored agents"""
        status = []
        
        for agent_id, info in self.agents.items():
            last_check = self.health_checks.get(agent_id)
            
            status.append({
                "agent_id": agent_id,
                "pid": info["pid"],
                "port": info["port"],
                "health_status": info["health_status"],
                "last_check": last_check.isoformat() if last_check else None,
                "restart_attempts": self.restart_attempts[agent_id],
                "uptime": (datetime.now() - info["registered_at"]).total_seconds(),
                "last_restart": info["last_restart"].isoformat() if info["last_restart"] else None
            })
        
        return status
    
    async def get_metrics(self, agent_id: str) -> Optional[dict]:
        """Get detailed metrics for an agent"""
        if agent_id not in self.agents:
            return None
        
        pid = self.agents[agent_id]["pid"]
        
        try:
            process = psutil.Process(pid)
            
            return {
                "agent_id": agent_id,
                "pid": pid,
                "cpu_percent": process.cpu_percent(interval=0.1),
                "memory_mb": process.memory_info().rss / 1024 / 1024,
                "num_threads": process.num_threads(),
                "create_time": process.create_time(),
                "status": process.status()
            }
        except psutil.NoSuchProcess:
            return {
                "agent_id": agent_id,
                "error": "Process not found"
            }


class LogAggregator:
    """Aggregate logs from all agents"""
    
    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(exist_ok=True)
    
    async def get_agent_logs(self, agent_id: str, lines: int = 100) -> List[str]:
        """Get recent logs for an agent"""
        log_file = self.log_dir / agent_id / "agent.log"
        
        if not log_file.exists():
            return []
        
        try:
            with open(log_file, "r") as f:
                all_lines = f.readlines()
                recent = all_lines[-lines:] if len(all_lines) > lines else all_lines
                return [line.strip() for line in recent]
        except Exception as e:
            logger.error(f"Failed to read logs for {agent_id}: {e}")
            return []
    
    async def search_logs(self, agent_id: str, pattern: str) -> List[str]:
        """Search logs for a pattern"""
        log_file = self.log_dir / agent_id / "agent.log"
        
        if not log_file.exists():
            return []
        
        try:
            with open(log_file, "r") as f:
                matching = [line.strip() for line in f if pattern.lower() in line.lower()]
                return matching
        except Exception as e:
            logger.error(f"Failed to search logs for {agent_id}: {e}")
            return []
    
    async def get_aggregated_logs(self, level: str = "ERROR", minutes: int = 60) -> List[dict]:
        """Get aggregated logs from all agents"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        aggregated = []
        
        for agent_dir in self.log_dir.iterdir():
            if not agent_dir.is_dir():
                continue
            
            log_file = agent_dir / "agent.log"
            if not log_file.exists():
                continue
            
            try:
                with open(log_file, "r") as f:
                    for line in f:
                        if level.upper() in line:
                            # Parse timestamp (simplified)
                            aggregated.append({
                                "agent": agent_dir.name,
                                "level": level,
                                "message": line.strip()
                            })
            except Exception as e:
                logger.error(f"Failed to read logs for {agent_dir.name}: {e}")
        
        return aggregated


# Global monitor instance
agent_monitor = AgentMonitor()
log_aggregator = LogAggregator(Path(__file__).parent.parent.parent / "agents" / "logs")


async def start_monitoring():
    """Start the monitoring system"""
    await agent_monitor.monitor_loop()


def get_monitor() -> AgentMonitor:
    """Get the global monitor instance"""
    return agent_monitor


def get_log_aggregator() -> LogAggregator:
    """Get the global log aggregator instance"""
    return log_aggregator
