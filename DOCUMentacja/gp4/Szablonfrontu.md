OK. React + Vite + TypeScript. To jest właściwy wybór dla żywego control center.

Poniżej masz **szablon frontu** (monorepo) pod:

* `hub.ops.tld` (master)
* `pumo.ops.tld`, `zenon.ops.tld`, … (ten sam kod, inne `PROJECT_ID`)
* wspólny layout + moduły + RBAC w UI
* gotowe podpięcie do FastAPI (`/v1/me`, `/v1/projects`, `/v1/status/*`, `/v1/commands`)

---

## 1) Struktura repo (frontend)

```
jimbo77-ops-ui/
  apps/
    hub/
      index.html
      vite.config.ts
      src/
        main.tsx
        App.tsx
        pages/HubOverview.tsx
    project/
      index.html
      vite.config.ts
      src/
        main.tsx
        App.tsx
        pages/ProjectOverview.tsx
        pages/Services.tsx
        pages/Deploy.tsx
        pages/Logs.tsx
  packages/
    ui/
      src/
        layout/AppShell.tsx
        layout/Topbar.tsx
        layout/Sidebar.tsx
        components/Card.tsx
        components/Button.tsx
        styles/ops.css
    core/
      src/
        api.ts
        types.ts
        rbac.ts
        projectContext.ts
  package.json
  tsconfig.base.json
  pnpm-workspace.yaml
```

Polecam **pnpm** (szybko i czytelnie), ale npm też da radę.

---

## 2) ENV: subdomeny = ta sama appka “project”, różny PROJECT_ID

Dla `apps/project` ustawiasz na build/deploy:

* `VITE_API_BASE=https://api.ops.tld`
* `VITE_PROJECT_ID=pumo` (albo zenon/blogops)
* `VITE_ENV=prod`

Dla `apps/hub`:

* `VITE_API_BASE=https://api.ops.tld`

---

## 3) Wspólny styl (ops.css) – zero rounded, panelowy klimat

`packages/ui/src/styles/ops.css` – skrót (ty to potem dopieścisz):

