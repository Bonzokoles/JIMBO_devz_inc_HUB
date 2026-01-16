# PUMO RAG Integration - System Architecture

**Data**: 16 stycznia 2026  
**Cel**: Integracja Pumo Guide RAG z ekosystemem JIMBO77  
**Status**: Dokumentacja architektury

---

## 🏗️ Architektura Podziału

### **Podział Odpowiedzialności**

```
JIMBO_devz_inc_HUB (U:\The_yellow_hub\JIMBO_devz_inc_HUB)
├── workers/pumo-rag/                    ← NOWY: RAG API Worker
│   ├── src/
│   │   ├── index.ts                     → Main entry (routing)
│   │   ├── vectorize.ts                 → Cloudflare Vectorize ops
│   │   ├── rag-engine.ts                → RAG logic (query → context → answer)
│   │   ├── agents-connector.ts          → Połączenie z agents-orchestrator
│   │   └── logging.ts                   → Query logging do KV
│   ├── wrangler.toml
│   └── package.json
│
├── workers/agents-orchestrator/         ← ISTNIEJĄCY: Rozszerzamy
│   ├── src/
│   │   ├── tools/pumo-search.ts         → NOWY: Tool dla agentów
│   │   └── index.ts                     → Dodajemy /pumo endpoint
│   └── wrangler.toml
│
└── Jimbo_77/frontend/apps/
    └── jimbo-hub/                       ← NOWY: Dashboard na jimbo77.com
        ├── src/pages/
        │   ├── pumo-guide/              → Proxy/embed Pumo Guide
        │   ├── pumo-chat/               → RAG Chat UI
        │   └── pumo-analytics/          → Query analytics dashboard
        └── astro.config.mjs

my-bonzo-ai-blog (U:\The_yellow_hub\my-bonzo-ai-blog)
├── src/pages/pumo-guide/
│   ├── chat.astro                       ← NOWY: Frontend tylko UI
│   └── dla-agentow.astro                ← NOWY: AI API documentation
├── src/components/
│   └── PumoChatWidget.astro             → Client-side widget
└── public/
    └── llms.txt                         → NOWY: AI crawler instructions
```

---

## 🔌 Endpoints Architecture

### **1. PUMO RAG Worker** (`pumo-rag.jimbo77.com` lub `api.jimbo77.com/pumo-rag`)

```typescript
// workers/pumo-rag/src/index.ts

POST /api/chat
→ RAG chatbot główny endpoint
→ Input: { query: string, context?: string[] }
→ Output: { answer: string, sources: [...], confidence: number }

POST /api/search
→ Semantic search po produktach
→ Input: { query: string, limit?: number, filters?: {...} }
→ Output: { results: [...], total: number }

POST /api/embed
→ Embedding endpoint dla nowych produktów
→ Input: { text: string, metadata: {...} }
→ Output: { id: string, embedded: boolean }

GET /api/stats
→ Query analytics
→ Output: { total_queries: number, top_searches: [...] }

POST /internal/agent-search
→ Endpoint dla agents-orchestrator
→ Wymaga API key
→ Input: { query: string, agent_id: string }
```

### **2. Blog Frontend** (`mybonzoaiblog.com/pumo-guide`)

```typescript
// my-bonzo-ai-blog/src/pages/pumo-guide/chat.astro

<PumoChatWidget
  apiUrl="https://pumo-rag.jimbo77.com/api/chat"
  theme="pumo"
  initialMessage="Witaj! Jak mogę pomóc w wyborze mebli?"
/>
```

### **3. JIMBO Hub Dashboard** (`jimbo77.com/pumo-control`)

```typescript
// JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/jimbo-hub/src/pages/pumo-analytics.astro

<PumoAnalyticsDashboard
  apiUrl="https://api.jimbo77.com/pumo-rag/stats"
  realtime={true}
/>
```

---

## 📦 Cloudflare Resources

### **Vectorize Index**

```bash
# workers/pumo-rag/
npx wrangler vectorize create pumo-products \
  --dimensions=1536 \
  --metric=cosine
```

```toml
# wrangler.toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "pumo-products"
```

### **KV Namespaces**

```bash
# Query logging
npx wrangler kv:namespace create PUMO_LOGS

# Response cache
npx wrangler kv:namespace create PUMO_CACHE
```

