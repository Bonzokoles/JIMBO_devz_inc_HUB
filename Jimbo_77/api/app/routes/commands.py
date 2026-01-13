from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel

from ..db import get_session
from ..models import Command, CommandEvent, CommandStatus
from ..schemas import CommandIn, CommandOut
from ..cooldown import enforce_cooldown, CooldownError

router = APIRouter()

class CommandStatusUpdate(BaseModel):
    status: str
    result: dict = None

@router.post("/commands", response_model=CommandOut)
async def create_command(
    payload: CommandIn,
    idempotency_key: str = None,  # Header: Idempotency-Key
    session: AsyncSession = Depends(get_session),
):
    # TODO: Add current_actor dependency
    # actor = Depends(current_actor)
    # require(actor.role, "service.restart" or "deploy.run")
    
    # Reason required for destructive actions
    if payload.action in ("service.restart", "deploy.run"):
        if not payload.reason or len(payload.reason.strip()) < 5:
            raise HTTPException(status_code=400, detail="reason_required_min_5")
    
    # Cooldown enforcement (twardy)
    try:
        enforce_cooldown(payload.projectId, payload.action, payload.target)
    except CooldownError as e:
        raise HTTPException(
            status_code=429,
            detail={"error": "cooldown_active", "retry_after_seconds": e.ttl}
        )
    
    # TODO: Idempotency check
    # TODO: Insert command to DB
    # TODO: Create "queued" event
    
    # Mock response for now
    import uuid
    return CommandOut(
        id=uuid.uuid4(),
        status="queued",
        projectId=payload.projectId,
        action=payload.action,
        target=payload.target,
        attempt=0,
        maxAttempts=3,
        createdBy="system",  # TODO: get from actor
    )

@router.get("/commands/pending")
async def get_pending_commands():
    """Endpoint for agent polling - returns oldest pending command"""
    # TODO: Real implementation with database
    # For now return empty (no commands)
    return None

@router.post("/commands/{command_id}/status")
async def update_command_status(
    command_id: UUID,
    update: CommandStatusUpdate
):
    """Endpoint for agents to report command execution status"""
    # TODO: Real implementation with database
    # For now just log and return success
    print(f"Command {command_id} status: {update.status}")
    if update.result:
        print(f"Result: {update.result}")
    return {"ok": True}
