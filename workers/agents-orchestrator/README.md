# Agents Orchestrator 🎭

**Inteligentny koordynator 18 agentów AI** używający **DeepSeek R1** (lub innych modeli) przez OpenRouter.

## 🧠 Jak to działa?

```
User Query → Orchestrator (AI Analysis) → Agent Execution Plan → Parallel Execution → Results Aggregation → Final Answer
```

### Przykład:
**Query**: *"Zbadaj rynek mebli ogrodowych w Polsce i napisz artykuł SEO o trendach 2026"*

**Orchestrator tworzy plan**:
1. **Priority 1** (równolegle):
   - `market-research-agent`: analiza rynku mebli ogrodowych
   - `research-agent`: trendy 2026 w meblach
   - `seo-agent`: keyword research "meble ogrodowe"

2. **Priority 2**:
   - `writer-agent`: napisz artykuł na podstawie wyników z priority 1
   
3. **Priority 3**:
   - `graphics-agent`: wygeneruj obrazy ilustrujące artykuł
   - `seo-agent`: on-page SEO check

**Result**: Gotowy artykuł + obrazy + raport SEO

---

## 🚀 Setup

### 1. Install Dependencies
```bash
cd workers/agents-orchestrator
npm install
```

### 2. Create KV Namespace
```bash
npx wrangler kv:namespace create AGENT_STATE
# Skopiuj ID i wklej do wrangler.toml
```

### 3. Set Secrets
```bash
# OpenRouter API Key (https://openrouter.ai/keys)
npx wrangler secret put OPENROUTER_API_KEY
# Wklej: sk-or-v1-...

# Backend API URL (gdzie działają agenci)
npx wrangler secret put AGENTS_API_BASE
# Wklej: https://api.jimbo77.com (lub https://jimbo77-api.up.railway.app)

# (Optional) DeepSeek Direct API Key
npx wrangler secret put DEEPSEEK_API_KEY
```

### 4. Deploy
```bash
npm run deploy
```

---

## 📡 API Endpoints

### POST /orchestrate
Główny endpoint - wysyła zapytanie, dostaje odpowiedź.

```bash
curl -X POST https://orchestrator.jimbo77.com/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Zbadaj rynek AI tools i napisz raport",
    "model": "deepseek/deepseek-r1",
    "context": {
      "focus": "SMB market",
      "region": "Poland"
    }
  }'
```

**Response**:
```json
{
  "taskId": "uuid-1234",
  "query": "Zbadaj rynek AI tools i napisz raport",
  "plan": [
    {
      "agentId": "market-research-agent",
      "action": "market-analysis",
      "data": { "industry": "AI tools", "region": "Poland" },
      "priority": 1
    },
    {
      "agentId": "writer-agent",
      "action": "content-creation",
      "data": { "type": "report", "topic": "AI tools market" },
      "priority": 2
    }
  ],
  "results": [
    {
      "agentId": "market-research-agent",
      "success": true,
      "data": { "market_size": "$2.5B", "growth": "45%", ... }
    },
    {
      "agentId": "writer-agent",
      "success": true,
      "data": { "content": "# Raport rynku AI tools...", ... }
    }
  ],
  "answer": "# Comprehensive Market Report\n\nBased on market analysis...",
  "execution_time": 5234,
  "model_used": "deepseek/deepseek-r1"
}
```

### GET /task/{taskId}
Sprawdź status zadania (asynchroniczne).

```bash
curl https://orchestrator.jimbo77.com/task/uuid-1234
```

### GET /health
Health check.

```bash
curl https://orchestrator.jimbo77.com/health
```

---

## 🎯 Przykłady użycia

### 1. Badanie konkurencji + artykuł
```json
{
  "query": "Przeanalizuj 5 największych konkurentów w branży mebli, porównaj oferty i napisz artykuł o różnicach",
  "model": "deepseek/deepseek-r1"
}
```

