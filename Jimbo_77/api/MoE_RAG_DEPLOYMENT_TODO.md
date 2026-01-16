# MoE-RAG Deployment - Status i TODO

**Data:** 16 stycznia 2026 00:51
**Cel:** Pełny deployment MoE-RAG na api.jimbo77.com

---

## ✅ COMPLETED (Faza 1)

### Backend API

- [x] FastAPI endpoint `/api/moe-rag/health` - działa
- [x] FastAPI endpoint `/api/moe-rag/` (main query) - działa
- [x] FastAPI endpoint `/api/moe-rag/debug` - działa
- [x] Port 3885 (RAG_API_PORT z config/ports.env) - działa
- [x] Embeddings (sentence-transformers) - załadowane (539MB)
- [x] Input validation (SQL/XSS/Prompt injection) - działa
- [x] Routing logic (FAST/EXPERT/HYBRID) - działa
- [x] Semantic search (vectorized indices) - działa

### Cloudflare Infrastructure

- [x] Named Tunnel utworzony: `moe-rag-backend` (ID: e04cbedb-2c71-45cb-b7ce-f62da831c139)
- [x] DNS route: `rag.jimbo77.com` → tunnel
- [x] KV Namespace utworzony: `457240e143234fb5bd66cd799110c2b8`
- [x] Worker deployed: `api.jimbo77.com/api/moe-rag/*`
- [x] Worker config: wrangler.toml z KV + CORS + caching

### Dokumentacja

- [x] LOCAL_DEV.md - instrukcje deweloperskie
- [x] start_local.ps1 - skrypt startowy backend
- [x] start_tunnel.ps1 - skrypt tunelu (quick)
- [x] deploy_full.ps1 - full deployment automation
- [x] moe-rag-tunnel.yml - config named tunnel

---

## 🔧 IN PROGRESS (Faza 2)

### Tunnel Stability

- [ ] **PROBLEM:** Named tunnel `rag.jimbo77.com` - error 1033 (routing conflict)
  - **Przyczyna:** Subdomena może być już przypisana do innego tunelu
  - **Rozwiązanie:** Użyć `cloudflared tunnel route dns` do sprawdzenia/naprawy routingu
  - **Alternatywa:** Użyć innej subdomeny (np. `moerag.jimbo77.com`)

### D1 Database Integration

- [ ] **TODO:** Podłączyć D1 do MoE-RAG API
  - **Binding:** Dodać D1 do wrangler.toml Worker
  - **Schema:** Utworzyć tabele dla:
    - `moe_queries` - historia zapytań
    - `moe_responses` - cache odpowiedzi
    - `moe_metrics` - metryki (latency, cost, routing)
  - **Connection:** FastAPI → Cloudflare D1 via HTTP API lub binding

### AI Models Integration

- [ ] **TODO:** Zintegrować modele AI do generowania odpowiedzi
  - **OpenRouter:** `OPENROUTER_API_KEY` (Qwen 2.5 72B)
  - **DeepSeek:** `DEEPSEEK_API_KEY` (reasoning model)
  - **Fallback:** OpenAI GPT-4 Turbo
  - **Endpoint:** `/api/moe-rag/` powinien używać LLM do syntezy odpowiedzi

---

## 📋 TODO - NEXT STEPS (Faza 3)

### 1. Fix Tunnel Routing (PILNE)

```powershell
# Sprawdź który tunnel obsługuje rag.jimbo77.com
cloudflared tunnel route ip show

# Jeśli konflikt, usuń starą route
cloudflared tunnel route dns --delete rag.jimbo77.com

# Dodaj nową route
cloudflared tunnel route dns moe-rag-backend rag.jimbo77.com

# Restart tunelu
cloudflared tunnel --config moe-rag-tunnel.yml run moe-rag-backend
```

### 2. D1 Database Setup

```bash
# Utwórz D1 database
npx wrangler d1 create moe-rag-db

# Dodaj do wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "moe-rag-db"
database_id = "YOUR_D1_ID"

# Utwórz schema
npx wrangler d1 execute moe-rag-db --file=./schema.sql
```

**Schema (schema.sql):**

```sql
CREATE TABLE moe_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  routing_path TEXT,
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE moe_responses (
  id TEXT PRIMARY KEY,
  query_id TEXT REFERENCES moe_queries(id),
  response TEXT,
  confidence REAL,
  agents_used TEXT,
  cost_usd REAL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE moe_metrics (
  id TEXT PRIMARY KEY,
  date DATE,
  total_queries INTEGER,
  avg_latency_ms REAL,
  total_cost_usd REAL,
  fast_path_count INTEGER,
  expert_path_count INTEGER,
  hybrid_path_count INTEGER
);

CREATE INDEX idx_queries_created ON moe_queries(created_at);
CREATE INDEX idx_queries_user ON moe_queries(user_id);
CREATE INDEX idx_metrics_date ON moe_metrics(date);
```

### 3. AI Models Integration

**Update routes/moe_rag.py:**

