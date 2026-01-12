OK. Skoro **wszystko jest na Cloudflare** (DNS/Pages), a hostów jest wiele i **Docker jako primary**, to masz sensowny, “pancerny” układ:

* **Cloudflare Pages**: `hub.ops.tld`, `pumo.ops.tld`, `zenon.ops.tld` (UI)
* **API + Worker + Redis + Postgres**: normalnie na serwerze/VPS (to nie musi być na Cloudflare; Pages nie uruchomi Ci FastAPI/worker/redis)
* **Agent na każdym hoście**: lokalny serwis + **Cloudflare Tunnel** do `agent-<host>.ops.tld` (bez otwierania portów)

Poniżej dostajesz **szablon**: (A) API FastAPI, (B) Worker Celery, (C) Agent FastAPI na hoście, (D) Cloudflare Access polityki i tokeny, (E) idempotencja+lock+retry.

---

## 1) Cloudflare: co ustawiasz (konkret)

### Access Apps

1. **Human apps**:

* `hub.ops.tld/*`, `pumo.ops.tld/*`, `zenon.ops.tld/*`, `api.ops.tld/*`
* Allow: Twoje konto + MFA

2. **Service app** dla agentów:

* `agent-*.ops.tld/*`
* Allow: **Service Token** `ops-worker` (tylko worker)
* (opcjonalnie) dodatkowo allow Ty (żeby debugować), ale lepiej nie.

### Service Token

Tworzysz token dla workera i zapisujesz:

* `CF_ACCESS_CLIENT_ID`
* `CF_ACCESS_CLIENT_SECRET`

Worker będzie tym legitymował się do agentów.

---

## 2) Idempotencja i “pancerność” — zasady

* UI wysyła `Idempotency-Key: <uuid>` przy `POST /v1/commands`.
* API ma `UNIQUE(idempotency_key)` — drugi taki sam request zwraca istniejącą komendę.
* Worker bierze **lock** w Redis (`SET lock NX EX ttl`) zanim wykona akcję.
* Komendy mają status: `queued -> running -> succeeded/failed`.
* Retry/backoff na transient errors (timeout, 502, agent unreachable).
* Audit: każde “queued/started/retry/done/error” jako event.

---

## 3) Repo: gotowa struktura “ops-backend”

```
ops-backend/
  api/
    app/
      main.py
      settings.py
      db.py
      models.py
      security/
        cf_access.py
        rbac.py
      routes/
        me.py
        projects.py
        commands.py
        audit.py
    pyproject.toml
  worker/
    worker.py
    tasks.py
    agent_client.py
    locks.py
    pyproject.toml
  shared/
    schemas.py
    project_config.py
  docker-compose.yml
```

---

## 4) DB modele (Postgres) — minimalne, ale właściwe

```python
# api/app/models.py
import enum, uuid
from sqlalchemy import String, DateTime, Integer, Enum, JSON, Text, func, UniqueConstraint
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
    action: Mapped[str] = mapped_column(String(64), nullable=False)         # "service.restart" / "deploy.run"
    target: Mapped[str | None] = mapped_column(String(128), nullable=True)  # np. "pumo-api"
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
    command_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    ts: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(32), nullable=False)          # queued/started/log/retry/done/error
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
```

---

## 5) API: create command z idempotencją + wrzut na kolejkę

```python
# api/app/routes/commands.py
import uuid as uuidlib
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models import Command, CommandEvent, CommandStatus
from ..main import current_actor
from ..security.rbac import require
from shared.schemas import CommandIn, CommandOut
from worker.tasks import enqueue_command  # <- w praktyce: przez broker, tu konceptualnie

router = APIRouter()

@router.post("/commands", response_model=CommandOut)
async def create_command(
    payload: CommandIn,
    actor=Depends(current_actor),
    session: AsyncSession = Depends(get_session),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")
):
    if not idempotency_key:
        raise HTTPException(400, "Missing Idempotency-Key")

    # RBAC mapping
    if payload.action == "service.restart":
        require(actor.role, "service.restart")
    elif payload.action == "deploy.run":
        require(actor.role, "deploy.run")
    else:
        raise HTTPException(400, "Unknown action")

    # idempotency lookup
    existing = await session.execute(select(Command).where(Command.idempotency_key == idempotency_key))
    cmd = existing.scalar_one_or_none()
    if cmd:
        return CommandOut(id=str(cmd.id), status=cmd.status, projectId=cmd.project_id, action=cmd.action)

    cmd = Command(
        idempotency_key=idempotency_key,
        project_id=payload.projectId,
        action=payload.action,
        target=payload.target,
        params=payload.params or {},
        reason=payload.reason,
        created_by=actor.email,
        status=CommandStatus.queued
    )
    session.add(cmd)
    await session.flush()

    session.add(CommandEvent(command_id=cmd.id, type="queued", message="Command queued", meta={"by": actor.email}))
    await session.commit()

    # enqueue (celery)
    enqueue_command.delay(str(cmd.id))

    return CommandOut(id=str(cmd.id), status=cmd.status, projectId=cmd.project_id, action=cmd.action)
```

