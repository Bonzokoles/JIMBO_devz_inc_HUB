# Agent Zero Integration - JIMBO77 Orchestrator

## Overview

Agent Zero został zintegrowany z systemem JIMBO77 Agents Orchestrator przez Cloudflare Tunnel i dedykowany bridge worker.

**Status**: ✅ ACTIVE
**Data integracji**: 19 stycznia 2026

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  JIMBO77 Agents Orchestrator                                │
│  orchestrator.jimbo77.com                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Task Assignment
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent Zero Bridge Worker (Cloudflare)                      │
│  https://agent-zero-bridge.stolarnia-ams.workers.dev        │
│                                                              │
│  Routes: /health, /message, /status                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS Tunnel
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Tunnel                                          │
│  https://boxing-operator-smithsonian-rocks.trycloudflare.com│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Local Forward
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent Zero Instance                                        │
│  localhost:50100                                            │
│  API: /api_message                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Agent Zero Instance

- **Local Port**: 50100
- **Cloudflare Tunnel**: boxing-operator-smithsonian-rocks.trycloudflare.com
- **API Key**: jVD0r1eqaoXKz-18
- **API Endpoint**: /api_message

### Cloudflare Worker Bridge

- **URL**: https://agent-zero-bridge.stolarnia-ams.workers.dev
- **Version**: 1.0.0
- **Status**: ACTIVE ✅

### Supabase Edge Function

- **Function**: agent-zero-proxy
- **URL**: https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/agent-zero-proxy
- **Status**: ACTIVE ✅

---

## API Endpoints

### Cloudflare Worker Bridge

#### GET /health

Health check endpoint.

```bash
curl https://agent-zero-bridge.stolarnia-ams.workers.dev/health
```

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "status": "online",
  "tunnel": "https://boxing-operator-smithsonian-rocks.trycloudflare.com",
  "local_port": "50100",
  "timestamp": "2026-01-19T..."
}
```

#### POST /message

Send message to Agent Zero.

```bash
curl -X POST https://agent-zero-bridge.stolarnia-ams.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "List all files in current directory",
    "context_id": "task-123",
    "lifetime_hours": 24
  }'
```

**Request Body:**

```typescript
{
  message: string;           // Required: Message for Agent Zero
  context_id?: string;       // Optional: Conversation context ID
  attachments?: Array<{      // Optional: File attachments
    filename: string;
    base64: string;
  }>;
  lifetime_hours?: number;   // Optional: Chat lifetime (default: 24)
}
```

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "request": {
    "message": "List all files in current directory",
    "context_id": "task-123"
  },
  "response": {
    // Agent Zero response data
  },
  "via_tunnel": "https://boxing-operator-smithsonian-rocks.trycloudflare.com"
}
```

#### GET /status

Get Agent Zero configuration and capabilities.

```bash
curl https://agent-zero-bridge.stolarnia-ams.workers.dev/status
```

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "config": {
    "tunnel_url": "https://boxing-operator-smithsonian-rocks.trycloudflare.com",
    "local_port": "50100",
    "api_endpoint": "/api_message"
  },
  "capabilities": [
    "code_execution",
    "terminal_access",
    "file_operations",
    "web_search",
    "conversation_continuity"
  ],
  "integration": "JIMBO77 Agents Orchestrator"
}
```

### Supabase Edge Function

```bash
# Health check
curl https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/agent-zero-proxy

