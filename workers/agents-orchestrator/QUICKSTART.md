# 🚀 ORCHESTRATOR QUICK START

## 1️⃣ Setup (5 minut)

### A. Install Dependencies
```bash
cd workers/agents-orchestrator
npm install
```

### B. Get OpenRouter API Key
1. Idź na https://openrouter.ai/keys
2. Sign up (darmowe $1 credit na start)
3. Create Key → skopiuj: `sk-or-v1-...`

### C. Create KV Namespace
```bash
npx wrangler kv:namespace create AGENT_STATE
# Output: { id: "abc123..." }
# Skopiuj ID do wrangler.toml
```

### D. Set Secrets
```bash
# OpenRouter API Key
npx wrangler secret put OPENROUTER_API_KEY
# Wklej: sk-or-v1-...

# Backend API (gdzie działają agenci)
npx wrangler secret put AGENTS_API_BASE
# Lokalnie: http://localhost:8001
# Produkcja: https://api.jimbo77.com (lub Railway URL)
```

---

## 2️⃣ Deploy

```bash
npm run deploy
```

**Output**:
```
✅ Deployed jimbo77-agents-orchestrator
🌐 URL: https://jimbo77-agents-orchestrator.<your-subdomain>.workers.dev
```

---

## 3️⃣ Test

```bash
curl -X POST https://jimbo77-agents-orchestrator.<your-subdomain>.workers.dev/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Zbadaj rynek AI tools w Polsce i napisz krótki raport",
    "model": "deepseek/deepseek-r1"
  }'
```

**Expected Response** (po ~5-10 sek):
```json
{
  "taskId": "abc-123",
  "plan": [
    {
      "agentId": "market-research-agent",
      "action": "market-analysis",
      "priority": 1
    },
    {
      "agentId": "research-agent",
      "action": "search",
      "priority": 1
    },
    {
      "agentId": "writer-agent",
      "action": "content-creation",
      "priority": 2
    }
  ],
  "results": [...],
  "answer": "# Raport rynku AI Tools w Polsce\n\n...",
  "execution_time": 5234,
  "model_used": "deepseek/deepseek-r1"
}
```

---

## 4️⃣ Przykłady Użycia

### Prosty Research
```bash
curl -X POST https://your-worker.dev/orchestrate \
  -d '{"query":"Co to jest DeepSeek R1?"}'
```

### Kompleksowy Task
```bash
curl -X POST https://your-worker.dev/orchestrate \
  -d '{
    "query": "Zbadaj 3 największych konkurentów Ikea w Polsce, porównaj ceny mebli ogrodowych i napisz artykuł SEO",
    "model": "deepseek/deepseek-r1",
    "context": {
      "focus": "outdoor furniture",
      "budget_max": "2000 PLN"
    }
  }'
```

**Plan AI utworzy**:
1. `company-analysis-agent` × 3 (Ikea, Agata, Black Red White)
2. `market-research-agent`: porównanie cen
3. `seo-agent`: keyword research
4. `writer-agent`: napisz artykuł
5. `graphics-agent`: wygeneruj wykresy porównawcze

---

## 5️⃣ Monitoring

### Logi Real-Time
```bash
npm run tail
```

### Task Status
```bash
curl https://your-worker.dev/task/{taskId}
```

### Cloudflare Dashboard
```
Dashboard → Workers → jimbo77-agents-orchestrator → Logs
```

---

## 6️⃣ Koszty

**DeepSeek R1** (domyślny model):
- Input: $0.55/M tokens
- Output: $2.19/M tokens
- **Średni query**: ~5k tokens = **$0.01**

**Porównanie**:
- GPT-4 Turbo: ~$0.15/query (15x drożej)
- Claude 3.5: ~$0.10/query (10x drożej)
- DeepSeek R1: ~$0.01/query ✅

**1000 queries/miesiąc** = $10/month 🎉

---

## 7️⃣ Custom Domain (Optional)

```bash
# W wrangler.toml dodaj:
route = { pattern = "orchestrator.jimbo77.com/*", zone_name = "jimbo77.com" }

# Deploy
npm run deploy
```

Cloudflare automatycznie skonfiguruje DNS ✅

---

## 🎯 Gotowe!

**Frontend integration** - dodaj do AgentsView.tsx:

```typescript
const handleOrchestrate = async () => {
  const response = await fetch('https://orchestrator.jimbo77.com/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: userQuery,
      model: 'deepseek/deepseek-r1'
    })
  });

  const result = await response.json();
  console.log('AI Plan:', result.plan);
  console.log('Answer:', result.answer);
};
```

---

## 🔧 Troubleshooting

### "Agent not responding"
- Sprawdź czy backend API działa: `curl http://localhost:8001/health`
- Uruchom backend: `cd Jimbo_77/api && python -m app.main`

### "OpenRouter 401"
- Sprawdź klucz: `wrangler secret list`
- Odśwież: `wrangler secret put OPENROUTER_API_KEY`

### "KV not found"
- Sprawdź ID w wrangler.toml
- Utwórz ponownie: `wrangler kv:namespace create AGENT_STATE`

---

**Pomoc**: Zobacz [README.md](./README.md) dla pełnej dokumentacji
