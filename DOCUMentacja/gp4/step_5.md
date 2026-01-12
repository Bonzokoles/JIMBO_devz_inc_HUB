OK — FastAPI pasuje idealnie jako **central API** pod HUB + subdomeny projektów.

Poniżej masz **szablon FastAPI** (produkcyjny w sensie: sensowna struktura, CORS, weryfikacja Access JWT, RBAC, audit, endpoints pod template UI). To jest *szkielet* — nie udaje, że ma Twoje serwisy, ale jest gotowy do podpinania runnerów i realnych statusów.

---

## 1) Struktura API (repo / app)

```
api/
  app/
    main.py
    settings.py
    security/
      cf_access.py
      rbac.py
    routes/
      projects.py
      status.py
      me.py
      audit.py
      commands.py
    storage/
      audit_store.py
      project_store.py
  pyproject.toml
  README.md
```

---

## 2) Najważniejsze: uwierzytelnienie przez Cloudflare Access (JWT)

Cloudflare Access potrafi przekazywać JWT w nagłówku `Cf-Access-Jwt-Assertion`. Serwer powinien:

* pobrać JWKS (klucze publiczne) dla Twojego Access,
* zweryfikować podpis i claimy,
* wyciągnąć email/identity,
* zmapować na rolę.

### `app/security/cf_access.py`

```python
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict, Any
import time
import httpx
from jose import jwt
from jose.exceptions import JWTError

@dataclass
class AccessUser:
    email: str
    sub: str
    name: Optional[str] = None
    groups: Optional[list[str]] = None
    raw: Optional[Dict[str, Any]] = None

class CFJwksCache:
    def __init__(self, jwks_url: str, ttl_seconds: int = 3600):
        self.jwks_url = jwks_url
        self.ttl = ttl_seconds
        self._jwks: Optional[dict] = None
        self._exp: float = 0.0

    async def get(self) -> dict:
        now = time.time()
        if self._jwks and now < self._exp:
            return self._jwks
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(self.jwks_url)
            r.raise_for_status()
            self._jwks = r.json()
            self._exp = now + self.ttl
            return self._jwks

async def verify_cf_access_jwt(
    assertion: str,
    jwks_cache: CFJwksCache,
    audience: str,
    issuer: Optional[str] = None,
) -> AccessUser:
    """
    Verify Cloudflare Access JWT.
    - assertion: value of Cf-Access-Jwt-Assertion header
    - audience: Access application AUD (policy audience)
    - issuer: optional strict issuer check
    """
    jwks = await jwks_cache.get()
    try:
        claims = jwt.decode(
            assertion,
            jwks,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            options={"verify_aud": True},
        )
    except JWTError as e:
        raise ValueError(f"Invalid Access JWT: {e}")

    email = claims.get("email") or claims.get("upn")
    sub = claims.get("sub")
    if not email or not sub:
        raise ValueError("Access JWT missing email/sub")

    return AccessUser(
        email=email,
        sub=sub,
        name=claims.get("name"),
        groups=claims.get("groups"),
        raw=claims,
    )
```

---

## 3) RBAC + mapowanie ról (na start prosto)

### `app/security/rbac.py`

```python
from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Iterable

Role = Literal["owner", "admin", "dev", "viewer"]

@dataclass
class Actor:
    email: str
    role: Role

PERMS = {
    "viewer": {"status.read", "logs.read"},
    "dev":    {"status.read", "logs.read", "service.restart", "deploy.run"},
    "admin":  {"status.read", "logs.read", "service.restart", "deploy.run", "project.configure"},
    "owner":  {"*"},
}

def can(role: Role, perm: str) -> bool:
    s = PERMS.get(role, set())
    return "*" in s or perm in s

def require(role: Role, perm: str) -> None:
    if not can(role, perm):
        raise PermissionError(f"Missing permission: {perm}")

def role_from_email(email: str, owners: Iterable[str], admins: Iterable[str], devs: Iterable[str]) -> Role:
    e = email.lower()
    if e in {x.lower() for x in owners}: return "owner"
    if e in {x.lower() for x in admins}: return "admin"
    if e in {x.lower() for x in devs}:   return "dev"
    return "viewer"
```

