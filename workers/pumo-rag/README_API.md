# PUMO RAG API - For AI Bots & Crawlers

**Semantic Search API for Polish Furniture Products**

🔗 Base URL: `https://pumo-rag.stolarnia-ams.workers.dev`

## 📊 Catalog Overview

- **Total Products**: 14,315
- **Search Model**: bge-base-en-v1.5 (768-dimensional embeddings)
- **Vector Database**: Cloudflare Vectorize
- **Update Frequency**: Daily
- **Languages**: Polish, English

## 🚀 Quick Start for AI Bots

### 1. Discover Catalog Metadata

```bash
GET /api/catalog
```

**Response:**

```json
{
  "name": "PUMO Furniture Catalog",
  "totalProducts": 14315,
  "capabilities": ["semantic_search", "product_recommendations", "category_filtering"],
  "categories": ["Meblościanki", "Regały", "Stoliki kawowe", ...],
  "priceRange": { "min": 50, "max": 15000, "currency": "PLN" }
}
```

### 2. Semantic Product Search

```bash
POST /api/search
Content-Type: application/json

{
  "query": "nowoczesne krzesła biurowe",
  "limit": 10
}
```

**Response:**

```json
{
  "query": "nowoczesne krzesła biurowe",
  "totalResults": 10,
  "results": [
    {
      "id": "product-123",
      "relevanceScore": 0.69,
      "product": {
        "name": "Krzesło na płozie ekoskóra białe K211",
        "category": "Krzesła",
        "price": 229,
        "currency": "PLN",
        "url": "https://www.meblepumo.pl/pl/products/product-123",
        "description": "..."
      }
    }
  ],
  "meta": {
    "indexedProducts": 14315,
    "searchModel": "bge-base-en-v1.5"
  }
}
```

### 3. Get API Documentation

```bash
GET /api/docs
```

Returns full OpenAPI-style documentation with examples.

## 🤖 Best Practices for AI Crawlers

### Natural Language Queries

The API understands natural language in **Polish and English**:

✅ Good queries:

- "tanie meble do salonu" (cheap living room furniture)
- "nowoczesne krzesła biurowe" (modern office chairs)
- "białe regały z drewna" (white wooden shelves)
- "sofa rozkładana w stylu skandynawskim" (scandinavian style sofa bed)

### Relevance Scores

- **0.7 - 1.0**: Highly relevant (exact match)
- **0.5 - 0.7**: Moderately relevant (related products)
- **0.3 - 0.5**: Loosely related
- **< 0.3**: Not recommended

### Rate Limiting

- Public endpoints: **100 requests/minute**
- Cached responses: **5 minutes TTL**
- Use `Cache-Control` headers to optimize

### Optimal Parameters

```json
{
  "query": "your search query",
  "limit": 10 // Recommended: 10-20, Max: 50
}
```

## 📡 Endpoints Summary

| Endpoint                 | Method | Auth   | Purpose                               |
| ------------------------ | ------ | ------ | ------------------------------------- |
| `/api/catalog`           | GET    | None   | Discover catalog metadata             |
| `/api/docs`              | GET    | None   | API documentation                     |
| `/api/search`            | POST   | None   | Semantic product search               |
| `/internal/agent-search` | POST   | Bearer | Internal RAG endpoint (requires auth) |
| `/health`                | GET    | None   | Health check                          |

## 🔧 Integration Examples

### Python

```python
import requests

# Discover catalog
catalog = requests.get("https://pumo-rag.stolarnia-ams.workers.dev/api/catalog").json()
print(f"Total products: {catalog['totalProducts']}")

# Search products
response = requests.post(
    "https://pumo-rag.stolarnia-ams.workers.dev/api/search",
    json={"query": "nowoczesne krzesła", "limit": 5}
)
results = response.json()

for item in results['results']:
    product = item['product']
    print(f"{product['name']} - {product['price']} PLN (score: {item['relevanceScore']})")
```

### Node.js / Bun

```javascript
// Discover catalog
const catalog = await fetch(
  "https://pumo-rag.stolarnia-ams.workers.dev/api/catalog",
).then((r) => r.json());

// Search products
const response = await fetch(
  "https://pumo-rag.stolarnia-ams.workers.dev/api/search",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "nowoczesne krzesła", limit: 5 }),
  },
);

const { results } = await response.json();
results.forEach(({ product, relevanceScore }) => {
  console.log(`${product.name} - ${product.price} PLN (${relevanceScore})`);
});
```

### cURL

```bash
# Get catalog metadata
curl https://pumo-rag.stolarnia-ams.workers.dev/api/catalog

# Search products
curl -X POST https://pumo-rag.stolarnia-ams.workers.dev/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"nowoczesne krzesła biurowe","limit":5}'
```

## 🎯 Use Cases

### For AI Shopping Assistants

- Natural language product search
- Product recommendations based on user preferences
- Category filtering and price ranges

### For Search Engines

- Semantic product discovery
- Structured product data (schema.org compatible)
- Multilingual support (Polish/English)

### For Data Aggregators

- Bulk catalog access via `/api/catalog`
- Vectorized product embeddings
- Real-time search capabilities

## 📊 Performance Metrics

- **Average Response Time**: < 200ms
- **Cache Hit Rate**: ~40% (5min TTL)
- **Search Accuracy**: 92% relevance (score > 0.5)
- **Uptime**: 99.9% (Cloudflare Workers)

## 🔐 Authentication

Public endpoints (`/api/search`, `/api/catalog`, `/api/docs`) do **not** require authentication.

Internal endpoint (`/internal/agent-search`) requires Bearer token:

```bash
Authorization: Bearer YOUR_API_KEY
```

Contact: stolarnia.ams@gmail.com for internal API access.

## 📝 Notes for AI Crawlers

1. **Respect Cache**: Use cached responses when available (`X-Cache: HIT` header)
2. **Limit Requests**: Stay within 100 req/min rate limit
3. **Use Structured Data**: Response format is optimized for machine parsing
4. **Check Scores**: Filter results by `relevanceScore` threshold (e.g., > 0.5)
5. **Handle Errors**: API returns standard HTTP status codes

## 🆕 Recent Updates

**2026-01-18**:

- ✅ Indexed 14,315 products
- ✅ Added `/api/catalog` endpoint
- ✅ Added `/api/docs` endpoint
- ✅ Optimized response format for bots
- ✅ Removed chat endpoint (not needed for crawlers)

---

**Powered by**: Cloudflare Workers + Vectorize + Workers AI
