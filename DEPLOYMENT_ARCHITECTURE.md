# 🚀 JIMBO77 Deployment Architecture - Complete System

**Data**: 19 stycznia 2026  
**Status**: Production Deployment Plan

---

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    JIMBO77 ECOSYSTEM                             │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ jimbo77.com │    │ jimbo77.org  │    │ zenbrowsers  │       │
│  │  Dashboard  │◄──►│  AI Magnet   │◄──►│    .org      │       │
│  └─────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         └───────────┬───────┴────────────────────┘               │
│                     ▼                                            │
│          ┌─────────────────────┐                                │
│          │  Cloudflare Workers  │                                │
│          │  - orchestrator (20) │                                │
│          │  - agent-zero-bridge │                                │
│          │  - zeno-browser-brdg │                                │
│          │  - sitemap-generator │                                │
│          │  - api-docs-aggr     │                                │
│          └─────────────────────┘                                │
│                     │                                            │
│         ┌───────────┴───────────┐                                │
│         ▼                       ▼                                │
│   ┌───────────┐         ┌──────────────┐                        │
│   │ 18 Python │         │ Special      │                        │
│   │ Agents    │         │ Agents (2)   │                        │
│   │ (Docker)  │         │ - Agent Zero │                        │
│   └───────────┘         │ - ZENO       │                        │
│                         └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 Domains & Hosting

### **jimbo77.com** - Control Hub (Dashboard)

```yaml
Hosting: Cloudflare Pages
Repository: JIMBO_devz_inc_HUB/jimbo-net-control
Build Command: npm run build
Output Directory: dist
Framework: React + Vite
Port (Dev): 4780
```

**Features:**

- 🎯 Task Orchestration Panel
- 🌐 ZENO Browser Integration
- 🤖 Agent Zero Direct Control
- 📊 Multi-Agent Monitoring
- 🔍 System Health Dashboard

**URLs:**

- Production: https://jimbo77.com
- Pages Dev: https://jimbo-net-control.pages.dev
- Local Dev: http://localhost:4780

---

### **jimbo77.org** - AI Magnet (Public Catalog)

```yaml
Hosting: Cloudflare Pages
Type: Static Site
Generator: Astro 5.x
Build: npm run build
Output: dist/
```

**Structure:**

```
jimbo77.org/
├── /                        → Landing page
├── /llms.txt                → AI crawler manifest (MAIN)
├── /robots.txt              → AI-friendly crawl rules
├── /sitemap.xml             → Auto-generated unified sitemap
├── /projects/               → 11 project showcase pages
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
│   └── agent-zero/
├── /docs/api/               → API Documentation Aggregator
├── /.well-known/
│   ├── ai-plugin.json       → OpenAI plugin manifest
│   └── manifest.json        → PWA manifest
└── /schemas/                → Schema.org markup examples
```

**URLs:**

- Production: https://jimbo77.org
- Pages Dev: https://jimbo-ai-magnet.pages.dev

---

### **zenbrowsers.org** - ZENO_WEB_CORE_APP

```yaml
Hosting: Cloudflare Pages
Repository: zen-bro-wser.org
Framework: Astro + React
MCP Tools: 6 (web_navigation, content_analysis, etc.)
Status: ✅ Already Deployed
```

**URLs:**

- Production: https://zenbrowsers.org
- MCP Bridge: https://zeno-browser-bridge.stolarnia-ams.workers.dev

---

## ⚙️ Cloudflare Workers

### **1. agents-orchestrator**

```yaml
Name: jimbo77-agents-orchestrator
URL: https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev
Version: PENDING (20 agents upgrade)
Path: workers/agents-orchestrator/

Agents: 20
- 18 Python Agents (Research, Code Gen, SEO, etc.)
- Agent Zero (Code execution, terminal, file ops)
- ZENO Browser (Web navigation, search, analysis)

Model: deepseek/deepseek-r1 via OpenRouter

Endpoints:
- POST /orchestrate     → Multi-agent task delegation
- GET  /health          → System status + agents list
- GET  /task/{id}       → Task execution status

Environment Variables:
- OPENROUTER_API_KEY
- DEEPSEEK_API_KEY
- AGENTS_API_BASE
- AGENT_STATE (KV Namespace)
```

**Dependencies:**

