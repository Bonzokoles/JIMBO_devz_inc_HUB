# D1 Database Setup for MoE-RAG

## 1. Create D1 Database

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\moe-rag-proxy
npx wrangler d1 create moe-rag-db
```

**Przykładowy output:**

```
✅ Successfully created DB 'moe-rag-db'!
binding = "DB"
database_name = "moe-rag-db"
database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"
```

## 2. Apply Database Schema

```bash
npx wrangler d1 execute moe-rag-db --file=../../Jimbo_77/api/schema.sql --remote
```

**Weryfikacja:**

```bash
npx wrangler d1 execute moe-rag-db --command="SELECT name FROM sqlite_master WHERE type='table'" --remote
```

## 3. Update wrangler.toml

Dodaj do `workers/moe-rag-proxy/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "moe-rag-db"
database_id = "YOUR_DATABASE_ID_FROM_STEP_1"
```

## 4. Update Worker Code

W `src/index.ts` dodaj D1 binding:

```typescript
export interface Env {
  CACHE: KVNamespace;
  DB: D1Database; // DODAJ TĘ LINIĘ
  BACKEND_URL: string;
  CORS_ORIGIN: string;
  CACHE_TTL: string;
}
```

## 5. Deploy Updated Worker

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\moe-rag-proxy
npx wrangler deploy
```

## 6. Test D1 Connection

```bash
# Query z CLI
npx wrangler d1 execute moe-rag-db --command="SELECT COUNT(*) FROM moe_queries" --remote

# Lub przez Worker endpoint (po dodaniu logging route)
curl https://api.jimbo77.com/api/moe-rag/stats
```

## Schema Details

**Tables:**

- `moe_queries` - Historia zapytań (query, routing_path, latency)
- `moe_responses` - Odpowiedzi AI (response, tokens, cost)
- `moe_metrics` - Dzienne agregaty (total queries, avg latency, cost)
- `moe_cache` - Query cache (query_hash, response, TTL)

**Indexes:**

- Query timestamps (dla analytics)
- User ID (dla per-user stats)
- Routing paths (dla performance analysis)
- Cache expiration (dla cleanup)

## Usage in Worker

```typescript
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
    INSERT INTO moe_responses (id, query_id, response, confidence, cost_usd)
    VALUES (?, ?, ?, ?, ?)
  `
  )
    .bind(
      crypto.randomUUID(),
      queryId,
      response.response,
      response.confidence,
      response.cost_usd
    )
    .run();
}
```

## AI Models Setup

## 1. Set API Keys

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api

# OpenRouter (Qwen 2.5 72B)
$env:OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY_HERE"

# DeepSeek R1 (optional)
$env:DEEPSEEK_API_KEY="sk-YOUR_KEY_HERE"

# OpenAI (optional fallback)
$env:OPENAI_API_KEY="sk-YOUR_KEY_HERE"
```

**Permanentne (System Environment Variables):**

```powershell
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "sk-or-v1-YOUR_KEY", "User")
[System.Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "sk-YOUR_KEY", "User")
```

## 2. Test LLM Integration

```bash
# Restart backend z nowymi env vars
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python run.py
```

**Test query:**

```powershell
$body = @{
  query = "What is Cloudflare Workers?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3885/api/moe-rag" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected output:**

```json
{
  "response": "Cloudflare Workers is a serverless platform...",
  "confidence": 0.85,
  "routing_path": "FAST_PATH",
  "tokens_used": {
    "input": 245,
    "output": 387
  },
  "cost_usd": 0.000142
}
```

## 3. Monitor Costs

**OpenRouter Dashboard:** https://openrouter.ai/activity
**DeepSeek Console:** https://platform.deepseek.com/usage

**Szacunkowe koszty:**

- Qwen 2.5 72B: $0.35/1M input, $0.40/1M output (~$0.0002/query)
- DeepSeek R1: $0.55/1M input, $2.19/1M output (~$0.0006/query)
- GPT-4 Turbo: $10/1M input, $30/1M output (~$0.008/query)

## Next Steps

1. ✅ Create D1 database
2. ✅ Apply schema
3. ✅ Update wrangler.toml
4. ✅ Set API keys
5. ⏳ Test LLM responses
6. ⏳ Add D1 logging to Worker
7. ⏳ Deploy to production
8. ⏳ Monitor costs and performance
