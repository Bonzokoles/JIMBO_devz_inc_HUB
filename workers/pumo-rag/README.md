# PUMO RAG Worker

Cloudflare Worker providing RAG-powered search and chat for PUMO Guide (meble.pumo.pl catalog).

## Architecture

- **Embeddings**: Workers AI `@cf/baai/bge-small-en-v1.5` (1536 dimensions)
- **Vector DB**: Cloudflare Vectorize (cosine similarity)
- **LLM**: OpenRouter (DeepSeek R1) with fallback to Workers AI (Llama 3.3 70B)
- **Caching**: KV namespace (5 min TTL)
- **Logging**: KV namespace (30 days retention)

## Endpoints

### Public Endpoints

**POST /api/chat**
Chat interface for blog widget.

```json
{
  "query": "Szukam sofy do salonu w stylu skandynawskim"
}
```

Response:

```json
{
  "answer": "Polecam następujące sofy skandynawskie...",
  "sources": [
    {
      "id": "sofa-123",
      "title": "Sofa NORA 3-osobowa",
      "category": "Sofy",
      "price": "2,499 zł",
      "url": "https://meble.pumo.pl/sofy/nora-3",
      "score": 0.89
    }
  ],
  "confidence": 89,
  "metadata": {
    "llm": "openrouter",
    "processingTime": 1234
  }
}
```

**POST /api/search**
Simple product search without LLM.

```json
{
  "query": "krzesła tapicerowane",
  "limit": 10
}
```

**GET /api/stats**
Query statistics (TODO: implementation pending).

**GET /health**
Health check endpoint.

### Internal Endpoints

**POST /internal/agent-search**
For agents-orchestrator. Requires `Authorization: Bearer <INTERNAL_API_KEY>`.

## Setup

### 1. Install Dependencies

```bash
cd workers/pumo-rag
npm install
```

### 2. Create Cloudflare Resources

```bash
# Vectorize namespace (1536 dimensions, cosine similarity)
npx wrangler vectorize create pumo-products --dimensions=1536 --metric=cosine

# KV namespaces
npx wrangler kv:namespace create PUMO_LOGS
npx wrangler kv:namespace create PUMO_CACHE
```

Update `wrangler.toml` with the returned namespace IDs.

### 3. Set Secrets

```bash
# OpenRouter API key
npx wrangler secret put OPENROUTER_API_KEY

# Internal API key for agents-orchestrator
npx wrangler secret put INTERNAL_API_KEY
```

### 4. Development

```bash
npm run dev
```

Worker will be available at `http://localhost:8787`.

### 5. Deploy

```bash
# Development environment
npm run deploy

# Production (pumo-api.jimbo77.com)
npm run deploy:prod
```

## Indexing Products

Products are indexed using a separate script (see `scripts/index-pumo-products.ts`).

Example product metadata:

```json
{
  "title": "Sofa NORA 3-osobowa",
  "category": "Sofy",
  "categorySlug": "sofy",
  "price": "2,499 zł",
  "description": "Elegancka sofa 3-osobowa w stylu skandynawskim...",
  "brand": "PUMO",
  "url": "https://meble.pumo.pl/sofy/nora-3"
}
```

## Integration

### Blog Chat Widget

```typescript
// my-bonzo-ai-blog/src/components/PumoChatWidget.astro
const response = await fetch("https://pumo-api.jimbo77.com/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: userMessage }),
});

const data = await response.json();
// Display data.answer and data.sources
```

### Agents Orchestrator

```typescript
// agents-orchestrator/src/tools/pumo-search.ts
const response = await fetch(
  "https://pumo-api.jimbo77.com/internal/agent-search",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({ query: agentQuery }),
  },
);
```

## Monitoring

```bash
# Live logs
npm run tail

# Stats endpoint
curl https://pumo-api.jimbo77.com/api/stats
```

## Project Status

**Week 1: Core RAG Infrastructure** ✅

- [x] Worker setup (wrangler.toml, package.json, tsconfig.json)
- [x] Basic routing (index.ts)
- [x] RAG engine (rag-engine.ts)
- [x] Caching (KV, 5 min TTL)
- [x] Logging (KV, 30 days retention)

**Week 2: Blog Integration** ⏳

- [ ] llms.txt
- [ ] dla-agentow page
- [ ] Chat widget

**Week 3: Agents Integration** ⏳

- [ ] Agent tool (pumo-search.ts)
- [ ] Orchestrator integration

**Week 4: Analytics & Dashboard** ⏳

- [ ] Stats aggregation
- [ ] jimbo77.org integration

See [PUMO_RAG_INTEGRATION_ARCHITECTURE.md](../../PUMO_RAG_INTEGRATION_ARCHITECTURE.md) for full plan.
