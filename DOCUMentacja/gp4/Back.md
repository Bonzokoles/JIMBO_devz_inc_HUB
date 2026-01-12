Poniżej masz **gotowe pliki** (backend + frontend), tak żeby:

* `POST /v1/commands` już masz (lub masz wersję z poprzednich wiadomości),
* dochodzą:

  * `GET /v1/commands/{id}`
  * `GET /v1/commands/{id}/events`
  * `GET /v1/audit?limit=...`
* a na froncie:

  * `CommandDrawer.tsx` (panel statusu komendy + eventy)
  * podpięcie w `apps/project/src/App.tsx` (zamiast `alert()`)

Zakładam backend w stylu: **FastAPI async + SQLAlchemy async**. Jeśli masz trochę inne nazwy modułów, to tylko dopasujesz importy.

---

# A) BACKEND (FastAPI)

## 1) `api/app/schemas.py` (nowy)

```python
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
```

---

## 2) `api/app/db.py` (nowy lub podmień swój)

```python
from __future__ import annotations
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ops:ops@localhost:5432/ops")

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session():
    async with SessionLocal() as session:
        yield session
```

---

## 3) `api/app/models.py` (jeśli już masz — sprawdź pola, dopasuj)

```python
from __future__ import annotations
import enum
import uuid
from sqlalchemy import String, DateTime, Integer, Enum, JSON, Text, func, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, declarative_base

Base = declarative_base()

class CommandStatus(str, enum.Enum):
    queued="queued"
    running="running"
    succeeded="succeeded"
    failed="failed"
    canceled="canceled"

class Command(Base):
    __tablename__ = "commands"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_idem_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)

    project_id: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    target: Mapped[str | None] = mapped_column(String(128), nullable=True)
    params: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[CommandStatus] = mapped_column(Enum(CommandStatus), nullable=False, default=CommandStatus.queued)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

class CommandEvent(Base):
    __tablename__ = "command_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    command_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("commands.id"), nullable=False, index=True)

    ts: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(32), nullable=False)          # queued/started/log/retry/done/error
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
```

---

## 4) `api/app/routes/commands_read.py` (NOWY) — GET /commands/{id} + /events

```python
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..db import get_session
from ..models import Command, CommandEvent
from ..main import current_actor
from ..security.rbac import require
from ..schemas import CommandOut, CommandEventOut

router = APIRouter()

@router.get("/commands/{command_id}", response_model=CommandOut)
async def get_command(
    command_id: UUID,
    actor=Depends(current_actor),
    session: AsyncSession = Depends(get_session),
):
    require(actor.role, "status.read")
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
    actor=Depends(current_actor),
    session: AsyncSession = Depends(get_session),
    limit: int = 200,
):
    require(actor.role, "logs.read")
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
```

---

## 5) `api/app/routes/audit.py` (NOWY) — GET /audit

To jest “ostatnie eventy” (w praktyce: ostatnie wpisy z `command_events`).

```python
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import CommandEvent, Command
from ..main import current_actor
from ..security.rbac import require
from ..schemas import AuditEventOut

router = APIRouter()

@router.get("/audit", response_model=list[AuditEventOut])
async def audit(
    actor=Depends(current_actor),
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
):
    require(actor.role, "logs.read")

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
```

---

## 6) Podpięcie routerów w `api/app/main.py`

Dodaj importy i include_router:

```python
from .routes import commands_read, audit

app.include_router(commands_read.router, prefix="/v1", tags=["commands"])
app.include_router(audit.router, prefix="/v1", tags=["audit"])
```

---

# B) FRONTEND (React)

Dodamy API metody + drawer komponent.

## 1) `packages/core/src/api.ts` (DOPISZ)

Dopisz na końcu obiektu `api`:

```ts
  commandGet: (id: string) => jget<any>(`/v1/commands/${id}`),
  commandEvents: (id: string) => jget<any[]>(`/v1/commands/${id}/events`),
  audit: (limit = 50) => jget<any[]>(`/v1/audit?limit=${limit}`),
```

Jeśli chcesz typy na sztywno, da się, ale na MVP `any` jest OK.

---

## 2) `packages/ui/src/components/CommandDrawer.tsx` (NOWY)

To jest prosty panel z prawej, polling statusu + eventów.