```css
/* =========================
   JIMBO UNIFIED OPS DASHBOARD
   Sci-fi ultra-computer theme
   Zero rounded corners
   ========================= */

:root {
  --bg: #07090f;
  --bg2: #05070c;
  --panel: #0b0f1a;
  --panel2: #090d17;
  --text: #e7ecff;
  --muted: #9aa6c7;
  --faint: #6b7696;
  --line: #1b2542;
  --hot: #7cffb2;  /* neon green */
  --cold: #6aa6ff; /* neon blue */
  --warn: #ffd166; /* amber */
  --bad: #ff4d6d;  /* red/pink */
  --shadow: 0 0 0 1px rgba(231, 236, 255, .06), 0 18px 50px rgba(0, 0, 0, .55);

  --maxw: 1800px;
  --lh: 1.65;
  --fs: 14px;
  --fs-sm: 12px;
  --fs-lg: 16px;
  --fs-xl: 24px;

  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", sans-serif;

  --focus: 0 0 0 2px var(--cold), 0 0 0 4px rgba(106, 166, 255, .25);
}

* { box-sizing: border-box; border-radius: 0 !important; }
html, body { height: 100%; margin: 0; overflow-x: hidden; }
body {
  font: var(--fs)/var(--lh) var(--sans);
  background:
    radial-gradient(1200px 800px at 15% 0%, rgba(124, 255, 178, .08), transparent 60%),
    radial-gradient(1200px 800px at 90% 5%, rgba(106, 166, 255, .08), transparent 60%),
    linear-gradient(180deg, var(--bg), var(--bg2) 70%);
  color: var(--text);
}
a { color: inherit; text-decoration: none; }
a:hover { color: var(--hot); }

/* LAYOUT */
.topbar {
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(10px);
  background: linear-gradient(180deg, rgba(11, 15, 26, .92), rgba(7, 9, 15, .70));
  border-bottom: 1px solid rgba(27, 37, 66, .9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .4);
}
.toprow {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; max-width: var(--maxw); margin: 0 auto; padding: 14px 20px;
}
.container { max-width: var(--maxw); margin: 0 auto; padding: 20px; }
.grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 18px; margin-top: 20px;
}

/* COMPONENTS */
.panel {
  border: 1px solid rgba(27, 37, 66, .85);
  background: linear-gradient(180deg, rgba(11, 15, 26, .95), rgba(9, 13, 23, .80));
  box-shadow: var(--shadow);
  position: relative; overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
}
.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(231, 236, 255, .10), 0 24px 60px rgba(0, 0, 0, .65);
}
.panel-header {
  border-bottom: 1px solid rgba(27, 37, 66, .75);
  padding: 14px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between;
}
.panel-header h3 { margin: 0; font: 900 14px/1.2 var(--mono); letter-spacing: 1px; color: var(--text); }
.badge {
  border: 1px solid rgba(27, 37, 66, .8); padding: 5px 8px;
  font: 700 10px/1 var(--mono); letter-spacing: 0.6px;
  color: var(--muted); background: rgba(11, 15, 26, .6);
}
.badge.active { border-color: rgba(124, 255, 178, .45); color: var(--hot); background: rgba(124, 255, 178, .08); }
.badge.inactive { border-color: rgba(255, 77, 109, .35); color: var(--bad); }

.service-card {
  display: flex; gap: 12px; padding: 12px;
  border-top: 1px solid rgba(27, 37, 66, .5);
  align-items: flex-start; transition: background .15s ease;
}
.service-icon {
  width: 42px; height: 42px; min-width: 42px;
  border: 1px solid rgba(27, 37, 66, .8);
  background: repeating-linear-gradient(45deg, rgba(106, 166, 255, .12) 0px, rgba(106, 166, 255, .12) 1px, transparent 1px, transparent 4px);
  display: flex; align-items: center; justify-content: center;
  font: 900 16px/1 var(--mono); color: var(--cold);
}
.service-btn {
  appearance: none; background: transparent;
  border: 1px solid rgba(27, 37, 66, .8);
  color: var(--muted); padding: 6px 10px;
  font: 700 10px/1 var(--mono); cursor: pointer;
  transition: all .15s ease;
}
.service-btn.launch { border-color: rgba(124, 255, 178, .35); color: var(--hot); }
.service-btn:hover { border-color: rgba(106, 166, 255, .45); color: var(--cold); background: rgba(106, 166, 255, .06); }
```

---

## 4) Core: typy + API client + RBAC

`packages/core/src/types.ts`:

```ts
export type Role = "owner" | "admin" | "dev" | "viewer";

export type Me = { email: string; role: Role };

export type Project = {
  id: string;
  name: string;
  host: string;           // https://pumo.ops.tld
  modules: string[];      // ["overview","services","deploy","logs"]
  agents?: { id: string; url: string }[];
};

export type GlobalStatus = { ok: boolean; ts: string };
export type ProjectStatus = { ok: boolean; servicesUp: number; servicesTotal: number };

export type CommandIn = {
  projectId: string;
  action: "service.restart" | "deploy.run";
  target?: string | null;
  params?: Record<string, unknown>;
  reason?: string | null;
};

export type CommandOut = {
  id: string;
  status: string;
  projectId: string;
  action: string;
};
```

`packages/core/src/api.ts`:

```ts
import type { Me, Project, GlobalStatus, ProjectStatus, CommandIn, CommandOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.ops.tld";

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

async function jpost<T>(path: string, body: unknown, headers?: Record<string,string>): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type":"application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

export const api = {
  me: () => jget<Me>("/v1/me"),
  projects: () => jget<Project[]>("/v1/projects"),
  globalStatus: () => jget<GlobalStatus>("/v1/status/global"),
  projectStatus: (id: string) => jget<ProjectStatus>(`/v1/status/project/${id}`),
  command: (payload: CommandIn, idempotencyKey: string) =>
    jpost<CommandOut>("/v1/commands", payload, { "Idempotency-Key": idempotencyKey }),
};
```

