Pewnie. Poniżej masz **szablon stron (template)** pod układ: **master HUB na `hub.ops.tld` + dashboardy projektowe na subdomenach** – wszystko w tym samym layoucie, z modułami wpinanymi per projekt. Robię to pod **Astro** (bo już na nim siedzisz), ale tak, żebyś mógł też wrzucić to jako czysty static, jeśli chcesz.

---

## 0) Struktura repo (czytelna przy wielu subdomenach)

```
jimbo77-ops/
  apps/
    hub/                 # hub.ops.tld
    project/             # template dla pumo/zenon/blogops (ten sam kod, inny PROJECT_ID)
    magnet/              # index.ai-domena.tld (crawler magnes)
  packages/
    ui/                  # wspólny layout, komponenty, style
    core/                # api client, auth/user, RBAC, types, feature flags
  infra/
    cloudflare/          # notatki/polityki Access, headers, robots
  README.md
```

> Najważniejsze: **`apps/project` to jeden template**, a subdomeny różnicujesz env var `PROJECT_ID` (np. `pumo`, `zenon`).

---

## 1) Wspólny layout (UI shell) — `packages/ui`

### `packages/ui/src/styles/ops.css`

Minimalny “terminal/ops”, bez zaokrągleń, panelowy styl jak w Twoich dashboardach.

```css
:root{
  --bg0:#05070a; --bg1:#070b12;
  --fg:#d7e2ff; --muted:#93a4c7;
  --line:#1b2a44;
  --accent:#41ff9a; --accent2:#5aa7ff;
  --danger:#ff3b57; --warn:#ffb020;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

html,body{height:100%; background:radial-gradient(1200px 800px at 20% 10%, #0b1630, transparent 60%),
                         radial-gradient(900px 600px at 70% 30%, #081a14, transparent 55%),
                         linear-gradient(180deg, var(--bg1), var(--bg0));
          color:var(--fg); font-family:var(--mono); margin:0;}

a{color:inherit; text-decoration:none}
*{box-sizing:border-box}

.shell{min-height:100vh; display:grid; grid-template-rows:auto 1fr auto;}
.topbar{position:sticky; top:0; z-index:50; backdrop-filter: blur(8px);
        background:rgba(5,7,10,.72); border-bottom:1px solid var(--line);}
.topbar-inner{display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px;}
.brand{display:flex; align-items:baseline; gap:10px;}
.brand b{letter-spacing:.08em}
.pill{border:1px solid var(--line); padding:4px 8px; font-size:12px; color:var(--muted);}
.pill.ok{border-color:rgba(65,255,154,.35); color:var(--accent)}
.pill.bad{border-color:rgba(255,59,87,.35); color:var(--danger)}

.main{display:grid; grid-template-columns:260px 1fr; min-height:0;}
.sidebar{border-right:1px solid var(--line); padding:12px; background:rgba(0,0,0,.15); min-height:0;}
.content{padding:14px; min-height:0;}

.section-title{font-size:12px; color:var(--muted); letter-spacing:.08em; margin:10px 0 8px;}
.nav a{display:flex; justify-content:space-between; padding:10px 10px; border:1px solid var(--line);
       margin-bottom:8px; background:rgba(10,18,32,.35);}
.nav a:hover{border-color:rgba(90,167,255,.45)}
.nav small{color:var(--muted)}

.grid{display:grid; grid-template-columns:repeat(12,1fr); gap:12px;}
.card{border:1px solid var(--line); background:rgba(8,12,18,.55); padding:12px; min-height:60px;}
.card h3{margin:0 0 8px 0; font-size:13px; color:var(--muted); letter-spacing:.06em;}
.kpi{font-size:22px; color:var(--accent)}
.btn{display:inline-flex; align-items:center; gap:8px; border:1px solid var(--line);
     padding:8px 10px; background:rgba(10,18,32,.35); cursor:pointer; font-family:var(--mono);}
.btn:hover{border-color:rgba(65,255,154,.45)}
.btn.danger:hover{border-color:rgba(255,59,87,.55)}
.footer{border-top:1px solid var(--line); padding:10px 14px; color:var(--muted); font-size:12px;}
```

### `packages/ui/src/components/Topbar.astro`

```astro
---
const { title, env, userEmail, role, globalOk } = Astro.props;
---

<header class="topbar">
  <div class="topbar-inner">
    <div class="brand">
      <b>JIMBO77</b>
      <span style="color:var(--muted)">/ {title}</span>
      <span class={`pill ${globalOk ? 'ok' : 'bad'}`}>{globalOk ? 'CORE OK' : 'CORE DOWN'}</span>
      <span class="pill">{env}</span>
    </div>

    <div style="display:flex; gap:10px; align-items:center;">
      <span class="pill">{role ?? 'unknown-role'}</span>
      <span class="pill">{userEmail ?? 'unknown-user'}</span>
      <a class="btn" href="https://hub.ops.tld">HUB</a>
    </div>
  </div>
</header>
```

### `packages/ui/src/layouts/AppShell.astro`

