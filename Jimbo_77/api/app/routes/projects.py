from __future__ import annotations
from fastapi import APIRouter, HTTPException
from ..project_config import PROJECTS
from ..schemas_projects import ProjectOut

router = APIRouter()

@router.get("/projects", response_model=list[ProjectOut])
async def list_projects():
    # MVP: Brak autoryzacji RBAC na razie, żeby dashboard wstał od razu
    return PROJECTS

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str):
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
            
    # Fallback dla nieznanych projektów (żeby UI nie crashowało przy błędnym ID)
    return {
        "id": project_id,
        "name": f"Unknown Project {project_id}",
        "host": "",
        "modules": [],
        "agents": [],
        "services": [],
        "links": {},
    }