`packages/core/src/rbac.ts`:

```ts
import type { Role } from "./types";

const PERMS: Record<Role, Set<string>> = {
  viewer: new Set(["status.read","logs.read"]),
  dev:    new Set(["status.read","logs.read","service.restart","deploy.run"]),
  admin:  new Set(["status.read","logs.read","service.restart","deploy.run","project.configure"]),
  owner:  new Set(["*"]),
};

export function can(role: Role, perm: string): boolean {
  const s = PERMS[role] ?? new Set();
  return s.has("*") || s.has(perm);
}
```

---

## 5) UI Shell (wspólny layout)

`packages/ui/src/layout/AppShell.tsx`:

```tsx
import React from "react";
import "../styles/ops.css";

export function AppShell(props: {
  topbar: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      {props.topbar}
      <main className="container">
        {props.children}
      </main>
      <footer>{props.footer ?? "JIMBO UNIFIED CONTROL HUB"}</footer>
    </>
  );
}
```

`packages/ui/src/layout/Topbar.tsx`:

```tsx
import React from "react";

export function Topbar(props: {
  title: string;
  env: string;
  userEmail?: string;
  role?: string;
  globalOk?: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <div style={{ display:"flex", gap:10, alignItems:"baseline" }}>
          <b>JIMBO77</b>
          <span style={{ color:"var(--muted)" }}>/ {props.title}</span>
          <span className={`pill ${props.globalOk ? "pillOk" : "pillBad"}`}>
            {props.globalOk ? "CORE OK" : "CORE DOWN"}
          </span>
          <span className="pill">{props.env}</span>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span className="pill">{props.role ?? "unknown-role"}</span>
          <span className="pill">{props.userEmail ?? "unknown-user"}</span>
          <a className="btn" href="https://hub.ops.tld">HUB</a>
        </div>
      </div>
    </header>
  );
}
```

---

## 6) HUB app (master)

`apps/hub/src/App.tsx` (minimal):

```tsx
import React from "react";
import { AppShell } from "@ui/layout/AppShell";
import { Topbar } from "@ui/layout/Topbar";
import { api } from "@core/api";

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const [me, setMe] = React.useState<any>(null);
  const [globalOk, setGlobalOk] = React.useState<boolean>(false);
  const [projects, setProjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      const [m, g, p] = await Promise.all([api.me(), api.globalStatus(), api.projects()]);
      setMe(m); setGlobalOk(g.ok); setProjects(p);
    })().catch(console.error);
  }, []);

  return (
    <AppShell
      topbar={<Topbar title="UNIFIED OPS" />}
      footer={`JIMBO UNIFIED | ${new Date().toISOString()}`}
    >
      {/* TABS */}
      <div className="tabs">
        <button className="tab active">DASHBOARDS</button>
        <button className="tab">AGENTS</button>
        <button className="tab">SERVICES</button>
      </div>

      <div className="grid">
        {/* Main Dashboard Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="label">PORT 4560</div>
              <h3>MAIN DASHBOARD</h3>
            </div>
            <span className="badge active">ACTIVE</span>
          </div>
          <div className="panel-body">
             {/* Service Card Example */}
             <div className="service-card">
               <div className="service-icon">?</div>
               <div className="service-info">
                 <h4>Dashboard Server</h4>
                 <p>Centralny panel kontrolny (Flask/React)</p>
                 <div className="service-btn launch">LAUNCH</div>
               </div>
             </div>
          </div>
        </div>

        {/* Project Panels */}
        {projects.map(p => (
           <div key={p.id} className="panel">
             <div className="panel-header">
               <h3>{p.name.toUpperCase()}</h3>
               <span className="badge">PROJECT</span>
             </div>
             <div className="panel-body">
               <a href={p.host} className="service-btn" style={{display:'block', textAlign:'center'}}>
                 OPEN HUB →
               </a>
             </div>
           </div>
        ))}
      </div>
    </AppShell>
  );
}
```

---

## 7) Project app (subdomena) + przykładowa komenda z idempotency

