# JIMBO77 DEVZ Inc HUB

**Centralny system sterowania projektami AI i e-commerce**

## 🎯 Status Integracji

- ✅ **AI Magnet Strategy** (Phase 1) - ACTIVE na jimbo77.org
- ✅ **Agents Orchestrator** - 19 agentów (18 Python + Agent Zero)
- ✅ **Agent Zero Integration** - Code execution via Cloudflare Tunnel
- ✅ **Supabase Database** - 2 tabele, 4 Edge Functions
- ✅ **Control Hub** - ACTIVE na jimbo77.com
- 🔄 **API Gateway** - FastAPI na port 3885

## Architektura

System składa się z dwóch domen:

### AI Magnet Domain (jimbo77.org) - Public Catalog ✅

```
jimbo77.org
├── /llms.txt                    → AI crawler index
├── /projects/{name}/            → 11 project pages
│   ├── pumo-rag/
│   ├── zenon-promptmaster/
│   ├── cayden-deepsearch/
│   ├── blogops/
│   ├── my-bonzo-ai-blog/
│   ├── zen-bro-wser/
│   ├── jimbo-agents/
│   ├── luc-de-zen-on/
│   ├── ngrok-ai-gateway/
│   ├── cloudflare-workers/
│   └── agent-zero/              → ⚡ NEW - Code execution agent
├── /sitemap.xml                 → Unified sitemap
├── /robots.txt                  → AI-friendly crawl rules
├── /docs/api/                   → API Documentation Aggregator
├── /.well-known/ai-plugin.json  → OpenAI plugin manifest
└── /.well-known/manifest.json   → PWA manifest
```

**Status**: DEPLOYED & VERIFIED (19 Jan 2026)

### Control Hub (jimbo77.com) - Dashboard ✅

```
jimbo77.com → Master Control Dashboard
├── Projekt Overview
├── Agents Status Monitor (19 agents)
├── Deployment Tools
└── Analytics & Logs
```

**Status**: DEPLOYED (rebuilt 19 Jan 2026)

## Struktura Projektu

```
JIMBO_devz_inc_HUB/
├── workers/
│   ├── agents-orchestrator/       # Main orchestration worker (19 agents)
│   ├── agent-zero-bridge/         # ⚡ NEW - Agent Zero tunnel bridge
│   ├── sitemap-generator/         # AI Magnet sitemap aggregator
│   ├── api-docs-aggregator/       # API documentation generator
│   └── [10+ more workers]/
├── Jimbo_77/
│   ├── frontend/apps/
│   │   ├── magnet/                # AI Magnet (jimbo77.org)
│   │   └── hub/                   # Control Hub (jimbo77.com)
│   └── api/                       # FastAPI Gateway (port 3885)
├── agents/python/                 # 18 Python AI agents (ports 6030-6109)
├── docs/
│   ├── JIMBO77_ORG_AI_MAGNET_STRATEGY.md
│   ├── AGENT_ZERO_INTEGRATION.md   # ⚡ NEW
│   ├── AGENT_ZERO_TEST_GUIDE.md    # ⚡ NEW
│   └── SUPABASE_INTEGRATION.md
└── config/
    └── docker-compose.yml         # PostgreSQL, Redis, API Gateway
```

## Technologie

- **Frontend**: React + Vite + TypeScript
- **Backend**: FastAPI + Python 3.11+ + Bun (Node.js)
- **Workers**: Cloudflare Workers (TypeScript)
- **Database**: Supabase (PostgreSQL + Edge Functions)
- **Agents**: 18 Python agents + Agent Zero (localhost + Cloudflare Tunnel)
- **AI Models**: DeepSeek R1 (via OpenRouter), Claude 3.5 Sonnet
- **Deployment**: Cloudflare Pages + Workers
- **Style**: Dark theme with glassmorphism

## 🚀 Agent Zero Integration

**Agent Zero** (#19) to najbardziej zaawansowany agent z pełnym dostępem do:

- ✅ **Code Execution** - Python, JavaScript, bash
- ✅ **Terminal Access** - Pełny dostęp do systemu
- ✅ **File Operations** - CRUD na plikach
- ✅ **Web Search** - Real-time wyszukiwanie
- ✅ **Conversation Continuity** - Konteksty 24h+

### Architecture

```
User → Orchestrator → Agent Zero Bridge → Cloudflare Tunnel → Agent Zero (localhost:50100)
```

**Endpoints**:

- Orchestrator: https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev
- Bridge: https://agent-zero-bridge.stolarnia-ams.workers.dev
- Tunnel: https://boxing-operator-smithsonian-rocks.trycloudflare.com
- Local: http://localhost:50100

**Dokumentacja**: [docs/AGENT_ZERO_INTEGRATION.md](docs/AGENT_ZERO_INTEGRATION.md)

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
