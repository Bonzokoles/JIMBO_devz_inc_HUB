# 🚀 PLAN DZIAŁANIA: PUMO Analytics Dashboard - PEŁNA IMPLEMENTACJA

**Data:** 22 stycznia 2026  
**Status:** ⚙️ DO WYKONANIA - MOA READY  
**Execution:** Multi-Agent Orchestration (2-3 modele równolegle)

---

## 🎯 CEL GŁÓWNY

**Uruchomić pełnofunkcjonalny dashboard analityczny PUMO z prawdziwymi danymi, działającymi agentami AI i integracją MOA dla buying guides.**

### KPI Sukcesu:

- ✅ Backend API działa na porcie 8001 z real data
- ✅ Frontend pobiera dane bez fallback fake data
- ✅ 10 agentów AI monitoruje system real-time
- ✅ MOA generuje buying guides < 60 sekund
- ✅ Dashboard odświeża się co 60s z prawdziwymi metrykami

---

## 📋 FAZY PROJEKTU (5 Faz x 3-5 zadań)

### FAZA 1: INFRASTRUKTURA BACKEND (Priority: CRITICAL ⚠️)

**Cel:** Uruchomić FastAPI backend na porcie 8001 z działającymi endpoints dla analytics

#### Zadanie 1.1: Setup Backend API na porcie 8001

**Opis:** Skonfigurować i uruchomić FastAPI backend z routes analytics_ai.py i guides.py  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\main.py`  
**Akcje:**

1. Sprawdź czy `analytics_ai.py` i `guides.py` są zaimportowane w `main.py`
2. Dodaj routes jeśli brakuje:

   ```python
   from app.routes import analytics_ai, guides

   app.include_router(analytics_ai.router, prefix="/v1")
   app.include_router(guides.router, prefix="/v1")
   ```

3. Uruchom serwer:
   ```bash
   cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
   python -m uvicorn app.main:app --port 8001 --reload --host 0.0.0.0
   ```
4. Test endpoints:
   ```bash
   curl http://localhost:8001/v1/analytics/business-overview
   curl http://localhost:8001/v1/analytics/health
   curl http://localhost:8001/v1/guides/categories/list
   ```

**Expected Output:** HTTP 200 responses, JSON data (może być empty jeśli brak exports)  
**Dependencies:** Brak - może działać od razu  
**Time Estimate:** 30 minut

---

#### Zadanie 1.2: Eksport Danych z IdoSell

**Opis:** Uruchomić pełny eksport produktów, zamówień, klientów z IdoSell API  
**Plik:** `U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\export_business_analytics.ps1`  
**Akcje:**

1. Sprawdź obecny stan eksportu:
   ```powershell
   Get-ChildItem "U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports\*.json" |
     Select-Object Name, @{N='Size MB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
   ```
2. Uruchom pełny eksport (może trwać 30-60 min):
   ```powershell
   cd U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB
   .\export_business_analytics.ps1
   ```
3. Weryfikuj wyniki:
   - `analytics_[timestamp].json` - metadane (KPIs, customer segments, payment methods)
   - `products_[timestamp].json` - wszystkie produkty (14,315+)
   - `orders_[timestamp].json` - historia zamówień
   - `customers_[timestamp].json` - klienci z total spent

**Expected Output:** 4 pliki JSON w `api/exports/`, każdy > 1MB  
**Dependencies:** IdoSell API credentials w .env  
**Time Estimate:** 60 minut (z czasem wykonania skryptu)

---

#### Zadanie 1.3: Konfiguracja CORS i Environment Variables

**Opis:** Upewnić się że frontend może łączyć się z backend (CORS) i ma prawidłowe env vars  
**Pliki:**

- Backend: `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\main.py`
- Frontend: `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy\.env`

**Akcje Backend:**

```python
# main.py - sprawdź czy jest CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Akcje Frontend:**

```bash
# .env
VITE_API_BASE=http://localhost:8001/v1
```

**Test:**

```bash
# Terminal 1: Backend
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python -m uvicorn app.main:app --port 8001 --reload

# Terminal 2: Frontend
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy
npm run dev

# Terminal 3: Test
curl http://localhost:3002
curl http://localhost:8001/v1/analytics/health
```

**Expected Output:** Frontend otwiera się bez CORS errors w console  
**Dependencies:** Zadanie 1.1 (backend running)  
**Time Estimate:** 20 minut

---

#### Zadanie 1.4: Usunięcie Fake Data Fallbacks

**Opis:** Usunąć wszystkie hardcoded fake data z api.ts - pokazywać prawdziwe błędy  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy\src\api.ts`  
**Akcje:**

**PRZED (linie 149-164):**

```typescript
async getKPIs(): Promise<KPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/kpis`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return await response.json();
    } catch (error) {
      console.error('KPIs API error:', error);
      // Return fallback data ← USUŃ TO!
      return {
        totalRevenue: 284750,
        revenueChange: 8.3,
        // ... więcej fake data
      };
    }
  }
```

**PO:**

```typescript
async getKPIs(): Promise<KPIResponse> {
    const response = await fetch(`${this.baseUrl}/analytics/kpis`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
}
```

**Refactor ALL methods:**

- `getKPIs()` ✓
- `getRevenueTrend()` ✓
- `getTrafficSources()` ✓
- `getTopProducts()` ✓
- `queryAI()` ✓
- `getCustomerSegments()` ✓
- `getPaymentMethods()` ✓
- `getOrderSources()` ✓
- `getTopCustomers()` ✓
- `getAIPredictions()` ✓

**Error Handling w UI:**

```typescript
// AppAdvanced.tsx - loadAllData()
try {
  const kpiData = await api.getKPIs();
  setKpis(kpiData);
} catch (error) {
  console.error("Failed to load KPIs:", error);
  setError("Nie można załadować danych. Sprawdź czy backend działa.");
}
```

**Expected Output:** Dashboard pokazuje error message gdy backend offline, real data gdy online  
**Dependencies:** Zadanie 1.1 + 1.2 (backend + data)  
**Time Estimate:** 45 minut

---

#### Zadanie 1.5: Health Check Endpoint z Database Status

**Opis:** Endpoint /health pokazujący status wszystkich dependencies (DB, Redis, exports)  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\routes\analytics_ai.py`  
**Akcje:**

Dodaj na końcu analytics_ai.py:

```python
from pathlib import Path
from datetime import datetime

@router.get("/health")
async def health_check():
    """
    Comprehensive health check for analytics backend
    """
    health = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {}
    }

    # Check exports directory
    try:
        exports_dir = Path("u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports")
        analytics_files = list(exports_dir.glob("analytics_*.json"))
        products_files = list(exports_dir.glob("products_*.json"))

        if analytics_files:
            latest_analytics = max(analytics_files, key=lambda p: p.stat().st_mtime)
            health["components"]["analytics_data"] = {
                "status": "ok",
                "latest_file": latest_analytics.name,
                "last_updated": datetime.fromtimestamp(latest_analytics.stat().st_mtime).isoformat(),
                "size_mb": round(latest_analytics.stat().st_size / 1024 / 1024, 2)
            }
        else:
            health["components"]["analytics_data"] = {"status": "missing", "message": "No analytics files found"}
            health["status"] = "degraded"

        if products_files:
            latest_products = max(products_files, key=lambda p: p.stat().st_mtime)
            health["components"]["products_data"] = {
                "status": "ok",
                "latest_file": latest_products.name,
                "last_updated": datetime.fromtimestamp(latest_products.stat().st_mtime).isoformat(),
                "size_mb": round(latest_products.stat().st_size / 1024 / 1024, 2)
            }
        else:
            health["components"]["products_data"] = {"status": "missing"}

    except Exception as e:
        health["components"]["exports"] = {"status": "error", "error": str(e)}
        health["status"] = "unhealthy"

    # Check MOA Worker connectivity
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://lucjan-moa.stolarnia-ams.workers.dev/health")
            health["components"]["moa_worker"] = {
                "status": "ok" if response.status_code == 200 else "degraded",
                "response_time_ms": int(response.elapsed.total_seconds() * 1000)
            }
    except Exception as e:
        health["components"]["moa_worker"] = {"status": "unreachable", "error": str(e)}

    return health
