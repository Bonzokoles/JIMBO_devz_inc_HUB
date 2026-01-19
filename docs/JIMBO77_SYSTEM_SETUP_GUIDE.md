# 🚀 Jimbo77 System - Setup Guide z Proton VPN + Tailscale

**Data**: 2026-01-19  
**Status**: Ready to deploy  
**Network**: Proton VPN Pro (USA) + Tailscale + Cloudflare Tunnel

---

## 🎯 Architektura

```
┌──────────────────────────────────────────────────────────┐
│              Cloudflare Edge (Public)                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  jimbo77.com ─────────► Pages (Dashboard UI)            │
│  api.jimbo77.org ─────► Tunnel → Win (FastAPI :3885)    │
│  win.jimbo77.org ─────► Tunnel → Win (agentd :7777)     │
│  dashboard.jimbo77.org ► Tunnel → Win (Bun :3880)       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         │
                   Cloudflare Tunnel
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│       Windows Worker (U:\The_yellow_hub)                 │
├──────────────────────────────────────────────────────────┤
│  Network: ProtonVPN (WireGuard) + Tailscale              │
│                                                          │
│  🔧 agentd (7777) ─── Worker Daemon                     │
│  📡 FastAPI (3885) ── Control-plane API                 │
│  🎨 Bun (3880) ────── Dashboard Backend                 │
│                                                          │
│  🐳 Docker Agents:                                       │
│    - agent-zero (50100)                                  │
│    - deployment-coordinator (6001)                       │
│    - guardian (6004)                                     │
│    - cost-optimizer (6002)                               │
│    - health-monitor (6003)                               │
│    - research-agent (6062)                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         ▲
                    Tailscale Mesh
                         ▲
┌──────────────────────────────────────────────────────────┐
│              Satellite Workers (Future)                  │
├──────────────────────────────────────────────────────────┤
│  s1.jimbo77.local (Tailscale private network)            │
│  s2.jimbo77.local                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

✅ Proton VPN Pro (USA) - RUNNING  
✅ Tailscale - INSTALLED  
✅ Docker Desktop - RUNNING  
✅ Bun - INSTALLED  
✅ Cloudflare Account - ACTIVE

---

## 🔧 Setup Steps

### **Step 1: Install Cloudflare Tunnel (5 min)**

```powershell
# Install cloudflared
winget install --id Cloudflare.cloudflared

# Login (opens browser - authenticate with Cloudflare)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create win-jimbo77

# Note the Tunnel ID (będzie potrzebny!)
# Example: 1234abcd-5678-efgh-9012-ijklmnopqrst
```

**Output będzie wyglądał tak:**

```
Tunnel credentials written to C:\Users\<USER>\.cloudflared\1234abcd-....json
Created tunnel win-jimbo77 with id 1234abcd-5678-efgh-9012-ijklmnopqrst
```

**Skopiuj Tunnel ID!**

---

### **Step 2: Configure DNS w Cloudflare Dashboard**

Idź do https://dash.cloudflare.com → Wybierz domenę `jimbo77.org`

Dodaj 3 CNAME records:

| Type  | Name      | Target                         |
| ----- | --------- | ------------------------------ |
| CNAME | api       | `<TUNNEL_ID>.cfargotunnel.com` |
| CNAME | win       | `<TUNNEL_ID>.cfargotunnel.com` |
| CNAME | dashboard | `<TUNNEL_ID>.cfargotunnel.com` |

**Zastąp `<TUNNEL_ID>` swoim Tunnel ID z Step 1!**

---

### **Step 3: Update Tunnel Config**

```powershell
# Edit config file
code U:\The_yellow_hub\config\cloudflared-win-config.yml
```

Zamień `<TUNNEL_ID_HERE>` na swój Tunnel ID:

```yaml
tunnel: 1234abcd-5678-efgh-9012-ijklmnopqrst # ← TWÓJ ID TUTAJ
credentials-file: C:\Users\stola\.cloudflared\1234abcd-5678-efgh-9012-ijklmnopqrst.json
```

**Zapisz plik!**

---

### **Step 4: Install agentd Dependencies**

```powershell
cd U:\The_yellow_hub\workers\agentd
bun install
```

---

### **Step 5: Test agentd Locally**

```powershell
# Start agentd
bun dev

