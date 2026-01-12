Pewnie. Masz poniżej **gotowy starter repo** (monorepo) pod **React + Vite + TypeScript** z 2 appkami (`hub`, `project`) i 2 paczkami (`@ui`, `@core`). Kopiuj 1:1.

> Zakładam **pnpm**. Jeśli używasz npm – da się, ale pnpm to mniejsze cierpienie.

---

# 1) Pliki w root

## `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## `package.json`

```json
{
  "name": "jimbo77-ops-ui",
  "private": true,
  "packageManager": "pnpm@9.12.3",
  "scripts": {
    "dev:hub": "pnpm --filter @apps/hub dev",
    "dev:project": "pnpm --filter @apps/project dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint"
  }
}
```

## `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"],
    "useDefineForClassFields": true,
    "resolveJsonModule": true
  }
}
```

---

# 2) Package: `@core`

## `packages/core/package.json`

```json
{
  "name": "@core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./api": "./src/api.ts",
    "./types": "./src/types.ts",
    "./rbac": "./src/rbac.ts"
  },
  "dependencies": {}
}
```

## `packages/core/src/index.ts`

```ts
export * from "./types";
export * from "./api";
export * from "./rbac";
```

## `packages/core/src/types.ts`

```ts
export type Role = "owner" | "admin" | "dev" | "viewer";
export type Me = { email: string; role: Role };

