from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import CommandEvent, Command
from ..schemas import AuditEventOut

router = APIRouter()

@router.get("/audit", response_model=list[AuditEventOut])
async def audit(
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
):
    # TODO: Add current_actor dependency and RBAC check
    # require(actor.role, "logs.read")

    # join do commands żeby dorzucić projectId (i opcjonalnie actor)
    stmt = (
        select(CommandEvent, Command.project_id, Command.created_by)
        .join(Command, Command.id == CommandEvent.command_id)
        .order_by(desc(CommandEvent.id))
        .limit(min(max(limit, 1), 500))
    )
    res = await session.execute(stmt)
    rows = res.all()

    out: list[AuditEventOut] = []
    for ev, project_id, created_by in rows:
        out.append(AuditEventOut(
            id=ev.id,
            commandId=ev.command_id,
            ts=ev.ts.isoformat() if hasattr(ev.ts, "isoformat") else str(ev.ts),
            type=ev.type,
            message=ev.message,
            projectId=project_id,
            actor=created_by,
        ))
    return out
