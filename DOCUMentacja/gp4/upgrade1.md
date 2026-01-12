Dobra. To robimy kolejny krok: **projects config → UI listuje serwisy → restart działa na konkretnym kontenerze** + “danger confirm” (wpisujesz reason). Poniżej masz gotowe pliki/zmiany.

---

# A) BACKEND: `GET /v1/projects` z `services[]` i `agents[]`

## 1) `api/app/schemas_projects.py` (NOWY)

```python
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional

class AgentCfg(BaseModel):
    id: str
    url: str

class ServiceCfg(BaseModel):
    id: str             # stable ID w UI
    label: str
    target: str         # nazwa kontenera (docker) przekazywana do agenta
    agentId: str        # który agent ma to wykonać
    kind: str = "docker"  # na start: docker

class ProjectOut(BaseModel):
    id: str
    name: str
    host: str
    modules: list[str]
    agents: list[AgentCfg]
    services: list[ServiceCfg]
    links: dict[str, str] = {}
```

## 2) `api/app/project_config.py` (NOWY, MVP “w pliku”)

```python
from __future__ import annotations

PROJECTS = [
    {
        "id": "pumo",
        "name": "PUMO",
        "host": "https://pumo.ops.tld",
        "modules": ["overview", "services", "deploy", "logs", "alerts"],
        "agents": [
            {"id": "pumo-1", "url": "https://agent-pumo-1.ops.tld"},
            {"id": "pumo-2", "url": "https://agent-pumo-2.ops.tld"},
        ],
        "services": [
            {"id": "pumo-api", "label": "PUMO API", "target": "pumo-api", "agentId": "pumo-1", "kind": "docker"},
            {"id": "pumo-worker", "label": "PUMO Worker", "target": "pumo-worker", "agentId": "pumo-2", "kind": "docker"},
        ],
        "links": {
            "docs": "https://index.ai-domena.tld/projects/pumo",
        }
    },
    {
        "id": "zenon",
        "name": "ZENON",
        "host": "https://zenon.ops.tld",
        "modules": ["overview", "services", "logs"],
        "agents": [
            {"id": "zenon-1", "url": "https://agent-zenon-1.ops.tld"},
        ],
        "services": [
            {"id": "zenon-api", "label": "ZENON API", "target": "zenon-api", "agentId": "zenon-1", "kind": "docker"},
        ],
        "links": {}
    },
]
```

## 3) `api/app/routes/projects.py` (PODMIANA lub DOPISZ)

```python
from __future__ import annotations
from fastapi import APIRouter, Depends
from ..main import current_actor
from ..security.rbac import require
from ..project_config import PROJECTS
from ..schemas_projects import ProjectOut

router = APIRouter()

@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(actor=Depends(current_actor)):
    require(actor.role, "status.read")
    return PROJECTS

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, actor=Depends(current_actor)):
    require(actor.role, "status.read")
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    return {
        "id": project_id,
        "name": project_id,
        "host": "",
        "modules": [],
        "agents": [],
        "services": [],
        "links": {},
    }
```

> Worker i UI teraz będą miały wspólne źródło prawdy. Docelowo przeniesiesz to do DB, ale MVP działa.

---

# B) WORKER: używa configu z API (zamiast pliku)

Masz teraz dwa warianty:

1. **MVP:** worker nadal ma swój `project_config.py` (szybko)
2. **Lepsze:** worker pobiera config z `api.ops.tld/v1/projects/{id}` (jedno źródło prawdy)

Zrobimy **lepsze**, bo inaczej się rozjedzie.

## 1) `worker/config_client.py` (NOWY)