export type Project = {
  id: string;
  name: string;
  host: string;        // https://pumo.ops.tld
  modules: string[];   // ["overview","services","deploy","logs"]
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

## `packages/core/src/api.ts`

```ts
import type { Me, Project, GlobalStatus, ProjectStatus, CommandIn, CommandOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.ops.tld";

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

async function jpost<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
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

## `packages/core/src/rbac.ts`

```ts
import type { Role } from "./types";

const PERMS: Record<Role, Set<string>> = {
  viewer: new Set(["status.read", "logs.read"]),
  dev: new Set(["status.read", "logs.read", "service.restart", "deploy.run"]),
  admin: new Set(["status.read", "logs.read", "service.restart", "deploy.run", "project.configure"]),
  owner: new Set(["*"]),
};

export function can(role: Role, perm: string): boolean {
  const s = PERMS[role] ?? new Set();
  return s.has("*") || s.has(perm);
}
```

---

# 3) Package: `@ui`

## `packages/ui/package.json`

```json
{
  "name": "@ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./layout/AppShell": "./src/layout/AppShell.tsx",
    "./layout/Topbar": "./src/layout/Topbar.tsx",
    "./styles/ops.css": "./src/styles/ops.css"
  },
  "dependencies": {
    "react": "^18.3.1"
  }
}
```

## `packages/ui/src/index.ts`

```ts
export * from "./layout/AppShell";
export * from "./layout/Topbar";
```

## `packages/ui/src/styles/ops.css`

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

## `packages/ui/src/layout/AppShell.tsx`

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

## `packages/ui/src/layout/Topbar.tsx`

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
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <b>JIMBO77</b>
          <span style={{ color: "var(--muted)" }}>/ {props.title}</span>
          <span className={`pill ${props.globalOk ? "pillOk" : "pillBad"}`}>
            {props.globalOk ? "CORE OK" : "CORE DOWN"}
          </span>
          <span className="pill">{props.env}</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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

# 4) App: HUB (`apps/hub`)

## `apps/hub/package.json`

```json
{
  "name": "@apps/hub",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@core": "workspace:*",
    "@ui": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.8.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.1"
  }
}
```

## `apps/hub/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ui/*": ["../../packages/ui/src/*"],
      "@core/*": ["../../packages/core/src/*"]
    }
  },
  "include": ["src"]
}
```

## `apps/hub/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
});
```

## `apps/hub/index.html`

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JIMBO77 / HUB</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `apps/hub/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## `apps/hub/src/App.tsx`

```tsx
import React from "react";
import { AppShell } from "@ui/layout/AppShell";
import { Topbar } from "@ui/layout/Topbar";
import { api } from "@core/api";
import type { Project } from "@core/types";

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const [me, setMe] = React.useState<{ email: string; role: string } | null>(null);
  const [globalOk, setGlobalOk] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);

  React.useEffect(() => {
    (async () => {
      const [m, g, p] = await Promise.all([api.me(), api.globalStatus(), api.projects()]);
      setMe(m);
      setGlobalOk(g.ok);
      setProjects(p);
    })().catch(console.error);
  }, []);

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color: "var(--muted)" }}>MASTER</div>
        <div className="kpi">HUB</div>
      </div>

      <div style={{ marginTop: 12, color: "var(--muted)" }}>PROJECTS</div>
      {projects.map((p) => (
        <a
          key={p.id}
          className="btn"
          style={{ width: "100%", justifyContent: "space-between", marginTop: 8 }}
          href={p.host}
        >
          <span>{p.name}</span>
          <small style={{ color: "var(--muted)" }}>{p.id}</small>
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
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>GLOBAL</div>
          <div className="kpi">{globalOk ? "OK" : "DOWN"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 8" }}>
          <div style={{ color: "var(--muted)" }}>PROJECTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {projects.map((p) => (
              <a key={p.id} className="btn" href={p.host}>
                {p.name}
              </a>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: "span 12" }}>
          <div style={{ color: "var(--muted)" }}>RECENT</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>
            tu podepniesz audit / alerty / ostatnie komendy
          </div>
        </div>
      </div>
    </AppShell>
  );
}
```

---

# 5) App: PROJECT template (`apps/project`)

## `apps/project/package.json`

```json
{
  "name": "@apps/project",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@core": "workspace:*",
    "@ui": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.8.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.1"
  }
}
```

## `apps/project/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@ui/*": ["../../packages/ui/src/*"],
      "@core/*": ["../../packages/core/src/*"]
    }
  },
  "include": ["src"]
}
```

## `apps/project/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
});
```

## `apps/project/index.html`

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JIMBO77 / PROJECT</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `apps/project/src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## `apps/project/src/App.tsx`

```tsx
import React from "react";
import { AppShell } from "@ui/layout/AppShell";
import { Topbar } from "@ui/layout/Topbar";
import { api } from "@core/api";
import { can } from "@core/rbac";
import type { Project, CommandIn } from "@core/types";

function idemKey() {
  return crypto.randomUUID();
}

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const projectId = import.meta.env.VITE_PROJECT_ID ?? "unknown";

  const [me, setMe] = React.useState<{ email: string; role: any } | null>(null);
  const [globalOk, setGlobalOk] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [status, setStatus] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [m, g, p, s] = await Promise.all([
        api.me(),
        api.globalStatus(),
        api.projects(),
        api.projectStatus(projectId),
      ]);
      setMe(m);
      setGlobalOk(g.ok);
      setProjects(p);
      setStatus(s);
    })().catch(console.error);
  }, [projectId]);

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color: "var(--muted)" }}>PROJECT</div>
        <div className="kpi">{projectId}</div>
      </div>

      <div style={{ marginTop: 12, color: "var(--muted)" }}>JUMP</div>
      {projects.map((p) => (
        <a
          key={p.id}
          className="btn"
          style={{ width: "100%", justifyContent: "space-between", marginTop: 8 }}
          href={p.host}
        >
          <span>{p.name}</span>
          <small style={{ color: "var(--muted)" }}>{p.id}</small>
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
        target: `${projectId}-api`, // docelowo z configu projektu
        params: {},
        reason: "manual restart from dashboard",
      };
      const out = await api.command(payload, idemKey());
      console.log("command:", out);
      alert(`Command queued: ${out.id}`);
    } catch (e: any) {
      alert(`Error: ${String(e?.message ?? e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      topbar={
        <Topbar
          title={`PROJECT / ${projectId}`}
          env={env}
          userEmail={me?.email}
          role={me?.role}
          globalOk={globalOk}
        />
      }
      sidebar={sidebar}
      footer={`${projectId} / ${new Date().toISOString()}`}
    >
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>HEALTH</div>
          <div className="kpi">{status?.ok ? "OK" : "DEGRADED"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>SERVICES</div>
          <div className="kpi">{status ? `${status.servicesUp}/${status.servicesTotal}` : "-"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>ACTIONS</div>
          <button
            className="btn"
            disabled={busy || !me || !can(me.role, "service.restart")}
            onClick={restartExample}
          >
            RESTART (example)
          </button>
        </div>
      </div>
    </AppShell>
  );
}
```

---

# 6) Jak to odpalić lokalnie

W root repo:

```bash
pnpm install
pnpm dev:hub
pnpm dev:project
```

ENV (lokalnie) – najprościej przez `.env.local` w appkach:

## `apps/hub/.env.local`

```env
VITE_API_BASE=http://localhost:8000
VITE_ENV=dev
```

## `apps/project/.env.local`

```env
VITE_API_BASE=http://localhost:8000
VITE_ENV=dev
VITE_PROJECT_ID=pumo
```

---

# 7) Deployment na Cloudflare Pages

* `hub.ops.tld` → build:

  * root: `apps/hub`
  * command: `pnpm install --frozen-lockfile && pnpm build`
  * output: `apps/hub/dist`
  * env: `VITE_API_BASE=https://api.ops.tld`

* `pumo.ops.tld` → build:

  * root: `apps/project`
  * env: `VITE_PROJECT_ID=pumo`, `VITE_API_BASE=https://api.ops.tld`

i tak dla kolejnych subdomen.

---

Jeśli chcesz, kolejny krok zrobię już “operacyjnie”: dorzucę do UI moduł **Command timeline** (polling `GET /v1/commands/{id}` + `/events`) i wtedy po kliknięciu restartu zobaczysz status “queued/running/done” jak w prawdziwym panelu.
