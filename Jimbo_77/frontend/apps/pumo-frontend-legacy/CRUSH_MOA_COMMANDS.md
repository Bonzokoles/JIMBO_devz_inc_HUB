# 🤖 CRUSH TERMINAL - MOA EXECUTION COMMANDS

**Generated:** 2026-01-22 16:05
**Mission:** PUMO Megastore OS Implementation
**Models:** GPT-4 (Backend) + Claude Sonnet (Frontend) + DeepSeek R1 (QA/Deploy)

---

## 🎯 MISSION OVERVIEW

Transform PUMO Analytics Dashboard from 90% UI prototype to 100% functional system with:

- Real-time data from IdoSell exports
- 10 AI agents monitoring system health
- MOA-powered buying guides generation
- Production deployment on Cloudflare

**Sources:**

1. `MASTER_PLAN_PUMO_MEGASTORE_OS.md` - Strategic vision (4 modules)
2. `PLAN_DZIALANIA_MOA.md` - Tactical tasks (25 tasks, 5 phases)
3. `RAPORT_ANALIZY_2026-01-22.md` - Current state analysis

---

## 🤖 MODEL 1: GPT-4 (Backend Architect)

**Role:** Python/FastAPI expert, data engineering specialist  
**Phases:** FAZA 1 + FAZA 2  
**Priority:** 🔴 CRITICAL - START IMMEDIATELY  
**Timeline:** 7-10 hours

### FAZA 1: INFRASTRUCTURE BACKEND

#### Task 1.1: Setup Backend API (Port 8001)

**Location:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api`

```bash
# Navigate to API directory
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api

# Check main.py for routes
# Ensure analytics_ai and guides are imported
# Add if missing:
# from app.routes import analytics_ai, guides
# app.include_router(analytics_ai.router, prefix="/v1")
# app.include_router(guides.router, prefix="/v1")

# Start server
python -m uvicorn app.main:app --port 8001 --reload --host 0.0.0.0
```

**Verification:**

```bash
curl http://localhost:8001/v1/analytics/health
# Expected: {"status": "ok", "components": {...}}
```

#### Task 1.2: Verify IdoSell Data Exports

**Location:** `u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports`

```bash
# Check existing exports
ls u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports

# Required files:
# - analytics.json (business overview data)
# - products.json (6000+ products)
# - orders.json (500+ orders)
# - customers.json (customer segments)

# If missing, run export script or use mock data generator
```

**Expected Outcome:** All JSON files present with valid data

#### Task 1.3: Configure CORS + Environment

**File:** `api/app/main.py` and `api/.env`

```python
# Add to main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "https://pumo-dashboard.pages.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Create `.env`:

```env
API_PORT=8001
DATABASE_URL=postgresql://user:pass@localhost:5432/pumo
REDIS_URL=redis://localhost:6379/1
EXPORTS_DIR=u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports
```

#### Task 1.4: Remove Fake Data from Frontend

**File:** `pumo-frontend-legacy/src/api.ts`

**Find and remove 8 methods with fake data fallbacks:**

- `getKPIs()` - lines 149-164
- `getRevenueTrend()` - lines 175-183
- `getTopProducts()` - lines 209-215
- Similar pattern in all API methods

**Replace with:**

```typescript
export async function getKPIs(): Promise<KPIData> {
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/business-overview`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch KPIs:", error);
    throw error; // Let UI handle error display
  }
}
```

#### Task 1.5: Health Check Endpoint

**File:** `api/app/routes/analytics_ai.py`

```python
@router.get("/analytics/health")
async def health_check():
    """System health check"""
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {}
    }

    # Check database
    try:
        # Test DB connection
        status["components"]["database"] = "ok"
    except:
        status["components"]["database"] = "error"
        status["status"] = "degraded"

    # Check Redis
    try:
        redis_client.ping()
        status["components"]["redis"] = "ok"
    except:
        status["components"]["redis"] = "error"

    # Check exports directory
    exports_exist = os.path.exists(EXPORTS_DIR)
    status["components"]["exports"] = "ok" if exports_exist else "missing"

    return status
