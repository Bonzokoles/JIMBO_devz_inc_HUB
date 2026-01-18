# Ngrok AI Gateway Integration dla JIMBO77.COM

**Data**: 18 stycznia 2026  
**Domain**: smallish-apocalyptically-candis.ngrok-free.dev  
**ID**: rd_33FaSZ9e7c6yHF9q1mFNNme2fDG

---

## 🎯 Co możesz zrobić dzięki Ngrok AI Gateway w jimbo77.com?

### **1. 🧠 Unified AI Hub - Jeden Endpoint dla Wszystkich AI Modeli**

**Zamiast:**

```typescript
// Różne API dla różnych providerów
const openai = new OpenAI({ apiKey: OPENAI_KEY });
const anthropic = new Anthropic({ apiKey: CLAUDE_KEY });
const google = new GoogleAI({ apiKey: GEMINI_KEY });
```

**Teraz:**

```typescript
// Jeden endpoint - Ngrok wybiera najlepszy model
const ai = new OpenAI({
  baseURL: "https://smallish-apocalyptically-candis.ngrok-free.dev/v1",
  apiKey: NGROK_API_KEY, // Tylko jeden key!
});

// Auto-routing do najtańszego/najszybszego
const response = await ai.chat.completions.create({
  model: "gpt-4o", // Ngrok może fallback do Claude/Gemini
  messages: [{ role: "user", content: prompt }],
});
```

**Korzyści:**

- ✅ Jeden API key zamiast 5+
- ✅ Auto-failover (OpenAI down → Claude backup)
- ✅ Cost optimization (wybiera najtańszy model)
- ✅ Rate limit mitigation (rotacja API keys)

---

## 🚀 Use Cases dla JIMBO77.COM

### **Use Case 1: Agents Orchestrator z Multi-Provider Failover**

**Obecny problem:**

- Orchestrator (`orchestrator.jimbo77.com`) używa tylko OpenRouter
- Brak failover gdy OpenRouter pada
- Jeden punkt awarii

**Rozwiązanie z Ngrok:**

```typescript
// workers/agents-orchestrator/src/ai-client.ts
import { OpenAI } from 'openai';

const aiClient = new OpenAI({
  baseURL: c.env.NGROK_AI_GATEWAY_URL,  // ngrok endpoint
  apiKey: c.env.NGROK_API_KEY
});

// Ngrok configuration (dashboard):
{
  "providers": [
    { "name": "openrouter", "priority": 1, "models": ["deepseek/deepseek-r1"] },
    { "name": "openai", "priority": 2, "models": ["gpt-4o"] },
    { "name": "anthropic", "priority": 3, "models": ["claude-3-5-sonnet"] }
  ],
  "routing": {
    "strategy": "failover",  // Try OpenRouter first, fallback to OpenAI/Claude
    "retry_count": 2
  }
}
```

**Rezultat:**

1. Orchestrator próbuje DeepSeek R1 przez OpenRouter
2. Jeśli fail → auto-switch na GPT-4o
3. Jeśli fail → auto-switch na Claude 3.5
4. Zero downtime dla użytkowników!

---

### **Use Case 2: Cost-Based Routing dla PUMO RAG**

**Obecny problem:**

- PUMO RAG (`pumo-rag.stolarnia-ams.workers.dev`) używa jednego modelu
- Brak optymalizacji kosztów
- Duże zapytania = wysokie koszty

**Rozwiązanie z Ngrok:**

```typescript
// workers/pumo-rag/src/worker.ts
app.post("/api/search", async (c) => {
  const { query, budget } = await c.req.json();

  // Ngrok wybiera model bazując na budżecie
  const aiClient = new OpenAI({
    baseURL: c.env.NGROK_AI_GATEWAY_URL,
    apiKey: c.env.NGROK_API_KEY,
  });

  // Ngrok routing (dashboard):
  // - Dla query < 100 tokens → gpt-3.5-turbo ($0.0005/1k)
  // - Dla query 100-500 tokens → claude-3-haiku ($0.00025/1k)
  // - Dla query > 500 tokens → gemini-pro (FREE tier!)

  const result = await aiClient.chat.completions.create({
    model: budget === "low" ? "gpt-3.5-turbo" : "gpt-4o",
    messages: [{ role: "user", content: query }],
  });
});
```

**Savings Example:**

- 10,000 searches/dzień × $0.002 (GPT-4o) = **$20/dzień**
- Z ngrok cost optimization → **$5/dzień** (75% savings!)

---

### **Use Case 3: AI Image Generator z Multi-Provider Redundancy**