---

## 4) Settings (env vars)

### `app/settings.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "prod"
    cors_origins: str = "https://hub.ops.tld,https://pumo.ops.tld,https://zenon.ops.tld"
    cf_jwks_url: str
    cf_audience: str
    cf_issuer: str | None = None

    owners: str = ""
    admins: str = ""
    devs: str = ""

settings = Settings()

def split_csv(s: str) -> list[str]:
    return [x.strip() for x in s.split(",") if x.strip()]
```

---

## 5) Dependency: “current user” z nagłówka Access

### `app/main.py`

```python
from __future__ import annotations
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .settings import settings, split_csv
from .security.cf_access import CFJwksCache, verify_cf_access_jwt
from .security.rbac import Actor, role_from_email

jwks_cache = CFJwksCache(settings.cf_jwks_url)

app = FastAPI(title="JIMBO77 OPS API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=split_csv(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def current_actor(
    cf_access_jwt_assertion: str | None = Header(default=None, alias="Cf-Access-Jwt-Assertion"),
):
    if not cf_access_jwt_assertion:
        raise HTTPException(status_code=401, detail="Missing Cf-Access-Jwt-Assertion")
    try:
        user = await verify_cf_access_jwt(
            cf_access_jwt_assertion,
            jwks_cache=jwks_cache,
            audience=settings.cf_audience,
            issuer=settings.cf_issuer,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    role = role_from_email(user.email, split_csv(settings.owners), split_csv(settings.admins), split_csv(settings.devs))
    return Actor(email=user.email, role=role)

# --- routers ---
from .routes import projects, status, me, audit, commands
app.include_router(me.router, prefix="/v1", tags=["me"])
app.include_router(projects.router, prefix="/v1", tags=["projects"])
app.include_router(status.router, prefix="/v1", tags=["status"])
app.include_router(audit.router, prefix="/v1", tags=["audit"])
app.include_router(commands.router, prefix="/v1", tags=["commands"])

@app.get("/healthz")
async def healthz():
    return {"ok": True, "env": settings.env}

# expose dependency for other modules
def get_actor_dep():
    return Depends(current_actor)
```

---

## 6) Projekty (config) — pod template UI

### `app/storage/project_store.py`

```python
from __future__ import annotations
from pydantic import BaseModel
from typing import List

class ServiceCfg(BaseModel):
    id: str
    label: str
    health: str | None = None

class ProjectCfg(BaseModel):
    id: str
    name: str
    host: str
    modules: List[str] = []
    services: List[ServiceCfg] = []
    links: dict[str, str] = {}

# MVP: w pamięci (potem podmienisz na SQLite/Postgres)
PROJECTS: list[ProjectCfg] = [
    ProjectCfg(
        id="pumo",
        name="PUMO",
        host="https://pumo.ops.tld",
        modules=["overview","services","deploy","logs","alerts"],
        services=[ServiceCfg(id="pumo-api", label="PUMO API", health="/healthz")]
    ),
    ProjectCfg(
        id="zenon",
        name="ZENON",
        host="https://zenon.ops.tld",
        modules=["overview","services","logs"],
        services=[ServiceCfg(id="zenon-api", label="ZENON API", health="/healthz")]
    ),
]
```

### `app/routes/projects.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends
from ..main import current_actor
from ..storage.project_store import PROJECTS

router = APIRouter()

@router.get("/projects")
async def list_projects(actor=Depends(current_actor)):
    # actor param wymusza auth. Viewer też zobaczy listę (to OK).
    return [p.model_dump() for p in PROJECTS]

@router.get("/projects/{project_id}")
async def get_project(project_id: str, actor=Depends(current_actor)):
    for p in PROJECTS:
        if p.id == project_id:
            return p.model_dump()
    return {"error": "not_found"}
```

---

## 7) Status global + per projekt (mock na MVP)

### `app/routes/status.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from ..main import current_actor
from ..security.rbac import require
from ..storage.project_store import PROJECTS

router = APIRouter()

@router.get("/status/global")
async def global_status(actor=Depends(current_actor)):
    require(actor.role, "status.read")
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

@router.get("/status/project/{project_id}")
async def project_status(project_id: str, actor=Depends(current_actor)):
    require(actor.role, "status.read")
    # MVP: liczba serwisów jako "total", a "up" symulujemy
    proj = next((p for p in PROJECTS if p.id == project_id), None)
    total = len(proj.services) if proj else 0
    up = total  # TODO: real health checks/runner
    return {"ok": bool(proj), "servicesUp": up, "servicesTotal": total}
```

---

## 8) `/me` (żeby frontend nie miał placeholderów)

### `app/routes/me.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends
from ..main import current_actor

router = APIRouter()

@router.get("/me")
async def me(actor=Depends(current_actor)):
    return {"email": actor.email, "role": actor.role}
```

---

## 9) Audit log (najpierw w pamięci, potem DB)

### `app/storage/audit_store.py`

```python
from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any

@dataclass
class AuditEvent:
    ts: str
    actor: str
    role: str
    project: str | None
    action: str
    target: str | None
    ok: bool
    meta: dict[str, Any]

AUDIT: list[AuditEvent] = []

def add_event(**kwargs):
    AUDIT.append(AuditEvent(
        ts=datetime.now(timezone.utc).isoformat(),
        **kwargs
    ))

def list_events(limit: int = 50):
    return [asdict(x) for x in AUDIT[-limit:]][::-1]
```

### `app/routes/audit.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from ..main import current_actor
from ..security.rbac import require
from ..storage.audit_store import list_events

router = APIRouter()

@router.get("/audit")
async def audit(limit: int = Query(default=50, ge=1, le=500), actor=Depends(current_actor)):
    require(actor.role, "logs.read")
    return list_events(limit=limit)
```

---

## 10) Commands endpoint (z RBAC + audit) — bez wykonywania na razie

### `app/routes/commands.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..main import current_actor
from ..security.rbac import require
from ..storage.audit_store import add_event

router = APIRouter()

class CommandIn(BaseModel):
    projectId: str
    action: str         # "service.restart" | "deploy.run" etc.
    target: str | None = None
    params: dict = {}
    reason: str | None = None

@router.post("/commands")
async def commands(cmd: CommandIn, actor=Depends(current_actor)):
    # mapowanie action->perm
    if cmd.action == "service.restart":
        require(actor.role, "service.restart")
    elif cmd.action == "deploy.run":
        require(actor.role, "deploy.run")
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

    # TODO: tu wepniesz runnera (kolejka/agent)
    ok = True

    add_event(
        actor=actor.email,
        role=actor.role,
        project=cmd.projectId,
        action=cmd.action,
        target=cmd.target,
        ok=ok,
        meta={"params": cmd.params, "reason": cmd.reason},
    )
    return {"ok": ok}
```

---

## 11) .env (przykład)

```
ENV=prod
CORS_ORIGINS=https://hub.ops.tld,https://pumo.ops.tld,https://zenon.ops.tld

CF_JWKS_URL=https://<twoj-team>.cloudflareaccess.com/cdn-cgi/access/certs
CF_AUDIENCE=<AUD_FROM_ACCESS_APP>
CF_ISSUER=https://<twoj-team>.cloudflareaccess.com

OWNERS=ty@domena.pl
ADMINS=
DEVS=dev1@domena.pl,dev2@domena.pl
```

---

## 12) Co dalej (żeby to było “żywe”, nie tylko ładne)

1. Dopinasz frontend do:

* `GET /v1/me` (user/role),
* `GET /v1/projects` (nawigacja i moduły),
* `GET /v1/status/*` (kafelki).

2. Następnie dodajesz “runner”:

* albo prosty agent na hostach (HTTP + mTLS / tunnel),
* albo kolejka (Redis/RQ/Celery) i worker wykonuje komendy.

3. Audit przenosisz z pamięci do SQLite/Postgresa.

---

Jeśli chcesz, w następnym kroku dam Ci **dokładny “runner pattern”** pod Twoje realne usługi (start/stop/restart, health checks, log tail), w wersji:

* **minimal** (HTTP agent + systemd/docker),
* albo **bardziej pancernej** (kolejka + worker + idempotencja).
