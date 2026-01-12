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

## Documentation

- [Frontend README](frontend/README.md) - TODO
- [API README](api/README.md) - TODO
- [Cloudflare Pages Deployment](infra/cloudflare/pages-deployment.md)
- [Cloudflare Access Setup](infra/cloudflare/access-setup.md)
