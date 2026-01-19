# Network Control Center - Integration Guide

## ✅ Wdrożenie Ukończone

Network Control Center został zintegrowany z systemem JIMBO77 jako moduł monitoringu infrastruktury.

## 🎯 Funkcje

### 1. Real-time Network Monitoring

- **Port Scanning** - wykrywanie aktywnych portów i usług
- **Process Tracking** - monitorowanie procesów używających portów
- **Vulnerability Scoring** - ocena podatności (0-100)
- **Network Graph** - wizualizacja połączeń sieciowych

### 2. PowerShell Tools (14 narzędzi)

**DNS Management:**

- Flush DNS cache
- Show DNS cache
- DNS resolution testing

**Network Diagnostics:**

- Active ports listing
- Port-to-process mapping
- Kill port process
- Network stack reset

**System Info:**

- Computer information
- Running services
- Temp files cleanup

### 3. AI-Powered Analysis

**Dual AI Integration:**

- **Agent Zero** (Primary) - Local, fast, port 50100
- **OpenRouter** (Fallback) - Cloud, Qwen 2.5 72B

**AI Features:**

- Security vulnerability analysis
- Network topology insights
- Automated threat detection
- Actionable recommendations

### 4. Data Export

- **PDF Reports** - Comprehensive metrics with charts
- **CSV/JSON** - Raw data export
- **Real-time Metrics** - Event tracking

## 🚀 Backend API Endpoints

### Network Services

```bash
GET  /api/network/services          # List all active services
GET  /api/network/tunnels            # List active tunnels
GET  /api/network/ports/{port}/process  # Get process for port
POST /api/network/ports/{port}/kill     # Kill process on port
GET  /api/network/health             # Health check
```

### PowerShell Execution

```bash
POST /api/network/powershell
Body: {
  "command": "Get-NetTCPConnection | Where-Object {$_.State -eq 'Listen'}",
  "params": {}
}
```

### 🎯 Task Orchestration (Blueprint Architecture)

**NEW - Added 2026-01-19**

```bash
POST /api/network/orchestrate        # Execute Blueprint orchestration flow
GET  /api/network/orchestration/status  # Check orchestrator health
```

**Orchestration Flow:**
```
Request → Jimbo (decompose) → Brain (strategy) → Pinky (validate) → Workers → Elwirka (finalize)
```

**Example Request:**
```typescript
POST /api/network/orchestrate
Body: {
  "task": "Analyze network security and recommend improvements",
  "context": null,
  "agents": null  // Auto-selected by Brain
}
```

**Response:**
```json
{
  "task": "...",
  "timestamp": "2026-01-19T04:00:00Z",
  "status": "completed",
  "steps": {
    "jimbo": { "success": true, "content": "...", "provider": "agent-zero" },
    "brain": { "success": true, "content": "..." },
    "pinky": { "success": true, "verdict": "APPROVE" },
    "execution": [...],
    "elwirka": { "success": true, "content": "..." }
  },
  "final_output": {...},
  "checklist": [...],
  "next_steps": [...]
}
```

**Pinky STOP Authority:**
Pinky can halt execution if:
- Plan will break production
- Security risk > 50
- Missing critical dependencies
- Circular logic detected

## 🔧 Konfiguracja

### 1. Environment Variables

Create `.env.local`:

```env
# OpenRouter API (fallback AI)
VITE_OPENROUTER_API_KEY=sk-or-v1-xxx

# Backend API Gateway
VITE_BACKEND_API_URL=http://localhost:3885

# Agent Zero (primary AI)
VITE_AGENT_ZERO_API_URL=http://localhost:50100
```

### 2. Backend API Setup

Dodano route: `app/routes/network.py`
Router zarejestrowany w `app/main.py`

**Restart Backend:**

```bash
cd U:/The_yellow_hub/JIMBO_devz_inc_HUB/Jimbo_77/api
docker-compose restart api-gateway
```

### 3. Frontend Integration

**Install dependencies:**

```bash
cd U:/The_yellow_hub/JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/network-control
npm install
```

**Start dev server:**

```bash
npm run dev
# Runs on: http://localhost:5173
```

**Build for production:**

```bash
npm run build
# Output: dist/
```

## 📊 Integration Points

### A. Main Hub Dashboard

Add link in `apps/hub/src/components/Navigation.tsx`:

```tsx
<NavLink to="/network-control">
  <NetworkIcon />
  Network Control
</NavLink>
```

### B. Agent System Integration

Network Control współpracuje z:

- **bonzo-research-agent** (6062) - Data collection
- **bonzo-guardian-agent** (6004) - Security monitoring
- **bonzo-deployment-coordinator** (6001) - Infrastructure orchestration

### C. 4 Strony WWW w Systemie

**Obecne aplikacje Frontend:**

1. **Hub** (`apps/hub`) - Main dashboard
2. **Magnet** (`apps/magnet`) - ?
3. **Project** (`apps/project`) - Project management
4. **Pumo-Frontend-Legacy** (`apps/pumo-frontend-legacy`) - Legacy e-commerce
5. **Network Control** (`apps/network-control`) - **NOWY**

**Plan Konsolidacji:**

```bash
# Dodaj routing w Hub dla wszystkich apps
apps/hub/src/routes/
  ├── index.tsx          # Main routes
  ├── network.tsx        # Network Control routes
  ├── projects.tsx       # Project routes
  └── magnet.tsx         # Magnet routes
```

## 🔐 Security Notes

**PowerShell Commands:**

