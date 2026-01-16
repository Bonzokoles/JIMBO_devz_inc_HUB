# MoE-RAG Cloudflare Worker Proxy

Cloudflare Worker that proxies requests to the MoE-RAG FastAPI backend with caching.

## Architecture

```
User Request → api.jimbo77.com/api/moe-rag
              ↓
         Cloudflare Worker
              ↓
         KV Cache Check
         /           \
      HIT            MISS
       ↓              ↓
   Return Cache   Backend API (FastAPI)
                      ↓
                  Cache Response
                      ↓
                  Return to User
```

## Features

- **CORS handling** for hub.jimbo77.com and jimbo77.com
- **Response caching** in KV (5 min TTL)
- **Health check passthrough** (no cache)
- **Debug endpoint** (no cache)
- **Error handling** with fallback responses

## Deployment

### 1. Create KV Namespace

```bash
cd workers/moe-rag-proxy

# Production
npx wrangler kv:namespace create CACHE
# Copy the ID to wrangler.toml

# Preview
npx wrangler kv:namespace create CACHE --preview
# Copy the preview_id to wrangler.toml
```

### 2. Update wrangler.toml

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID_HERE"        # From step 1
preview_id = "YOUR_PREVIEW_KV_ID_HERE"  # From step 1

[vars]
BACKEND_URL = "https://YOUR_BACKEND_SERVER/api/moe-rag"  # Update with real backend URL
```

### 3. Deploy

```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to production
npm run deploy
```

## Testing

```bash
# Health check
curl https://api.jimbo77.com/api/moe-rag/health

# Query (first request - cache MISS)
curl -X POST https://api.jimbo77.com/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{"query":"What is MoE-RAG?"}'

# Same query (second request - cache HIT)
curl -X POST https://api.jimbo77.com/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{"query":"What is MoE-RAG?"}'
# Should return faster with cache_hit: true

# Debug (no cache)
curl -X POST https://api.jimbo77.com/api/moe-rag/debug \
  -H "Content-Type: application/json" \
  -d '{"query":"Test query"}'
```

## Monitoring

```bash
# Live logs
npm run tail

# Check KV usage
npx wrangler kv:key list --binding=CACHE
```

## Environment Variables

- `BACKEND_URL` - FastAPI backend URL (e.g., https://your-server.com/api/moe-rag)
- `CORS_ORIGIN` - Allowed origins (comma-separated)
- `CACHE_TTL` - Cache time-to-live in seconds (default: 300)

## Routes

- `GET /api/moe-rag/health` - Health check (no cache)
- `POST /api/moe-rag` - Main query endpoint (cached)
- `POST /api/moe-rag/debug` - Debug routing (no cache)
