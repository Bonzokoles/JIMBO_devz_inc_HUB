# CLAUDE.md – JIMBO DevZ Inc. Hub

## 🎯 Project Overview

**Name:** JIMBO DevZ Inc. Hub  
**Owner:** JIMBO DevZ Inc. / Bonzokoles  
**Stack:** Cloudflare Workers, FastAPI, React, TypeScript, Python  
**Status:** PRODUCTION

---

## 🧠 Context (Agent Must Read First)

### Architecture Principles

- **Cloudflare-first** - Workers, Vectorize, KV, R2, Workers AI
- **Dual-domain strategy** - jimbo77.com (control hub), jimbo77.org (AI magnet)
- **Microservices** - Each worker is isolated, stateless
- **AI orchestration** - 18 agents coordinated by orchestrator
- **Production-ready** - No TODOs in deployed code

### Key Constraints

- **Workers runtime** - No Node.js APIs (use Cloudflare APIs)
- **KV limitations** - 1 MB value size, eventual consistency
- **Vectorize** - Max 100K vectors per index, cosine/euclidean only
- **Workers AI** - Usage charges apply even in local dev
- **Secrets** - Never hardcode, use `wrangler secret put`

### Tech Decisions

- **Workers over Lambda** - Edge deployment, 0ms cold starts
- **Vectorize over Pinecone** - Native integration, no API keys
- **OpenRouter over direct OpenAI** - 200+ models, unified API
- **KV over Redis** - Edge-native, no infrastructure
- **DeepSeek R1** - Best reasoning model for agents

---

## 📁 Project Structure

```
JIMBO_devz_inc_HUB/
├── .workspace_meta/          # THIS - Project context
├── workers/
│   ├── pumo-rag/            # PUMO RAG System (COMPLETE ✅)
│   └── agents-orchestrator/ # 18 AI agents coordinator
├── Jimbo_77/
│   ├── api/                 # FastAPI alternative (port 3885)
│   └── frontend/            # React dashboard (port 5173)
├── DOCUMentacja/
│   ├── pumo_extracted/      # Old PUMO dashboard archive
│   └── RAPORT_ANALIZY_PROJEKTU.md
└── PUMO_RAG_INTEGRATION_ARCHITECTURE.md  # Main spec
```

---

## 🔧 Active Projects

### 1. PUMO RAG Worker (Week 1 COMPLETE ✅)

**Location:** `workers/pumo-rag/`  
**Status:** Deployed to https://pumo-rag.stolarnia-ams.workers.dev  
**Commit:** `e6a6035`

**Resources:**

- Vectorize: `pumo-products` (1536 dim, cosine)
- KV LOGS: `41d03720f6cc4385b8e37cb2dca77861`
- KV CACHE: `959e9d4588d744f89dc833b7a94ca1d3`

**Stack:**

- Embeddings: `@cf/baai/bge-small-en-v1.5`
- LLM: DeepSeek R1 (OpenRouter) → Llama 3.3 70B (Workers AI fallback)
- Cache: KV (5 min TTL)
- Logs: KV (30 days retention)

**Endpoints:**

```
POST /api/chat               # Public (blog widget)
POST /api/search             # Simple search
POST /internal/agent-search  # Agents-orchestrator (auth)
GET  /health
GET  /api/stats              # TODO
```

**Week 2 Tasks:**

- [ ] Blog integration (my-bonzo-ai-blog)
- [ ] llms.txt generation
- [ ] Chat widget component
- [ ] dla-agentow API docs page

---

### 2. Agents Orchestrator

**Location:** `workers/agents-orchestrator/`  
**URL:** https://orchestrator.jimbo77.com  
**Purpose:** Coordinates 18 AI agents using DeepSeek R1

**KV Bindings:**

- `AGENT_STATE` - Task persistence
- Routes: Priority 1 → 2 → 3 execution

**Week 3 Integration:**

- [ ] Add `pumo-search` tool
- [ ] Connect to `/internal/agent-search`
- [ ] Log source (agent vs blog)

---

## 📋 Definition of Done

1. ✅ `npx wrangler deploy` succeeds
2. ✅ All secrets configured (`wrangler secret list`)
3. ✅ Health check returns 200
4. ✅ Updated this CLAUDE.md with changes
5. ✅ Created snapshot in `.workspace_meta/notes/snapshots/`
6. ✅ No hardcoded secrets in code
7. ✅ Commit message follows `[type] description` format

---

## 🚨 Agent Red Lines

- ❌ Don't use Node.js APIs in Workers (no fs, path, etc.)
- ❌ Don't exceed KV 1MB value limit
- ❌ Don't forget CORS headers in responses
- ❌ Don't commit wrangler.toml with real namespace IDs (use placeholders)
- ❌ Don't skip type casting for Workers AI responses
- ❌ Don't use `npm` - use `npx wrangler` or `bun`

---

## 🔗 Related Documents

- `.workspace_meta/notes/architecture.md` - Detailed system design
- `PUMO_RAG_INTEGRATION_ARCHITECTURE.md` - 4-week implementation plan
- `DOCUMentacja/RAPORT_ANALIZY_PROJEKTU.md` - Project analysis
- Parent workspace: `U:/The_yellow_hub/.workspace_meta/CLAUDE.md`