```

---

### FAZA 2: AI AGENTS IMPLEMENTATION

#### Task 2.1: BaseAgent Framework

**Location:** `api/app/agents/base_agent.py` (create new)

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
import redis
import json
from datetime import datetime

class BaseAgent(ABC):
    """Base class for all monitoring agents"""

    def __init__(self, agent_id: str, redis_client: redis.Redis):
        self.agent_id = agent_id
        self.redis = redis_client
        self.status = "inactive"

    async def health_check(self) -> Dict[str, Any]:
        """Check if agent is responsive"""
        return {
            "agent_id": self.agent_id,
            "status": self.status,
            "last_check": datetime.now().isoformat()
        }

    @abstractmethod
    async def run(self):
        """Main agent logic - must be implemented by subclass"""
        pass

    def save_state(self, data: dict):
        """Save agent state to Redis"""
        key = f"agent:{self.agent_id}:state"
        self.redis.set(key, json.dumps(data), ex=3600)

    def get_state(self) -> dict:
        """Load agent state from Redis"""
        key = f"agent:{self.agent_id}:state"
        data = self.redis.get(key)
        return json.loads(data) if data else {}
```

#### Task 2.2: UptimeAgent (A1)

**Location:** `api/app/agents/uptime_agent.py` (create new)

```python
from .base_agent import BaseAgent
import httpx
import asyncio
from datetime import datetime

class UptimeAgent(BaseAgent):
    """Monitor uptime of critical services"""

    def __init__(self, redis_client):
        super().__init__("A1_UptimeMonitor", redis_client)
        self.services = {
            "api_gateway": "http://localhost:8001/v1/analytics/health",
            "database": "postgresql://localhost:5432",
            "redis": "redis://localhost:6379"
        }

    async def run(self):
        """Check uptime every 5 minutes"""
        self.status = "active"

        while True:
            results = {}

            # Check API Gateway
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.services["api_gateway"], timeout=5)
                    results["api_gateway"] = "up" if response.status_code == 200 else "down"
            except:
                results["api_gateway"] = "down"

            # Check Redis
            try:
                self.redis.ping()
                results["redis"] = "up"
            except:
                results["redis"] = "down"

            # Save results
            self.save_state({
                "timestamp": datetime.now().isoformat(),
                "uptime": results,
                "uptime_percentage": self._calculate_uptime(results)
            })

            await asyncio.sleep(300)  # 5 minutes

    def _calculate_uptime(self, results: dict) -> float:
        """Calculate uptime percentage"""
        total = len(results)
        up = sum(1 for status in results.values() if status == "up")
        return (up / total) * 100 if total > 0 else 0
```

#### Task 2.3: AgentManager

**Location:** `api/app/agents/manager.py` (create new)

```python
from typing import List, Dict
from .uptime_agent import UptimeAgent
import asyncio

class AgentManager:
    """Orchestrate all AI agents"""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.agents = []
        self._register_agents()

    def _register_agents(self):
        """Register all agents"""
        # Agent A1: Uptime Monitor
        self.agents.append(UptimeAgent(self.redis))

        # TODO: Add remaining agents A2-A10
        # self.agents.append(PerformanceAgent(self.redis))
        # self.agents.append(ErrorBudgetAgent(self.redis))
        # etc.

    async def start_all(self):
        """Start all agents in parallel"""
        tasks = [asyncio.create_task(agent.run()) for agent in self.agents]
        await asyncio.gather(*tasks)

    async def get_status(self) -> List[Dict]:
        """Get status of all agents"""
        statuses = []
        for agent in self.agents:
            status = await agent.health_check()
            status["state"] = agent.get_state()
            statuses.append(status)
        return statuses
```

**Add endpoint in analytics_ai.py:**

```python
from app.agents.manager import AgentManager

agent_manager = AgentManager(redis_client)

@router.get("/analytics/agents/status")
async def get_agents_status():
    """Get status of all monitoring agents"""
    return await agent_manager.get_status()

# Start agents on app startup
@router.on_event("startup")
async def start_agents():
    asyncio.create_task(agent_manager.start_all())
```

#### Task 2.4: Frontend Agent Status Integration

**File:** `pumo-frontend-legacy/src/AppAdvanced.tsx`

**Replace lines 87-93:**

