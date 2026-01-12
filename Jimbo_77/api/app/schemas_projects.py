from __future__ import annotations
from pydantic import BaseModel
from typing import Optional

class AgentCfg(BaseModel):
    id: str
    url: str

class ServiceCfg(BaseModel):
    id: str             # stable ID w UI
    label: str
    target: str         # nazwa kontenera (docker) przekazywana do agenta
    agentId: str        # który agent ma to wykonać
    kind: str = "docker"  # na start: docker

class ProjectOut(BaseModel):
    id: str
    name: str
    host: str
    modules: list[str]
    agents: list[AgentCfg]
    services: list[ServiceCfg]
    links: dict[str, str] = {}