```python
from openai import OpenAI

# Initialize clients
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

async def generate_response(query: str, retrieved_docs: list) -> str:
    """Generate response using LLM"""
    context = "\n\n".join([doc.content for doc in retrieved_docs[:5]])

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant..."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
    ]

    response = openrouter_client.chat.completions.create(
        model="qwen/qwen-2.5-72b-instruct",
        messages=messages,
        max_tokens=1000
    )

    return response.choices[0].message.content
```

### 4. Worker Updates dla D1

**Update workers/moe-rag-proxy/src/index.ts:**

```typescript
export interface Env {
  CACHE: KVNamespace;
  DB: D1Database; // NEW
  BACKEND_URL: string;
  CORS_ORIGIN: string;
  CACHE_TTL: string;
}

// Log query to D1
async function logQuery(env: Env, query: string, response: any) {
  const queryId = crypto.randomUUID();

  await env.DB.prepare(
    `
    INSERT INTO moe_queries (id, query, routing_path, latency_ms, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `
  )
    .bind(queryId, query, response.routing_path, response.latency_ms)
    .run();

  await env.DB.prepare(
    `
    INSERT INTO moe_responses (id, query_id, response, confidence, agents_used, cost_usd)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      crypto.randomUUID(),
      queryId,
      response.response,
      response.confidence,
      JSON.stringify(response.agents_used),
      response.cost_usd
    )
    .run();
}
```

### 5. Frontend UI (hub.jimbo77.com)

**OPCJA A:** React component (MoESearch.tsx) - FAILED (build crash)
**OPCJA B:** HTML + vanilla JS - RECOMMENDED

```html
<!-- hub.jimbo77.com/moe-search.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>MoE-RAG Search</title>
    <script>
      async function search() {
        const query = document.getElementById("query").value;
        const response = await fetch("https://api.jimbo77.com/api/moe-rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        document.getElementById("result").textContent = data.response;
      }
    </script>
  </head>
  <body>
    <input id="query" type="text" placeholder="Ask anything..." />
    <button onclick="search()">Search</button>
    <div id="result"></div>
  </body>
</html>
```

### 6. Testing & Validation

```bash
# Test health
curl https://api.jimbo77.com/api/moe-rag/health

# Test query
curl -X POST https://api.jimbo77.com/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{"query":"What is MoE-RAG?"}'

# Test debug
curl -X POST https://api.jimbo77.com/api/moe-rag/debug \
  -H "Content-Type: application/json" \
  -d '{"query":"Test routing"}'

# Monitor tunnel
cloudflared tunnel info moe-rag-backend

# Check D1 data
npx wrangler d1 execute moe-rag-db --command="SELECT COUNT(*) FROM moe_queries"
```

---

## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Production

- [ ] Backend działa stabilnie na localhost:3885
- [ ] Named tunnel działa (bez error 1033)
- [ ] Worker proxy deployowany i testowany
- [ ] D1 database schema utworzona
- [ ] AI models API keys skonfigurowane
- [ ] KV cache działający
- [ ] CORS poprawnie skonfigurowany

### Production

- [ ] DNS propagacja (rag.jimbo77.com → Cloudflare)
- [ ] SSL certyfikat aktywny (auto przez Cloudflare)
- [ ] Health checks passing (api.jimbo77.com/api/moe-rag/health)
- [ ] Rate limiting (Cloudflare Workers)
- [ ] Monitoring (Prometheus/Grafana lub Cloudflare Analytics)
- [ ] Error tracking (Sentry)
- [ ] Cost tracking (OpenRouter dashboard)

### Post-Production

- [ ] Load testing (100 queries/min)
- [ ] Performance optimization (P95 < 2s)
- [ ] Documentation update (PUBLIC API docs)
- [ ] Frontend UI deployment
- [ ] User onboarding (demo queries)

---

## 📊 CURRENT STATUS

**Backend:** ✅ WORKING (localhost:3885)
**Tunnel:** ⚠️ ISSUES (error 1033 routing conflict)
**Worker:** ✅ DEPLOYED (api.jimbo77.com/api/moe-rag/\*)
**D1:** ❌ NOT CONFIGURED
**AI Models:** ❌ NOT INTEGRATED
**Frontend:** ❌ NOT DEPLOYED

---

## 🎯 NEXT IMMEDIATE ACTION

1. **Fix tunnel routing:** Sprawdź i napraw DNS route dla rag.jimbo77.com
2. **D1 setup:** Utwórz database i schema
3. **AI integration:** Dodaj OpenRouter/DeepSeek do response generation
4. **Test end-to-end:** Backend → Tunnel → Worker → Frontend
5. **Monitor & optimize:** Tracking metrics, latency, cost

---

## 📝 NOTES

- **Tunnel stability:** Named tunnels są stabilniejsze niż quick tunnels, ale wymagają poprawnej konfiguracji DNS
- **D1 limits:** Free tier = 5M rows/day (wystarczy na start)
- **OpenRouter cost:** Qwen 2.5 72B = $0.35/1M tokens (bardzo tanie)
- **Worker limits:** 100k requests/day free tier
- **Cache strategy:** KV cache = 5 min TTL (można zwiększyć do 1h)

---

**Ostatnia aktualizacja:** 2026-01-16 00:51
**Status:** Phase 1 COMPLETE, Phase 2 IN PROGRESS
**Next Review:** Po naprawie tunnel + D1 + AI integration
