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
:root{
  --bg0:#05070a; --bg1:#070b12;
  --fg:#d7e2ff; --muted:#93a4c7;
  --line:#1b2a44;
  --accent:#41ff9a; --accent2:#5aa7ff;
  --danger:#ff3b57;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}
html,body,#root{height:100%; margin:0; background:linear-gradient(180deg,var(--bg1),var(--bg0)); color:var(--fg); font-family:var(--mono);}
*{box-sizing:border-box}
a{color:inherit; text-decoration:none}
.shell{min-height:100%; display:grid; grid-template-rows:auto 1fr auto;}
.topbar{position:sticky; top:0; z-index:50; backdrop-filter:blur(8px); background:rgba(5,7,10,.72); border-bottom:1px solid var(--line);}
.topbarInner{display:flex; justify-content:space-between; align-items:center; padding:10px 14px; gap:12px;}
.pill{border:1px solid var(--line); padding:4px 8px; font-size:12px; color:var(--muted);}
.pillOk{border-color:rgba(65,255,154,.35); color:var(--accent)}
.pillBad{border-color:rgba(255,59,87,.35); color:var(--danger)}
.main{display:grid; grid-template-columns:260px 1fr; min-height:0;}
.sidebar{border-right:1px solid var(--line); padding:12px; background:rgba(0,0,0,.12); overflow:auto;}
.content{padding:14px; overflow:auto;}
.card{border:1px solid var(--line); background:rgba(8,12,18,.55); padding:12px;}
.kpi{font-size:22px; color:var(--accent)}
.btn{display:inline-flex; gap:8px; align-items:center; border:1px solid var(--line); padding:8px 10px; background:rgba(10,18,32,.35); cursor:pointer; font-family:var(--mono);}
.btn:hover{border-color:rgba(65,255,154,.45)}
.footer{border-top:1px solid var(--line); padding:10px 14px; color:var(--muted); font-size:12px;}
.grid{display:grid; grid-template-columns:repeat(12,1fr); gap:12px;}
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
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      {props.topbar}
      <div className="main">
        <aside className="sidebar">{props.sidebar}</aside>
        <main className="content">{props.children}</main>
      </div>
      <div className="footer">{props.footer ?? "build: ops-ui"}</div>
    </div>
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

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color:"var(--muted)" }}>MASTER</div>
        <div className="kpi">HUB</div>
      </div>

      <div style={{ marginTop:12, color:"var(--muted)" }}>PROJECTS</div>
      {projects.map(p => (
        <a key={p.id} className="btn" style={{ width:"100%", justifyContent:"space-between", marginTop:8 }} href={p.host}>
          <span>{p.name}</span><small style={{ color:"var(--muted)" }}>{p.id}</small>
        </a>
      ))}
    </>
  );

  return (
    <AppShell
      topbar={<Topbar title="CONTROL HUB" env={env} userEmail={me?.email} role={me?.role} globalOk={globalOk} />}
      sidebar={sidebar}
      footer={`hub / ${new Date().toISOString()}`}
    >
      <div className="grid">
        <div className="card" style={{ gridColumn:"span 4" }}>
          <div style={{ color:"var(--muted)" }}>GLOBAL</div>
          <div className="kpi">{globalOk ? "OK" : "DOWN"}</div>
        </div>

        <div className="card" style={{ gridColumn:"span 8" }}>
          <div style={{ color:"var(--muted)" }}>PROJECTS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:10 }}>
            {projects.map(p => (
              <a key={p.id} className="btn" href={p.host}>{p.name}</a>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn:"span 12" }}>
          <div style={{ color:"var(--muted)" }}>RECENT</div>
          <div style={{ color:"var(--muted)", marginTop:8 }}>
            tu podłączysz audit + alerty
          </div>
        </div>
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