```astro
---
import "../styles/ops.css";
import Topbar from "../components/Topbar.astro";

const { title, env, userEmail, role, globalOk, sidebar, footer } = Astro.props;
---

<div class="shell">
  <Topbar title={title} env={env} userEmail={userEmail} role={role} globalOk={globalOk} />

  <div class="main">
    <aside class="sidebar">
      {sidebar}
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>

  <div class="footer">
    {footer ?? `build: ${env} / ${new Date().toISOString()}`}
  </div>
</div>
```

---

## 2) Core: API client + RBAC (proste, ale działa) — `packages/core`

### `packages/core/src/api.ts`

```ts
export type Project = {
  id: string;
  name: string;
  host: string;         // https://pumo.ops.tld
  modules: string[];    // ["overview","services","deploy","logs"]
};

export type GlobalStatus = { ok: boolean; ts: string; };
export type ProjectStatus = { ok: boolean; servicesUp: number; servicesTotal: number; };

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "https://api.ops.tld";

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  projects: () => jget<Project[]>("/v1/projects"),
  globalStatus: () => jget<GlobalStatus>("/v1/status/global"),
  projectStatus: (id: string) => jget<ProjectStatus>(`/v1/status/project/${id}`),
};
```

### `packages/core/src/rbac.ts`

```ts
export type Role = "owner" | "admin" | "dev" | "viewer";

export function can(role: Role, perm: string): boolean {
  const map: Record<Role, string[]> = {
    viewer: ["status.read","logs.read"],
    dev:    ["status.read","logs.read","service.restart","deploy.run"],
    admin:  ["status.read","logs.read","service.restart","deploy.run","project.configure"],
    owner:  ["*"],
  };
  const perms = map[role] ?? [];
  return perms.includes("*") || perms.includes(perm);
}
```

---

## 3) App: `hub.ops.tld` — master ster (`apps/hub`)

### `apps/hub/src/pages/index.astro`

```astro
---
import AppShell from "@ui/layouts/AppShell.astro";
import { api } from "@core/api";

const env = import.meta.env.PUBLIC_ENV ?? "prod";

// user/role: docelowo bierzesz z API (np. /v1/me) lub z headerów przekazanych przez Access.
// tu placeholder:
const userEmail = "from-access@todo";
const role = "owner";

const [global, projects] = await Promise.all([
  api.globalStatus().catch(()=>({ok:false, ts:new Date().toISOString()})),
  api.projects().catch(()=>[])
]);

const sidebar = (
  <>
    <div class="section-title">PROJECTS</div>
    <nav class="nav">
      {projects.map(p => (
        <a href={p.host}>
          <span>{p.name}</span>
          <small>{p.id}</small>
        </a>
      ))}
    </nav>

    <div class="section-title">HUB</div>
    <nav class="nav">
      <a href="/"><span>Overview</span><small>global</small></a>
      <a href="/audit"><span>Audit</span><small>log</small></a>
      <a href="/admin"><span>Admin</span><small>flags</small></a>
    </nav>
  </>
);
---

<AppShell
  title="CONTROL HUB"
  env={env}
  userEmail={userEmail}
  role={role}
  globalOk={global.ok}
  sidebar={sidebar}
  footer={`hub / ${global.ts}`}
>
  <div class="grid">
    <div class="card" style="grid-column: span 4;">
      <h3>GLOBAL</h3>
      <div class="kpi">{global.ok ? "OK" : "DOWN"}</div>
    </div>

    <div class="card" style="grid-column: span 8;">
      <h3>PROJECTS</h3>
      <div style="display:flex; flex-wrap:wrap; gap:10px;">
        {projects.map(p => (
          <a class="btn" href={p.host}>
            <span>{p.name}</span>
            <small style="color:var(--muted)">{p.id}</small>
          </a>
        ))}
      </div>
    </div>

    <div class="card" style="grid-column: span 12;">
      <h3>RECENT</h3>
      <div style="color:var(--muted)">
        tutaj podepniesz: ostatnie alerty / ostatnie komendy (audit) / ostatnie błędy
      </div>
    </div>
  </div>
</AppShell>
```

---

## 4) App: template dla subdomen projektów (`apps/project`)

To jest *jedna appka* do wielu subdomen. Różnicujesz env var: `PUBLIC_PROJECT_ID=pumo` itd.

### `apps/project/src/pages/index.astro`

