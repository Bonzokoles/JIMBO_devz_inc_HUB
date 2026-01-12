from __future__ import annotations
from fastapi import APIRouter, Depends
from ..project_config import PROJECTS
from ..schemas_projects import ProjectOut

router = APIRouter()

@router.get("/projects", response_model=list[ProjectOut])
async def list_projects():
    # TODO: Add current_actor dependency and RBAC check
    # require(actor.role, "status.read")
    return PROJECTS

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str):
    # TODO: Add current_actor dependency and RBAC check
    # require(actor.role, "status.read")
    
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    return {
        "id": project_id,
        "name": project_id,
        "host": "",
        "modules": [],
        "agents": [],
        "services": [],
        "links": {},
    }