```

**Test:**

```bash
curl http://localhost:8001/v1/analytics/health | jq
```

**Expected Output:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T14:30:00",
  "components": {
    "analytics_data": {"status": "ok", "latest_file": "analytics_20260122.json", ...},
    "products_data": {"status": "ok", ...},
    "moa_worker": {"status": "ok", "response_time_ms": 234}
  }
}
```

**Dependencies:** Zadanie 1.1 + 1.2  
**Time Estimate:** 30 minut

---

### FAZA 2: AI AGENTS IMPLEMENTATION (Priority: HIGH 🔥)

**Cel:** Implementować 10 agentów AI jako osobne procesy z real-time monitoring

#### Zadanie 2.1: Agent Framework - Base Class

**Opis:** Stworzyć bazową klasę dla wszystkich agentów z common functionality  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\agents\base_agent.py` (NOWY)  
**Akcje:**

```python
"""
Base Agent Framework dla PUMO Analytics Agents
Każdy agent dziedziczy z BaseAgent i implementuje run()
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, List, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class AgentStatus:
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"
    STOPPED = "stopped"

class BaseAgent(ABC):
    """
    Bazowa klasa dla wszystkich PUMO Analytics Agents
    """
    def __init__(self, agent_id: str, name: str, interval_seconds: int = 60):
        self.agent_id = agent_id
        self.name = name
        self.interval_seconds = interval_seconds
        self.status = AgentStatus.IDLE
        self.last_run: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.metrics: Dict[str, Any] = {}
        self.alerts: List[Dict[str, Any]] = []
        self._running = False

    @abstractmethod
    async def run(self) -> Dict[str, Any]:
        """
        Main logic agenta - MUST be implemented by subclass

        Returns:
            Dict z wynikami wykonania (metrics, alerts, etc.)
        """
        pass

    async def execute_cycle(self):
        """
        Wykonaj jeden cykl agenta
        """
        try:
            self.status = AgentStatus.RUNNING
            result = await self.run()

            self.last_run = datetime.now()
            self.metrics.update(result.get('metrics', {}))

            # Dodaj alerty jeśli są
            if result.get('alerts'):
                self.alerts.extend(result['alerts'])

            self.status = AgentStatus.IDLE
            logger.info(f"[{self.agent_id}] Cycle completed successfully")

        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"[{self.agent_id}] Error: {e}")

    async def start(self):
        """
        Start agent loop
        """
        self._running = True
        logger.info(f"[{self.agent_id}] Starting agent loop (interval: {self.interval_seconds}s)")

        while self._running:
            await self.execute_cycle()
            await asyncio.sleep(self.interval_seconds)

    def stop(self):
        """
        Stop agent loop
        """
        self._running = False
        self.status = AgentStatus.STOPPED
        logger.info(f"[{self.agent_id}] Agent stopped")

    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status
        """
        return {
            "id": self.agent_id,
            "name": self.name,
            "status": self.status,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "last_error": self.last_error,
            "interval_seconds": self.interval_seconds,
            "metrics": self.metrics,
            "alerts_count": len(self.alerts)
        }
