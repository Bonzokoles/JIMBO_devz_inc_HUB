# 🤖 Qwen + MCP Integration Plan - PUMO & Agents

**Data:** 20 stycznia 2026  
**Model:** Qwen 2.5 72B Instruct (via OpenRouter)  
**MCP Servers:** knowledge-graph, postgres-local, openrouter-planner

---

## 📋 Dostępne Zasoby

### 1. **Qwen MCP Server (OpenRouter-planner)**

```json
{
  "name": "openrouter-planner",
  "model": "qwen/qwen-2.5-72b-instruct",
  "api_key": "sk-or-v1-9fefdbae...",
  "capabilities": [
    "Planning & task decomposition",
    "Code generation",
    "Multi-step reasoning",
    "Context-aware responses"
  ]
}
```

### 2. **Knowledge Graph MCP**

- **Lokalizacja:** `R:/CLAUDE_MEMORY`
- **Funkcje:** 10 MCP tools
- **Użycie:** Trwała pamięć, relacje między encjami, graf wiedzy

### 3. **PUMO RAG System**

- **Worker URL:** https://jimbo-like-pumo-api.stolarnia-ams.workers.dev
- **Bazy danych:**
  - `jimbo-rag-db` (D1) - Produkty PUMO
  - `pumo-analiza` (D1) - Analytics IdoSell
  - `pumo_embeddings` (Vectorize) - Vector search
- **Bindings:** Cloudflare AI, R2 backup, KV cache

### 4. **PostgreSQL Database**

- **Agent Zero Memory:** `localhost:5433/agent_zero_memory`
- **Workspace Knowledge:** 105 chunks, 10 files
- **JIMBO Main DB:** `localhost:5432/bonzo_main`

---

## 🎯 Use Cases - Qwen dla PUMO

### **Scenariusz 1: PUMO Product Intelligence Agent**

**Zadanie:** Inteligentny asystent dla klientów sklepu meblepumo.iai-shop.com

**Stack:**

```
User Query → Qwen (planning) → Vector Search (PUMO products)
  → Qwen (synthesis) → Response + Product Links
```

**Implementacja:**

1. **Agent Konfiguracja:**

```typescript
// agents/pumo-assistant/config.ts
export const pumoAgent = {
  name: "PUMO Product Assistant",
  model: "qwen/qwen-2.5-72b-instruct",
  mcp_servers: [
    "openrouter-planner", // Qwen reasoning
    "postgres-local", // Product DB access
    "knowledge-graph", // Customer preferences memory
  ],
  database: {
    connection: "postgresql://bonzo:bonzo_dev_2026@localhost:5432/bonzo_main",
    tables: ["pumo_products", "pumo_categories", "pumo_orders"],
  },
  vectorize: {
    endpoint: "https://jimbo-like-pumo-api.workers.dev/api/search",
    index: "pumo_embeddings",
  },
};
```

2. **Flow Diagram:**

```
┌─────────────────┐
│  User Question  │ "Szukam sofy rozkładanej do 3000zł"
└────────┬────────┘
         ↓
┌────────────────────────────┐
│  Qwen Planning (MCP)       │
│  - Dekompozycja zapytania  │
│  - Parametry: price, type  │
└────────┬───────────────────┘
         ↓
┌────────────────────────────┐
│  Vector Search (PUMO API)  │
│  - Embedding query         │
│  - Search pumo_embeddings  │
│  - Top 5 products          │
└────────┬───────────────────┘
         ↓
┌────────────────────────────┐
│  PostgreSQL (bonzo_main)   │
│  - Get full product data   │
│  - Prices, stock, images   │
└────────┬───────────────────┘
         ↓
┌────────────────────────────┐
│  Qwen Synthesis            │
│  - Format response         │
│  - Add recommendations     │
│  - Include buy links       │
└────────┬───────────────────┘
         ↓
┌────────────────────────────┐
│  Knowledge Graph Update    │
│  - Save user preferences   │
│  - Track product interest  │
└────────────────────────────┘
```

3. **Example Code:**

