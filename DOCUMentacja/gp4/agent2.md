Dopisuję to w sposób **realny** i **bez udawania**: statusy biorą się z agentów (Docker), API tylko agreguje i normalizuje pod UI.

Zrobimy:

1. **Agent**: endpoint, który zwraca status tylko dla kontenerów z allowlisty (żeby nie wyciekało “co tam masz na hoście”).
2. **API**: endpoint `GET /v1/projects/{projectId}/services/status` – odpytuje agentów, mapuje status do `services[]`.
3. **UI**: w `ServicesPage` polling co 3s, pokazuje `running/exited/unknown` + uptime/age jeśli chcesz.

---

# 1) AGENT: endpoint statusów usług

W Twoim agencie (ten realny FastAPI z Docker SDK), dopisz:

## `agent/app/main.py` – dopisz na końcu

```python
from datetime import datetime, timezone

def _to_iso(dt):
    if not dt:
        return None
    if isinstance(dt, str):
        return dt
    try:
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return str(dt)

@app.get("/services/status")
def services_status():
    """
    Zwraca status tylko dla kontenerów z allowlisty (ALLOWED_RESTART_CONTAINERS),
    bo to jest dokładnie lista "zarządzalnych serwisów".
    """
    out = []
    for name in sorted(ALLOWED_RESTART):
        try:
            c = docker_client.containers.get(name)
            # docker status: created, running, exited, restarting, paused, dead
            state = c.attrs.get("State", {}) if getattr(c, "attrs", None) else {}
            started_at = state.get("StartedAt")
            finished_at = state.get("FinishedAt")
            out.append({
                "id": name,
                "name": name,
                "status": c.status,
                "state": state.get("Status", c.status),
                "health": (state.get("Health", {}) or {}).get("Status"),
                "startedAt": started_at,
                "finishedAt": finished_at,
            })
        except Exception as e:
            out.append({
                "id": name,
                "name": name,
                "status": "unknown",
                "state": "unknown",
                "health": None,
                "error": str(e),
            })

    return {"ok": True, "service": SERVICE, "items": out}
```

To jest “prawdziwe”: agent patrzy na Docker i zwraca realny stan.

---

# 2) API: agregacja statusów dla projektu

## 2.1 Schemat odpowiedzi (NOWY)

Dodaj plik:

### `api/app/schemas_status.py`

```python
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional

class ServiceLiveStatus(BaseModel):
    serviceId: str
    label: str
    agentId: str
    target: str
    state: str              # running/exited/restarting/unknown...
    health: Optional[str] = None
    startedAt: Optional[str] = None
    finishedAt: Optional[str] = None
    error: Optional[str] = None

class ProjectServicesStatusOut(BaseModel):
    projectId: str
    ok: bool
    items: list[ServiceLiveStatus]
```

## 2.2 Route: `GET /v1/projects/{id}/services/status` (NOWY)

### `api/app/routes/project_status.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
import httpx

from ..main import current_actor
from ..security.rbac import require
from ..project_config import PROJECTS
from ..schemas_status import ProjectServicesStatusOut, ServiceLiveStatus

router = APIRouter()

def _get_project(project_id: str) -> dict:
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    raise HTTPException(404, "project_not_found")

def _agent_url(project: dict, agent_id: str) -> str:
    for a in project.get("agents", []):
        if a["id"] == agent_id:
            return a["url"]
    raise KeyError(agent_id)

@router.get("/projects/{project_id}/services/status", response_model=ProjectServicesStatusOut)
async def project_services_status(
    project_id: str,
    actor=Depends(current_actor),
):
    require(actor.role, "status.read")
    project = _get_project(project_id)

    services = project.get("services", []) or []
    if not services:
        return ProjectServicesStatusOut(projectId=project_id, ok=True, items=[])

    # grupuj serwisy per agentId
    by_agent: dict[str, list[dict]] = {}
    for s in services:
        by_agent.setdefault(s["agentId"], []).append(s)

    results_by_agent: dict[str, dict] = {}
    ok_all = True

    async with httpx.AsyncClient(timeout=5.0) as client:
        tasks = []
        for agent_id in by_agent.keys():
            try:
                url = _agent_url(project, agent_id)
            except KeyError:
                ok_all = False
                results_by_agent[agent_id] = {"ok": False, "error": "agent_not_configured", "items": []}
                continue

            tasks.append((agent_id, url))

        # równolegle
        async def fetch(agent_id: str, url: str):
            # endpoint agenta (po prywatnej sieci)
            r = await client.get(f"{url}/services/status")
            r.raise_for_status()
            return agent_id, r.json()

        coros = [fetch(aid, url) for aid, url in tasks]
        for coro in httpx.AsyncClient()._transport:  # dummy to silence linters
            pass

        # bez cudów: gather
        import asyncio
        gathered = await asyncio.gather(*coros, return_exceptions=True)

        for item in gathered:
            if isinstance(item, Exception):
                ok_all = False
                # nie wiemy który agent — fallback
                continue
            agent_id, payload = item
            if not payload.get("ok"):
                ok_all = False
            results_by_agent[agent_id] = payload

    # mapowanie: service -> status
    items: list[ServiceLiveStatus] = []
    for s in services:
        agent_id = s["agentId"]
        target = s.get("target") or ""
        label = s.get("label") or s["id"]

        payload = results_by_agent.get(agent_id)
        if not payload:
            items.append(ServiceLiveStatus(
                serviceId=s["id"], label=label, agentId=agent_id, target=target,
                state="unknown", error="agent_unreachable_or_missing"
            ))
            continue

        # agent zwraca itemy per container name (id/name)
        found = None
        for it in payload.get("items", []) or []:
            if it.get("name") == target or it.get("id") == target:
                found = it
                break

        if not found:
            items.append(ServiceLiveStatus(
                serviceId=s["id"], label=label, agentId=agent_id, target=target,
                state="unknown", error="not_reported_by_agent"
            ))
        else:
            items.append(ServiceLiveStatus(
                serviceId=s["id"],
                label=label,
                agentId=agent_id,
                target=target,
                state=found.get("state") or found.get("status") or "unknown",
                health=found.get("health"),
                startedAt=found.get("startedAt"),
                finishedAt=found.get("finishedAt"),
                error=found.get("error"),
            ))

    return ProjectServicesStatusOut(projectId=project_id, ok=ok_all, items=items)
