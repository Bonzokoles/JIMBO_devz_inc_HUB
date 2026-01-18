# Phase 3: Integration with Existing Workers

Integracja ngrok AI Gateway z 3 głównymi workers:

## 📋 Workers do zintegrowania

1. **agents-orchestrator** - 18 AI agents (DeepSeek R1 via OpenRouter)
2. **pumo-rag** - PUMO RAG embeddings + search
3. **cf-ai-image-gen** + **replicate-image-gen** - Image generation failover

---

## 1️⃣ Agents Orchestrator Integration

**Location:** `JIMBO_devz_inc_HUB/workers/agents-orchestrator`  
**Current:** Direct OpenRouter API calls  
**Target:** Ngrok multi-provider failover (DeepSeek → Claude → GPT-4)

### Changes Required:

**File:** `src/index.ts` or main handler

```typescript
// BEFORE (direct OpenRouter):
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://orchestrator.jimbo77.com'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-r1',
    messages: [...]
  })
});

// AFTER (via ngrok proxy):
const response = await fetch('https://ngrok-proxy.stolarnia-ams.workers.dev/api/chat', {
  headers: {
    'Authorization': `Bearer ${env.JIMBO_API_KEY}`, // ngrok proxy API key
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-r1', // ngrok handles provider routing
    messages: [...]
  })
});

// Extract provider info from response
const provider = response.headers.get('X-Provider'); // "deepseek-r1" or "claude-via-openrouter"
```

### Environment Variables:

Add to `wrangler.toml`:

```toml
[vars]
NGROK_PROXY_URL = "https://ngrok-proxy.stolarnia-ams.workers.dev"
```

Set secret:

```bash
npx wrangler secret put JIMBO_API_KEY
# Enter the same key used in ngrok-proxy worker
```

### Deployment:

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\agents-orchestrator
npx wrangler deploy
```

### Testing:

```bash
# Test orchestration endpoint
curl -X POST https://orchestrator.jimbo77.com/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze current market trends for AI tools",
    "agents": ["market-analyst", "data-researcher"]
  }'

