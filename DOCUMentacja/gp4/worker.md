OK, jedziemy “na gotowo”: **worker z DB + eventy + statusy + retry/backoff + lock + call do agentów przez Cloudflare Access service token + (opcjonalnie) HMAC**.

Poniżej masz komplet plików do wklejenia. Zakładam, że backend ma już:

* tabele `commands`, `command_events` (jak wcześniej),
* API tworzy komendę i odpala `enqueue_command.delay(cmd_id)`.

---

# 0) Założenia ENV (worker)

Worker potrzebuje:

```env
DATABASE_URL=postgresql://ops:ops@postgres:5432/ops
REDIS_URL=redis://redis:6379/0

CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

CF_ACCESS_CLIENT_ID=...
CF_ACCESS_CLIENT_SECRET=...

AGENT_HMAC_SECRET=supersekret   # opcjonalnie, ale polecam
```

---

# 1) `worker/pyproject.toml`

```toml
[project]
name = "ops-worker"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "celery[redis]==5.4.0",
  "redis==5.0.8",
  "sqlalchemy==2.0.32",
  "psycopg[binary]==3.2.1",
  "httpx==0.27.0",
]

[tool.celery]
```

---

# 2) `worker/worker.py` (Celery app)

```python
import os
from celery import Celery

celery = Celery(
    "ops_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
)

celery.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # żeby nie brał 20 tasków naraz i nie blokował locków
    task_reject_on_worker_lost=True,
)
```

---

# 3) `worker/db.py` (sync DB dla workera)

Worker może działać sync (Celery jest sync), więc dajemy zwykły engine.

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ops:ops@localhost:5432/ops")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_session():
    return SessionLocal()
```

---

# 4) `worker/models.py` (minimalne modele – zgodne z API)

**Uwaga:** tu musi być zgodne z tym, co masz w `api/app/models.py`.
Najprościej skopiować 1:1 definicje tabel (bez async). Poniżej gotowiec:

```python
import enum
import uuid
from sqlalchemy import String, DateTime, Integer, Enum, JSON, Text, func, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, Mapped, mapped_column

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

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
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
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
```

---

# 5) `worker/audit.py` (zapisywanie eventów)

```python
from __future__ import annotations
from typing import Any
from .models import CommandEvent

def add_event(session, command_id, type_: str, message: str, meta: dict[str, Any] | None = None):
    ev = CommandEvent(
        command_id=command_id,
        type=type_,
        message=message,
        meta=meta or {},
    )
    session.add(ev)
```

---

# 6) `worker/locks.py` (Redis lock z bezpiecznym release)

```python
import os, uuid
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def acquire_lock(key: str, ttl: int = 180) -> str | None:
    token = str(uuid.uuid4())
    ok = r.set(key, token, nx=True, ex=ttl)
    return token if ok else None

def release_lock(key: str, token: str) -> None:
    script = """
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
    """
    r.eval(script, 1, key, token)
```

---

# 7) `worker/project_config.py` (gdzie są agenty)

Na MVP trzymamy config w pliku (później pobierzesz z `api /v1/projects` albo DB).

```python
# MVP config
PROJECTS = {
    "pumo": {
        "agents": [
            {"id": "pumo-1", "url": "https://agent-pumo-1.ops.tld"},
            {"id": "pumo-2", "url": "https://agent-pumo-2.ops.tld"},
        ],
        "routing": {
            # service.restart -> agent wyboru
            "service.restart": "pumo-1",
            "deploy.run": "pumo-2",
        },
    },
    "zenon": {
        "agents": [
            {"id": "zenon-1", "url": "https://agent-zenon-1.ops.tld"},
        ],
        "routing": {
            "service.restart": "zenon-1",
            "deploy.run": "zenon-1",
        },
    },
}

def pick_agent_url(project_id: str, action: str) -> str:
    proj = PROJECTS.get(project_id)
    if not proj:
        raise KeyError(f"Unknown project_id={project_id}")

    agent_id = proj["routing"].get(action)
    if not agent_id:
        # fallback: pierwszy agent
        return proj["agents"][0]["url"]

    for a in proj["agents"]:
        if a["id"] == agent_id:
            return a["url"]

    return proj["agents"][0]["url"]
```

---

# 8) `worker/agent_client.py` (Cloudflare Access token + HMAC)

```python
import os, json, hmac, hashlib
import httpx