```

**Expected Output:** Base class gotowy do użycia przez 10 agentów  
**Dependencies:** Brak  
**Time Estimate:** 45 minut

---

#### Zadanie 2.2: Implementacja Agent A1 - Uptime Monitor

**Opis:** First agent - monitoruje dostępność kluczowych endpoints  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\agents\uptime_agent.py` (NOWY)  
**Akcje:**

```python
"""
Agent A1: Uptime + Transactions Monitor
Monitoruje dostępność głównych endpoints i syntetyczne transakcje
"""

from .base_agent import BaseAgent
import httpx
from datetime import datetime, timedelta

class UptimeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a1",
            name="Uptime + Transactions",
            interval_seconds=60  # Co 1 minutę
        )

        # Endpoints do monitorowania
        self.endpoints = [
            {"url": "http://localhost:8001/v1/analytics/health", "name": "Analytics API"},
            {"url": "http://localhost:3002", "name": "Frontend Dashboard"},
            {"url": "https://lucjan-moa.stolarnia-ams.workers.dev/health", "name": "MOA Worker"},
        ]

        self.sla_target = 99.9  # 99.9% uptime target
        self.uptime_history = []  # Last 24h

    async def run(self) -> dict:
        results = {
            "metrics": {},
            "alerts": []
        }

        checks = []

        # Check all endpoints
        async with httpx.AsyncClient(timeout=10.0) as client:
            for endpoint in self.endpoints:
                try:
                    start = datetime.now()
                    response = await client.get(endpoint["url"])
                    duration_ms = (datetime.now() - start).total_seconds() * 1000

                    is_up = response.status_code < 500

                    check = {
                        "name": endpoint["name"],
                        "url": endpoint["url"],
                        "status": "up" if is_up else "down",
                        "status_code": response.status_code,
                        "response_time_ms": round(duration_ms, 2),
                        "timestamp": datetime.now().isoformat()
                    }
                    checks.append(check)

                    # Alert if down or slow
                    if not is_up:
                        results["alerts"].append({
                            "severity": "critical",
                            "message": f"{endpoint['name']} is DOWN (status {response.status_code})",
                            "endpoint": endpoint["name"],
                            "timestamp": datetime.now().isoformat()
                        })
                    elif duration_ms > 5000:  # > 5 seconds
                        results["alerts"].append({
                            "severity": "warning",
                            "message": f"{endpoint['name']} is SLOW ({duration_ms:.0f}ms)",
                            "endpoint": endpoint["name"],
                            "response_time_ms": duration_ms,
                            "timestamp": datetime.now().isoformat()
                        })

                except Exception as e:
                    check = {
                        "name": endpoint["name"],
                        "status": "error",
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }
                    checks.append(check)

                    results["alerts"].append({
                        "severity": "critical",
                        "message": f"{endpoint['name']} connection failed: {str(e)}",
                        "endpoint": endpoint["name"],
                        "timestamp": datetime.now().isoformat()
                    })

        # Calculate uptime percentage
        up_count = sum(1 for c in checks if c.get("status") == "up")
        uptime_percent = (up_count / len(checks) * 100) if checks else 0

        # Store in history (keep 24h = 1440 checks at 1/min)
        self.uptime_history.append({
            "timestamp": datetime.now(),
            "uptime_percent": uptime_percent
        })

        # Keep only last 24h
        cutoff = datetime.now() - timedelta(hours=24)
        self.uptime_history = [h for h in self.uptime_history if h["timestamp"] > cutoff]

        # Calculate 24h average
        avg_uptime_24h = sum(h["uptime_percent"] for h in self.uptime_history) / len(self.uptime_history) if self.uptime_history else 0

        results["metrics"] = {
            "current_uptime_percent": round(uptime_percent, 2),
            "avg_uptime_24h": round(avg_uptime_24h, 2),
            "endpoints_up": up_count,
            "endpoints_total": len(checks),
            "checks": checks,
            "sla_target": self.sla_target,
            "sla_met": avg_uptime_24h >= self.sla_target
        }

        return results
```