# Should see provider info in response headers
```

---

## 2️⃣ PUMO RAG Integration

**Location:** `JIMBO_devz_inc_HUB/workers/pumo-rag`  
**Current:** Direct embeddings API (OpenAI or similar)  
**Target:** Ngrok smart routing (Gemini FREE → OpenAI fallback)

### Changes Required:

**File:** `src/index.ts` (embeddings handler)

```typescript
// BEFORE:
async function generateEmbeddings(text: string, env: Env): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// AFTER:
async function generateEmbeddings(text: string, env: Env): Promise<number[]> {
  const response = await fetch(`${env.NGROK_PROXY_URL}/api/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.JIMBO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  const data = await response.json();

  // Log provider for cost tracking
  const provider = response.headers.get("X-Provider");
  console.log(`Embedding generated via ${provider}`);

  return data.data[0].embedding;
}
```

### Cost Optimization:

Ngrok będzie automatycznie używać **Gemini FREE** dla embeddings (limit 60 RPM), następnie failover do OpenAI:

- **Gemini FREE:** 50% traffic → $0/month
- **OpenAI (fallback):** 50% traffic → ~$30/month (vs $60 direct)
- **SAVINGS:** ~$30/month (50%)

### Deployment:

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\pumo-rag

# Set secrets
npx wrangler secret put JIMBO_API_KEY
npx wrangler secret put NGROK_PROXY_URL

# Deploy
npx wrangler deploy

# Verify indexing continues
bun run indexing/index-products.ts
```

---

## 3️⃣ Image Generation Failover

**Location:** `JIMBO_devz_inc_HUB/workers/cf-ai-image-gen` + `replicate-image-gen`  
**Current:** CF FREE tier primary, Replicate backup (manual)  
**Target:** Automatic failover via ngrok

### Strategy:

```
Request → CF Workers AI (FREE, fast)
   ↓ (if fails or rate limited)
Ngrok Proxy → Replicate FLUX ($0.003/image)
   ↓ (if Replicate fails)
Failover → DALL-E 3 via ngrok ($0.04/image)
```

### Changes Required:

**File:** `cf-ai-image-gen/src/index.ts`

```typescript
// Add failover logic
async function generateImage(prompt: string, env: Env): Promise<Uint8Array> {
  // Try 1: Cloudflare Workers AI (FREE)
  try {
    const response = await env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      {
        prompt,
      },
    );

    if (response) {
      console.log("✅ CF Workers AI success (FREE)");
      return response;
    }
  } catch (cfError) {
    console.warn("⚠️ CF Workers AI failed, trying ngrok...", cfError);
  }

  // Try 2: Ngrok proxy (routes to Replicate or DALL-E)
  try {
    const response = await fetch(`${env.NGROK_PROXY_URL}/api/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.JIMBO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "replicate/flux-schnell", // or 'dall-e-3'
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await response.json();
    const provider = response.headers.get("X-Provider");
    console.log(`✅ Image generated via ngrok (${provider})`);

    // Download image from URL
    const imageUrl = data.data[0].url;
    const imageResponse = await fetch(imageUrl);
    return new Uint8Array(await imageResponse.arrayBuffer());
  } catch (ngrokError) {
    console.error("❌ All providers failed", ngrokError);
    throw new Error("Image generation failed on all providers");
  }
}
```

### Cost Analysis:

**Without Ngrok:**

- CF FREE: 100% attempts → 80% success, 20% fail (no images)
- Manual Replicate fallback: $0.003/image when needed

**With Ngrok:**

- CF FREE: 80% success → $0
- Ngrok → Replicate: 15% → $0.003/image
- Ngrok → DALL-E: 5% → $0.04/image (only when Replicate fails)
- **Result:** 100% success rate, minimal cost increase (~$0.005 avg/image)

### Deployment:

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\cf-ai-image-gen

# Add env vars to wrangler.toml
# [vars]
# NGROK_PROXY_URL = "https://ngrok-proxy.stolarnia-ams.workers.dev"

npx wrangler secret put JIMBO_API_KEY
npx wrangler deploy
```

---

## 🧪 Integration Testing

Po wdrożeniu wszystkich integracji, uruchom test suite:

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\ngrok-deployment\03_integration
powershell -ExecutionPolicy Bypass -File test-integration.ps1
```

Test sprawdzi:

- ✅ Agents Orchestrator używa ngrok
- ✅ PUMO RAG embeddings przez ngrok
- ✅ Image generation failover działa
- ✅ Analytics w ngrok-proxy D1
- ✅ Cost tracking (porównanie przed/po)

---

## 📊 Expected Results

### Before Integration:

- Agents: 100% OpenRouter (DeepSeek) → $193/month
- PUMO RAG: 100% OpenAI embeddings → $60/month
- Images: 80% CF FREE, 20% fail → $0/month (but 20% failures)
- **TOTAL:** $253/month + 20% image failures

### After Integration:

- Agents: 50% DeepSeek, 30% Claude, 20% Gemini FREE → $96/month
- PUMO RAG: 50% Gemini FREE, 50% OpenAI → $30/month
- Images: 80% CF FREE, 15% Replicate, 5% DALL-E → $12/month
- **TOTAL:** $138/month + 100% success rate
- **SAVINGS:** $115/month (45%) + zero failures! 🎉

---

## 🚀 Deployment Order

1. **Deploy ngrok-proxy worker** (already done in Phase 2)
2. **Update agents-orchestrator** (30 min)
3. **Update pumo-rag** (20 min) - ensure indexing continues
4. **Update cf-ai-image-gen** (15 min)
5. **Run integration tests** (10 min)
6. **Monitor for 24h** - check analytics dashboard

**Total Time:** ~1.5 hours

---

## 📝 Rollback Plan

If issues occur, rollback is simple:

```bash
# Revert to previous deployment
cd workers/[worker-name]
npx wrangler rollback

# Or redeploy previous version
git checkout HEAD~1 -- src/
npx wrangler deploy
```

Each worker keeps 3 previous versions in Cloudflare.

---

## 🔗 Next Steps

After successful integration:

- **Phase 4:** Monitoring & Analytics (Grafana dashboards)
- **Phase 5:** Advanced features (Ollama Layer 3, cache optimization)
- **Phase 6:** Production hardening (alerts, backup strategies)