- → agent-zero-bridge (Special Agent #19)
- → zeno-browser-bridge (Special Agent #20)
- → 18 Python agents (via AGENTS_API_BASE)

---

### **2. agent-zero-bridge**

```yaml
Name: agent-zero-bridge
URL: https://agent-zero-bridge.stolarnia-ams.workers.dev
Version: ✅ 4e96c784 (Deployed 19 Jan 2026)
Path: workers/agent-zero-bridge/

Capabilities:
  - code_execution
  - terminal
  - file_ops
  - web_search

Endpoints:
  - POST /message         → Send task to Agent Zero
  - GET  /health          → Health check

Environment Variables:
  - AGENT_ZERO_URL
  - AGENT_ZERO_API_KEY
```

**Dependencies:**

- → Agent Zero Docker container (internal)
- ← agents-orchestrator (calls this worker)

---

### **3. zeno-browser-bridge**

```yaml
Name: zeno-browser-bridge
URL: https://zeno-browser-bridge.stolarnia-ams.workers.dev
Version: ✅ a2352d41 (Deployed 19 Jan 2026)
Path: workers/zeno-browser-bridge/

MCP Tools: 6
- web_navigation
- content_analysis
- web_search
- bookmark_manager
- page_summarizer
- link_extractor

Endpoints:
- POST /execute         → Execute ZENO tool
- GET  /tools           → List all 6 tools
- GET  /health          → Health check

Environment Variables:
- ZENO_BROWSER_URL
- ZENO_API_URL
```

**Dependencies:**

- → ZENO_WEB_CORE_APP (zenbrowsers.org)
- ← agents-orchestrator (calls this worker)
- ← jimbo-net-control (direct UI integration)

---

### **4. sitemap-generator** ❌ NOT DEPLOYED

```yaml
Name: sitemap-generator
URL: TBD
Path: workers/sitemap-generator/

Purpose: Auto-generate unified sitemap for jimbo77.org
Features:
  - Crawl all 11 projects
  - Aggregate sitemaps
  - Priority + changefreq calculation
  - XML sitemap output

Endpoints:
  - GET  /sitemap.xml     → Full sitemap
  - POST /regenerate      → Trigger rebuild
  - GET  /stats           → Sitemap statistics
```

**Dependencies:**

- → jimbo77.org (serves generated sitemap)
- → All 11 project URLs (crawls for links)

---

### **5. api-docs-aggregator** ❌ NOT DEPLOYED

```yaml
Name: api-docs-aggregator
URL: TBD
Path: workers/api-docs-aggregator/

Purpose: Unified API documentation hub
Features:
  - Aggregate OpenAPI specs from all projects
  - Generate interactive docs
  - Search across all APIs
  - Authentication docs

Endpoints:
  - GET  /docs            → API docs landing
  - GET  /docs/{project}  → Project-specific docs
  - GET  /search?q={}     → Search API endpoints
```

**Dependencies:**

- → jimbo77.org/docs/api/ (serves aggregated docs)
- → OpenAPI specs from all projects

---

## 🔗 Cross-Domain Communication

### **API Endpoints Map**

```yaml
jimbo77.com → Orchestrator:
  URL: https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev
  Endpoints:
    - POST /orchestrate (task submission)
    - GET  /health (system status)

jimbo77.com → Agent Zero:
  URL: https://agent-zero-bridge.stolarnia-ams.workers.dev
  Endpoints:
    - POST /message (direct commands)

jimbo77.com → ZENO Browser:
  URL: https://zeno-browser-bridge.stolarnia-ams.workers.dev
  Endpoints:
    - POST /execute (MCP tool execution)
    - GET  /tools (tool discovery)

Orchestrator → Agent Zero:
  URL: https://agent-zero-bridge.stolarnia-ams.workers.dev
  Method: POST /message

Orchestrator → ZENO Browser:
  URL: https://zeno-browser-bridge.stolarnia-ams.workers.dev
  Method: POST /execute

Orchestrator → Python Agents:
  URL: ${AGENTS_API_BASE} (ngrok tunnel)
  Method: POST /execute/{agent_id}
```

### **CORS Configuration**

All workers must include:

```typescript
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

**Allowed Origins:**

- https://jimbo77.com
- https://jimbo77.org
- https://zenbrowsers.org
- http://localhost:4780 (dev)

---

## 🔐 Environment Variables

### **jimbo-net-control (.env.local)**

```bash
VITE_ORCHESTRATOR_API=https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev
VITE_AGENT_ZERO_BRIDGE=https://agent-zero-bridge.stolarnia-ams.workers.dev
VITE_ZENO_BRIDGE=https://zeno-browser-bridge.stolarnia-ams.workers.dev
```

### **agents-orchestrator (Secrets)**

```bash
# Required
OPENROUTER_API_KEY=<your_key>
DEEPSEEK_API_KEY=<your_key>
AGENTS_API_BASE=https://your-ngrok-url.ngrok-free.app

# Optional
NGROK_PROXY_URL=<ngrok_url>
JIMBO_API_KEY=<auth_key>
```

### **agent-zero-bridge (Secrets)**

```bash
AGENT_ZERO_URL=http://internal-agent-zero:5000
AGENT_ZERO_API_KEY=<auth_key>
```

### **zeno-browser-bridge (Secrets)**

```bash
ZENO_BROWSER_URL=https://zenbrowsers.org
ZENO_API_URL=https://zenbrowsers.org/api
```

---

## 📋 Deployment Checklist

### **Phase 1: Workers** ✅ PARTIAL

- [x] agent-zero-bridge (4e96c784)
- [x] zeno-browser-bridge (a2352d41)
- [ ] agents-orchestrator (PENDING - 20 agents)
- [ ] sitemap-generator (NOT DEPLOYED)
- [ ] api-docs-aggregator (NOT DEPLOYED)

### **Phase 2: jimbo77.org** ❌ NOT STARTED

- [ ] Create Astro project structure
- [ ] Generate llms.txt manifest
- [ ] Create 11 project showcase pages
- [ ] Setup auto sitemap generation
- [ ] Deploy to Cloudflare Pages
- [ ] Configure custom domain

### **Phase 3: jimbo77.com** ❌ NOT STARTED

- [ ] Build jimbo-net-control (React app)
- [ ] Update .env with production URLs
- [ ] Test all Worker integrations
- [ ] Deploy to Cloudflare Pages
- [ ] Configure custom domain

### **Phase 4: Testing** ❌ NOT STARTED

- [ ] Test orchestrator → 20 agents routing
- [ ] Verify ZENO Browser MCP tools
- [ ] Test Agent Zero commands
- [ ] Validate cross-domain CORS
- [ ] End-to-end task execution
- [ ] Load testing

---

## 🚀 Deployment Commands

### **Deploy Workers**

```bash
# agents-orchestrator
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\agents-orchestrator
npx wrangler deploy

# sitemap-generator
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\sitemap-generator
npx wrangler deploy

# api-docs-aggregator
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\api-docs-aggregator
npx wrangler deploy
```

### **Deploy jimbo77.org**

```bash
# TBD - Create Astro project first
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\jimbo-ai-magnet
npm run build
npx wrangler pages deploy dist --project-name jimbo-ai-magnet
```

### **Deploy jimbo77.com**

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\jimbo-net-control
npm run build
npx wrangler pages deploy dist --project-name jimbo-net-control
```

---

## 🎯 Priority Actions

### **CRITICAL (DO NOW)**

1. ✅ Deploy agents-orchestrator (upgrade to 20 agents)
2. ✅ Deploy sitemap-generator
3. ✅ Deploy api-docs-aggregator

### **HIGH (DO NEXT)**

4. Create jimbo77.org structure (Astro)
5. Generate llms.txt + 11 project pages
6. Build & deploy jimbo77.com (jimbo-net-control)

### **MEDIUM (DO LATER)**

7. Test end-to-end workflows
8. Setup monitoring & alerts
9. Documentation updates

---

## 📊 System Dependencies Graph

```
                  ┌─────────────┐
                  │  User UI    │
                  │ jimbo77.com │
                  └──────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────┐  ┌────────────────┐  ┌─────────┐
│Agent Zero  │  │ Orchestrator   │  │  ZENO   │
│  Bridge    │  │  (20 agents)   │  │ Bridge  │
└──────┬─────┘  └───────┬────────┘  └────┬────┘
       │                │                 │
       ▼                ▼                 ▼
┌──────────┐   ┌─────────────┐   ┌───────────┐
│ Agent    │   │ 18 Python   │   │   ZENO    │
│  Zero    │   │   Agents    │   │  Browser  │
│ Docker   │   │  (Docker)   │   │ (Pages)   │
└──────────┘   └─────────────┘   └───────────┘
```

**Critical Path:**

1. User submits task → jimbo77.com
2. jimbo77.com → agents-orchestrator (POST /orchestrate)
3. orchestrator analyzes with DeepSeek R1
4. orchestrator delegates to:
   - Agent Zero (code/terminal)
   - ZENO Browser (web tasks)
   - Python Agents (specialized)
5. Results → orchestrator → jimbo77.com UI

---

## ✅ Success Metrics

- [x] 3/5 Workers deployed (60%)
- [ ] jimbo77.org deployed (0%)
- [ ] jimbo77.com deployed (0%)
- [ ] End-to-end test passing (0%)
- [ ] All 20 agents responding (PENDING)

**Target:** 100% deployment by end of session

---

**Last Updated:** 19 stycznia 2026, 21:00  
**Next Action:** Deploy agents-orchestrator + missing workers
