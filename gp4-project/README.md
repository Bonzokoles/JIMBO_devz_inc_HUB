# GP4 Project - JIMBO77 Control Hub

**Centralny system sterowania projektami AI i e-commerce**

Projekt bazuje na dokumentacji GP4 (step_1 do step_5) znajdującej się w `DOCUMentacja/gp4/`.

## Architektura

System wykorzystuje **podział na dwie domeny**:

### 🔒 OPS Domain (jimbo77.org) - Private Control Center

Chronione przez **Cloudflare Access** (2FA + JWT):

```
hub.ops.tld         → Master Control HUB (Astro)
api.ops.tld         → Central API (FastAPI)
pumo.ops.tld        → Dashboard PUMO (Astro)
zenon.ops.tld       → Dashboard ZENON (Astro)
blogops.ops.tld     → Dashboard BLOGOPS (Astro)
```

### 🌐 AI Magnet Domain (jimbo77.com) - Public Catalog

Indeksowalne dla AI crawlerów:

```
magnets.jimbo77.com → Katalog projektów + dokumentacja high-level
```

## Struktura Projektu

```
gp4-project/
├── apps/
│   ├── hub/                    # Master HUB (hub.ops.tld)
│   │   └── src/pages/
│   ├── project/                # Template dla subdomen projektów
│   │   └── src/pages/          # (pumo/zenon/blogops.ops.tld)
│   └── magnet/                 # AI Magnet (magnets.jimbo77.com)
│       └── src/pages/
│
├── packages/
│   ├── ui/                     # Wspólny layout + neon-dark theme
│   │   ├── src/styles/         # ops.css
│   │   ├── src/components/     # Topbar, Sidebar, Cards
│   │   └── src/layouts/        # AppShell
│   └── core/                   # API client + RBAC
│       └── src/                # api.ts, rbac.ts
│
├── api/                        # FastAPI Central API
│   ├── app/
│   │   ├── main.py             # FastAPI app + CORS
│   │   ├── settings.py         # Pydantic settings
│   │   ├── security/
│   │   │   ├── cf_access.py    # Cloudflare Access JWT verification
│   │   │   └── rbac.py         # Role-based access control
│   │   ├── routes/
│   │   │   ├── projects.py     # GET /v1/projects
│   │   │   ├── status.py       # GET /v1/status/*
│   │   │   ├── me.py           # GET /v1/me
│   │   │   ├── audit.py        # GET /v1/audit
│   │   │   └── commands.py     # POST /v1/commands
│   │   └── storage/
│   │       ├── project_store.py
│   │       └── audit_store.py
│   └── pyproject.toml
│
├── infra/
│   └── cloudflare/             # CF Access config + docs
│
└── docs/
    └── architecture.md         # Szczegółowa dokumentacja
```

## Technologie

- **Frontend**: Astro + TypeScript
- **Backend**: FastAPI + Python 3.11+
- **Auth**: Cloudflare Access (JWT + RBAC)
- **Deployment**: Cloudflare Pages + Workers
- **Style**: Neon-dark terminal theme (cyberpunk aesthetic)

## Kluczowe Koncepcje

### 1. Wspólny Layout (UI Package)

Wszystkie aplikacje (Hub + Project dashboards) używają **tego samego layoutu**:
- **Topbar**: brand, env, user, role, global status
- **Sidebar**: projekty + nawigacja
- **Content**: moduły dynamiczne
- **Footer**: build info, uptime

### 2. RBAC (Role-Based Access Control)

Role:
- `owner` - pełny dostęp
- `admin` - większość operacji
- `dev` - restart/deploy w swoim projekcie
- `viewer` - tylko odczyt

Permissions:
- `status.read`, `logs.read`
- `service.restart`, `deploy.run`
- `project.configure`

### 3. Cloudflare Access Integration

API weryfikuje JWT z nagłówka `Cf-Access-Jwt-Assertion`:
- Pobiera JWKS (klucze publiczne)
- Weryfikuje podpis i claimy
- Mapuje email → role
- Loguje wszystkie akcje (audit)

### 4. Moduły Dynamiczne

Projekty definiują swoje moduły w configu:

```json
{
  "id": "pumo",
  "modules": ["overview", "services", "deploy", "logs", "alerts"]
}
```

Dashboard renderuje tylko włączone moduły.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Git

### Setup (po implementacji)

1. **Clone repository**:
```bash
git clone https://github.com/Bonzokoles/JIMBO_devz_inc_HUB.git
cd JIMBO_devz_inc_HUB/gp4-project
```

2. **Install dependencies**:
```bash
# UI Package
cd packages/ui && npm install

# Core Package
cd ../core && npm install

# Hub App
cd ../../apps/hub && npm install

# API
cd ../../api && pip install -e .
```

3. **Configure Cloudflare Access**:
```bash
# Edytuj api/.env
CF_JWKS_URL=https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
CF_AUDIENCE=<AUD_FROM_ACCESS_APP>
CF_ISSUER=https://<team>.cloudflareaccess.com
OWNERS=your@email.com
```

4. **Run development**:
```bash
# Terminal 1: API
cd api
uvicorn app.main:app --reload

# Terminal 2: Hub
cd apps/hub
npm run dev
```

## Dokumentacja

- [Implementation Plan](../../.gemini/antigravity/brain/.../implementation_plan.md) - Plan implementacji
- [GP4 Steps](../DOCUMentacja/gp4/) - Dokumentacja planowania (step_1 do step_5)
- Architecture (TODO) - Szczegółowa architektura systemu
- Cloudflare Setup (TODO) - Konfiguracja CF Access

## Status

🚧 **W BUDOWIE** - Struktura katalogów utworzona, implementacja w toku

## Next Steps

1. ✅ Utworzenie struktury katalogów
2. ⏳ Implementacja UI Package (layout + theme)
3. ⏳ Implementacja Core Package (API client + RBAC)
4. ⏳ Implementacja Hub App
5. ⏳ Implementacja Project Template
6. ⏳ Implementacja FastAPI backend
7. ⏳ Konfiguracja Cloudflare Access
8. ⏳ Deployment na Cloudflare

---

**JIMBO77 DEVZ Inc** - Advanced AI Systems & E-commerce Operations