**Plan AI**:
1. `company-analysis-agent` × 5 (parallel)
2. `seo-agent`: competitor analysis
3. `writer-agent`: comparison article
4. `graphics-agent`: comparison chart

### 2. Kampania marketingowa
```json
{
  "query": "Zaplanuj kampanię marketingową na launch nowego produktu, przygotuj content i grafiki",
  "context": {
    "product": "Eco Furniture Line",
    "budget": "$10k",
    "duration": "3 months"
  }
}
```

**Plan AI**:
1. `planner-agent`: campaign schedule
2. `marketing-maestro`: strategy & channels
3. `writer-agent`: ad copy, blog posts
4. `graphics-agent`: visuals, banners
5. `social-media`: posting schedule

### 3. Raport finansowy + prezentacja
```json
{
  "query": "Przygotuj raport finansowy Q4 2025 z prognozą na 2026 i wygeneruj grafiki do prezentacji",
  "context": {
    "revenue": "$500k",
    "costs": "$320k"
  }
}
```

**Plan AI**:
1. `finance-agent`: analysis, forecasting
2. `data-analyst`: visualization data
3. `graphics-agent`: charts, graphs
4. `writer-agent`: executive summary

### 4. SEO Audit + Content Plan
```json
{
  "query": "Zrób SEO audit strony meblepumo.pl i zaproponuj plan contentowy na 6 miesięcy"
}
```

**Plan AI**:
1. `web-crawler`: crawl website
2. `seo-agent`: SEO audit, keyword research
3. `webmaster`: technical SEO check
4. `planner-agent`: 6-month content calendar
5. `writer-agent`: content briefs

---

## 🤖 Dostępne Modele (OpenRouter)

```javascript
// Reasoning & Planning (najlepsze do orchestration)
"deepseek/deepseek-r1"              // $0.14/M tokens - BEST reasoning
"deepseek/deepseek-chat"            // $0.14/M - fast, cheap
"anthropic/claude-3.5-sonnet"       // $3/M - premium quality

// General Purpose
"openai/gpt-4-turbo"                // $10/M - reliable
"openai/gpt-4o"                     // $2.5/M - fast GPT-4
"google/gemini-pro-1.5"             // $1.25/M - multimodal

// Open Source
"meta-llama/llama-3.1-405b"         // $3/M - most powerful
"meta-llama/llama-3.1-70b-instruct" // $0.35/M - good balance
"mistralai/mixtral-8x22b-instruct"  // $0.65/M - fast

// Specialized
"perplexity/llama-3.1-sonar-large"  // $1/M - with web search
"microsoft/wizardlm-2-8x22b"        // $0.63/M - code & reasoning
```

Zmień model w request:
```json
{
  "query": "...",
  "model": "anthropic/claude-3.5-sonnet"
}
```

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────┐
│  Frontend (Jimbo77 Hub)                 │
│  User sends query                       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Orchestrator Worker (Cloudflare)       │
│  ┌─────────────────────────────────┐   │
│  │ Step 1: AI Analysis (DeepSeek)  │   │
│  │ - Parse query                    │   │
│  │ - Identify needed agents         │   │
│  │ - Create execution plan          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Step 2: Execute Plan             │   │
│  │ - Call agents in priority order  │   │
│  │ - Parallel execution             │   │
│  │ - Collect results                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Step 3: Aggregate (DeepSeek)    │   │
│  │ - Synthesize results             │   │
│  │ - Generate final answer          │   │
│  └─────────────────────────────────┘   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Backend API (Railway/Fly.io)           │
│  ┌───────────────────────────────────┐ │
│  │ 18 Agents (Python/TypeScript)     │ │
│  │ - research-agent                  │ │
│  │ - writer-agent                    │ │
│  │ - seo-agent                       │ │
│  │ - finance-agent                   │ │
│  │ - graphics-agent                  │ │
│  │ - ... (13 more)                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 💰 Cost Estimate