### **D1 Database** (opcjonalnie - dla advanced analytics)

```bash
npx wrangler d1 create pumo-analytics
npx wrangler d1 execute pumo-analytics --file=./schema.sql
```

---

## 🔐 Secrets & Environment

### **PUMO RAG Worker**

```bash
cd workers/pumo-rag

# OpenRouter API (dla LLM)
npx wrangler secret put OPENROUTER_API_KEY

# Internal API key (dla agents-orchestrator)
npx wrangler secret put INTERNAL_API_KEY

# Cloudflare Workers AI (backup LLM)
# Używa account_id z wrangler.toml - nie wymaga osobnego klucza
```

```toml
# wrangler.toml
[env.production]
name = "pumo-rag"
main = "src/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "pumo-products"

[[kv_namespaces]]
binding = "LOGS"
id = "xxx" # z npx wrangler kv:namespace create

[[kv_namespaces]]
binding = "CACHE"
id = "yyy"

[vars]
OPENROUTER_MODEL = "deepseek/deepseek-chat"
CACHE_TTL = "300"
MAX_CONTEXT_ITEMS = "5"
```

---

## 🔄 Data Flow

### **Query Flow**

```
User (Blog) → Chat Widget
              ↓
POST https://pumo-rag.jimbo77.com/api/chat
              ↓
Cloudflare Worker (pumo-rag)
              ↓
1. Check CACHE (KV) ━━━━━━━━┓ HIT → Return cached
              ↓ MISS        ┃
2. Vectorize.query()         ┃
   "szafa 120cm biała"       ┃
              ↓              ┃
3. Get top 5 products        ┃
   [szafa1, szafa2, ...]     ┃
              ↓              ┃
4. LLM (OpenRouter/Workers AI)┃
   System: "Jesteś...        ┃
   Context: products         ┃
   Query: user question      ┃
              ↓              ┃
5. Answer + sources          ┃
              ↓              ┃
6. Log to KV (LOGS)          ┃
              ↓              ┃
7. Cache response (5 min) ━━━┛
              ↓
Return JSON to widget
              ↓
Display in UI
```

### **Agent Flow** (dla agents-orchestrator)

```
Agent Task → "znajdź szafę do sypialni"
              ↓
agents-orchestrator → Tool: pumo-search
              ↓
POST https://pumo-rag.jimbo77.com/internal/agent-search
Headers: Authorization: Bearer INTERNAL_API_KEY
              ↓
Vectorize search → Top 3 products
              ↓
Return structured data
              ↓
Agent continues reasoning
```

---

## 📊 Monitoring & Analytics

### **Query Logging** (KV)

```typescript
// Key format: query:{timestamp}:{hash}
await env.LOGS.put(
  `query:${Date.now()}:${hash}`,
  JSON.stringify({
    query: "szafa 120cm",
    results_count: 5,
    confidence: 0.87,
    response_time_ms: 234,
    source: "blog" | "agent",
    agent_id: "research-agent-01", // jeśli z agenta
  }),
  { expirationTtl: 86400 * 30 }, // 30 dni
);
```

### **Analytics Dashboard** (jimbo77.com/pumo-analytics)

```typescript
// Fetch stats from LOGS KV
const stats = await fetchPumoStats();
/*
{
  total_queries: 1247,
  avg_response_time: 178,
  top_searches: [
    { query: "szafy", count: 87 },
    { query: "łóżka sypialniane", count: 54 }
  ],
  confidence_distribution: {...},
  sources: { blog: 1100, agents: 147 }
}
*/
```

---

## 🚀 Implementation Timeline

### **WEEK 1: Core RAG Infrastructure**

**Day 1-2: PUMO RAG Worker Setup**

- [ ] Create `workers/pumo-rag` folder structure
- [ ] Setup Vectorize index (`pumo-products`)
- [ ] Implement `/api/embed` endpoint
- [ ] Test embedding 10 sample products

**Day 3-4: RAG Engine**

- [ ] Implement `rag-engine.ts` (query → Vectorize → LLM)
- [ ] Setup OpenRouter integration (DeepSeek)
- [ ] Fallback to Workers AI (@cf/meta/llama-3.3-70b)
- [ ] Test with 20 queries