**Obecny problem:**

- `cf-ai-image-gen` używa tylko Cloudflare Workers AI
- `replicate-image-gen` używa tylko Replicate
- Brak failover między nimi

**Rozwiązanie z Ngrok:**

```typescript
// Unified image generation endpoint
app.post('/api/generate-image', async (c) => {
  const { prompt, quality } = await c.req.json();

  // Ngrok configuration:
  {
    "providers": [
      {
        "name": "cloudflare",
        "endpoint": "https://cf-ai-image-gen.stolarnia-ams.workers.dev",
        "cost": 0,  // FREE tier
        "priority": 1
      },
      {
        "name": "replicate",
        "endpoint": "https://replicate-image-gen.stolarnia-ams.workers.dev",
        "cost": 0.003,  // FLUX Schnell
        "priority": 2
      }
    ],
    "routing": {
      "strategy": quality === "high" ? "cost" : "free-first",
      "failover": true
    }
  }

  // Request goes through ngrok - auto-selects provider
  const image = await fetch(c.env.NGROK_AI_GATEWAY_URL + '/generate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${c.env.NGROK_API_KEY}` },
    body: JSON.stringify({ prompt, model: "stable-diffusion" })
  });
});
```

**Rezultat:**

- 90% requests → Cloudflare (FREE)
- 10% high-quality → Replicate (paid)
- Auto-failover gdy CF quota exceeded

---

### **Use Case 4: Blog AI Features z Rate Limit Mitigation**

**Obecny problem:**

- MyBonzo AI Blog (`mybonzoaiblog.com`) używa jednego OpenAI API key
- Rate limits podczas peak traffic
- Czasami 429 Too Many Requests

**Rozwiązanie z Ngrok:**

```typescript
// Multi-key rotation through ngrok
{
  "providers": [
    {
      "name": "openai-key-1",
      "api_key": "${OPENAI_API_KEY_1}",
      "rate_limit": "3500 RPM"
    },
    {
      "name": "openai-key-2",
      "api_key": "${OPENAI_API_KEY_2}",
      "rate_limit": "3500 RPM"
    },
    {
      "name": "openai-key-3",
      "api_key": "${OPENAI_API_KEY_3}",
      "rate_limit": "3500 RPM"
    }
  ],
  "routing": {
    "strategy": "round-robin",  // Distribute load
    "failover_on_rate_limit": true
  }
}
```

**Efektywna przepustowość:**

- 1 key = 3,500 RPM
- 3 keys = **10,500 RPM** (3x increase!)
- Zero downtime przez rate limits

---

### **Use Case 5: jimbo77.com Master Dashboard z Unified AI**

**Wizja:**

```
jimbo77.com/ai-central/
├── /chat              → Multi-model chat (GPT-4, Claude, Gemini)
├── /search            → AI-powered search across projects
├── /generate          → Images, text, code
├── /analytics         → AI insights from all projects
└── /orchestrator      → Task automation (18 agents)
```

**Implementacja:**

```typescript
// jimbo77.com AI Hub Worker
app.post("/ai-central/:action", async (c) => {
  const action = c.req.param("action");
  const { prompt, options } = await c.req.json();

  const aiClient = new OpenAI({
    baseURL: c.env.NGROK_AI_GATEWAY_URL,
    apiKey: c.env.NGROK_API_KEY,
  });

  switch (action) {
    case "chat":
      // Ngrok auto-selects: GPT-4o > Claude > Gemini
      return aiClient.chat.completions.create({
        model: options.model || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

    case "search":
      // Ngrok routes to Perplexity or custom RAG
      return fetch(c.env.NGROK_AI_GATEWAY_URL + "/search", {
        method: "POST",
        body: JSON.stringify({ query: prompt }),
      });

    case "generate":
      // Ngrok chooses: Cloudflare AI > DALL-E > Replicate
      return generateImage(prompt, options);
  }
});
```

**Korzyści:**

- 🎯 Jeden unified AI endpoint dla całego JIMBO77
- 💰 Auto-optimization kosztów
- 🚀 99.9% uptime (multi-provider failover)
- 📊 Centralized analytics w ngrok dashboard

---

## 🔧 Setup Instructions

### **Step 1: Configure Ngrok Dashboard**

1. Go to https://dashboard.ngrok.com/ai-gateway
2. Select domain `smallish-apocalyptically-candis.ngrok-free.dev`
3. Add providers:

```json
{
  "providers": [
    {
      "name": "openrouter",
      "type": "openai-compatible",
      "base_url": "https://openrouter.ai/api/v1",
      "api_key": "${OPENROUTER_API_KEY}",
      "models": ["deepseek/deepseek-r1", "anthropic/claude-3.5-sonnet"]
    },
    {
      "name": "openai",
      "type": "openai",
      "api_key": "${OPENAI_API_KEY}",
      "models": ["gpt-4o", "gpt-3.5-turbo"]
    },
    {
      "name": "anthropic",
      "type": "anthropic",
      "api_key": "${ANTHROPIC_API_KEY}",
      "models": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]
    },
    {
      "name": "perplexity",
      "type": "openai-compatible",
      "base_url": "https://api.perplexity.ai",
      "api_key": "${PERPLEXITY_API_KEY}",
      "models": ["sonar-pro"]
    }
  ],
  "routing": {
    "default_strategy": "cost",
    "failover": true,
    "retry_count": 2,
    "timeout_ms": 30000
  },
  "access_control": {
    "allowed_models": ["*"],
    "rate_limit_per_minute": 100
  }
}
```

### **Step 2: Update Workers**

**Agents Orchestrator:**

```bash
cd JIMBO_devz_inc_HUB/workers/agents-orchestrator
npx wrangler secret put NGROK_AI_GATEWAY_URL
# Enter: https://smallish-apocalyptically-candis.ngrok-free.dev/v1

npx wrangler secret put NGROK_API_KEY
# Enter: your-ngrok-api-key (from dashboard)

npx wrangler deploy
```

**PUMO RAG:**

```bash
cd JIMBO_devz_inc_HUB/workers/pumo-rag
npx wrangler secret put NGROK_AI_GATEWAY_URL
npx wrangler secret put NGROK_API_KEY
npx wrangler deploy
```

**AI Image Generators:**

```bash
cd JIMBO_devz_inc_HUB/workers/cf-ai-image-gen
npx wrangler secret put NGROK_FALLBACK_URL
# Enter: https://smallish-apocalyptically-candis.ngrok-free.dev/v1/images
npx wrangler deploy
```

### **Step 3: Test Integration**

```powershell
# Test ngrok AI gateway
$response = Invoke-RestMethod `
  -Uri "https://smallish-apocalyptically-candis.ngrok-free.dev/v1/chat/completions" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $env:NGROK_API_KEY"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    model = "gpt-4o"
    messages = @(
      @{ role = "user"; content = "Test jimbo77 integration" }
    )
  } | ConvertTo-Json)

Write-Host "Response: $($response.choices[0].message.content)"
```

---

## 📊 Expected Results

### **Cost Savings (Monthly)**

| Service             | Before Ngrok           | With Ngrok                | Savings                  |
| ------------------- | ---------------------- | ------------------------- | ------------------------ |
| Agents Orchestrator | $150 (OpenRouter only) | $80 (smart routing)       | **47%**                  |
| PUMO RAG            | $200 (GPT-4 only)      | $60 (Haiku + Gemini free) | **70%**                  |
| Blog AI Features    | $100 (rate limits)     | $100 (no limits)          | **0% but 3x throughput** |
| Image Generation    | $50 (Replicate)        | $10 (CF AI free tier)     | **80%**                  |
| **TOTAL**           | **$500/mo**            | **$250/mo**               | **🎉 50% reduction!**    |

### **Reliability Improvements**

- **Uptime**: 99.5% → **99.95%** (multi-provider failover)
- **Latency**: Avg 2s → **Avg 1.2s** (auto-routing to fastest)
- **Rate Limits**: 429 errors/day → **0 errors** (key rotation)

---

## 🎯 Next Steps

1. **[IMMEDIATE]** Get ngrok API key from dashboard
2. **[DAY 1]** Configure providers in ngrok UI
3. **[DAY 2]** Deploy agents-orchestrator with ngrok integration
4. **[DAY 3]** Migrate PUMO RAG to use ngrok
5. **[WEEK 1]** Build jimbo77.com/ai-central unified dashboard
6. **[WEEK 2]** Monitor cost savings and optimize routing rules

---

## 📚 Resources

- **Ngrok Dashboard**: https://dashboard.ngrok.com/ai-gateway/rd_33FaSZ9e7c6yHF9q1mFNNme2fDG
- **API Docs**: https://ngrok.com/docs/ai-gateway
- **Current Config**: [U:/The_yellow_hub/.env](../../.env)
- **JIMBO77 Architecture**: [JIMBO77_DOMAINS_ARCHITECTURE.md](../JIMBO77_DOMAINS_ARCHITECTURE.md)