Schematy:

```python
# shared/schemas.py
from pydantic import BaseModel, Field
from typing import Any

class CommandIn(BaseModel):
    projectId: str
    action: str
    target: str | None = None
    params: dict[str, Any] = Field(default_factory=dict)
    reason: str | None = None

class CommandOut(BaseModel):
    id: str
    status: str
    projectId: str
    action: str
```

---

## 6) Worker: Celery task z lockami + retry/backoff + call do agenta

### Lock helper (Redis)

```python
# worker/locks.py
import os, time, uuid
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def acquire_lock(key: str, ttl: int = 120) -> str | None:
    token = str(uuid.uuid4())
    ok = r.set(key, token, nx=True, ex=ttl)
    return token if ok else None

def release_lock(key: str, token: str) -> None:
    # safe release (Lua)
    script = """
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
    """
    r.eval(script, 1, key, token)
```

### Agent client (z Access service token + opcjonalny HMAC)

```python
# worker/agent_client.py
import os, hmac, hashlib, json
import httpx

CF_ID = os.getenv("CF_ACCESS_CLIENT_ID", "")
CF_SECRET = os.getenv("CF_ACCESS_CLIENT_SECRET", "")
HMAC_SECRET = os.getenv("AGENT_HMAC_SECRET", "")  # ten sam na worker i agent

def sign(payload: dict) -> str:
    if not HMAC_SECRET:
        return ""
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = hmac.new(HMAC_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    return f"sha256={sig}"

async def call_agent(agent_url: str, payload: dict, timeout: int = 30) -> dict:
    headers = {
        "CF-Access-Client-Id": CF_ID,
        "CF-Access-Client-Secret": CF_SECRET,
        "Content-Type": "application/json",
    }
    sig = sign(payload)
    if sig:
        headers["X-Signature"] = sig

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(f"{agent_url}/execute", json=payload, headers=headers)
        r.raise_for_status()
        return r.json()
```

### Celery task (idempotent execution)

```python
# worker/tasks.py
import os
from celery import Celery
from datetime import datetime, timezone
import asyncio

from .locks import acquire_lock, release_lock
from .agent_client import call_agent

celery = Celery(
    "ops_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0"),
)

# tu: w prawdziwej implementacji worker łączy się do Postgresa i aktualizuje models.Command
# żeby nie robić tu ściany kodu, zostawiam “punkty zaczepienia”.

def lock_key_for(project_id: str, action: str, target: str | None) -> str:
    if action == "deploy.run":
        return f"lock:{project_id}:deploy"
    return f"lock:{project_id}:service:{target or 'unknown'}"

@celery.task(bind=True, max_retries=3, default_retry_delay=10)
def enqueue_command(self, command_id: str):
    """
    1) Load command from DB
    2) Acquire lock
    3) Mark running + event
    4) Call agent
    5) Mark succeeded/failed + event
    6) Retry on transient
    """
    # PSEUDO: load from DB
    cmd = load_command(command_id)  # <- do zrobienia: DB
    lk = lock_key_for(cmd.project_id, cmd.action, cmd.target)

    token = acquire_lock(lk, ttl=180)
    if not token:
        # zajęte -> retry z backoff
        raise self.retry(countdown=15)

    try:
        mark_running(cmd)  # DB update + event

        payload = {
            "commandId": command_id,
            "projectId": cmd.project_id,
            "action": cmd.action,
            "target": cmd.target,
            "params": cmd.params,
        }

        # wybór agenta z configu
        agent_url = pick_agent_url(cmd)  # <- z configu projektu
        result = asyncio.run(call_agent(agent_url, payload, timeout=60))

        if result.get("ok") is True:
            mark_succeeded(cmd, result)
        else:
            # błąd wykonania (nie transient) -> fail
            mark_failed(cmd, result.get("error", "unknown error"))
    except TransientError as e:
        mark_retry(cmd, str(e))
        raise self.retry(countdown=backoff_seconds(cmd.attempt))
    finally:
        release_lock(lk, token)
```

**Uwaga praktyczna:** tu są “load_command/mark_*” jako haki — bo to jest najdłuższa część (SQLAlchemy + transakcje + eventy). Jeśli chcesz, w kolejnym kroku dam Ci kompletny kod DB dla workera (sync session) + migracje.

---

## 7) Agent na hoście (FastAPI) — tylko allowlista, tylko Docker, zero “run cmd”

Agent uruchamiasz na każdym hoście (lokalnie), a na zewnątrz wystawiasz przez **cloudflared tunnel**.

### `agent/app/main.py`

