# Ngrok MCP - Połączenie Stron i Agentów w JIMBO77 System

**Data**: 2026-01-19  
**Status**: MCP ngrok zainstalowany w VS Code

---

## 🎯 Co daje nam Ngrok MCP?

Ngrok MCP to **MCP server** który pozwala:

1. **Wystawić lokalne serwisy** (dashboard, agents, API) na publiczne URLe
2. **Połączyć strony** (jimbo77.org, jimbo77.com, mybonzo) między sobą
3. **Połączyć agentów** przez bezpieczne tunele
4. **Testować webhooks** lokalnie (bez deployment)

---

## 📋 Aktualna Konfiguracja VS Code

### MCP Servers w `.vscode/settings.json`

```jsonc
{
  "github.copilot.chat.mcp.servers": {
    "rag-memory-mcp": {
      /* ... */
    },
    "smart-coding-mcp": {
      /* ... */
    },
    "cloudflare-r2": {
      /* ... */
    },
    "openrouter-planner": {
      /* ... */
    },
    "perplexity-pro": {
      /* ... */
    },
    "s3x": {
      /* ... */
    },
    "workspace-navigator": {
      /* ... */
    },

    // ⬇️ NOWY - ngrok MCP
    "ngrok-mcp": {
      "command": "npx",
      "args": ["-y", "@ngrok/mcp-server"],
      "env": {
        "NGROK_AUTHTOKEN": "YOUR_NGROK_TOKEN_HERE",
      },
    },
  },
}
```

---

## 🚀 Setup Ngrok MCP

### Krok 1: Pobierz Ngrok Auth Token

```powershell
# Otwórz https://dashboard.ngrok.com/get-started/your-authtoken
# Skopiuj token

# Zapisz w .env (root workspace)
Add-Content -Path "U:\The_yellow_hub\.env" -Value "`nNGROK_AUTHTOKEN=2pBxVxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Krok 2: Dodaj do VS Code Settings

```powershell
# Edytuj .vscode/settings.json
code U:\The_yellow_hub\.vscode\settings.json
```

Dodaj ngrok MCP do sekcji `github.copilot.chat.mcp.servers`:

```jsonc
"ngrok-mcp": {
  "command": "npx",
  "args": ["-y", "@ngrok/mcp-server"],
  "env": {
    "NGROK_AUTHTOKEN": "2pBxVxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Krok 3: Restart VS Code

Przeładuj okno VS Code żeby MCP server wystartował.

---

## 🔗 Use Case 1: Wystawienie Dashboard na Publiczny URL

**Problem**: Dashboard działa tylko na `localhost:3880`, nie możesz go pokazać komuś spoza sieci.

**Rozwiązanie**:

```powershell
# Terminal 1 - Start Dashboard Backend
cd U:\The_yellow_hub\dashboard\backend
bun server.ts

# Terminal 2 - Start Ngrok Tunnel
ngrok http 3880 --domain=dashboard.jimbo77.dev
```

**Rezultat**:

```
Dashboard dostępny publicznie:
https://dashboard.jimbo77.dev → localhost:3880
```

**Bonus - MCP Tool**:
W Copilot Chat możesz użyć MCP ngrok żeby automatycznie zarządzać tunelami:

```
@workspace Uruchom ngrok tunnel dla dashboard:3880 z domeną dashboard.jimbo77.dev
```

---

## 🔗 Use Case 2: Połączenie Agent Zero z Dashboard

**Problem**: Agent Zero (`localhost:50100`) nie może komunikować się z Dashboard (`localhost:3880`) przez publiczny URL.

**Rozwiązanie - Ngrok Tunele**:

```powershell
# Terminal 1 - Dashboard tunnel
ngrok http 3880 --domain=dashboard.jimbo77.dev

# Terminal 2 - Agent Zero tunnel
ngrok http 50100 --domain=agent-zero.jimbo77.dev

# Terminal 3 - Sprawdź
curl https://dashboard.jimbo77.dev/api/health
curl https://agent-zero.jimbo77.dev/health
```

**Konfiguracja Agent Zero**:

```yaml
# agents/python/agent-zero/config.yaml
api:
  dashboard_url: https://dashboard.jimbo77.dev
  callback_url: https://agent-zero.jimbo77.dev
```

**Rezultat**:

- Agent Zero może wysyłać dane do Dashboard przez `https://dashboard.jimbo77.dev`
- Dashboard może odpytywać Agent Zero przez `https://agent-zero.jimbo77.dev`
- Oba działają lokalnie ale wyglądają jak produkcja!

---

## 🔗 Use Case 3: Webhook Testing dla Stripe/Twilio

