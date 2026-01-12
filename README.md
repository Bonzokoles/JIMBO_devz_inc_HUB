# JIMBO77 DEVZ Inc HUB

**Centralny system sterowania projektami AI i e-commerce**

## Architektura

System składa się z dwóch domen:

### OPS Domain (jimbo77.org) - Private Control Center
```
├── hub.ops.tld         → Master Control HUB
├── api.ops.tld         → Central API (FastAPI)
├── pumo.ops.tld        → Dashboard PUMO
├── zenon.ops.tld       → Dashboard ZENON
└── blogops.ops.tld     → Dashboard BLOGOPS
```

**Security**: Cloudflare Access (2FA + JWT verification)

### AI Magnet Domain (jimbo77.com) - Public Catalog
```
└── magnets.jimbo77.com → Crawler-friendly katalog projektów
```

**Purpose**: Indeksowalne opisy projektów dla AI crawlerów (bez dostępu do OPS)

## Struktura Projektu

```
gp4-project/
├── apps/
│   ├── hub/                # Master HUB (Astro)
│   ├── project/            # Template dla subdomen (Astro)
│   └── magnet/             # AI Magnet (Astro)
├── packages/
│   ├── ui/                 # Wspólny layout + neon-dark theme
│   └── core/               # API client, RBAC, types
├── api/                    # FastAPI Central API
│   ├── app/
│   │   ├── security/       # CF Access JWT + RBAC
│   │   ├── routes/         # Endpoints
│   │   └── storage/        # Data stores
│   └── pyproject.toml
├── infra/
│   └── cloudflare/         # CF Access config
└── docs/
    └── architecture.md
```

## Technologie

- **Frontend**: Astro + TypeScript
- **Backend**: FastAPI + Python 3.11+
- **Auth**: Cloudflare Access (JWT)
- **Deployment**: Cloudflare Pages + Workers
- **Style**: Neon-dark terminal theme

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Setup

1. **Clone repository**:
```bash
git clone https://github.com/Bonzokoles/JIMBO_devz_inc_HUB.git
cd JIMBO_devz_inc_HUB
```

2. **Install dependencies** (po utworzeniu struktury):
```bash
# UI Package
cd gp4-project/packages/ui
npm install

# Core Package
cd ../core
npm install

# Hub App
cd ../../apps/hub
npm install

# API
cd ../../api
pip install -e .
```

3. **Configure environment**:
```bash
# API
cp api/.env.example api/.env
# Edytuj api/.env z CF Access credentials
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

- [Architecture](docs/architecture.md) - Szczegółowa architektura systemu
- [Cloudflare Setup](infra/cloudflare/access-setup.md) - Konfiguracja CF Access
- [GP4 Steps](DOCUMentacja/gp4/) - Dokumentacja planowania (step_1 do step_5)

## Projekty

- **PUMO** - Analytics dla meblepumo.pl
- **ZENON** - Video generation system
- **BLOGOPS** - RAG blog operations

## Security

- Cloudflare Access z 2FA
- JWT verification per request
- RBAC: owner/admin/dev/viewer
- Audit log wszystkich akcji

## Status

🚧 **W BUDOWIE** - Struktura projektu w fazie implementacji

---

**JIMBO77** - Advanced AI Systems & E-commerce Operations
