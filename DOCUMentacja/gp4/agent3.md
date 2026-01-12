OK. Robimy **VIEW LOGS (tail)** bez SSH, ale **bezpiecznie**: tylko allowlista kontenerów, tylko tail, bez “pobierz cały dysk” 😉

Poniżej masz komplet: **Agent → API proxy → UI drawer**.

---

# 1) AGENT: endpoint logów z allowlistą

W Twoim realnym agencie (`agent/app/main.py`) dopisz:

### A) Importy (na górze pliku)

```python
from fastapi import Query
```

### B) Endpoint `GET /logs/{container}`

```python
@app.get("/logs/{container}")
def tail_logs(
    container: str,
    lines: int = Query(200, ge=1, le=2000),
    timestamps: bool = Query(True),
):
    """
    Tail logów z dockera. Tylko allowlista (ALLOWED_RESTART_CONTAINERS).
    Bezpieczne: ograniczenie lines, brak arbitralnych komend.
    """
    if container not in ALLOWED_RESTART:
        raise HTTPException(403, "container_not_allowed")

    try:
        c = docker_client.containers.get(container)
        data = c.logs(tail=lines, timestamps=timestamps)
        # docker-py zwraca bytes
        text = data.decode("utf-8", errors="replace")
        return {
            "ok": True,
            "container": container,
            "lines": lines,
            "timestamps": timestamps,
            "text": text,
        }
    except docker.errors.NotFound:
        raise HTTPException(404, "container_not_found")
    except Exception as e:
        raise HTTPException(500, f"logs_error: {e}")
```

To jest w 100% realne: agent czyta docker logs.

---

# 2) API: proxy do logów dla konkretnego serviceId

Chcemy, żeby UI nie waliło bezpośrednio do agentów (łatwiej Access/ACL).
Dodaj endpoint:

`GET /v1/projects/{projectId}/services/{serviceId}/logs?lines=200`

## 2.1 Schemat (NOWY)

`api/app/schemas_logs.py`

```python
from __future__ import annotations
from pydantic import BaseModel

class ServiceLogsOut(BaseModel):
    ok: bool
    projectId: str
    serviceId: str
    agentId: str
    container: str
    text: str
    lines: int
    timestamps: bool
```

## 2.2 Route (NOWY)

`api/app/routes/project_logs.py`

```python
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
import httpx

from ..main import current_actor
from ..security.rbac import require
from ..project_config import PROJECTS
from ..schemas_logs import ServiceLogsOut

router = APIRouter()

def _get_project(project_id: str) -> dict:
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    raise HTTPException(404, "project_not_found")

def _find_service(project: dict, service_id: str) -> dict:
    for s in project.get("services", []) or []:
        if s["id"] == service_id:
            return s
    raise HTTPException(404, "service_not_found")

def _agent_url(project: dict, agent_id: str) -> str:
    for a in project.get("agents", []) or []:
        if a["id"] == agent_id:
            return a["url"]
    raise HTTPException(500, "agent_not_configured")

@router.get("/projects/{project_id}/services/{service_id}/logs", response_model=ServiceLogsOut)
async def service_logs(
    project_id: str,
    service_id: str,
    lines: int = 200,
    timestamps: bool = True,
    actor=Depends(current_actor),
):
    require(actor.role, "logs.read")
    project = _get_project(project_id)
    svc = _find_service(project, service_id)

    agent_id = svc["agentId"]
    container = svc.get("target") or svc["id"]  # target to nazwa kontenera
    url = _agent_url(project, agent_id)

    # twarde limity też po stronie API (druga bariera)
    if lines < 1:
        lines = 1
    if lines > 2000:
        lines = 2000

    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            r = await client.get(
                f"{url}/logs/{container}",
                params={"lines": lines, "timestamps": str(timestamps).lower()},
            )
        except Exception as e:
            raise HTTPException(502, f"agent_unreachable: {e}")

    if r.status_code == 403:
        raise HTTPException(403, "logs_not_allowed_by_agent")
    if r.status_code == 404:
        raise HTTPException(404, "container_not_found_on_agent")
    if r.status_code >= 400:
        raise HTTPException(502, f"agent_error_{r.status_code}")

    data = r.json()
    return ServiceLogsOut(
        ok=True,
        projectId=project_id,
        serviceId=service_id,
        agentId=agent_id,
        container=container,
        text=data.get("text", ""),
        lines=lines,
        timestamps=bool(timestamps),
    )
```

## 2.3 Podpięcie routera w `api/app/main.py`

```python
from .routes import project_logs
app.include_router(project_logs.router, prefix="/v1", tags=["project-logs"])
```

---

# 3) UI: Logs Drawer (prawy panel) + przycisk VIEW LOGS

## 3.1 Komponent `ServiceLogsDrawer.tsx` (NOWY)

`packages/ui/src/components/ServiceLogsDrawer.tsx`