```typescript
// OLD (fake data):
const [agents, setAgents] = useState([...hardcoded array...]);

// NEW (real API call):
const [agents, setAgents] = useState<AgentStatus[]>([]);

useEffect(() => {
  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('http://localhost:8001/v1/analytics/agents/status');
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  };

  // Initial fetch
  fetchAgentStatus();

  // Auto-refresh every 30 seconds
  const interval = setInterval(fetchAgentStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

**GPT-4 Success Criteria:**

- [x] Backend running on :8001
- [x] All analytics endpoints return real data
- [x] UptimeAgent (A1) monitoring system
- [x] GET /agents/status returns real statuses
- [x] Frontend shows live agent status

---

## 🤖 MODEL 2: CLAUDE SONNET (Frontend Specialist)

**Role:** React/TypeScript expert, UX/UI specialist  
**Phases:** FAZA 3 + FAZA 4  
**Priority:** 🟡 HIGH - START AFTER FAZA 1 BACKEND READY  
**Timeline:** 3-5 hours

### FAZA 3: MOA BUYING GUIDES

#### Task 3.1: Test MOA Worker

**URL:** https://lucjan-moa.stolarnia-ams.workers.dev

```bash
# Test request
curl -X POST https://lucjan-moa.stolarnia-ams.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "category": "szafy",
    "products": [
      {"id": "123", "name": "Szafa biała 2-drzwiowa", "price": 899}
    ],
    "user_query": "szafa do sypialni biała"
  }'
```

**Expected Response (< 60s):**

```json
{
  "guide": {
    "title": "Przewodnik zakupowy: Szafy do sypialni",
    "content": "## Analiza produktów...",
    "metadata": {
      "generated_by": ["gpt-4", "deepseek", "gemini-2.0"],
      "timestamp": "2026-01-22T16:00:00Z"
    }
  }
}
```

#### Task 3.2: Backend Guides API Test

**File:** `api/app/routes/guides.py` (already exists)

```bash
# Test generate endpoint
curl -X POST http://localhost:8001/v1/guides/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "szafy",
    "products": [...],
    "user_query": "szafa biała"
  }'

# Check saved guides
ls u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/guides

# Test retrieval
curl http://localhost:8001/v1/guides/{guide_id}
```

#### Task 3.3: Frontend Buying Guides UI

**File:** `pumo-frontend-legacy/src/AppAdvanced.tsx` lines 200-250

**Enhance existing UI:**

```tsx
import { useState } from "react";
import { motion } from "framer-motion";

function BuyingGuidesTab() {
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<any>(null);
  const [formData, setFormData] = useState({
    category: "",
    query: "",
  });

  const generateGuide = async () => {
    setLoading(true);
    try {
      // Get products for category
      const productsResponse = await fetch(
        `http://localhost:8001/v1/analytics/top-products?category=${formData.category}`
      );
      const products = await productsResponse.json();

      // Generate guide via MOA
      const guideResponse = await fetch("http://localhost:8001/v1/guides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          products: products.slice(0, 10),
          user_query: formData.query,
        }),
      });

      const result = await guideResponse.json();
      setGuide(result);
    } catch (error) {
      console.error("Failed to generate guide:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buying-guides-container">
      <h2>AI Buying Guides Generator</h2>

      {/* Form */}
      <div className="guide-form">
        <select
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="">Select category...</option>
          <option value="szafy">Szafy</option>
          <option value="komody">Komody</option>
          <option value="łóżka">Łóżka</option>
        </select>

        <input
          type="text"
          placeholder="What are you looking for?"
          value={formData.query}
          onChange={e => setFormData({ ...formData, query: e.target.value })}
        />

        <button onClick={generateGuide} disabled={loading}>
          {loading ? "Generating..." : "Generate Guide"}
        </button>
      </div>

      {/* Loading animation */}
      {loading && (
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          🤖 MOA Working...
        </motion.div>
      )}

      {/* Guide display */}
      {guide && (
        <div className="guide-result">
          <h3>{guide.title}</h3>
          <div dangerouslySetInnerHTML={{ __html: guide.content }} />
          <button onClick={() => downloadGuide(guide)}>Download PDF</button>
        </div>
      )}
    </div>
  );
}
```

---

### FAZA 4: REAL-TIME DATA FLOW

#### Task 4.1: Verify Analytics Endpoints

**Test all endpoints with real data:**

```bash
# Business Overview
curl http://localhost:8001/v1/analytics/business-overview

# Revenue Trend
curl http://localhost:8001/v1/analytics/revenue-trend

# Top Products
curl http://localhost:8001/v1/analytics/top-products

# Customer Segments
curl http://localhost:8001/v1/analytics/customer-segments