**Test:**

```python
# Test w terminalu
import asyncio
from app.agents.uptime_agent import UptimeAgent

async def test():
    agent = UptimeAgent()
    result = await agent.run()
    print(result)

asyncio.run(test())
```

**Expected Output:** Dict z metrykami, alerty jeśli endpoint down  
**Dependencies:** Zadanie 2.1 (BaseAgent)  
**Time Estimate:** 60 minut

---

#### Zadanie 2.3: Agent Manager - Orchestrator

**Opis:** Centralny manager uruchamiający wszystkie agenty i zbierający status  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api\app\agents\manager.py` (NOWY)  
**Akcje:**

```python
"""
Agent Manager - Orchestrator dla wszystkich PUMO Agents
"""

import asyncio
from typing import Dict, List
from datetime import datetime
import logging

from .uptime_agent import UptimeAgent
# from .performance_agent import PerformanceAgent  # TODO: implement
# ... inne agenty

logger = logging.getLogger(__name__)

class AgentManager:
    """
    Centralized manager dla wszystkich analytics agents
    """
    def __init__(self):
        self.agents = {}
        self.tasks = {}

        # Initialize all agents
        self._register_agents()

    def _register_agents(self):
        """
        Register all available agents
        """
        # A1: Uptime Monitor
        self.agents["a1"] = UptimeAgent()

        # TODO: Add remaining agents
        # self.agents["a2"] = PerformanceAgent()
        # self.agents["a3"] = ErrorBudgetAgent()
        # ... etc

        logger.info(f"Registered {len(self.agents)} agents")

    async def start_all(self):
        """
        Start all agents in parallel
        """
        logger.info("Starting all agents...")

        for agent_id, agent in self.agents.items():
            task = asyncio.create_task(agent.start())
            self.tasks[agent_id] = task
            logger.info(f"Started agent {agent_id}: {agent.name}")

        logger.info(f"All {len(self.agents)} agents running")

    async def stop_all(self):
        """
        Stop all agents gracefully
        """
        logger.info("Stopping all agents...")

        for agent in self.agents.values():
            agent.stop()

        # Wait for tasks to finish
        await asyncio.gather(*self.tasks.values(), return_exceptions=True)

        logger.info("All agents stopped")

    def get_all_status(self) -> List[Dict]:
        """
        Get status of all agents
        """
        return [agent.get_status() for agent in self.agents.values()]

    def get_agent_status(self, agent_id: str) -> Dict:
        """
        Get status of specific agent
        """
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        return agent.get_status()

    def get_all_alerts(self) -> List[Dict]:
        """
        Get all alerts from all agents
        """
        all_alerts = []
        for agent in self.agents.values():
            for alert in agent.alerts:
                alert["agent_id"] = agent.agent_id
                alert["agent_name"] = agent.name
                all_alerts.append(alert)

        # Sort by timestamp (newest first)
        all_alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return all_alerts

# Global instance
agent_manager = AgentManager()
```

**API Endpoint (dodaj do analytics_ai.py):**

```python
from app.agents.manager import agent_manager