```python
import os
import httpx

API_BASE = os.getenv("OPS_API_BASE", "https://api.ops.tld")

def get_project_cfg(project_id: str) -> dict:
    # worker jest za Access? zwykle tak. Jeśli API też ma Access dla service tokenów:
    # dodaj tu CF service token headers analogicznie jak do agentów.
    with httpx.Client(timeout=20) as client:
        r = client.get(f"{API_BASE}/v1/projects/{project_id}")
        r.raise_for_status()
        return r.json()

def pick_agent_url(project_cfg: dict, agent_id: str) -> str:
    for a in project_cfg.get("agents", []):
        if a["id"] == agent_id:
            return a["url"]
    raise KeyError(f"agent not found: {agent_id}")
```

## 2) Zmiana w `worker/tasks.py`: agent wybieramy po `agentId` serwisu

Podmień fragment wyboru agenta.

Dodaj import:

```python
from .config_client import get_project_cfg, pick_agent_url
```

I w środku taska, przed `call_agent`:

```python
project_cfg = get_project_cfg(cmd.project_id)

# dla service.restart target to nazwa kontenera; musimy znaleźć service, żeby dobrać agentId
agent_url = None
if cmd.action == "service.restart":
    # cmd.target = nazwa kontenera albo service id — my ustawimy w UI cmd.target = serviceId (bezpieczniej)
    service = next((s for s in project_cfg.get("services", []) if s["id"] == cmd.target), None)
    if not service:
        # fallback: spróbuj dopasować po target(containter)
        service = next((s for s in project_cfg.get("services", []) if s.get("target") == cmd.target), None)
    if not service:
        mark_failed(session, cmd, f"service_not_found: {cmd.target}", permanent=True)
        session.commit()
        return {"ok": False, "error": "service_not_found"}

    agent_url = pick_agent_url(project_cfg, service["agentId"])
    # do agenta wysyłamy realny kontener:
    payload_target = service["target"]
else:
    # deploy.run: wybierz pierwszy agent albo osobny routing (tu MVP: pierwszy)
    agents = project_cfg.get("agents", [])
    if not agents:
        mark_failed(session, cmd, "no_agents_configured", permanent=True)
        session.commit()
        return {"ok": False, "error": "no_agents_configured"}
    agent_url = agents[0]["url"]
    payload_target = cmd.target
```

I potem w `payload` użyj `payload_target` zamiast `cmd.target`:

```python
payload = {
  "commandId": str(cmd.id),
  "projectId": cmd.project_id,
  "action": cmd.action,
  "target": payload_target,
  "params": cmd.params or {},
}
```

**Ważne:** UI będzie wysyłać `cmd.target = serviceId` (np. `pumo-api`), a worker zamieni na realny kontener `target` (np. `pumo-api` — ale może być różnie). To daje Ci kontrolę.

---

# C) AGENT: restart dockera już masz — dodaj “reason” do logów (opcjonalnie)

Jeśli chcesz, w agent payload możesz wysyłać `params.reason` i logować. Na MVP OK bez.

---

# D) FRONTEND: moduł Services + reason confirm

Teraz robimy stronę/komponent “Services”, który:

* pobiera `GET /v1/projects/{projectId}`
* listuje `services[]`
* przy restart:

  * otwiera modal/prompt “Reason”
  * wysyła `POST /v1/commands` z:

    * `action: "service.restart"`
    * `target: service.id`  ✅ (nie nazwa kontenera)
    * `reason: ...`
  * otwiera `CommandDrawer`

## 1) `apps/project/src/pages/Services.tsx` (NOWY)