# Payment Methods
curl http://localhost:8001/v1/analytics/payment-methods
```

**Add Redis caching in analytics_ai.py:**

```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def cache_result(ttl=300):
    """Cache decorator with TTL"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"cache:{func.__name__}"

            # Try cache first
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Compute result
            result = await func(*args, **kwargs)

            # Cache for TTL seconds
            redis_client.set(cache_key, json.dumps(result), ex=ttl)
            return result
        return wrapper
    return decorator

@router.get("/analytics/business-overview")
@cache_result(ttl=300)  # Cache for 5 minutes
async def get_business_overview():
    # ... existing code
```

#### Task 4.2: Frontend Data Flow Verification

**File:** `pumo-frontend-legacy/src/api.ts`

**Ensure NO fake data fallbacks - all methods throw errors:**

```typescript
export async function getKPIs(): Promise<KPIData> {
  const response = await fetch(`${API_BASE}/v1/analytics/business-overview`);
  if (!response.ok) {
    throw new Error(`Failed to fetch KPIs: ${response.status}`);
  }
  return await response.json();
}

export async function getRevenueTrend(): Promise<TrendData[]> {
  const response = await fetch(`${API_BASE}/v1/analytics/revenue-trend`);
  if (!response.ok) {
    throw new Error(`Failed to fetch revenue trend: ${response.status}`);
  }
  return await response.json();
}

// Repeat for all 8+ methods - NO FAKE DATA
```

**Add error boundaries in AppAdvanced.tsx:**

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-state">
      <h3>⚠️ Failed to load data</h3>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}

// Wrap dashboard in ErrorBoundary
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Dashboard />
</ErrorBoundary>;
```

#### Task 4.3: Auto-Refresh Validation

**File:** `pumo-frontend-legacy/src/AppAdvanced.tsx` lines 95-104

**Enhance auto-refresh with visual indicator:**

```tsx
const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
const [isRefreshing, setIsRefreshing] = useState(false);

useEffect(() => {
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadKPIs(), loadRevenueTrend(), loadTopProducts(), loadAgentStatus()]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  loadData();

  // Auto-refresh every 60 seconds
  const interval = setInterval(loadData, 60000);
  return () => clearInterval(interval);
}, []);

// Display in UI
<div className="dashboard-header">
  <span className="last-updated">
    Last updated: {lastUpdated.toLocaleTimeString()}
    {isRefreshing && <span className="refreshing-badge">🔄 Refreshing...</span>}
  </span>
</div>;
```

**CLAUDE Success Criteria:**

- [x] MOA generates guide in < 60 seconds
- [x] All 7 tabs show real data (no fake data)
- [x] Auto-refresh works every 60s
- [x] Error boundaries handle API failures

---

## 🤖 MODEL 3: DEEPSEEK R1 (QA & Deployment)

**Role:** Testing expert, DevOps specialist  
**Phases:** FAZA 5  
**Priority:** 🟢 LOW - START AFTER FAZA 1-4 COMPLETE  
**Timeline:** 2-3 hours

### FAZA 5: DEPLOYMENT & MONITORING

#### Task 5.1: Integration Testing

**Create:** `api/tests/test_analytics.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/v1/analytics/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]

def test_business_overview():
    response = client.get("/v1/analytics/business-overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_orders" in data

def test_agents_status():
    response = client.get("/v1/analytics/agents/status")
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) >= 1  # At least UptimeAgent
    assert agents[0]["agent_id"] == "A1_UptimeMonitor"

def test_generate_guide():
    payload = {
        "category": "szafy",
        "products": [{"id": "1", "name": "Szafa", "price": 899}],
        "user_query": "szafa biała"
    }
    response = client.post("/v1/guides/generate", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert "guide" in data

# Run tests
# pytest api/tests/test_analytics.py -v
```

**Frontend E2E tests:** `pumo-frontend-legacy/tests/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Dashboard loads with real data", async ({ page }) => {
  await page.goto("http://localhost:3002");

  // Wait for data to load
  await page.waitForSelector(".kpi-card", { timeout: 10000 });

  // Check KPI cards have numbers (not "Loading...")
  const revenueCard = await page.textContent(".kpi-card.revenue .value");
  expect(revenueCard).toMatch(/\d+/);

  // Check chart renders
  const chart = await page.locator("canvas.chart");
  await expect(chart).toBeVisible();
});

test("Agent status updates every 30s", async ({ page }) => {
  await page.goto("http://localhost:3002");

  const agentStatus = await page.textContent(".agent-status");
  expect(agentStatus).toContain("A1_UptimeMonitor");

  // Wait 30 seconds
  await page.waitForTimeout(31000);

  // Check status updated
  const newStatus = await page.textContent(".agent-status");
  expect(newStatus).toBeTruthy();
});

// Run: npx playwright test
```

#### Task 5.2: Cloudflare Pages Deployment

**Location:** `pumo-frontend-legacy/`

```bash
# Build frontend
cd pumo-frontend-legacy
npm run build

# Check dist/ output
ls dist/
# Should contain: index.html, assets/, etc.

# Create wrangler.toml for Pages
cat > wrangler.toml << EOF
name = "pumo-dashboard"
compatibility_date = "2026-01-22"

[site]
bucket = "./dist"
EOF

# Deploy
npx wrangler pages deploy dist --project-name=pumo-dashboard

# Expected output:
# ✨ Success! Deployed to https://pumo-dashboard.pages.dev
```

**Configure environment variables in Cloudflare Dashboard:**

- `VITE_API_BASE_URL` = https://pumo-api.railway.app

#### Task 5.3: Backend Deployment (Railway)

**Create:** `api/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8001

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Deploy to Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to repo
railway link

# Add environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set REDIS_URL=redis://...
railway variables set EXPORTS_DIR=/app/exports

# Deploy
railway up

# Get deployment URL
railway status
# Example: https://pumo-api-production.up.railway.app
```

#### Task 5.4: Monitoring Setup

**Sentry Integration:**

```bash
# Backend
pip install sentry-sdk

# Add to main.py
import sentry_sdk
sentry_sdk.init(
    dsn="https://...@sentry.io/...",
    environment="production"
)
```

**Slack Alerts:**

```python
# In uptime_agent.py
import httpx

SLACK_WEBHOOK = "https://hooks.slack.com/services/..."

async def send_alert(message: str):
    async with httpx.AsyncClient() as client:
        await client.post(SLACK_WEBHOOK, json={
            "text": f"🚨 PUMO Alert: {message}"
        })

# Use in agent:
if results["api_gateway"] == "down":
    await send_alert("API Gateway is down!")
```

**DEEPSEEK Success Criteria:**

- [x] All tests passing (backend + frontend)
- [x] Frontend live on Cloudflare Pages
- [x] Backend deployed to Railway
- [x] Monitoring alerts configured

---

## 📊 EXECUTION TRACKING

### Progress Checklist

**FAZA 1: Backend (GPT-4)** - 🔴 CRITICAL

- [ ] Task 1.1: Backend API on :8001
- [ ] Task 1.2: IdoSell exports verified
- [ ] Task 1.3: CORS + env configured
- [ ] Task 1.4: Fake data removed
- [ ] Task 1.5: Health check endpoint

**FAZA 2: AI Agents (GPT-4)** - 🟡 HIGH

- [ ] Task 2.1: BaseAgent framework
- [ ] Task 2.2: UptimeAgent (A1)
- [ ] Task 2.3: AgentManager
- [ ] Task 2.4: Frontend integration

**FAZA 3: MOA Guides (CLAUDE)** - 🟡 HIGH

- [ ] Task 3.1: MOA Worker test
- [ ] Task 3.2: Backend API test
- [ ] Task 3.3: Frontend UI

**FAZA 4: Data Flow (CLAUDE)** - 🟡 HIGH

- [ ] Task 4.1: Analytics endpoints
- [ ] Task 4.2: Frontend verification
- [ ] Task 4.3: Auto-refresh

**FAZA 5: Deployment (DEEPSEEK)** - 🟢 LOW

- [ ] Task 5.1: Testing suite
- [ ] Task 5.2: Cloudflare Pages
- [ ] Task 5.3: Railway backend
- [ ] Task 5.4: Monitoring

---

## 🚀 QUICK START COMMANDS

```powershell
# Start backend (Terminal 1)
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python -m uvicorn app.main:app --port 8001 --reload

# Start frontend (Terminal 2)
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy
npm run dev

# Test health
curl http://localhost:8001/v1/analytics/health

# Test agent status
curl http://localhost:8001/v1/analytics/agents/status
```

---

## 📚 DOCUMENTATION LINKS

- Master Plan: `MASTER_PLAN_PUMO_MEGASTORE_OS.md`
- Task Details: `PLAN_DZIALANIA_MOA.md`
- Analysis: `RAPORT_ANALIZY_2026-01-22.md`
- Startup Script: `START_MOA.ps1`

---

**🎯 DEFINITION OF DONE:**

- ✅ Backend responding on :8001 with real data
- ✅ Frontend shows dashboard (0% fake data)
- ✅ 1+ AI agent running (UptimeAgent minimum)
- ✅ MOA guides generate in < 60s
- ✅ Auto-refresh every 60s
- ✅ Production deployment live

**⏱️ TOTAL TIME:** 12-18 hours (parallel) or ~19h (sequential)

**🚀 READY TO EXECUTE!**