```python
# agents/pumo-assistant/main.py
from mcp import MCPClient

async def handle_product_query(user_query: str):
    # Step 1: Qwen Planning
    plan = await mcp.call(
        "openrouter-planner",
        "plan_task",
        query=user_query
    )

    # Step 2: Vector Search
    products = await fetch(
        "https://jimbo-like-pumo-api.workers.dev/api/search",
        json={
            "query": plan["search_terms"],
            "filters": plan["filters"],
            "limit": 5
        }
    )

    # Step 3: Enrich from PostgreSQL
    product_ids = [p["id"] for p in products["results"]]
    details = await mcp.call(
        "postgres-local",
        "query",
        sql=f"SELECT * FROM pumo_products WHERE id = ANY($1)",
        params=[product_ids]
    )

    # Step 4: Qwen Synthesis
    response = await mcp.call(
        "openrouter-planner",
        "generate",
        prompt=f"""
        User asked: {user_query}
        Found products: {details}

        Create friendly response with:
        1. Brief intro
        2. Top 3 recommendations
        3. Why each matches user needs
        4. Buy links
        """
    )

    # Step 5: Save to Knowledge Graph
    await mcp.call(
        "knowledge-graph",
        "add_memory",
        content={
            "user_query": user_query,
            "recommended_products": product_ids[:3],
            "timestamp": datetime.now()
        }
    )

    return response
```

---

### **Scenariusz 2: PUMO Analytics Agent**

**Zadanie:** Automatyczna analiza sprzedaży i raportowanie

**Stack:**

```
Cron Trigger → Qwen (analytics planning) → PostgreSQL (PUMO analytics)
  → Qwen (insights generation) → Slack/Email Report
```

**Implementacja:**

```typescript
// agents/pumo-analytics/worker.ts
export default {
  async scheduled(event, env, ctx) {
    // Step 1: Get analytics data
    const salesData = await env.PUMO_ANALYTICS.prepare(
      `
      SELECT 
        product_id,
        SUM(quantity) as total_sold,
        SUM(revenue) as total_revenue,
        COUNT(DISTINCT order_id) as order_count
      FROM orders
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY product_id
      ORDER BY total_revenue DESC
      LIMIT 20
    `,
    ).all();

    // Step 2: Qwen Analysis
    const insights = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [
            {
              role: "user",
              content: `Analyze this week's sales data and provide insights:
          
          ${JSON.stringify(salesData, null, 2)}
          
          Format:
          1. Top performers (products)
          2. Trends detected
          3. Recommendations for marketing
          4. Stock alerts
          `,
            },
          ],
        }),
      },
    );

    // Step 3: Send report
    await sendSlackReport(insights.choices[0].message.content);
  },
};
```

---

### **Scenariusz 3: Multi-Agent Orchestration dla PUMO**

**Zadanie:** Kompleksowa obsługa zamówień z wieloma agentami

**Agenci:**

1. **Customer Service Agent** (Qwen) - Komunikacja z klientem
2. **Inventory Agent** (Python) - Sprawdzanie stanów magazynowych
3. **Pricing Agent** (Qwen) - Optymalizacja cen, rabaty
4. **Shipping Agent** (Python) - Kalkulacja wysyłki, wybór kuriera
5. **Analytics Agent** (Qwen) - Zbieranie insights z zamówienia

**Orchestrator Configuration:**

```typescript
// JIMBO_devz_inc_HUB/workers/agents-orchestrator/src/pumo-agents.ts
export const pumoAgents = [
  {
    name: "Customer Service",
    type: "ai",
    model: "qwen/qwen-2.5-72b-instruct",
    mcp_tools: ["openrouter-planner", "knowledge-graph"],
    responsibilities: [
      "Answer customer questions",
      "Product recommendations",
      "Handle complaints",
    ],
  },
  {
    name: "Inventory Manager",
    type: "python",
    script: "agents/python/inventory-agent/main.py",
    database: "postgresql://bonzo:bonzo_dev_2026@localhost:5432/bonzo_main",
    responsibilities: [
      "Check stock levels",
      "Trigger restock alerts",
      "Sync with IdoSell",
    ],
  },
  {
    name: "Pricing Optimizer",
    type: "ai",
    model: "qwen/qwen-2.5-72b-instruct",
    mcp_tools: ["postgres-local"],
    responsibilities: [
      "Dynamic pricing",
      "Competitor analysis",
      "Discount strategies",
    ],
  },
];

// Order processing flow
export async function processOrder(orderId: string) {
  // Step 1: Customer Service - Confirm order
  const confirmation = await runAgent("Customer Service", {
    action: "confirm_order",
    order_id: orderId,
  });

  // Step 2: Inventory - Check stock
  const stockStatus = await runAgent("Inventory Manager", {
    action: "verify_stock",
    order_id: orderId,
  });

  // Step 3: Pricing - Apply discounts
  const pricing = await runAgent("Pricing Optimizer", {
    action: "calculate_final_price",
    order_id: orderId,
    stock_status: stockStatus,
  });

  // Step 4: Shipping - Calculate delivery
  const shipping = await runAgent("Shipping Agent", {
    action: "calculate_shipping",
    order_id: orderId,
  });

  // Step 5: Analytics - Track metrics
  await runAgent("Analytics Agent", {
    action: "record_order",
    order_data: {
      id: orderId,
      stock_status: stockStatus,
      final_price: pricing,
      shipping: shipping,
    },
  });

  return {
    status: "processed",
    confirmation,
    pricing,
    shipping,
  };
}
```