**Problem**: Stripe webhooks wymagają publicznego HTTPS endpointu, nie możesz testować na localhost.

**Rozwiązanie**:

```powershell
# Start local webhook handler
cd U:\The_yellow_hub\luc-de-zen-on
bun dev  # Port 4321

# Create ngrok tunnel
ngrok http 4321 --domain=webhooks.jimbo77.dev
```

**Stripe Dashboard**:

```
Webhook URL: https://webhooks.jimbo77.dev/api/stripe/webhook
```

**Rezultat**:
Stripe wysyła webhooks → `https://webhooks.jimbo77.dev` → localhost:4321 → twój kod otrzymuje event!

---

## 🔗 Use Case 4: Połączenie Wszystkich Agentów przez Ngrok

**Problem**: Mamy 7 agentów Docker na różnych portach (6001-6062), trudno nimi zarządzać.

**Rozwiązanie - Ngrok Edge**:

```yaml
# config/ngrok-agents.yml
version: 3
tunnels:
  deployment-coordinator:
    proto: http
    addr: 6001
    domain: deployment.jimbo77.dev

  guardian:
    proto: http
    addr: 6004
    domain: guardian.jimbo77.dev

  cost-optimizer:
    proto: http
    addr: 6002
    domain: cost.jimbo77.dev

  health-monitor:
    proto: http
    addr: 6003
    domain: health.jimbo77.dev

  research-agent:
    proto: http
    addr: 6062
    domain: research.jimbo77.dev

  agent-zero:
    proto: http
    addr: 50100
    domain: agent-zero.jimbo77.dev
```

**Start wszystkich tuneli**:

```powershell
ngrok start --all --config config/ngrok-agents.yml
```

**Rezultat**:

```
✅ https://deployment.jimbo77.dev → localhost:6001
✅ https://guardian.jimbo77.dev → localhost:6004
✅ https://cost.jimbo77.dev → localhost:6002
✅ https://health.jimbo77.dev → localhost:6003
✅ https://research.jimbo77.dev → localhost:6062
✅ https://agent-zero.jimbo77.dev → localhost:50100
```

**Agent Orchestrator może teraz wywołać agentów przez publiczne URLe!**

---

## 🔗 Use Case 5: Multi-Site Connection (jimbo77.org ↔ jimbo77.com)

**Problem**: `jimbo77.org` (Cloudflare Pages) potrzebuje API z `jimbo77.com` (Cloudflare Worker) ale jest CORS issue.

**Rozwiązanie - Ngrok jako Proxy**:

### Scenariusz A: Local Development Proxy

```powershell
# Start local API Gateway
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python -m uvicorn main:app --port 3885 --reload

# Expose przez ngrok
ngrok http 3885 --domain=api.jimbo77.dev
```

**Frontend jimbo77.org dev**:

```typescript
// magnet/src/api.ts
const API_BASE = import.meta.env.DEV
  ? "https://api.jimbo77.dev" // Ngrok tunnel do localhost:3885
  : "https://api.jimbo77.com"; // Produkcja Worker

fetch(`${API_BASE}/v1/projects`);
```

**Korzyści**:

- Testujesz API lokalnie bez deployu
- HTTPS działa (bo ngrok)
- CORS poprawnie skonfigurowany
- Hot reload API podczas pracy

### Scenariusz B: Cross-Site Agent Communication

**jimbo77.com** (Control Hub) wywołuje agentów przez ngrok:

```typescript
// workers/control-hub/src/agents.ts
const AGENT_ENDPOINTS = {
  deployment: "https://deployment.jimbo77.dev",
  guardian: "https://guardian.jimbo77.dev",
  research: "https://research.jimbo77.dev",
};

async function callAgent(agentName: string, payload: any) {
  const url = AGENT_ENDPOINTS[agentName];
  const response = await fetch(`${url}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}