```tsx
import React from "react";
import { api } from "@core/api";
import { can } from "@core/rbac";
import type { CommandIn } from "@core/types";

function idemKey() {
  return crypto.randomUUID();
}

export function ServicesPage(props: {
  projectId: string;
  me: { email: string; role: any } | null;
  onCommand: (id: string) => void;
}) {
  const [project, setProject] = React.useState<any>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const p = await fetch(`${import.meta.env.VITE_API_BASE}/v1/projects/${props.projectId}`, { credentials: "include" });
      if (!p.ok) throw new Error(`projects/${props.projectId} ${p.status}`);
      setProject(await p.json());
    })().catch(console.error);
  }, [props.projectId]);

  async function restart(service: any) {
    if (!props.me) return;
    if (!can(props.me.role, "service.restart")) return;

    const reason = window.prompt(`Reason for RESTART (${service.label})?`, "manual restart");
    if (!reason || reason.trim().length < 3) return;

    setBusyId(service.id);
    try {
      const payload: CommandIn = {
        projectId: props.projectId,
        action: "service.restart",
        target: service.id,      // ✅ serviceId, nie kontener
        params: {},
        reason: reason.trim(),
      };
      const out = await api.command(payload, idemKey());
      props.onCommand(out.id);
    } finally {
      setBusyId(null);
    }
  }

  if (!project) return <div className="card">loading project config…</div>;

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 12" }}>
        <div style={{ color: "var(--muted)" }}>SERVICES</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {(project.services ?? []).map((s: any) => (
            <div key={s.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(10,18,32,.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <b>{s.label}</b>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                    id: {s.id} · agent: {s.agentId} · target: {s.target}
                  </div>
                </div>

                <button
                  className="btn"
                  disabled={busyId === s.id || !props.me || !can(props.me.role, "service.restart")}
                  onClick={() => restart(s)}
                >
                  {busyId === s.id ? "WORKING…" : "RESTART"}
                </button>
              </div>
            </div>
          ))}
          {(project.services ?? []).length === 0 && <div style={{ color: "var(--muted)" }}>no services configured</div>}
        </div>
      </div>
    </div>
  );
}
```

## 2) Routing w `apps/project/src/App.tsx` (minimalny router bez react-router)

Dodaj import:

```tsx
import { ServicesPage } from "./pages/Services";
import { CommandDrawer } from "@ui/components/CommandDrawer";
```

Dodaj state:

```tsx
const [activeCommandId, setActiveCommandId] = React.useState<string | null>(null);
const [tab, setTab] = React.useState<"overview" | "services">("overview");
```

W sidebar dodaj przyciski:

```tsx
<div style={{ marginTop: 12, color: "var(--muted)" }}>NAV</div>
<button className="btn" style={{ width:"100%", marginTop: 8, justifyContent:"space-between" }} onClick={() => setTab("overview")}>
  <span>Overview</span><small style={{ color:"var(--muted)" }}>kpi</small>
</button>
<button className="btn" style={{ width:"100%", marginTop: 8, justifyContent:"space-between" }} onClick={() => setTab("services")}>
  <span>Services</span><small style={{ color:"var(--muted)" }}>ops</small>
</button>
```

W content area zamiast stałego grid daj:

```tsx
{tab === "overview" && (
  <div className="grid">
    ... twoje karty health/services/actions ...
  </div>
)}

{tab === "services" && (
  <ServicesPage
    projectId={projectId}
    me={me}
    onCommand={(id) => setActiveCommandId(id)}
  />
)}

<CommandDrawer commandId={activeCommandId} onClose={() => setActiveCommandId(null)} />
```

---

# E) Worker: dopisz ENV `OPS_API_BASE`

W `docker-compose` dla worker:

```yaml
environment:
  OPS_API_BASE: https://api.ops.tld
```

Jeśli `api.ops.tld` też jest za Access tylko dla ludzi, to dodaj osobny **service token** dla workera i analogiczne nagłówki w `config_client.py`. (Na MVP możesz wystawić API dla workera po prywatnej sieci/VPS bez Access.)

---

## Co dostajesz po tym kroku

* UI “Services” pokazuje listę serwisów z configu
* restart pyta o **reason**
* wysyła komendę z `target=serviceId`
* worker mapuje `serviceId → agentId + container target`
* agent robi `docker restart <container>`
* drawer pokazuje timeline (queued → started → done/retry/error)

---

Jeśli chcesz, następny upgrade (już fajny):

* zamiast `window.prompt` robimy “danger modal” z:

  * wpisz `RESTART` żeby potwierdzić
  * reason obowiązkowy
* i do tego “cooldown” na akcje (żeby nie restartować co 2 sek).