---

## 🔧 Setup Steps

### **1. Configure Qwen MCP Access**

```bash
# VS Code settings.json already has:
# - openrouter-planner (Qwen 2.5 72B)
# - knowledge-graph (R:/CLAUDE_MEMORY)
# - postgres-local (bonzo_main DB)

# Verify access
npx @modelcontextprotocol/server-openrouter --help
```

### **2. Create PUMO Agent**

```bash
# New agent directory
mkdir -p agents/pumo-assistant
cd agents/pumo-assistant

# Initialize
cat > config.json <<EOF
{
  "name": "PUMO Product Assistant",
  "model": "qwen/qwen-2.5-72b-instruct",
  "mcp_servers": [
    "openrouter-planner",
    "postgres-local",
    "knowledge-graph"
  ],
  "databases": {
    "pumo": "postgresql://bonzo:bonzo_dev_2026@localhost:5432/bonzo_main",
    "vector": "https://jimbo-like-pumo-api.workers.dev/api/search"
  }
}
EOF
```

### **3. Add to Orchestrator**

```typescript
// JIMBO_devz_inc_HUB/workers/agents-orchestrator/src/index.ts

// Add PUMO agent to routing
if (taskType === "pumo_query") {
  return await fetch("http://localhost:6070/query", {
    method: "POST",
    body: JSON.stringify({
      query: task.data,
      model: "qwen/qwen-2.5-72b-instruct",
      mcp_tools: ["openrouter-planner", "postgres-local"],
    }),
  });
}
```

### **4. Deploy PUMO RAG Worker Updates**

```bash
cd JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/pumo-api
npx wrangler deploy

# Verify
curl https://jimbo-like-pumo-api.workers.dev/api/search \
  -d '{"query":"sofa rozkładana","limit":5}'
```

---

## 📊 Benefits

### **1. Qwen dla PUMO = Inteligentny E-commerce**

- ✅ Natural language product search
- ✅ Personalized recommendations (knowledge-graph memory)
- ✅ Automated analytics & insights
- ✅ Multi-language support (Polish + English)

### **2. MCP Integration = Unified System**

- ✅ Single interface for all tools (openrouter, postgres, knowledge)
- ✅ Easy agent orchestration
- ✅ Reusable components across projects

### **3. Cost Efficiency**

- ✅ Qwen 2.5 72B: $0.80/M tokens (vs GPT-4: $30/M)
- ✅ Cloudflare Workers: Pay per request
- ✅ PostgreSQL: Self-hosted (no vendor lock-in)

---

## 🚀 Quick Start (Recommended)

**Option A: Agent Zero + PUMO**

```bash
# Agent Zero już pobiera biblioteki Python
# Dodaj PUMO search do workspace_search.py
```

**Option B: Standalone PUMO Agent**

```bash
# Create new Python agent
cd agents/python
mkdir pumo-agent
# ... (see Scenariusz 1 code above)
```

**Option C: Cloudflare Worker + Qwen API**

```bash
# Extend pumo-api worker with Qwen chat endpoint
# ... (see Scenariusz 2 code above)
```

---

## 📝 Next Steps

1. ✅ **Test Qwen MCP** - Verify openrouter-planner works
2. ⏳ **Create PUMO agent** - Implement Scenariusz 1
3. ⏳ **Add to orchestrator** - Integrate with existing agents
4. ⏳ **Deploy to Cloudflare** - Production ready
5. ⏳ **Monitor & optimize** - Track performance, costs

---

**Czy chcesz:**

- A) Stworzyć PUMO Product Assistant (Scenariusz 1)?
- B) Dodać Qwen analytics do istniejącego pumo-api worker?
- C) Zintegrować Qwen z Agent Zero dla PUMO queries?
- D) Coś innego?
