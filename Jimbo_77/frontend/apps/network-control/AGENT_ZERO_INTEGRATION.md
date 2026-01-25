# Agent Zero + Network Control Integration

## Quick Deploy

### 1. Agent Zero MCP (standalone)

```powershell
podman run -d --name agent-zero-network `
  -p 50082:80 `
  --env-file "T:\DOcker_aGENT_zero\.env" `
  -v /mnt/t/DOcker_aGENT_zero:/a0/work:z `
  agent0ai/agent-zero:latest
```

**WebUI:** http://localhost:50082  
**Login:** Bonzo  
**Password:** vLdC6qUETAQwvJiJ32JfeWr5M5pjMfCM

### 2. Network Control (Vite dev)

```powershell
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\network-control
npm run dev
```

**Port:** 5173 (default Vite)

### 3. Cloudflare Tunnel (wbudowana funkcja)

**Option A: Network Control ma wbudowaną obsługę**

- Component: `CreateTunnelModal.tsx` - tworzy tunnel przez UI
- Provider: `Cloudflare` (dropdown w modalu)
- API endpoint: `/api/network/tunnels`

**Option B: Manual cloudflared**

```powershell
cloudflared tunnel --url http://localhost:50082
cloudflared tunnel --url http://localhost:5173
```

## Integracja Flow

```
[Agent Zero Port 50082] ←→ Cloudflare Tunnel ←→ Public URL
         ↓
    [MCP Server] ←→ Network Control (5173)
         ↓
    [network.yaml devices]
```

## Agent Zero API w Network Control

Dodaj do `network.yaml`:

```yaml
agents:
  - id: "AgentZero_Main"
    name: "Agent Zero MCP"
    url: "http://localhost:50082"
    type: "autonomous_agent"
    capabilities:
      - web_navigation
      - code_execution
      - file_operations
      - docker_control
```

## Wdrożenie

1. **Start Agent Zero** → `podman run` (powyżej)
2. **Start Network Control** → `npm run dev`
3. **Create Tunnel** → Użyj UI w Network Control lub `cloudflared`
4. **Expose:** Agent Zero WebUI + Network Control Dashboard