**DeepSeek R1** pricing:
- Input: $0.55 per 1M tokens
- Output: $2.19 per 1M tokens
- Cache hit: $0.14 per 1M tokens

**Przykładowy task**:
- AI Analysis: ~2k tokens → $0.001
- Agent Execution: 0 (agents używają własnych API keys)
- Aggregation: ~3k tokens → $0.007
- **Total**: ~$0.01 per complex query

**1000 queries/month** = ~$10/month 🎉

Compare to Claude 3.5 Sonnet: ~$50/month  
Compare to GPT-4 Turbo: ~$150/month

---

## 🔧 Development

### Local Testing
```bash
npm run dev
# Orchestrator: http://localhost:8787

# Test with curl:
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"query":"Test query"}'
```

### View Logs
```bash
npm run tail
```

### Update Secrets
```bash
wrangler secret put OPENROUTER_API_KEY
wrangler secret put AGENTS_API_BASE
```

---

## 🎛️ Integration z Frontend

Update `AgentsView.tsx`:

```typescript
const handleOrchestrate = async (query: string) => {
  const response = await fetch('https://orchestrator.jimbo77.com/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      model: 'deepseek/deepseek-r1',
      context: {}
    })
  });

  const result = await response.json();
  console.log('Orchestration result:', result);
  
  // Display:
  // - result.plan (co było wykonane)
  // - result.results (wyniki z agentów)
  // - result.answer (finalna odpowiedź AI)
};
```

Dodaj UI:
```tsx
<div>
  <h2>AI Orchestrator</h2>
  <textarea 
    placeholder="Opisz co chcesz zrobić (np. 'Zbadaj rynek i napisz raport')"
    onChange={e => setQuery(e.target.value)}
  />
  <button onClick={() => handleOrchestrate(query)}>
    Execute with AI
  </button>
</div>
```

---

## 🚦 Monitoring

### Task Status
```bash
# Get task status
curl https://orchestrator.jimbo77.com/task/{taskId}
```

### KV Storage (wrangler)
```bash
# List all tasks
wrangler kv:key list --namespace-id=YOUR_KV_ID

# Get specific task
wrangler kv:key get "task:uuid-1234" --namespace-id=YOUR_KV_ID
```

### Cloudflare Dashboard
- Workers → jimbo77-agents-orchestrator → Logs
- Real-time logs, errors, performance metrics

---

## ⚡ Advanced Features

### Custom Agent Priority
```json
{
  "query": "Research and write",
  "agent_config": {
    "research-agent": { "timeout": 30000 },
    "writer-agent": { "max_tokens": 2000 }
  }
}
```

### Streaming Results (Future)
```typescript
// Stream results as they complete
const stream = orchestrate(query);
for await (const result of stream) {
  console.log('Agent completed:', result);
}
```

### Retry Logic
Orchestrator automatycznie retry failowanych agentów (max 3 próby).

---

## 🎯 Next Steps

1. **Deploy Orchestrator**:
   ```bash
   cd workers/agents-orchestrator
   npm install
   npx wrangler secret put OPENROUTER_API_KEY
   npx wrangler secret put AGENTS_API_BASE
   npm run deploy
   ```

2. **Test**:
   ```bash
   curl -X POST https://orchestrator.jimbo77.com/orchestrate \
     -H "Content-Type: application/json" \
     -d '{"query":"Test all agents"}'
   ```

3. **Integrate w UI**:
   - Dodaj "AI Orchestrator" tab w AgentsView
   - Query input + model selector
   - Results display z execution plan

4. **Monitor**:
   - Cloudflare Dashboard → Logs
   - KV Storage dla task history

---

**Status**: ✅ Ready to deploy!  
**Cost**: ~$0.01 per query (DeepSeek R1)  
**Speed**: 2-10s depending on agent complexity  
**Reliability**: Auto-retry + fallback models