- ⚠️ Wymagają uprawnień administratora
- ✅ Walidacja po stronie backend
- ✅ Rate limiting zalecany

**API Security:**

- ✅ CORS skonfigurowany
- ⏳ TODO: JWT authentication
- ⏳ TODO: RBAC integration

## 📈 Monitoring & Metrics

**Tracked Events:**

- `app_initialized`
- `service_scanned`
- `vulnerability_detected`
- `powershell_executed`
- `ai_analysis_requested`
- `report_generated`

**Export Formats:**

- JSON - Full metrics
- CSV - Tabular data
- PDF - Visual reports

## 🎨 UI Features

**Dashboard Tabs:**

1. **Dashboard** - Main overview
2. **Architecture** - Network topology
3. **Metrics** - Performance & usage
4. **🎯 Orchestration** - Task orchestration (NEW)
5. **Tools** - PowerShell utilities

**Orchestration Panel:**
- Task input form with textarea
- Real-time flow visualization (Jimbo → Brain → Pinky → Elwirka)
- Step-by-step tracking with expand/collapse
- Provider badges (Agent Zero / OpenRouter)
- Final output display with checklist & next steps
- Error handling with fallback display

**Real-time Updates:**

- Service status refreshes every 30s
- Vulnerability scores auto-calculated
- AI insights on-demand
- Orchestration steps stream in real-time

## 🔄 Workflow Example

**1. Security Audit:**

```typescript
// Frontend calls AI service
const analysis = await aiService.analyzeNetworkSecurity({
  services: currentServices,
  tunnels: activeTunnels,
  vpnStatus: vpnInfo,
});

// Agent Zero analyzes → provides recommendations
// If unavailable → OpenRouter fallback
```

**2. Port Management:**

```typescript
// Get process on port
const process = await fetch("/api/network/ports/8080/process");

// Kill if needed
await fetch("/api/network/ports/8080/kill", { method: "POST" });
```

**3. PowerShell Execution:**

```typescript
// Flush DNS cache
const result = await aiService.executePowerShellCommand("Clear-DnsClientCache");
```

## ✅ Integration Checklist

- [x] Backend API routes created (`routes/network.py`)
- [x] Router registered in `main.py`
- [x] AI Service migrated (Gemini → OpenRouter + Agent Zero)
- [x] Frontend copied to `apps/network-control`
- [x] Environment variables configured
- [x] **DONE:** Orchestration endpoints added (Jimbo/Brain/Pinky/Elwirka)
- [x] **DONE:** OrchestrationPanel.tsx component created
- [x] **DONE:** Orchestration tab integrated in App.tsx
- [ ] **TODO:** Add to Hub navigation
- [ ] **TODO:** Build & deploy to production
- [ ] **TODO:** Configure OpenRouter API key
- [ ] **TODO:** Test Agent Zero integration
- [ ] **TODO:** Setup RBAC permissions
- [ ] **TODO:** Test full orchestration flow with real agents

## 🚀 Next Steps+ orchestration routes
2. **Configure API Keys** - OpenRouter + Agent Zero
3. **Test Orchestration** - Simple task → full flow
4. **Test Integration** - Verify all endpoints
5. **Add Hub Link** - Navigation menu

### Short-term (This Week):

6. **Connect 4 WWW Apps** - Unified routing
7. **Real Agent Execution** - Integrate with Docker agents (6001-6062)
8. **Real Tunnel Management** - Cloudflare integration
9. **WebSocket Updates** - Real-time monitoring
10. **RBAC Setup** - Secure endpoints

### Mid-term (This Month):

11. **Orchestration Templates** - Pre-defined workflows (security audit, deployment, optimization)
12. **Orchestration History** - Store past executions in database
13. **Agent Registry Integration** - Auto-discover available agents
14. **Cloud Deployment** - Docker container

### Long-term (Next Sprint):

15. **Advanced AI Features** - Predictive alerts, pattern recognition
16. **Multi-server Support** - Remote monitoring
17. **Automated Remediation** - AI-driven fixes with Elwirka execution
18. **Orchestration Analytics** - Success rates, performance metric
9. **Cloud Deployment** - Docker container
10. **Advanced AI Features** - Predictive alerts
11. **Multi-server Support** - Remote monitoring
12. **Automated Remediation** - AI-driven fixes

## 📝 Notes

**Agent Zero Benefits:**

- ✅ Local deployment (no API costs)
- ✅ Fast response times
- ✅ Full control over prompts
- ✅ Privacy (data stays local)

**OpenRouter Benefits:**

- ✅ Cloud fallback (always available)
- ✅ Multiple models (Qwen, GPT-4, Claude)
- ✅ No local infrastructure needed
- ✅ Pay-per-use pricing

**Best Practice:**
Use Agent Zero for routine analysis (port scans, service checks)
Use OpenRouter for complex analysis (threat modeling, advanced recommendations)

## 🆘 Troubleshooting

**Backend not responding:**

```bash
docker logs bonzo-api-gateway --tail 50
# Check for network route errors
```

**Agent Zero unavailable:**

```bash
curl http://localhost:50100/health
# Should return: {"status": "healthy"}
```

**PowerShell fails:**

- Check Windows PowerShell execution policy
- Verify backend has admin privileges
- Test command manually first

**AI analysis timeout:**

- Agent Zero might be processing
- Fallback to OpenRouter should activate
- Check network connectivity

---

**Status:** ✅ Integration Complete - Ready for Testing
**Version:** 1.0.0
**Last Updated:** 2026-01-19