# W nowym terminalu - test
curl http://localhost:7777/health
```

**Expected output:**

```json
{
  "status": "ok",
  "worker": "win-jimbo77",
  "timestamp": "2026-01-19T...",
  "uptime": 1.234
}
```

**Jeśli działa - Ctrl+C i przechodź dalej.**

---

### **Step 6: Install Cloudflare Tunnel Service**

**Uruchom PowerShell jako Administrator!**

```powershell
# Install service (wpisz swój Tunnel ID!)
cd U:\The_yellow_hub\scripts
.\setup-cloudflare-tunnel.ps1 -TunnelId "1234abcd-5678-efgh-9012-ijklmnopqrst"
```

**Service zostanie zainstalowany i uruchomiony automatycznie!**

Sprawdź status:

```powershell
Get-Service cloudflared
```

**Expected: Status = Running**

---

### **Step 7: Test Tunnels**

```powershell
# Test API tunnel (powinna zwrócić 502 bo API nie działa jeszcze)
curl https://api.jimbo77.org

# Test worker tunnel (powinno zwrócić 502 bo agentd nie działa w tle)
curl https://win.jimbo77.org/health
```

**Jeśli widzisz błąd DNS** - poczekaj 2-3 min (propagacja DNS).

---

### **Step 8: Start Services**

**Terminal 1 - Docker Agents:**

```powershell
cd U:\The_yellow_hub\config
docker-compose up -d
```

**Terminal 2 - agentd (Worker Daemon):**

```powershell
cd U:\The_yellow_hub\workers\agentd
bun dev
```

**Terminal 3 - Dashboard Backend:**

```powershell
cd U:\The_yellow_hub\dashboard\backend
bun server.ts
```

**Terminal 4 - FastAPI Gateway:**

```powershell
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python -m uvicorn main:app --port 3885 --reload
```

**Lub użyj VS Code Tasks:**

- `Worker: Start agentd`
- `Dashboard: Start Backend`
- `API: Start Gateway`
- `Docker: Start All`

---

### **Step 9: Test Public Endpoints**

```powershell
# Worker health
curl https://win.jimbo77.org/health

# Worker capabilities
curl https://win.jimbo77.org/capabilities

# Agent status
curl https://win.jimbo77.org/agents/status

# Dashboard backend
curl https://dashboard.jimbo77.org/api/health

# API Gateway
curl https://api.jimbo77.org/docs
```

**Wszystko powinno działać przez HTTPS!** 🎉

---

## 🔒 Security - Cloudflare Access

### **Protect API endpoint**

1. Idź do https://dash.cloudflare.com → Zero Trust → Access → Applications
2. **Add an application**:
   - **Name**: `Jimbo77 Control-Plane API`
   - **Subdomain**: `api`
   - **Domain**: `jimbo77.org`
   - **Type**: Self-hosted

3. **Policy**:
   - **Name**: `Admin Only`
   - **Action**: Allow
   - **Include**: Email → `stolarnia.ams@gmail.com`

**Teraz `https://api.jimbo77.org` wymaga logowania!**

### **Protect Worker endpoint (Service Token)**

1. Zero Trust → Access → Service Auth → **Create Service Token**
2. **Name**: `control-plane-to-worker`
3. **Copy Client ID + Client Secret**

4. Create Application:
   - **Name**: `Jimbo77 Windows Worker`
   - **Subdomain**: `win`
   - **Domain**: `jimbo77.org`

5. **Policy**:
   - **Name**: `Service Tokens Only`
   - **Action**: Allow
   - **Include**: Service Auth → Select created token