```astro
---
import AppShell from "@ui/layouts/AppShell.astro";
import { api } from "@core/api";
import { can } from "@core/rbac";

const env = import.meta.env.PUBLIC_ENV ?? "prod";
const PROJECT_ID = import.meta.env.PUBLIC_PROJECT_ID ?? "unknown";

const userEmail = "from-access@todo";
const role = "dev"; // docelowo z /v1/me

const [global, projects, status] = await Promise.all([
  api.globalStatus().catch(()=>({ok:false, ts:new Date().toISOString()})),
  api.projects().catch(()=>[]),
  api.projectStatus(PROJECT_ID).catch(()=>({ok:false, servicesUp:0, servicesTotal:0}))
]);

const meProject = projects.find(p => p.id === PROJECT_ID);

const sidebar = (
  <>
    <div class="section-title">PROJECT</div>
    <div class="card">
      <h3>CONTEXT</h3>
      <div class="kpi">{meProject?.name ?? PROJECT_ID}</div>
      <div style="color:var(--muted); margin-top:6px">{meProject?.host}</div>
    </div>

    <div class="section-title">NAV</div>
    <nav class="nav">
      <a href="/"><span>Overview</span><small>kpi</small></a>
      <a href="/services"><span>Services</span><small>ops</small></a>
      <a href="/deploy"><span>Deploy</span><small>pipe</small></a>
      <a href="/logs"><span>Logs</span><small>tail</small></a>
    </nav>

    <div class="section-title">JUMP</div>
    <nav class="nav">
      {projects.map(p => <a href={p.host}><span>{p.name}</span><small>{p.id}</small></a>)}
    </nav>
  </>
);
---

<AppShell
  title={`PROJECT / ${meProject?.name ?? PROJECT_ID}`}
  env={env}
  userEmail={userEmail}
  role={role}
  globalOk={global.ok}
  sidebar={sidebar}
  footer={`${PROJECT_ID} / ${global.ts}`}
>
  <div class="grid">
    <div class="card" style="grid-column: span 4;">
      <h3>PROJECT HEALTH</h3>
      <div class="kpi">{status.ok ? "OK" : "DEGRADED"}</div>
    </div>

    <div class="card" style="grid-column: span 4;">
      <h3>SERVICES</h3>
      <div class="kpi">{status.servicesUp}/{status.servicesTotal}</div>
    </div>

    <div class="card" style="grid-column: span 4;">
      <h3>PERMISSIONS</h3>
      <div style="color:var(--muted); line-height:1.6">
        restart: {String(can(role as any, "service.restart"))}<br/>
        deploy: {String(can(role as any, "deploy.run"))}
      </div>
    </div>

    <div class="card" style="grid-column: span 12;">
      <h3>MODULES</h3>
      <div style="color:var(--muted)">
        tu renderujesz moduły dynamicznie wg configu projektu (modules[])
      </div>
    </div>
  </div>
</AppShell>
```

### Dodatkowe strony (na start puste, ale w layoucie)

* `apps/project/src/pages/services.astro`
* `apps/project/src/pages/deploy.astro`
* `apps/project/src/pages/logs.astro`

Każda dziedziczy ten sam `AppShell`, tylko w środku inna zawartość.

---

## 5) App: AI-magnes (`apps/magnet`) — indeksowalne, “czytanka dla botów”

### `apps/magnet/src/pages/index.astro`

```astro
---
import "../styles/magnet.css"; // możesz użyć tego samego ops.css, tylko ja bym dał trochę więcej czytelności

const projects = [
  { id:"pumo", name:"PUMO", desc:"High-level description only.", ops:"https://pumo.ops.tld" },
  { id:"zenon", name:"ZENON", desc:"High-level description only.", ops:"https://zenon.ops.tld" },
];
---

<main class="wrap">
  <header class="hero">
    <h1>JIMBO77 / Project Index for Agents</h1>
    <p>Directory + documentation. Ops links go through Access.</p>
  </header>

  <section class="grid">
    {projects.map(p => (
      <article class="card">
        <h2>{p.name}</h2>
        <p>{p.desc}</p>
        <a href={`/projects/${p.id}`}>Docs</a>
        <span> · </span>
        <a href={p.ops}>Ops (Access)</a>
      </article>
    ))}
  </section>
</main>
```

Plus klasyki:

* `robots.txt` (tu **allow**)
* `sitemap.xml`
* opcjonalnie `llms.txt`

---

## 6) Jak to mapujesz na subdomeny (praktycznie)

Masz trzy deploye:

### Deploy 1: `hub.ops.tld`

* app: `apps/hub`
* env: `PUBLIC_API_BASE=https://api.ops.tld`

### Deploy 2..N: `pumo.ops.tld`, `zenon.ops.tld`, ...

* app: `apps/project`
* env:

  * `PUBLIC_API_BASE=https://api.ops.tld`
  * `PUBLIC_PROJECT_ID=pumo` (lub zenon/blogops)

### Deploy 3: `index.ai-domena.tld`

* app: `apps/magnet`

---

## 7) Co jest “must have” w API, żeby ten szablon ożył

Minimalnie:

* `GET /v1/projects`
* `GET /v1/status/global`
* `GET /v1/status/project/:id`
* (potem) `GET /v1/me` żeby UI znał user/role bez placeholderów

I pamiętaj: **Access wpuszcza do stron**, ale **API nadal robi RBAC + audit**.

---

Jeśli chcesz, w kolejnym kroku dopnę to do Twojego obecnego stylu (z załączników) jeszcze bliżej 1:1 i rozpiszę:

* **dokładną listę modułów** (core + per-projekt),
* format `projects` tak, żeby zawierał też `modules[]`, `services[]`, `links[]`,
* oraz wzorzec “dynamic module loader” (czyli: config decyduje, jakie klocki się renderują).

Powiedz tylko: API chcesz w **Python (FastAPI)** czy **Node**? (Bez filozofii — to wpływa na przykład kontraktu i middleware pod Access.)
