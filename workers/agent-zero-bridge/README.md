# Agent Zero Bridge Worker

Cloudflare Worker that bridges Agent Zero with JIMBO77 Agents Orchestrator.

## Configuration

**Agent Zero Instance:**

- Local Port: 50100
- Cloudflare Tunnel: https://boxing-operator-smithsonian-rocks.trycloudflare.com
- API Key: jVD0r1eqaoXKz-18

## Endpoints

### GET /health

Health check for Agent Zero connection.

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "status": "online",
  "tunnel": "https://boxing-operator-smithsonian-rocks.trycloudflare.com",
  "local_port": "50100"
}
```

### POST /message

Send message to Agent Zero.

**Request:**

```json
{
  "message": "Hello, how can you help me?",
  "context_id": "optional-context-id",
  "attachments": [],
  "lifetime_hours": 24
}
```

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "response": { ... },
  "via_tunnel": "https://boxing-operator-smithsonian-rocks.trycloudflare.com"
}
```

### GET /status

Get Agent Zero configuration and capabilities.

**Response:**

```json
{
  "success": true,
  "agent": "Agent Zero",
  "capabilities": [
    "code_execution",
    "terminal_access",
    "file_operations",
    "web_search"
  ]
}
```

## Deployment

```bash
cd workers/agent-zero-bridge
npm install
npx wrangler deploy
```

## Integration with Orchestrator

Agent Zero is now available as Agent #19 in the orchestrator system.

**Priority**: 1 (High Priority - Code Execution)
**Capabilities**: Terminal access, code execution, file operations
**Model**: Configurable (supports multiple LLMs)
