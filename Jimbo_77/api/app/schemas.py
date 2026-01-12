from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Optional
from uuid import UUID

class CommandIn(BaseModel):
    projectId: str
    action: str
    target: Optional[str] = None
    params: dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None

class CommandOut(BaseModel):
    id: UUID
    status: str
    projectId: str
    action: str
    target: Optional[str] = None
    attempt: int
    maxAttempts: int
    createdBy: str

class CommandEventOut(BaseModel):
    id: int
    commandId: UUID
    ts: str
    type: str
    message: str
    meta: dict[str, Any]

class AuditEventOut(BaseModel):
    id: int
    commandId: UUID
    ts: str
    type: str
    message: str
    projectId: Optional[str] = None
    actor: Optional[str] = None