# Send message
curl -X POST https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/agent-zero-proxy \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Agent Zero"}'
```

---

## Agent Capabilities

Agent Zero (#19 w orchestrator) posiada następujące możliwości:

### 1. Code Execution

- Wykonywanie kodu Python, JavaScript, bash
- Instalacja pakietów (pip, npm)
- Zarządzanie środowiskami wirtualnymi

### 2. Terminal Access

- Pełny dostęp do terminala
- Operacje na systemie plików
- Uruchamianie procesów

### 3. File Operations

- Czytanie i zapisywanie plików
- Zarządzanie strukturą katalogów
- Operacje na plikach (copy, move, delete)

### 4. Web Search

- Wyszukiwanie informacji w internecie
- Pobieranie zawartości stron
- Analiza danych z web

### 5. Conversation Continuity

- Konteksty konwersacji (context_id)
- Historia interakcji
- Długoterminowa pamięć (do 24h default)

---

## Integration with Orchestrator

### Dodanie Agent Zero do systemu orchestracji

W pliku orchestrator:

```typescript
const agents = [
  // ... existing agents
  {
    id: 19,
    name: "Agent Zero",
    priority: 1,
    capabilities: ["code_execution", "terminal", "file_ops", "web_search"],
    endpoint: "https://agent-zero-bridge.stolarnia-ams.workers.dev/message",
    health_check: "https://agent-zero-bridge.stolarnia-ams.workers.dev/health",
  },
];
```

### Przykład użycia w taskach

```javascript
// Task requires code execution
const task = {
  id: "task-456",
  description: "Create Python script to analyze CSV data",
  priority: 1,
  required_capabilities: ["code_execution", "file_ops"],
};

// Orchestrator assigns to Agent Zero (priority 1, has all capabilities)
const assignment = {
  task_id: "task-456",
  agent_id: 19,
  agent_name: "Agent Zero",
  endpoint: "https://agent-zero-bridge.stolarnia-ams.workers.dev/message",
};

// Send task to Agent Zero
const response = await fetch(assignment.endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: task.description,
    context_id: task.id,
    lifetime_hours: 24,
  }),
});
```

---

## Testing

### Test Connection

```bash
# Check if Agent Zero is online
curl https://agent-zero-bridge.stolarnia-ams.workers.dev/health
```

### Test Message Execution

```bash
# Simple command
curl -X POST https://agent-zero-bridge.stolarnia-ams.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'

# Code execution
curl -X POST https://agent-zero-bridge.stolarnia-ams.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a Python script that prints Hello World"}'

# Terminal access
curl -X POST https://agent-zero-bridge.stolarnia-ams.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Run pwd command in terminal"}'
```

---

## Monitoring

### Supabase Database Entry

```sql
SELECT * FROM jimbo77 WHERE title LIKE '%Agent Zero%';
```

**Result:**

```json
{
  "id": 11,
  "title": "Agent Zero - AI Assistant",
  "description": "Advanced AI agent with code execution and terminal access",
  "project_type": "agent",
  "status": "active",
  "metadata": {
    "local_port": 50100,
    "tunnel_url": "https://boxing-operator-smithsonian-rocks.trycloudflare.com",
    "api_endpoint": "/api_message",
    "capabilities": [
      "code_execution",
      "terminal",
      "file_operations",
      "web_search"
    ],
    "model": "configurable"
  }
}
```

### Health Monitoring

Regularnie sprawdzaj status:

```bash
# Every 5 minutes
*/5 * * * * curl -s https://agent-zero-bridge.stolarnia-ams.workers.dev/health | jq '.status'
```

---

## Troubleshooting

### Agent Zero is offline

1. Sprawdź czy Agent Zero działa na localhost:50100
2. Sprawdź czy Cloudflare Tunnel jest aktywny
3. Zrestartuj tunnel: `cloudflared tunnel run`

### Cloudflare Tunnel nie odpowiada

1. Sprawdź czy tunnel jest uruchomiony
2. Sprawdź konfigurację w cloudflared
3. Odśwież tunnel URL jeśli wygasł

### Worker zwraca błąd

1. Sprawdź logi: `npx wrangler tail agent-zero-bridge`
2. Zweryfikuj zmienne środowiskowe (AGENT_ZERO_TUNNEL, API_KEY)
3. Przetestuj bezpośrednio tunnel URL

---

## Next Steps

1. ✅ Agent Zero połączony z tunnelem
2. ✅ Bridge worker wdrożony
3. ✅ Supabase Edge Function aktywna
4. ✅ Dodany do bazy jimbo77
5. 🔄 Integracja z Agents Orchestrator (w trakcie)
6. 🔄 Dashboard monitoring (planowane)
7. 🔄 Auto-recovery na offline (planowane)

---

Last Updated: 19 stycznia 2026