`apps/project/src/App.tsx` (minimal + restart):

```tsx
import React from "react";
import { AppShell } from "@ui/layout/AppShell";
import { Topbar } from "@ui/layout/Topbar";
import { api } from "@core/api";
import { can } from "@core/rbac";
import type { CommandIn } from "@core/types";

function uuidv4() {
  return crypto.randomUUID();
}

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const projectId = import.meta.env.VITE_PROJECT_ID ?? "unknown";

  const [me, setMe] = React.useState<any>(null);
  const [globalOk, setGlobalOk] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [m, g, p, s] = await Promise.all([
        api.me(), api.globalStatus(), api.projects(), api.projectStatus(projectId)
      ]);
      setMe(m); setGlobalOk(g.ok); setProjects(p); setStatus(s);
    })().catch(console.error);
  }, [projectId]);

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color:"var(--muted)" }}>PROJECT</div>
        <div className="kpi">{projectId}</div>
      </div>

      <div style={{ marginTop:12, color:"var(--muted)" }}>JUMP</div>
      {projects.map(p => (
        <a key={p.id} className="btn" style={{ width:"100%", justifyContent:"space-between", marginTop:8 }} href={p.host}>
          <span>{p.name}</span><small style={{ color:"var(--muted)" }}>{p.id}</small>
        </a>
      ))}
    </>
  );

  async function restartExample() {
    if (!me) return;
    if (!can(me.role, "service.restart")) return;
    setBusy(true);
    try {
      const payload: CommandIn = {
        projectId,
        action: "service.restart",
        target: "pumo-api", // docelowo z configu
        params: {},
        reason: "manual restart from dashboard",
      };
      const out = await api.command(payload, uuidv4());
      console.log("command:", out);
      // tu potem: pokaż command id + podepnij audit/events
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      topbar={<Topbar title={`PROJECT / ${projectId}`} env={env} userEmail={me?.email} role={me?.role} globalOk={globalOk} />}
      sidebar={sidebar}
      footer={`${projectId} / ${new Date().toISOString()}`}
    >
      <div className="grid">
        <div className="card" style={{ gridColumn:"span 4" }}>
          <div style={{ color:"var(--muted)" }}>HEALTH</div>
          <div className="kpi">{status?.ok ? "OK" : "DEGRADED"}</div>
        </div>

        <div className="card" style={{ gridColumn:"span 4" }}>
          <div style={{ color:"var(--muted)" }}>SERVICES</div>
          <div className="kpi">{status ? `${status.servicesUp}/${status.servicesTotal}` : "-"}</div>
        </div>

        <div className="card" style={{ gridColumn:"span 4" }}>
          <div style={{ color:"var(--muted)" }}>ACTIONS</div>
          <button className="btn" disabled={busy || !me || !can(me.role, "service.restart")} onClick={restartExample}>
            RESTART (example)
          </button>
        </div>
      </div>
    </AppShell>
  );
}
```

---

## 8) Deployment na Cloudflare Pages (ważne)

* Pages działa świetnie dla Vite buildów.
* Dla każdej subdomeny projektu robisz osobny Pages project albo ten sam z różnymi env (zależy jak wolisz zarządzać).
* W każdym Pages projekcie ustawiasz env:

  * `VITE_API_BASE`
  * `VITE_PROJECT_ID` (tylko dla project app)
  * `VITE_ENV`

---

## 9) Co będzie następne (żeby to ruszyło end-to-end)

1. W API dodajemy:

* `GET /v1/commands/{id}`
* `GET /v1/commands/{id}/events`
* `GET /v1/audit` (ostatnie)

2. W UI robimy moduł “Command drawer”:

* pokazuje status komendy + eventy live (polling / SSE)

3. Dopiero potem log tail i “fajne rzeczy”.

---

Jeśli chcesz, kolejnym krokiem dam Ci **gotowy starter repo** z plikami `package.json`, `pnpm-workspace.yaml`, `vite.config.ts` dla obu appów i aliasami `@ui/@core`, żebyś to wkleił i odpalił bez ręcznego składania.