```tsx
import React from "react";

type Props = {
  open: boolean;
  title: string;
  url: string | null;          // pełny URL do API endpoint (już z projectId/serviceId)
  onClose: () => void;
};

export function ServiceLogsDrawer({ open, title, url, onClose }: Props) {
  const [text, setText] = React.useState<string>("");
  const [err, setErr] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<number>(200);
  const [poll, setPoll] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!open) return;
    setText("");
    setErr(null);
  }, [open]);

  React.useEffect(() => {
    if (!open || !url) return;
    let alive = true;

    async function load() {
      try {
        setErr(null);
        const u = new URL(url);
        u.searchParams.set("lines", String(lines));
        u.searchParams.set("timestamps", "true");

        const r = await fetch(u.toString(), { credentials: "include" });
        if (!r.ok) throw new Error(`logs ${r.status}`);
        const data = await r.json();
        if (!alive) return;
        setText(data.text ?? "");
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      }
    }

    load();
    const t = window.setInterval(() => {
      if (poll) load();
    }, 3000);

    return () => { alive = false; window.clearInterval(t); };
  }, [open, url, lines, poll]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, height: "100vh", width: 520,
      background: "rgba(5,7,10,.92)", borderLeft: "1px solid var(--line)",
      zIndex: 1000, display: "flex", flexDirection: "column"
    }}>
      <div style={{ padding: 12, borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ color: "var(--muted)" }}>LOGS</div>
          <div style={{ marginTop: 6 }}>{title}</div>
        </div>
        <button className="btn" onClick={onClose}>CLOSE</button>
      </div>

      <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--line)" }}>
        <label style={{ color: "var(--muted)", fontSize: 12 }}>LINES</label>
        <input
          type="number"
          value={lines}
          min={10}
          max={2000}
          onChange={(e) => setLines(Math.max(10, Math.min(2000, Number(e.target.value) || 200)))}
          style={{
            width: 110, padding: 8, border: "1px solid var(--line)",
            background: "rgba(10,18,32,.35)", color: "var(--fg)", outline: "none"
          }}
        />
        <button className="btn" onClick={() => setPoll((p) => !p)}>
          {poll ? "AUTO: ON" : "AUTO: OFF"}
        </button>
        <button className="btn" onClick={() => { /* force reload by toggling */ setPoll(false); setTimeout(() => setPoll(true), 0); }}>
          REFRESH
        </button>
      </div>

      <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
        {err && (
          <div className="card" style={{ borderColor: "rgba(255,59,87,.55)", marginBottom: 10 }}>
            <div style={{ color: "var(--danger)" }}>ERROR</div>
            <div style={{ marginTop: 8, color: "var(--muted)" }}>{err}</div>
          </div>
        )}

        <pre style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--fg)",
          background: "rgba(10,18,32,.18)",
          border: "1px solid var(--line)",
          padding: 12
        }}>
{text || "no logs"}
        </pre>
      </div>
    </div>
  );
}
```

## 3.2 Export w `packages/ui/src/index.ts`

```ts
export * from "./components/ServiceLogsDrawer";
```

---

# 4) UI: ServicesPage — dodaj VIEW LOGS przy serwisie

W `apps/project/src/pages/Services.tsx` dopisz state:

```tsx
const [logsOpen, setLogsOpen] = React.useState(false);
const [logsService, setLogsService] = React.useState<any>(null);

function openLogs(service: any) {
  setLogsService(service);
  setLogsOpen(true);
}
```

W pętli serwisów dodaj drugi przycisk obok RESTART:

```tsx
<div style={{ display: "flex", gap: 10 }}>
  <button
    className="btn"
    disabled={!props.me || !can(props.me.role, "logs.read")}
    onClick={() => openLogs(s)}
  >
    VIEW LOGS
  </button>

  <button
    className="btn"
    style={{ borderColor: disabled ? "var(--line)" : "rgba(255,59,87,.55)" }}
    disabled={disabled}
    onClick={() => openRestart(s)}
  >
    {busyId === s.id ? "WORKING…" : left > 0 ? "COOLDOWN" : "RESTART"}
  </button>
</div>
```

Na końcu komponentu (pod modalką restartu) dodaj drawer:

```tsx
import { ServiceLogsDrawer } from "@ui";

<ServiceLogsDrawer
  open={logsOpen}
  title={logsService ? `${logsService.label} (${logsService.target})` : "Logs"}
  url={
    logsService
      ? `${import.meta.env.VITE_API_BASE}/v1/projects/${props.projectId}/services/${logsService.id}/logs`
      : null
  }
  onClose={() => { setLogsOpen(false); setLogsService(null); }}
/>
```

---

# 5) RBAC: uprawnienie `logs.read` (jeśli jeszcze nie masz)

W `@core/rbac` już używasz `logs.read` przy events – jeśli nie, to dodaj do roli `ops`:

```ts
logs: { read: true }
```

(albo w Twojej mapie permissionów — wedle tego co masz).

---

# 6) Bezpieczeństwo (ważne, ale proste)

* Agent pozwala logi **tylko** z `ALLOWED_RESTART_CONTAINERS`.
* API ma limit `lines<=2000`.
* UI nie ma żadnej mocy bez backendu.

To jest “dobre minimum”, które później bez bólu rozwiniesz (filtry, search, grep po Loki).

---

Jeśli chcesz następny ruch (już turbo-użyteczne, ale nadal bezpieczne):
**“OPEN IN GRAFANA”** przy serwisie → link do Explore Loki z filtrem `container="<name>"` i `host="<host>"`. To daje logi “na sterydach” bez kopiowania czegokolwiek.