@router.get("/agents/status")
async def get_agents_status():
    """
    Get status of all analytics agents
    """
    return {
        "agents": agent_manager.get_all_status(),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """
    Get status of specific agent
    """
    try:
        status = agent_manager.get_agent_status(agent_id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/agents/alerts")
async def get_all_alerts():
    """
    Get all alerts from all agents
    """
    return {
        "alerts": agent_manager.get_all_alerts(),
        "timestamp": datetime.now().isoformat()
    }
```

**Startup Event (main.py):**

```python
from app.agents.manager import agent_manager

@app.on_event("startup")
async def startup_agents():
    """Start all analytics agents on startup"""
    asyncio.create_task(agent_manager.start_all())

@app.on_event("shutdown")
async def shutdown_agents():
    """Stop all agents on shutdown"""
    await agent_manager.stop_all()
```

**Expected Output:** `/v1/analytics/agents/status` zwraca live status wszystkich agentów  
**Dependencies:** Zadanie 2.1 + 2.2  
**Time Estimate:** 60 minut

---

#### Zadanie 2.4: Frontend Integration - Real Agent Status

**Opis:** Połączyć UI agent status bar z prawdziwym API  
**Plik:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy\src\AppAdvanced.tsx`  
**Akcje:**

**1. Dodaj API method (api.ts):**

```typescript
async getAgentsStatus(): Promise<Array<AgentStatus>> {
    const response = await fetch(`${this.baseUrl}/analytics/agents/status`);
    if (!response.ok) throw new Error('Failed to fetch agents status');
    const data = await response.json();
    return data.agents;
}

async getAgentsAlerts(): Promise<Array<any>> {
    const response = await fetch(`${this.baseUrl}/analytics/agents/alerts`);
    if (!response.ok) throw new Error('Failed to fetch alerts');
    const data = await response.json();
    return data.alerts;
}
```

**2. Update AppAdvanced.tsx (zamiast fake status):**

```typescript
// Usuń hardcoded agents useState
const [agents, setAgents] = useState<AgentStatus[]>([]);
const [agentAlerts, setAgentAlerts] = useState<any[]>([]);

// W loadAllData() dodaj:
const agentsStatus = await api.getAgentsStatus();
setAgents(agentsStatus);

const alerts = await api.getAgentsAlerts();
setAgentAlerts(alerts);
```

**3. Alerts Panel:**

```typescript
{/* Agent Alerts */}
{agentAlerts.length > 0 && (
    <div style={{
        background: '#1a0000',
        border: '1px solid #ff6b6b',
        padding: 15,
        marginBottom: 20,
        borderRadius: 8
    }}>
        <h3 style={{ color: '#ff6b6b' }}>⚠️ Active Alerts ({agentAlerts.length})</h3>
        {agentAlerts.slice(0, 5).map((alert, i) => (
            <div key={i} style={{
                padding: 10,
                background: '#0f0f0f',
                marginTop: 10,
                borderLeft: `3px solid ${alert.severity === 'critical' ? '#ff6b6b' : '#feca57'}`
            }}>
                <div style={{ fontWeight: 'bold', color: alert.severity === 'critical' ? '#ff6b6b' : '#feca57' }}>
                    [{alert.agent_name}] {alert.severity.toUpperCase()}
                </div>
                <div>{alert.message}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 5 }}>
                    {new Date(alert.timestamp).toLocaleString('pl')}
                </div>
            </div>
        ))}
    </div>
)}
```

**Expected Output:** Dashboard pokazuje real agent status + alerts  
**Dependencies:** Zadanie 2.3 (Agent Manager API)  
**Time Estimate:** 40 minut

---

### FAZA 3: MOA BUYING GUIDES (Priority: MEDIUM 🎨)

**Cel:** Uruchomić generowanie buying guides przez LUCJAN MOA v3.0 Worker

#### Zadanie 3.1: Test MOA Worker Connectivity

**Opis:** Zweryfikować że MOA Worker odpowiada i działa prawidłowo  
**Akcje:**

```bash
# Test health
curl https://lucjan-moa.stolarnia-ams.workers.dev/health

# Test chat endpoint
curl https://lucjan-moa.stolarnia-ams.workers.dev/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test MOA - czy działasz?",
    "model": "gemini-2.0-flash-exp",
    "enableMOA": true,
    "maxTokens": 500
  }'
```

**Expected Output:** JSON response z "response" field, model info  
**Dependencies:** Brak - external service  
**Time Estimate:** 15 minut

---

#### Zadanie 3.2: Backend Guides API - Full Test

**Opis:** Test pełnego flow generowania poradnika  
**Plik:** Backend już istnieje w `app/routes/guides.py`  
**Akcje:**

```bash
# Test generate endpoint
curl http://localhost:8001/v1/guides/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Materac piankowy 160x200",
    "category": "Materace",
    "additional_context": "Dla par, preferencja twardości medium, budżet do 2000 PLN"
  }'

# Powinno zwrócić JSON z:
# - guide_content
# - key_features[]
# - buying_tips[]
# - recommended_products[]
# - confidence_score
```

**Debug jeśli błąd:**

1. Sprawdź logi backend
2. Verify MOA Worker response format
3. Check JSON parsing w guides.py (linie 91-104)

**Expected Output:** Kompletny buying guide JSON < 60 sekund  
**Dependencies:** Zadanie 1.1 (backend running) + 3.1  
**Time Estimate:** 30 minut

---

#### Zadanie 3.3: Frontend Buying Guides - Full Flow Test

**Opis:** Test generowania + wyświetlania poradników w UI  
**Plik:** UI już istnieje w AppAdvanced.tsx (linie 200-250, buying-guides tab)  
**Akcje:**

1. Uruchom frontend: `npm run dev`
2. Przejdź do zakładki "BUYING GUIDES"
3. Wypełnij formularz:
   - Product Name: "Fotel gamingowy"
   - Category: "Fotele"
   - Context: "Dla graczy, długie sesje, wsparcie lędźwiowe"
4. Kliknij "Generuj Poradnik"
5. Czekaj ~60 sekund (MOA processing)
6. Verify:
   - ✅ Loading state pokazuje się
   - ✅ Progress: "Multi-Agent Orchestration w toku..."
   - ✅ Guide pojawia się po zakończeniu
   - ✅ Sections: Guide Content, Key Features, Buying Tips, Recommended Products
   - ✅ Guide dodany do listy
   - ✅ Możliwość ponownego otwarcia

**Błędy do obsługi:**

- Timeout (> 120s) - zwiększ timeout w api.ts
- MOA error - check response format parsing
- Empty guide - validate prompt structure

**Expected Output:** Pełny buying guide wygenerowany i wyświetlony w UI  
**Dependencies:** Zadanie 3.2  
**Time Estimate:** 30 minut

---

### FAZA 4: REAL-TIME DATA FLOW (Priority: HIGH 🔥)

**Cel:** Prawdziwe dane z IdoSell → Backend → Frontend bez fake fallbacks

#### Zadanie 4.1: Analytics Endpoints - Real Data Integration

**Opis:** Upewnić się że wszystkie analytics endpoints czytają z exports  
**Plik:** `app/routes/analytics_ai.py`  
**Akcje:**

**Verify EXPORTS_DIR path:**

```python
# Linia 13 w analytics_ai.py
EXPORTS_DIR = Path("u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports")

# Test w Pythonie
from pathlib import Path
exports_dir = Path("u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports")
print(f"Exists: {exports_dir.exists()}")
print(f"Files: {list(exports_dir.glob('*.json'))}")
```

**Test każdy endpoint:**

```bash
curl http://localhost:8001/v1/analytics/business-overview
curl http://localhost:8001/v1/analytics/revenue-trend?days=30
curl http://localhost:8001/v1/analytics/top-products?limit=10
curl http://localhost:8001/v1/analytics/customer-segments
curl http://localhost:8001/v1/analytics/payment-methods
curl http://localhost:8001/v1/analytics/order-sources
curl http://localhost:8001/v1/analytics/customers-detailed?limit=20
```

**Expected Output:** Wszystkie zwracają real JSON data (nie 404/500)  
**Dependencies:** Zadanie 1.2 (data exports)  
**Time Estimate:** 30 minut

---

#### Zadanie 4.2: Frontend Data Flow - End-to-End Test

**Opis:** Verify że dashboard ładuje się z prawdziwymi danymi  
**Akcje:**

1. Backend running: `python -m uvicorn app.main:app --port 8001 --reload`
2. Frontend running: `npm run dev` (port 3002)
3. Open http://localhost:3002
4. Open Chrome DevTools → Network tab
5. Refresh page
6. Verify requests:
   - ✅ `/analytics/kpis` → Status 200, real data
   - ✅ `/analytics/revenue-trend` → Status 200, array of objects
   - ✅ `/analytics/top-products` → Status 200, products array
   - ✅ `/analytics/customer-segments` → Status 200, segments data
   - ✅ NO fake data fallbacks triggered (check console)

**Check each tab:**

- Overview: KPIs show real numbers
- Products: Real product names from IdoSell
- Customers: Real emails (anonymized if needed)
- AI Predictions: Calculations based on real trend data

**Expected Output:** Dashboard fully populated with real data, no errors  
**Dependencies:** Zadanie 4.1 + 1.4 (fake data removed)  
**Time Estimate:** 30 minut

---

#### Zadanie 4.3: Auto-Refresh with Real Data

**Opis:** 60-second auto-refresh powinien pobierać świeże dane  
**Plik:** AppAdvanced.tsx już ma useEffect dla auto-refresh (linie 97-104)  
**Akcje:**

**Verify auto-refresh logic:**

```typescript
// Auto-refresh every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    loadAllData(); // ← Powinno wywoływać API, nie fake data
    loadAutoInsights();
  }, 60000);

  return () => clearInterval(interval);
}, []);
```

**Test:**

1. Uruchom dashboard
2. Otwórz Network tab
3. Czekaj 60 sekund
4. Verify: Nowe requesty do API co 60s
5. Check: Loading indicator pojawia się na 1-2 sekundy

**Enhancement (opcjonalnie):**

```typescript
// Add loading state
const [isRefreshing, setIsRefreshing] = useState(false);

const loadAllData = async () => {
  setIsRefreshing(true);
  try {
    // ... load data
  } finally {
    setIsRefreshing(false);
  }
};
```

**Expected Output:** Dashboard odświeża dane co 60s automatycznie  
**Dependencies:** Zadanie 4.2  
**Time Estimate:** 20 minut

---

### FAZA 5: DEPLOYMENT & MONITORING (Priority: LOW 📦)

**Cel:** Deploy na produkcję (Cloudflare) i setup continuous monitoring

#### Zadanie 5.1: Cloudflare Pages Deployment (Frontend)

**Opis:** Deploy frontend dashboardu na Cloudflare Pages  
**Akcje:**

**1. Build frontend:**

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy
npm run build  # Output: dist/
```

**2. Cloudflare Pages setup:**

```bash
# Przez dashboard lub wrangler
npx wrangler pages deploy dist \
  --project-name=pumo-dashboard \
  --branch=main

# Lub przez GitHub integration:
# Settings → Pages → Create Project → Connect to Git
```

**3. Environment variables (Cloudflare dashboard):**

```
VITE_API_BASE=https://api.pumo.jimbo77.com
```

**4. Custom domain:**

- Add `pumo.jimbo77.com` w Cloudflare Pages → Custom domains
- DNS auto-configured

**Expected Output:** https://pumo.jimbo77.com lub https://pumo-dashboard.pages.dev  
**Dependencies:** Wszystkie poprzednie fazy (working locally)  
**Time Estimate:** 45 minut

---

#### Zadanie 5.2: Backend Deployment (Railway/Render/VPS)

**Opis:** Deploy FastAPI backend z agentami  
**Opcje:**

- **Railway:** Easiest, auto-deploy z GitHub
- **Render:** Free tier available
- **VPS (Digital Ocean/Hetzner):** Full control

**Akcje (Railway example):**

1. Dodaj `Procfile`:

   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. `railway.json`:

   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

3. Railway CLI:

   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```

4. Environment variables (Railway dashboard):
   ```
   IDOSELL_API_KEY=...
   DATABASE_URL=...
   REDIS_URL=...
   ```

**Expected Output:** Backend dostępny na https://pumo-api.railway.app  
**Dependencies:** Wszystkie fazy działają lokalnie  
**Time Estimate:** 90 minut

---

#### Zadanie 5.3: Monitoring & Alerting Setup

**Opis:** Setup Sentry/Slack alerts dla production errors  
**Akcje:**

**1. Sentry (errors):**

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

**2. Slack webhooks (agent alerts):**

```python
# agents/base_agent.py
async def send_slack_alert(self, alert: dict):
    """Send critical alerts to Slack"""
    if alert["severity"] == "critical":
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        if webhook_url:
            async with httpx.AsyncClient() as client:
                await client.post(webhook_url, json={
                    "text": f"🚨 [{self.name}] {alert['message']}"
                })
```

**3. Uptime monitoring (UptimeRobot):**

- Add https://pumo.jimbo77.com
- Add https://api.pumo.jimbo77.com/health
- Interval: 5 minutes
- Alerts: Email/Slack

**Expected Output:** Alerts w Slack przy critical issues  
**Dependencies:** Zadanie 5.1 + 5.2 (deployed)  
**Time Estimate:** 60 minut

---

## 🤖 MOA TASK DISTRIBUTION (Multi-Agent Orchestration)

### Model 1: GPT-4 (Backend Implementation Expert)

**Specjalizacja:** Python/FastAPI, system architecture, database design  
**Zadania:**

- FAZA 1: Wszystkie zadania (1.1-1.5) - Backend setup
- FAZA 2: Zadania 2.1-2.3 - Agent framework i manager
- FAZA 4: Zadanie 4.1 - Real data integration

**Prompt dla Modelu 1:**

```
Jesteś ekspertem Python/FastAPI. Zaimplementuj backend dla PUMO Analytics Dashboard:

1. PRIORYTET: Uruchom FastAPI na porcie 8001 z routes analytics_ai.py i guides.py
2. Dodaj CORS middleware dla localhost:3002
3. Stwórz BaseAgent class dla agentów AI
4. Implementuj UptimeAgent (pierwszy z 10 agentów)
5. Stwórz AgentManager do orchestracji
6. Dodaj endpoints /agents/status i /agents/alerts
7. Usuń fake data - connect do real exports/*.json

Każde zadanie opisz dokładnie w komentarzach. Testuj po każdym kroku.
```

---

### Model 2: Claude Sonnet (Frontend Integration Specialist)

**Specjalizacja:** React/TypeScript, UI/UX, real-time updates  
**Zadania:**

- FAZA 1: Zadanie 1.4 - Usunięcie fake data z api.ts
- FAZA 2: Zadanie 2.4 - Frontend agent status integration
- FAZA 3: Zadanie 3.3 - Buying guides UI flow
- FAZA 4: Zadania 4.2-4.3 - Frontend data flow + auto-refresh

**Prompt dla Modelu 2:**

```
Jesteś ekspertem React/TypeScript. Połącz frontend PUMO Dashboard z backend API:

1. api.ts: Usuń WSZYSTKIE fallback fake data - throw errors instead
2. AppAdvanced.tsx: Replace fake agents status z prawdziwym API call
3. Add getAgentsStatus() i getAgentsAlerts() do API client
4. Implement alerts panel showing real-time agent warnings
5. Test buying guides flow end-to-end
6. Verify auto-refresh co 60s pobiera fresh data

UI musi być responsive i pokazywać loading states. Error handling crucial!
```

---

### Model 3: DeepSeek R1 (Testing & Validation Expert)

**Specjalizacja:** Testing, debugging, quality assurance  
**Zadania:**

- FAZA 1: Zadanie 1.2 - Weryfikacja IdoSell data exports
- FAZA 1: Zadanie 1.5 - Health check endpoint
- FAZA 3: Zadania 3.1-3.2 - MOA Worker testing
- FAZA 5: Wszystkie zadania - Deployment validation

**Prompt dla Modelu 3:**

```
Jesteś ekspertem testowania i QA. Zweryfikuj PUMO Analytics Dashboard:

1. Test IdoSell export - sprawdź czy wszystkie 4 pliki JSON istnieją
2. Health check endpoint - verify all components status
3. MOA Worker connectivity - test chat endpoint
4. Backend endpoints - curl each /analytics/* endpoint
5. Frontend end-to-end - verify all 7 tabs load real data
6. Agents monitoring - confirm all agents running and reporting
7. Deployment smoke tests - production URLs return 200

Dokumentuj każdy test z expected vs actual results. Report bugs ASAP.
```

---

## 📊 EXECUTION TIMELINE

| Faza       | Zadania                | Model             | Czas       | Status  |
| ---------- | ---------------------- | ----------------- | ---------- | ------- |
| **FAZA 1** | Backend Infrastructure | GPT-4             | 3-4h       | ⏳ TODO |
| **FAZA 2** | AI Agents (A1-A10)     | GPT-4             | 4-6h       | ⏳ TODO |
| **FAZA 3** | MOA Buying Guides      | Claude            | 1-2h       | ⏳ TODO |
| **FAZA 4** | Real-time Data Flow    | Claude + DeepSeek | 2-3h       | ⏳ TODO |
| **FAZA 5** | Deployment             | DeepSeek          | 2-3h       | ⏳ TODO |
| **TOTAL**  | 25 zadań               | 3 modele          | **12-18h** | -       |

---

## ✅ DEFINITION OF DONE

### Backend (Faza 1-2):

- [ ] FastAPI running on port 8001
- [ ] All `/v1/analytics/*` endpoints return 200 with real data
- [ ] `/v1/guides/*` endpoints functional
- [ ] At least Agent A1 (Uptime) running and reporting
- [ ] `/v1/analytics/agents/status` shows live agent status
- [ ] Health endpoint shows all components OK

### Frontend (Faza 3-4):

- [ ] Dashboard loads without errors on localhost:3002
- [ ] All 7 tabs display real data (no fake fallbacks)
- [ ] Agent status bar shows real-time status from API
- [ ] Buying guides generate successfully via MOA
- [ ] Auto-refresh works every 60 seconds
- [ ] No console errors related to API calls

### Production (Faza 5):

- [ ] Frontend deployed to Cloudflare Pages
- [ ] Backend deployed to Railway/Render
- [ ] Custom domains configured
- [ ] Monitoring alerts active (Sentry + Slack)
- [ ] Smoke tests pass on production URLs

---

## 🚨 RISK MITIGATION

### Risk 1: IdoSell API Rate Limiting

**Mitigation:** Cache exports for 24h, use incremental updates  
**Fallback:** Load from last known good export file

### Risk 2: MOA Worker Timeout

**Mitigation:** Increase timeout to 120s, retry logic  
**Fallback:** Show "Generation in progress, try again in 1 min"

### Risk 3: Agent Overwhelming System

**Mitigation:** Stagger agent start times (0s, 10s, 20s, etc.)  
**Fallback:** Disable agents individually via config

### Risk 4: Memory Leak in Long-Running Agents

**Mitigation:** Agent auto-restart every 24h  
**Monitoring:** Memory usage tracking in metrics

---

## 📞 SUPPORT & ESCALATION

**Backend Issues:** @GPT-4 Model  
**Frontend Issues:** @Claude Model  
**Testing/Deployment:** @DeepSeek Model  
**MOA Worker:** LUCJAN maintainer  
**IdoSell API:** Check API docs + credentials

---

**READY FOR EXECUTION - START MOA ORCHESTRATION! 🚀**
