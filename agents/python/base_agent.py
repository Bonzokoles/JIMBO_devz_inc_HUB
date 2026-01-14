"""
Base Agent Class
Shared infrastructure for all Python agents
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List, Literal
import uvicorn
import argparse
import json
import logging
from pathlib import Path
from datetime import datetime
import asyncio


class AgentConfig(BaseModel):
    """Base configuration for all agents"""
    id: str
    name: str
    version: str = "1.0.0"
    description: str = ""
    port: int = 6000
    capabilities: List[str] = []
    log_level: str = "INFO"


class AgentRequest(BaseModel):
    """Standard request format for all agents"""
    action: Literal["test", "execute", "status"]
    data: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    """Standard response format for all agents"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = datetime.now().isoformat()


class BaseAgent:
    """Base class for all Python agents"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.app = FastAPI(
            title=config.name,
            version=config.version,
            description=config.description
        )
        self.logger = self._setup_logging()
        self._setup_routes()
        self.is_running = False
    
    def _setup_logging(self) -> logging.Logger:
        """Configure logging for the agent"""
        logger = logging.getLogger(self.config.id)
        logger.setLevel(getattr(logging, self.config.log_level))
        
        # File handler
        log_file = Path(__file__).parent / self.config.id / "agent.log"
        log_file.parent.mkdir(exist_ok=True)
        
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Console handler
        console = logging.StreamHandler()
        console.setFormatter(formatter)
        logger.addHandler(console)
        
        return logger
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        @self.app.get("/")
        async def root():
            return {
                "agent": self.config.name,
                "version": self.config.version,
                "status": "running" if self.is_running else "idle",
                "capabilities": self.config.capabilities
            }
        
        @self.app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "agent": self.config.id,
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.post("/api", response_model=AgentResponse)
        async def handle_request(request: AgentRequest):
            """Main API endpoint"""
            self.logger.info(f"Received {request.action} request")
            
            try:
                if request.action == "test":
                    result = await self.test(request.data)
                elif request.action == "execute":
                    result = await self.execute(request.data)
                elif request.action == "status":
                    result = await self.status()
                else:
                    raise ValueError(f"Unknown action: {request.action}")
                
                return AgentResponse(
                    success=True,
                    message=f"{request.action} completed successfully",
                    data=result
                )
            
            except Exception as e:
                self.logger.error(f"Error in {request.action}: {str(e)}")
                return AgentResponse(
                    success=False,
                    message=str(e),
                    data={"error": type(e).__name__}
                )
    
    async def test(self, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Test agent functionality (override in subclass)"""
        return {
            "agent": self.config.id,
            "capabilities": self.config.capabilities,
            "message": "Test successful"
        }
    
    async def execute(self, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute main agent logic (override in subclass)"""
        raise NotImplementedError("Subclass must implement execute() method")
    
    async def status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "agent": self.config.id,
            "running": self.is_running,
            "capabilities": self.config.capabilities,
            "version": self.config.version
        }
    
    async def startup(self):
        """Startup hook (override in subclass for initialization)"""
        self.is_running = True
        self.logger.info(f"{self.config.name} started")
    
    async def shutdown(self):
        """Shutdown hook (override in subclass for cleanup)"""
        self.is_running = False
        self.logger.info(f"{self.config.name} stopped")
    
    def run(self, port: Optional[int] = None):
        """Run the agent server"""
        port = port or self.config.port
        
        # Setup lifespan events
        @self.app.on_event("startup")
        async def on_startup():
            await self.startup()
        
        @self.app.on_event("shutdown")
        async def on_shutdown():
            await self.shutdown()
        
        # Run server
        self.logger.info(f"Starting {self.config.name} on port {port}")
        uvicorn.run(
            self.app,
            host="0.0.0.0",
            port=port,
            log_level=self.config.log_level.lower()
        )


def load_config(config_file: Path, defaults: Dict) -> AgentConfig:
    """Load agent configuration from file or use defaults"""
    if config_file.exists():
        with open(config_file, "r") as f:
            user_config = json.load(f)
        # Merge with defaults
        merged = {**defaults, **user_config}
        return AgentConfig(**merged)
    else:
        return AgentConfig(**defaults)


def create_agent_cli(agent_class, default_config: Dict):
    """Create CLI for agent"""
    parser = argparse.ArgumentParser(description=default_config["description"])
    parser.add_argument("--port", type=int, help="Port to run on")
    parser.add_argument("--config", type=str, help="Path to config file")
    
    args = parser.parse_args()
    
    # Load config
    if args.config:
        config = load_config(Path(args.config), default_config)
    else:
        config = AgentConfig(**default_config)
    
    # Override port if specified
    if args.port:
        config.port = args.port
    
    # Create and run agent
    agent = agent_class(config)
    agent.run()
    
    return agent
