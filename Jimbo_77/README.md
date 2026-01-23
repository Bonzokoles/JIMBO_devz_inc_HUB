# JIMBO77 Control Hub - Quick Start

## Project Structure

```
gp4-project/
├── frontend/           # React+Vite monorepo
│   ├── apps/
│   │   ├── hub/       # Master HUB (hub.ops.jimbo77.org)
│   │   └── project/   # Project template (pumo/zenon/blogops.ops.jimbo77.org)
│   └── packages/
│       ├── ui/        # Shared UI components (AppShell, Topbar, ops.css)
│       └── core/      # API client, types, RBAC
├── api/               # FastAPI backend
│   └── app/
│       ├── models.py  # SQLAlchemy models (Command, CommandEvent)
│       ├── schemas.py # Pydantic schemas
│       ├── db.py      # Database connection
│       └── routes/    # API routes (commands, audit)
└── infra/
    └── cloudflare/    # Deployment guides
```

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Python 3.11+
- PostgreSQL 14+ (for API)

### Frontend Setup

```bash
cd gp4-project/frontend

# Install dependencies
pnpm install

# Run Hub app (localhost:5173)
pnpm dev:hub

# Run Project app (localhost:5174)
pnpm dev:project
```

**Environment Variables** (create `.env.local` in each app):

`apps/hub/.env.local`:

```env
VITE_API_BASE=http://localhost:8000
VITE_ENV=dev
```

`apps/project/.env.local`:

```env
VITE_API_BASE=http://localhost:8000
VITE_ENV=dev
VITE_PROJECT_ID=pumo
```

---

### Backend Setup

```bash
cd gp4-project/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb ops  # PostgreSQL
# Run migrations (TODO: add alembic)

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Run API server
uvicorn app.main:app --reload --port 8000
```

---

## Deployment

### Frontend → Cloudflare Pages

See [infra/cloudflare/pages-deployment.md](infra/cloudflare/pages-deployment.md) for detailed guide.

**Quick summary:**

- Create 4 Pages projects (hub, pumo, zenon, blogops)
- Set build command: `cd gp4-project/frontend && pnpm install && pnpm --filter @apps/{app} build`
- Set output directory: `gp4-project/frontend/apps/{app}/dist`
- Add env vars: `VITE_API_BASE`, `VITE_ENV`, `VITE_PROJECT_ID`

### Backend → VPS or Cloudflare Workers

**Option 1: VPS (Recommended for MVP)**

- Deploy FastAPI to VPS (Hetzner, DigitalOcean, etc.)
- Use Cloudflare Tunnel to expose API at `api.ops.jimbo77.org`

**Option 2: Cloudflare Workers (Advanced)**

- Convert FastAPI to Workers Python (experimental)

---

## Security

### Cloudflare Access

See [infra/cloudflare/access-setup.md](infra/cloudflare/access-setup.md) for detailed guide.

**Quick summary:**

- Create Access Application for `*.ops.jimbo77.org`
- Enable 2FA (One-time PIN)
- Configure JWT verification in API
- Set RBAC roles via env vars

---

## Architecture

### Domains

- **jimbo77.org (OPS)**: Private control center (Cloudflare Access protected)
  - `hub.ops.jimbo77.org` - Master HUB
  - `api.ops.jimbo77.org` - Central API
  - `pumo.ops.jimbo77.org` - PUMO dashboard
  - `zenon.ops.jimbo77.org` - ZENON dashboard
  - `blogops.ops.jimbo77.org` - BLOGOPS dashboard

- **jimbo77.com (Public)**: AI Magnet (crawler-friendly, no sensitive data)
  - `magnets.jimbo77.com` - Project catalog

### Tech Stack

**Frontend:**

- React 18 + Vite
- TypeScript
- CSS Modules (autentyczny styl JIMBO77)
- pnpm workspaces (monorepo)

**Backend:**

- FastAPI (Python 3.11+)
- SQLAlchemy async
- PostgreSQL
- Cloudflare Access JWT verification

---

## Next Steps

1. **Complete API implementation**:
   - Add `main.py` with CORS, JWT middleware
   - Add security modules (cf_access.py, rbac.py)
   - Add remaining routes (projects, status, me, commands POST)

2. **Add CommandDrawer component** (frontend):
   - Polling for command status
   - Display events timeline

3. **Setup Cloudflare**:
   - Deploy frontend to Pages
   - Configure Access policies
   - Deploy API to VPS + Tunnel

4. **Database migrations**:
   - Add Alembic for schema management

5. **Worker integration**:
   - Command execution worker
   - Event logging

---

## 🎉 FAZA 1 - Infrastructure Backend (COMPLETE - 23.01.2026)

### Status: ✅ 100% COMPLETE (All 5 Tasks)

**Backend API**: Running on port 8001 (PID monitoring: `Get-Process python | Where-Object CommandLine -like "*run.py*"`)

#### ✅ Task 1.1: Backend API Setup

- Port: 8001 (configured in `.env` with `API_PORT=8001`)
- Auto-reload: Enabled (`reload=True` in `run.py`)
- Health endpoints: `/health` and `/v1/analytics/health`
- 85+ routes loaded successfully

#### ✅ Task 1.2: IdoSell Exports Verification

- Sample data created: `exports/analytics_20260122_212328.json`
- Business overview working: 35,482 PLN revenue, 10 orders, 10 customers
- Endpoint tested: `/v1/analytics/business-overview`

#### ✅ Task 1.3: CORS + Environment Configuration

- CORS origins: Explicit list (localhost:3002, localhost:3880, localhost:5173, Cloudflare Pages, jimbo77.com)
- `.env` variables added:
  - `API_PORT=8001`
  - `DATABASE_URL=postgresql://bonzo:bonzo_dev_2026@localhost:5432/bonzo_main`
  - `REDIS_URL=redis://localhost:6379/0`
  - `EXPORTS_DIR=u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports`
- `run.py` loads `.env` with `python-dotenv`

#### ✅ Task 1.4: Remove Fake Data from Frontend

- File: `frontend/apps/pumo-frontend-legacy/src/api.ts`
- Removed fallback data from 4 methods:
  - `getKPIs()` → uses `/v1/analytics/business-overview`
  - `getRevenueTrend()` → uses `/v1/analytics/revenue-trend?days=N`
  - `getTrafficSources()` → uses `/v1/analytics/order-sources`
  - `getTopProducts()` → uses `/v1/analytics/top-products?limit=N`

#### ✅ Task 1.5: Health Check Endpoint Verification

- `/health` returns `{"status": "ok"}`
- `/v1/analytics/health` returns `{"status": "healthy", "analytics_files_available": 4, ...}`
- Backend confirmed running in background

### Important Notes

**Backend Process Management:**

- Backend runs in background (hidden window) after `Start-Process python -ArgumentList "run.py" -WindowStyle Hidden`
- VS Code terminal shows "Exit Code 1" but process continues running
- To verify: `Get-Process python | Where-Object { (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*run.py*" }`
- To check port: `netstat -ano | Select-String ":8001" | Select-String "LISTENING"`

**Next Steps:**

- FAZA 2: AI Agents Implementation (Tasks 2.1-2.4)
- FAZA 3-4: Claude (Buying Guides + Real-time Data)
- FAZA 5: DeepSeek (Deployment + Testing)

---

## Documentation

- [Frontend README](frontend/README.md) - TODO
- [API README](api/README.md) - TODO
- [Cloudflare Pages Deployment](infra/cloudflare/pages-deployment.md)
- [Cloudflare Access Setup](infra/cloudflare/access-setup.md)