```python
import os, hmac, hashlib, json, subprocess
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

HMAC_SECRET = os.getenv("AGENT_HMAC_SECRET", "")
ALLOWED_ACTIONS = {"service.restart", "deploy.run"}  # rozszerzysz
ALLOWED_SERVICES = set(x.strip() for x in os.getenv("ALLOWED_SERVICES", "").split(",") if x.strip())

app = FastAPI(title="OPS Agent", version="1.0")

class ExecuteIn(BaseModel):
    commandId: str
    projectId: str
    action: str
    target: str | None = None
    params: dict = {}

def verify_sig(payload: dict, signature: str | None):
    if not HMAC_SECRET:
        return  # jeśli nie chcesz HMAC, możesz zostawić pusty secret i polecieć tylko na Access tokenach
    if not signature or not signature.startswith("sha256="):
        raise HTTPException(401, "Missing signature")
    expected = "sha256=" + hmac.new(
        HMAC_SECRET.encode(),
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(401, "Bad signature")

def docker_restart(service: str):
    # service = nazwa kontenera lub compose service; Ty ustalisz standard nazewnictwa
    subprocess.check_call(["docker", "restart", service])

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.post("/execute")
def execute(body: ExecuteIn, x_signature: str | None = Header(default=None, alias="X-Signature")):
    payload = body.model_dump()
    verify_sig(payload, x_signature)

    if body.action not in ALLOWED_ACTIONS:
        raise HTTPException(400, "Action not allowed")

    if body.action == "service.restart":
        if not body.target:
            raise HTTPException(400, "Missing target")
        if ALLOWED_SERVICES and body.target not in ALLOWED_SERVICES:
            raise HTTPException(403, "Service not allowed")
        docker_restart(body.target)
        return {"ok": True}

    if body.action == "deploy.run":
        # tutaj: wywołanie bezpiecznego skryptu deploy (w allowliście), nie dowolnych poleceń
        # np. subprocess.check_call(["/opt/ops/deploy.sh", body.projectId])
        return {"ok": True}

    raise HTTPException(400, "Unknown action")
```

**Najważniejsze:** Agent nie ma endpointu “execute arbitrary shell”. Tylko konkretne akcje.

---

## 8) Cloudflared tunnel na każdym hoście (wzorzec)

Na hoście:

* agent nasłuchuje na `127.0.0.1:8787`
* cloudflared robi tunnel i mapuje hostname na lokalny port

W cloudflared config (idea):

```yaml
tunnel: <UUID>
credentials-file: /etc/cloudflared/<UUID>.json
ingress:
  - hostname: agent-pumo-1.ops.tld
    service: http://127.0.0.1:8787
  - service: http_status:404
```

I to jest wystawione na świat, ale dostępne tylko przez Access service token.

---

## 9) Minimalny docker-compose dla backendu (API + worker + redis + postgres)

To postawisz na jednym VPS jako “control plane”.

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ops
      POSTGRES_USER: ops
      POSTGRES_DB: ops
    volumes:
      - pg:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis:/data

  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql+asyncpg://ops:ops@postgres:5432/ops
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: redis://redis:6379/0
      CF_JWKS_URL: ${CF_JWKS_URL}
      CF_AUDIENCE: ${CF_AUDIENCE}
      CF_ISSUER: ${CF_ISSUER}
      OWNERS: ${OWNERS}
      ADMINS: ${ADMINS}
      DEVS: ${DEVS}
    depends_on: [postgres, redis]

  worker:
    build: ./worker
    environment:
      DATABASE_URL: postgresql://ops:ops@postgres:5432/ops
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: redis://redis:6379/0
      CF_ACCESS_CLIENT_ID: ${CF_ACCESS_CLIENT_ID}
      CF_ACCESS_CLIENT_SECRET: ${CF_ACCESS_CLIENT_SECRET}
      AGENT_HMAC_SECRET: ${AGENT_HMAC_SECRET}
    depends_on: [postgres, redis]

volumes:
  pg:
  redis:
```

---

## 10) Co jest krytyczne “żeby było bezpiecznie”

1. **Access** chroni UI, API i agentów (agent tylko service token).
2. **API** ma RBAC i audit (kto kliknął).
3. **Worker** ma idempotencję (nie wykona dwa razy) + locki.
4. **Agent** ma allowlistę usług i akcji — żadnego “shell on demand”.
5. **HMAC** (opcjonalnie, ale polecam) — dodatkowa warstwa na payload.

---

## Co teraz mogę Ci dopiąć bez dalszych pytań

Jeśli chcesz iść “do końca”, to następnym krokiem mogę wkleić **kompletny gotowy kod** dla:

* DB layer (SQLAlchemy async w API + sync w workerze),
* migracje (Alembic),
* endpoints: `GET /v1/commands/{id}`, `GET /v1/commands/{id}/events`,
* worker: pełne `load_command/mark_*`,
* project config: lista agentów per projekt i wybór targetu,
* prosty moduł “service.restart” działający end-to-end.

Powiem wprost: to będzie już “realnie uruchamialne” i zacznie robić robotę, a nie tylko wyglądać jak panel z filmu.