**Teraz `win.jimbo77.org` wymaga Service Token header!**

---

## 🧪 Test Service Token

```powershell
# Zapisz credentials
$clientId = "abc123..."
$clientSecret = "xyz789..."

# Call worker z tokenem
curl https://win.jimbo77.org/health `
  -H "CF-Access-Client-Id: $clientId" `
  -H "CF-Access-Client-Secret: $clientSecret"
```

**Expected: JSON response z health status**

---

## 📊 Monitoring

### **Cloudflare Analytics**

- https://dash.cloudflare.com → Analytics → Traffic
- Zobacz requesty do `api/win/dashboard.jimbo77.org`

### **Tunnel Logs**

```powershell
# Real-time logs
Get-Content "C:\Users\<USER>\.cloudflared\tunnel.log" -Wait

# Lub via command
cloudflared tunnel info win-jimbo77
```

### **Worker Health Dashboard**

```powershell
# Sprawdź wszystkich agentów
curl https://win.jimbo77.org/agents/status
```

---

## 🎯 Next Steps

### **1. Deploy Dashboard UI na Cloudflare Pages**

```powershell
cd U:\The_yellow_hub\dashboard\frontend
bun run build

# Deploy
npx wrangler pages deploy dist --project-name jimbo77-dashboard
```

**Skonfiguruj Custom Domain: jimbo77.com**

### **2. Implement Control-Plane Orchestration**

Według Blueprint:

- Jimbo (Master Orchestrator)
- Brain (Strategy)
- Pinky (Edge-case critic)
- Elwirka (Finalizer)

### **3. Add Satellite Workers**

Użyj Tailscale dla prywatnej sieci między workerami:

```powershell
# Na drugim komputerze
tailscale up --hostname s1-jimbo77

# Worker będzie dostępny jako s1-jimbo77.tail12345.ts.net
```

---

## 🆘 Troubleshooting

### **Tunnel nie startuje**

```powershell
# Check service logs
Get-EventLog -LogName Application -Source cloudflared -Newest 20

# Manual start dla testowania
cloudflared tunnel --config U:\The_yellow_hub\config\cloudflared-win-config.yml run
```

### **502 Bad Gateway**

- Sprawdź czy service działa (agentd, API, Dashboard)
- Sprawdź port w `cloudflared-win-config.yml`
- Test lokalnie: `curl http://localhost:7777/health`

### **DNS nie resolves**

- Sprawdź CNAME w Cloudflare Dashboard
- Upewnij się że proxy (orange cloud) jest włączony
- Poczekaj 2-3 min na propagację

### **Access Denied**

- Sprawdź polityki w Cloudflare Zero Trust
- Dla service tokens: sprawdź headers `CF-Access-Client-Id/Secret`
- Sprawdź czy token nie wygasł

---

## 📚 Resources

- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
- **Cloudflare Access**: https://developers.cloudflare.com/cloudflare-one/policies/access
- **Blueprint**: `U:\The_yellow_hub\JIMBO_devz_inc_HUB\docs\jimbo77_system_blueprint\`
- **agentd Source**: `U:\The_yellow_hub\workers\agentd\server.ts`

---

## ✅ Checklist

- [ ] Cloudflared zainstalowany
- [ ] Tunnel utworzony (win-jimbo77)
- [ ] DNS CNAME dodane (api/win/dashboard.jimbo77.org)
- [ ] Config zaktualizowany z Tunnel ID
- [ ] agentd dependencies zainstalowane (`bun install`)
- [ ] Cloudflare Tunnel Service running
- [ ] Docker agents running
- [ ] agentd running (port 7777)
- [ ] Dashboard backend running (port 3880)
- [ ] FastAPI Gateway running (port 3885)
- [ ] Public endpoints działają (https://win.jimbo77.org/health)
- [ ] Cloudflare Access skonfigurowany
- [ ] Service Tokens utworzone

**Gotowe! System działa zgodnie z Blueprint! 🚀**
