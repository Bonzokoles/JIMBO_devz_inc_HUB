from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..db import get_session
from ..models import Command, CommandEvent
from ..schemas import CommandOut, CommandEventOut

router = APIRouter()

@router.get("/commands/{command_id}", response_model=CommandOut)
async def get_command(
    command_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    # TODO: Add current_actor dependency and RBAC check
    # require(actor.role, "status.read")
    
    res = await session.execute(select(Command).where(Command.id == command_id))
    cmd = res.scalar_one_or_none()
    if not cmd:
        raise HTTPException(404, "command_not_found")

    return CommandOut(
        id=cmd.id,
        status=cmd.status.value if hasattr(cmd.status, "value") else str(cmd.status),
        projectId=cmd.project_id,
        action=cmd.action,
        target=cmd.target,
        attempt=cmd.attempt,
        maxAttempts=cmd.max_attempts,
        createdBy=cmd.created_by,
    )

@router.get("/commands/{command_id}/events", response_model=list[CommandEventOut])
async def get_command_events(
    command_id: UUID,
    session: AsyncSession = Depends(get_session),
    limit: int = 200,
):
    # TODO: Add current_actor dependency and RBAC check
    # require(actor.role, "logs.read")
    
    res = await session.execute(
        select(CommandEvent)
        .where(CommandEvent.command_id == command_id)
        .order_by(CommandEvent.id.asc())
        .limit(limit)
    )
    events = res.scalars().all()
    return [
        CommandEventOut(
            id=e.id,
            commandId=e.command_id,
            ts=e.ts.isoformat() if hasattr(e.ts, "isoformat") else str(e.ts),
            type=e.type,
            message=e.message,
            meta=e.meta or {},
        )
        for e in events
    ]
