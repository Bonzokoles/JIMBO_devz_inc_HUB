from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List, Dict

class AgentCfg(BaseModel):
    id: str
    url: str

class ServiceCfg(BaseModel):
    id: str             # stable ID w UI
    label: str
    target: str         # nazwa kontenera/procesu
    agentId: str        # który agent ma to wykonać
    kind: str = "docker"

class ProjectOut(BaseModel):
    id: str
    name: str
    host: str
    modules: List[str]
    agents: List[AgentCfg]
    services: List[ServiceCfg]
    links: Dict[str, str] = {}