**Day 5: Caching & Logging**

- [ ] KV cache implementation (5 min TTL)
- [ ] Query logging to KV
- [ ] Health check endpoint

### **WEEK 2: Blog Integration**

**Day 1-2: llms.txt & dla-agentow**

- [ ] Create `public/llms.txt`
- [ ] Create `src/pages/pumo-guide/dla-agentow.astro`
- [ ] Document API spec dla agentów

**Day 3-5: Chat Widget**

- [ ] Create `PumoChatWidget.astro`
- [ ] Implement chat UI (messages, typing indicator)
- [ ] Integrate with PUMO RAG API
- [ ] Test on `/pumo-guide/chat`

### **WEEK 3: Agents Integration**

**Day 1-2: Agent Tool**

- [ ] Create `workers/agents-orchestrator/src/tools/pumo-search.ts`
- [ ] Add `/pumo` endpoint w agents-orchestrator
- [ ] Setup INTERNAL_API_KEY

**Day 3-4: Testing**

- [ ] Test agent queries z orchestratora
- [ ] Validate logging (blog vs agent źródło)
- [ ] Performance benchmarks

### **WEEK 4: JIMBO Hub & Analytics**

**Day 1-3: Dashboard**

- [ ] Create `jimbo-hub` Astro app
- [ ] `/pumo-analytics` page
- [ ] Real-time query stats
- [ ] Top searches visualization

**Day 4-5: jimbo77.org Integration**

- [ ] Add PUMO Guide do AI Magnet sitemap
- [ ] Update `jimbo77.org/ai-index.html`
- [ ] Blog post announcement
- [ ] Citations tracking setup

---

## 📝 Code Examples

### **1. PUMO RAG Worker - Main Entry**

```typescript
// workers/pumo-rag/src/index.ts
import { ragChat } from "./rag-engine";
import { logQuery } from "./logging";

export interface Env {
  VECTORIZE: Vectorize;
  LOGS: KVNamespace;
  CACHE: KVNamespace;
  AI: Ai;
  OPENROUTER_API_KEY: string;
  INTERNAL_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Routes
    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { query, context } = await request.json();

      // Check cache
      const cacheKey = `chat:${query}`;
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
        });
      }

      // RAG query
      const result = await ragChat(query, env, context);

      // Log
      await logQuery(env.LOGS, { query, ...result, source: "blog" });

      // Cache (5 min)
      await env.CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 300,
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    // Internal agent endpoint
    if (url.pathname === "/internal/agent-search") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${env.INTERNAL_API_KEY}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      // ... agent search logic
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

### **2. RAG Engine**

```typescript
// workers/pumo-rag/src/rag-engine.ts
export async function ragChat(
  query: string,
  env: Env,
  context?: string[],
): Promise<{
  answer: string;
  sources: Array<{ title: string; url: string; score: number }>;
  confidence: number;
}> {
  // 1. Embed query
  const embedding = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
    text: [query],
  });

  // 2. Search Vectorize
  const results = await env.VECTORIZE.query(embedding.data[0], {
    topK: 5,
    returnMetadata: true,
  });

  // 3. Build context
  const contextText = results.matches
    .map(
      (m) =>
        `Produkt: ${m.metadata.title}\nKategoria: ${m.metadata.category}\nCena: ${m.metadata.price}\nOpis: ${m.metadata.description}`,
    )
    .join("\n\n");

  // 4. LLM call (OpenRouter first, Workers AI fallback)
  let answer = "";
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mybonzoaiblog.com",
          "X-Title": "PUMO RAG",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "Jesteś asystentem sklepu meblowego PUMO. Pomagasz w wyborze mebli na podstawie produktów w bazie. Odpowiadaj po polsku, profesjonalnie i konkretnie.",
            },
            {
              role: "user",
              content: `Kontekst z bazy produktów:\n${contextText}\n\nPytanie klienta: ${query}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      },
    );
    const data = await response.json();
    answer = data.choices[0].message.content;
  } catch (error) {
    // Fallback to Workers AI
    const aiResponse = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: "Asystent PUMO..." },
          { role: "user", content: `${contextText}\n\n${query}` },
        ],
      },
    );
    answer = aiResponse.response;
  }

  return {
    answer,
    sources: results.matches.map((m) => ({
      title: m.metadata.title,
      url: `https://www.mybonzoaiblog.com/pumo-guide/${m.metadata.slug}`,
      score: m.score,
    })),
    confidence: results.matches[0]?.score || 0,
  };
}
```

### **3. Blog Chat Widget**

```astro
---
// my-bonzo-ai-blog/src/pages/pumo-guide/chat.astro
import Layout from '../../layouts/Layout.astro';
---