```tsx
import React from "react";
import { api } from "@core/api";

type Props = {
  commandId: string | null;
  onClose: () => void;
};

function isDone(status?: string) {
  return status === "succeeded" || status === "failed" || status === "canceled";
}

export function CommandDrawer({ commandId, onClose }: Props) {
  const [cmd, setCmd] = React.useState<any>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!commandId) return;

    let alive = true;
    setCmd(null);
    setEvents([]);
    setError(null);

    const tick = async () => {
      try {
        const [c, ev] = await Promise.all([
          api.commandGet(commandId),
          api.commandEvents(commandId),
        ]);
        if (!alive) return;
        setCmd(c);
        setEvents(ev);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message ?? e));
      }
    };

    tick();

    const interval = window.setInterval(async () => {
      await tick();
    }, 1500);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [commandId]);

  if (!commandId) return null;

  const status = cmd?.status ?? "loading";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 420,
        background: "rgba(5,7,10,.92)",
        borderLeft: "1px solid var(--line)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ color: "var(--muted)" }}>COMMAND</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>{commandId}</div>
          <div style={{ marginTop: 8 }}>
            <span className={`pill ${status === "succeeded" ? "pillOk" : status === "failed" ? "pillBad" : ""}`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>
        <button className="btn" onClick={onClose}>CLOSE</button>
      </div>

      <div style={{ padding: 12, overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <div className="card" style={{ borderColor: "rgba(255,59,87,.55)" }}>
            <div style={{ color: "var(--danger)" }}>ERROR</div>
            <div style={{ marginTop: 8, color: "var(--muted)" }}>{error}</div>
          </div>
        )}

        <div className="card">
          <div style={{ color: "var(--muted)" }}>DETAILS</div>
          <div style={{ marginTop: 10, lineHeight: 1.6, color: "var(--muted)" }}>
            <div>project: <span style={{ color: "var(--fg)" }}>{cmd?.projectId ?? "-"}</span></div>
            <div>action: <span style={{ color: "var(--fg)" }}>{cmd?.action ?? "-"}</span></div>
            <div>target: <span style={{ color: "var(--fg)" }}>{cmd?.target ?? "-"}</span></div>
            <div>attempt: <span style={{ color: "var(--fg)" }}>{cmd?.attempt ?? "-"}</span> / {cmd?.maxAttempts ?? "-"}</div>
            <div>by: <span style={{ color: "var(--fg)" }}>{cmd?.createdBy ?? "-"}</span></div>
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--muted)" }}>EVENTS</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {events.length === 0 && <div style={{ color: "var(--muted)" }}>no events yet</div>}
            {events.map((e) => (
              <div key={e.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(10,18,32,.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <b style={{ fontSize: 12 }}>{String(e.type).toUpperCase()}</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{e.ts}</span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)" }}>{e.message}</div>
              </div>
            ))}
          </div>
        </div>

        {isDone(status) && (
          <div className="card" style={{ borderColor: "rgba(65,255,154,.25)" }}>
            <div style={{ color: "var(--muted)" }}>DONE</div>
            <div style={{ marginTop: 8, color: "var(--muted)" }}>
              command finished. you can close this drawer.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 3) Export w `packages/ui/src/index.ts` (DOPISZ)

```ts
export * from "./components/CommandDrawer";
```

I dopisz export map w `packages/ui/package.json` jeśli chcesz importować jako `@ui` (opcjonalne). Najprościej importować względnie z aliasu `@ui`.

---

## 4) Podpięcie drawer w `apps/project/src/App.tsx` (PODMIANA fragmentów)

### A) Dodaj import:

```tsx
import { CommandDrawer } from "@ui/components/CommandDrawer";
```

Jeśli nie masz aliasu do `components`, to importuj z `@ui` po dodaniu exportu w index.ts:

```tsx
import { CommandDrawer } from "@ui";
```

### B) Dodaj stan na aktualną komendę:

```tsx
const [activeCommandId, setActiveCommandId] = React.useState<string | null>(null);
```

### C) Zmień `restartExample()` — zamiast `alert()`

Podmień fragment:

```tsx
const out = await api.command(payload, idemKey());
setActiveCommandId(out.id);
```

### D) W JSX na końcu dodaj drawer:

```tsx
<CommandDrawer
  commandId={activeCommandId}
  onClose={() => setActiveCommandId(null)}
/>
```

Całość w praktyce: wciśniesz “RESTART” → dostajesz Command ID → drawer pokaże status + eventy.

---

# C) Ważne: eventy muszą się pojawiać (czyli worker/api muszą dopisywać)

Na MVP możesz dopisywać eventy już w API:

* `queued` (już robisz)
  A w workerze dopisujesz:
* `started`
* `done` / `error`
* ewentualnie `retry`

Jeśli jeszcze nie masz workera spiętego z DB, to na razie w UI zobaczysz tylko `queued` + brak dalszych eventów. To normalne, dopóki nie dopniesz “wykonywania”.

---

Jeśli chcesz, następny pakiet “na gotowo” to: **worker DB integration + dopisywanie eventów + zmiana statusu komendy** (to jest 100% mechaniki i wtedy drawer zaczyna żyć jak w prawdziwym NOC-u).