```

### Ważne

* Ten endpoint **zakłada prywatny dostęp API → agent** (HTTP).
* Jeśli API jest za Access i agent za Access: wtedy dołożymy service token do requestów. Na razie (zgodnie z Twoją decyzją “prywatna sieć”) – nie komplikuję.

## 2.3 Podpięcie routera w `api/app/main.py`

Dodaj:

```python
from .routes import project_status
app.include_router(project_status.router, prefix="/v1", tags=["project-status"])
```

---

# 3) UI: pokazuj live status w ServicesPage

## 3.1 Zmiana w `apps/project/src/pages/Services.tsx`

Dodaj state na statusy i polling:

W środku komponentu (obok `project`):

```tsx
const [live, setLive] = React.useState<Record<string, any>>({});
const [liveOk, setLiveOk] = React.useState<boolean | null>(null);

React.useEffect(() => {
  let alive = true;

  async function tick() {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_API_BASE}/v1/projects/${props.projectId}/services/status`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error(`status ${r.status}`);
      const data = await r.json();
      if (!alive) return;

      setLiveOk(!!data.ok);
      const map: Record<string, any> = {};
      for (const it of data.items ?? []) map[it.serviceId] = it;
      setLive(map);
    } catch (e) {
      if (!alive) return;
      setLiveOk(false);
    }
  }

  tick();
  const t = window.setInterval(tick, 3000);
  return () => { alive = false; window.clearInterval(t); };
}, [props.projectId]);
```

Potem w renderze, w pętli serwisów dodaj “status badge”:

W miejscu gdzie rysujesz serwis `s`:

```tsx
const st = live[s.id];
const state = st?.state ?? "unknown";
const health = st?.health;

const pillClass =
  state === "running" ? "pillOk" :
  state === "exited" || state === "dead" ? "pillBad" :
  "pill";
```

I w JSX (np. obok labela):

```tsx
<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
  <b>{s.label}</b>
  <span className={`pill ${pillClass}`}>{String(state).toUpperCase()}</span>
  {health && <span className="pill">{`health:${health}`}</span>}
  {liveOk === false && <span className="pill pillBad">AGENT STATUS OFF</span>}
</div>
```

I dopisz pod spodem ewentualny błąd:

```tsx
{st?.error && (
  <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>
    {st.error}
  </div>
)}
```

To wystarczy, żeby UI stało się “żywe”.

---

# 4) Jedna poprawka w API route (żeby nie było babola)

W moim kodzie w route jest jeden brzydki kawałek (to “dummy” pod linter). Wyrzuć go.
W praktyce użyj normalnie `asyncio.gather` i koniec.

Tu masz czystą wersję fragmentu gather (podmień cały blok po `coros = ...`):

```python
import asyncio
gathered = await asyncio.gather(*coros, return_exceptions=True)

for item in gathered:
    if isinstance(item, Exception):
        ok_all = False
        continue
    agent_id, payload = item
    if not payload.get("ok"):
        ok_all = False
    results_by_agent[agent_id] = payload
```

---

# 5) Co dostajesz po tej zmianie

* UI pokazuje realny stan kontenerów (`running/exited/restarting`)
* statusy są per-agent (prawdziwe Docker state)
* restart działa jak wcześniej, ale teraz widać efekt (np. krótkie `restarting`)

---

Jeśli chcesz, następny krok (mały, ale bardzo praktyczny):
w `ServicesPage` dodamy przycisk **VIEW LOGS** (tail 200 linii) – też z agenta, też allowlist (bezpiecznie) i bez SSH.