<Layout title="Czat z asystentem PUMO">
  <div class="chat-container">
    <h1>🛋️ Asystent Wyboru Mebli</h1>
    <div id="chat-messages"></div>
    <form id="chat-form">
      <input
        type="text"
        id="chat-input"
        placeholder="Np. Szukam szafy do sypialni 120cm szerokości..."
      />
      <button type="submit">Wyślij</button>
    </form>
  </div>

  <script>
    const API_URL = 'https://pumo-rag.jimbo77.com/api/chat';
    const messagesDiv = document.getElementById('chat-messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      // User message
      appendMessage('user', query);
      input.value = '';

      // Loading
      const loadingId = appendMessage('assistant', '...');

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        const data = await response.json();

        // Replace loading with answer
        document.getElementById(loadingId).innerHTML = `
          <div class="answer">${data.answer}</div>
          <div class="sources">
            ${data.sources.map(s => `
              <a href="${s.url}" target="_blank">${s.title}</a>
            `).join(' • ')}
          </div>
        `;
      } catch (error) {
        document.getElementById(loadingId).textContent = 'Błąd połączenia. Spróbuj ponownie.';
      }
    });

    function appendMessage(role, content) {
      const id = `msg-${Date.now()}`;
      const div = document.createElement('div');
      div.id = id;
      div.className = `message ${role}`;
      div.textContent = content;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return id;
    }
  </script>

  <style>
    .chat-container { max-width: 800px; margin: 2rem auto; padding: 1rem; }
    #chat-messages {
      height: 500px;
      overflow-y: auto;
      border: 1px solid #ddd;
      padding: 1rem;
      margin-bottom: 1rem;
      background: #f9f9f9;
    }
    .message { margin: 0.5rem 0; padding: 0.75rem; border-radius: 8px; }
    .message.user { background: #007bff; color: white; text-align: right; }
    .message.assistant { background: white; border: 1px solid #ddd; }
    .sources { margin-top: 0.5rem; font-size: 0.9rem; color: #666; }
    .sources a { color: #007bff; text-decoration: none; }
    #chat-form { display: flex; gap: 0.5rem; }
    #chat-input { flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
    button { padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</Layout>
```

---

## 🎯 Success Criteria

### **Technical**

- [ ] RAG endpoint < 2s response time (p95)
- [ ] Cache hit rate > 40%
- [ ] Vectorize search accuracy > 85%
- [ ] Zero downtime deployment

### **Integration**

- [ ] Blog widget działa na `/pumo-guide/chat`
- [ ] Agents mogą używać `/internal/agent-search`
- [ ] Analytics dashboard na `jimbo77.com/pumo-analytics`
- [ ] `llms.txt` indexed przez AI crawlers

### **User Experience**

- [ ] Naturalne odpowiedzi po polsku
- [ ] Źródła linkują do produktów
- [ ] Mobile-friendly widget
- [ ] Typing indicator działa

---

## 📚 Related Documents

- [PUMO_GUIDE_UPGRADE_PLAN.md](U:\The_yellow_hub\my-bonzo-ai-blog\docs\PUMO_GUIDE_UPGRADE_PLAN.md) - główny plan wdrożenia
- [RAG_DEPLOYMENT_GUIDE.md](U:\The_yellow_hub\my-bonzo-ai-blog\docs\planning\RAG_DEPLOYMENT_GUIDE.md) - szczegółowy przewodnik RAG
- [JIMBO77_DOMAINS_ARCHITECTURE.md](JIMBO77_DOMAINS_ARCHITECTURE.md) - architektura domen
- [definition_of_done.html](U:\The_yellow_hub\my-bonzo-ai-blog\docs\planning\definition_of_done.html) - tracking progress

---

**Autor**: GitHub Copilot  
**Wersja**: 1.0  
**Last Updated**: 16 stycznia 2026