```

**jimbo77.org** (AI Magnet) pobiera dane od agentów:

```typescript
// magnet/src/lib/project-stats.ts
export async function getProjectStats() {
  const healthData = await fetch("https://health.jimbo77.dev/api/stats");
  const costData = await fetch("https://cost.jimbo77.dev/api/summary");

  return {
    uptime: healthData.uptime,
    totalCost: costData.monthlyTotal,
  };
}
```

---

## 🔧 Ngrok MCP Tools (dostępne w Copilot Chat)

Po zainstalowaniu ngrok MCP masz dostęp do narzędzi:

### 1. `ngrok_create_tunnel`

```
@workspace Stwórz ngrok tunnel dla portu 3880 z domeną dashboard.jimbo77.dev
```

### 2. `ngrok_list_tunnels`

```
@workspace Pokaż wszystkie aktywne ngrok tunele
```

### 3. `ngrok_stop_tunnel`

```
@workspace Zatrzymaj tunnel dla dashboard.jimbo77.dev
```

### 4. `ngrok_get_tunnel_status`

```
@workspace Sprawdź status tunelu agent-zero.jimbo77.dev
```

### 5. `ngrok_update_config`

```
@workspace Zaktualizuj ngrok config - dodaj nowy tunnel dla research agent na porcie 6062
```

---

## 📊 Kompletna Architektura z Ngrok

```
┌─────────────────────────────────────────────────────────────┐
│                   Ngrok Edge Network                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  dashboard.jimbo77.dev ───────► localhost:3880 (Dashboard)  │
│  agent-zero.jimbo77.dev ──────► localhost:50100 (Agent)     │
│  deployment.jimbo77.dev ──────► localhost:6001 (Docker)     │
│  guardian.jimbo77.dev ────────► localhost:6004 (Docker)     │
│  cost.jimbo77.dev ────────────► localhost:6002 (Docker)     │
│  health.jimbo77.dev ──────────► localhost:6003 (Docker)     │
│  research.jimbo77.dev ────────► localhost:6062 (Docker)     │
│  api.jimbo77.dev ─────────────► localhost:3885 (FastAPI)    │
│  webhooks.jimbo77.dev ────────► localhost:4321 (Astro)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    jimbo77.org     jimbo77.com    External Webhooks
  (AI Magnet Site) (Control Hub)  (Stripe, Twilio)
```

**Flow przykładowy**:

1. User odwiedza `jimbo77.org`
2. Frontend wywołuje `https://api.jimbo77.dev/v1/projects`
3. Ngrok przekierowuje do `localhost:3885` (FastAPI Gateway)
4. API Gateway wywołuje `https://research.jimbo77.dev/api/search`
5. Ngrok przekierowuje do `localhost:6062` (Research Agent Docker)
6. Agent zwraca dane → API → Frontend → User

**Wszystko działa lokalnie, wygląda jak produkcja!**

---

## 🎯 Następne Kroki

### 1. Skonfiguruj Ngrok Auth Token

```powershell
# Pobierz z https://dashboard.ngrok.com/get-started/your-authtoken
code U:\The_yellow_hub\.vscode\settings.json
# Dodaj do "ngrok-mcp" → "env" → "NGROK_AUTHTOKEN"
```

### 2. Stwórz ngrok-agents.yml

```powershell
# Stwórz plik z tunnelami dla wszystkich agentów
code U:\The_yellow_hub\config\ngrok-agents.yml
```

### 3. Start Multi-Tunnel

```powershell
ngrok start --all --config U:\The_yellow_hub\config\ngrok-agents.yml
```

### 4. Zaktualizuj Agent Configs

Zamień `localhost:XXXX` na ngrok domeny w:

- `workers/agents-orchestrator/src/index.ts`
- `magnet/src/api.ts`
- `dashboard/frontend/src/api.ts`
- `agents/python/*/config.yaml`

### 5. Test Connection

```powershell
# Sprawdź czy wszystkie tunele działają
curl https://dashboard.jimbo77.dev/api/health
curl https://agent-zero.jimbo77.dev/health
curl https://deployment.jimbo77.dev/health
```

---

## 🔐 Security Best Practices

### 1. Użyj Ngrok OAuth

```yaml
# ngrok-agents.yml
tunnels:
  dashboard:
    proto: http
    addr: 3880
    domain: dashboard.jimbo77.dev
    oauth:
      provider: google
      allow_emails:
        - stolarnia.ams@gmail.com
```

### 2. IP Whitelisting

```yaml
tunnels:
  api:
    proto: http
    addr: 3885
    domain: api.jimbo77.dev
    ip_restriction:
      allow_cidrs:
        - 1.2.3.4/32 # Twoje IP
```

### 3. Webhook Verification

```typescript
// Zawsze weryfikuj webhooks
const signature = req.headers["stripe-signature"];
const verified = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET,
);
```

---

## 📚 Resources

- **Ngrok Docs**: https://ngrok.com/docs
- **Ngrok MCP Server**: https://github.com/ngrok/mcp-server
- **MCP Documentation**: https://docs.ngrok.com/using-ngrok-with/using-mcp
- **Dashboard**: https://dashboard.ngrok.com

**Chcesz żebym:**

1. ✅ Wygenerował `ngrok-agents.yml` z konfiguracją dla wszystkich agentów?
2. ✅ Dodał ngrok auth token do VS Code settings?
3. ✅ Stworzył skrypt PowerShell do auto-startu tuneli?
4. ❓ Coś innego?