CF_ID = os.getenv("CF_ACCESS_CLIENT_ID", "")
CF_SECRET = os.getenv("CF_ACCESS_CLIENT_SECRET", "")
HMAC_SECRET = os.getenv("AGENT_HMAC_SECRET", "")

class TransientAgentError(Exception):
    pass

def sign(payload: dict) -> str | None:
    if not HMAC_SECRET:
        return None
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = hmac.new(HMAC_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    return f"sha256={sig}"

def is_transient_status(code: int) -> bool:
    return code in (408, 429, 500, 502, 503, 504)

def call_agent(agent_url: str, payload: dict, timeout: int = 60) -> dict:
    headers = {
        "CF-Access-Client-Id": CF_ID,
        "CF-Access-Client-Secret": CF_SECRET,
        "Content-Type": "application/json",
    }
    sig = sign(payload)
    if sig:
        headers["X-Signature"] = sig

    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.post(f"{agent_url}/execute", json=payload, headers=headers)
            if r.status_code >= 400:
                # transient?
                if is_transient_status(r.status_code):
                    raise TransientAgentError(f"Agent {r.status_code}: {r.text[:200]}")
                # permanent
                return {"ok": False, "error": f"Agent {r.status_code}: {r.text[:200]}"}
            return r.json()
    except httpx.TimeoutException as e:
        raise TransientAgentError(f"Agent timeout: {e}")
    except httpx.TransportError as e:
        raise TransientAgentError(f"Agent transport error: {e}")
```

---

# 9) `worker/backoff.py` (retry opóźnienia)

```python
import random

def backoff_seconds(attempt: int) -> int:
    # attempt: 1..n
    base = [10, 30, 90, 180]
    idx = min(max(attempt - 1, 0), len(base) - 1)
    jitter = random.randint(0, 5)
    return base[idx] + jitter
```

---

# 10) `worker/tasks.py` (serce: load → lock → running → call agent → done/error → retry)

```python
from __future__ import annotations
import uuid as uuidlib
from datetime import datetime, timezone

from celery import states
from sqlalchemy import select
from sqlalchemy.orm import Session

from .worker import celery
from .db import get_session
from .models import Command, CommandStatus
from .audit import add_event
from .locks import acquire_lock, release_lock
from .project_config import pick_agent_url
from .agent_client import call_agent, TransientAgentError
from .backoff import backoff_seconds

def lock_key_for(cmd: Command) -> str:
    if cmd.action == "deploy.run":
        return f"lock:{cmd.project_id}:deploy"
    # restart lock per service target
    return f"lock:{cmd.project_id}:service:{cmd.target or 'unknown'}"

def utcnow():
    return datetime.now(timezone.utc)

def load_command(session: Session, command_id: str) -> Command | None:
    cid = uuidlib.UUID(command_id)
    res = session.execute(select(Command).where(Command.id == cid))
    return res.scalar_one_or_none()

def mark_running(session: Session, cmd: Command):
    cmd.status = CommandStatus.running
    cmd.started_at = utcnow()
    add_event(session, cmd.id, "started", "Command started", {"attempt": cmd.attempt})

def mark_succeeded(session: Session, cmd: Command, result: dict):
    cmd.status = CommandStatus.succeeded
    cmd.finished_at = utcnow()
    cmd.last_error = None
    add_event(session, cmd.id, "done", "Command succeeded", {"result": result})

def mark_failed(session: Session, cmd: Command, error: str, permanent: bool = True):
    cmd.status = CommandStatus.failed
    cmd.finished_at = utcnow()
    cmd.last_error = error
    add_event(session, cmd.id, "error", "Command failed", {"error": error, "permanent": permanent})

def mark_retry(session: Session, cmd: Command, error: str):
    add_event(session, cmd.id, "retry", "Retry scheduled", {"error": error, "attempt": cmd.attempt})

@celery.task(bind=True, name="enqueue_command", max_retries=10)
def enqueue_command(self, command_id: str):
    """
    Robust flow:
    - load command
    - if already done -> exit (idempotent worker)
    - acquire lock
    - bump attempt
    - mark running
    - call agent (Cloudflare Access service token)
    - mark succeeded/failed
    - retry transient errors with backoff
    """
    session = get_session()
    try:
        cmd = load_command(session, command_id)
        if not cmd:
            # nic nie zrobisz: command nie istnieje
            return {"ok": False, "error": "command_not_found"}

        # idempotencja w workerze: jeśli już zakończone, nie rób ponownie
        if cmd.status in (CommandStatus.succeeded, CommandStatus.failed, CommandStatus.canceled):
            add_event(session, cmd.id, "noop", f"Worker noop: already {cmd.status.value}", {})
            session.commit()
            return {"ok": True, "noop": True, "status": cmd.status.value}

        # lock
        lk = lock_key_for(cmd)
        token = acquire_lock(lk, ttl=240)
        if not token:
            # ktoś już robi deploy/restart -> retry
            cmd.attempt += 1
            mark_retry(session, cmd, "lock_busy")
            session.commit()
            raise self.retry(countdown=backoff_seconds(cmd.attempt))

        try:
            # attempt bump
            cmd.attempt += 1
            if cmd.attempt > cmd.max_attempts:
                mark_failed(session, cmd, f"max_attempts_exceeded ({cmd.max_attempts})", permanent=True)
                session.commit()
                return {"ok": False, "error": "max_attempts_exceeded"}

            mark_running(session, cmd)
            session.commit()

            agent_url = pick_agent_url(cmd.project_id, cmd.action)

            payload = {
                "commandId": str(cmd.id),
                "projectId": cmd.project_id,
                "action": cmd.action,
                "target": cmd.target,
                "params": cmd.params or {},
            }

            result = call_agent(agent_url, payload, timeout=90)

            if result.get("ok") is True:
                mark_succeeded(session, cmd, result)
                session.commit()
                return {"ok": True, "result": result}

            # agent zwrócił błąd "permanentny"
            mark_failed(session, cmd, result.get("error", "unknown_agent_error"), permanent=True)
            session.commit()
            return {"ok": False, "error": cmd.last_error}

        except TransientAgentError as e:
            # transient -> retry
            err = str(e)
            cmd.last_error = err
            mark_retry(session, cmd, err)
            session.commit()
            raise self.retry(countdown=backoff_seconds(cmd.attempt))

        except Exception as e:
            # błąd nieoczekiwany: zwykle lepiej retry 1-2 razy, ale żeby nie kręcić w nieskończoność
            err = f"worker_exception: {type(e).__name__}: {e}"
            cmd.last_error = err
            mark_retry(session, cmd, err)
            session.commit()
            raise self.retry(countdown=backoff_seconds(cmd.attempt))

        finally:
            release_lock(lk, token)

    finally:
        session.close()
```

---

# 11) Agent: dopisz eventy? (opcjonalnie)

Agent już zwraca `{ ok: true }` albo `{ ok:false, error:"..." }`. To wystarczy na MVP.

**Ważne:** agent powinien działać tylko za Access service token. (I HMAC jeśli ustawisz).

---

# 12) Backend API: odpalanie workera

W `api/app/routes/commands.py` po `commit` dodaj:

```python
from worker.worker import celery
# ...
celery.send_task("enqueue_command", args=[str(cmd.id)])
```

Albo jeśli masz monorepo i import bezpośredni: `enqueue_command.delay(str(cmd.id))`.

---

# 13) Minimalne eventy w API (żeby drawer miał od razu co pokazać)

W API przy tworzeniu komendy:

* event `queued`

Worker dopisze:

* `started`
* `retry` (jeśli trzeba)
* `done` / `error`
* (i `noop` jeśli ktoś spróbuje ponownie)

---

## Jak to sprawdzić (najprościej)

1. Postaw:

* Postgres
* Redis
* API
* Worker

2. Uruchom worker:

```bash
celery -A worker.worker.celery worker --loglevel=INFO
```

3. Kliknij w UI `RESTART (example)`:

* UI dostaje `commandId`
* Drawer pokazuje `queued` → `started` → `done` (albo `retry/error`)

---

Jeśli chcesz, następny logiczny krok (już “real ops”):

* endpoint w API: `GET /v1/projects` żeby zawierał `services[]` i `agents[]`,
* w UI: lista serwisów z configu + restart konkretnego kontenera zamiast `${projectId}-api`,
* plus “danger confirm” (wymóg wpisania reason) dla restart/deploy.
