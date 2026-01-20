# Agent Zero Integration - Quick Test Guide

## ✅ Status

- **Orchestrator**: DEPLOYED (Version 99aae9dc)
- **Agent Zero Bridge**: DEPLOYED (Version 4e96c784)
- **Agents Count**: 19 (18 legacy + Agent Zero)
- **Integration Status**: ACTIVE ✅

## Health Check

```bash
# PowerShell
Invoke-WebRequest -Uri "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/health" | Select-Object -ExpandProperty Content
```

**Expected Response:**

```json
{
  "status": "healthy",
  "orchestrator": "online",
  "model": "deepseek/deepseek-r1",
  "agents": 19,
  "special_agents": {
    "agent-zero": {
      "status": "online",
      "endpoint": "https://agent-zero-bridge.stolarnia-ams.workers.dev",
      "capabilities": ["code_execution", "terminal", "file_ops", "web_search"]
    }
  }
}
```

## Test Orchestration with Agent Zero

### Test 1: Simple Code Execution

```powershell
# Create test payload
@"
{
  "query": "Write a Python function that calculates factorial of 10",
  "model": "deepseek/deepseek-r1"
}
"@ | Out-File -FilePath test-factorial.json -Encoding utf8

# Send to orchestrator
Invoke-WebRequest -Uri "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/orchestrate" `
  -Method POST `
  -ContentType "application/json" `
  -InFile "test-factorial.json"
```

**Expected Flow:**

1. Orchestrator analyzes query with DeepSeek R1
2. DeepSeek identifies need for code execution
3. Assigns task to `agent-zero` (Priority 1)
4. Bridge worker forwards to Cloudflare Tunnel
5. Agent Zero executes code on localhost:50100
6. Response flows back: Agent Zero → Tunnel → Bridge → Orchestrator → Client

### Test 2: Terminal Command

```powershell
@"
{
  "query": "List all files in current directory and show disk usage",
  "model": "deepseek/deepseek-r1"
}
"@ | Out-File -FilePath test-terminal.json -Encoding utf8

Invoke-WebRequest -Uri "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/orchestrate" `
  -Method POST `
  -ContentType "application/json" `
  -InFile "test-terminal.json"
```

### Test 3: Multi-Agent Task

```powershell
@"
{
  "query": "Research latest Python best practices, then create a Python script demonstrating them",
  "model": "deepseek/deepseek-r1"
}
"@ | Out-File -FilePath test-multi-agent.json -Encoding utf8

Invoke-WebRequest -Uri "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/orchestrate" `
  -Method POST `
  -ContentType "application/json" `
  -InFile "test-multi-agent.json"
```

**Expected Plan:**

- **Priority 1**: research-agent → Web search for Python best practices
- **Priority 2**: agent-zero → Generate Python script using research results

## Direct Agent Zero Bridge Test

```powershell
# Test bridge health
Invoke-WebRequest -Uri "https://agent-zero-bridge.stolarnia-ams.workers.dev/health"

# Test direct message
@"
{
  "message": "What is 2+2?",
  "context_id": "test-123"
}
"@ | Out-File -FilePath test-direct.json -Encoding utf8

Invoke-WebRequest -Uri "https://agent-zero-bridge.stolarnia-ams.workers.dev/message" `
  -Method POST `
  -ContentType "application/json" `
  -InFile "test-direct.json"
```

## Monitoring

### Check Task Status

```powershell
# Get task ID from orchestration response
$taskId = "..." # From response JSON

Invoke-WebRequest -Uri "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/task/$taskId"
```

### View Logs

```powershell
# Orchestrator logs
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\workers\agents-orchestrator
npx wrangler tail

# Bridge logs
cd U:\The_yellow_hub\workers\agent-zero-bridge
npx wrangler tail
```

## Troubleshooting

### Issue: Orchestrator doesn't assign to Agent Zero

**Cause**: AI model didn't identify code execution requirement  
**Solution**: Make query more explicit:

```json
{
  "query": "Execute this Python code: print('Hello')",
  "context": {
    "requires_code_execution": true
  }
}
```

### Issue: Bridge returns tunnel error

**Cause**: Cloudflare Tunnel offline or URL changed  
**Solution**:

1. Check tunnel status: `cloudflared tunnel info`
2. Update bridge worker env vars if URL changed
3. Restart tunnel: `cloudflared tunnel run`

### Issue: Agent Zero timeout

**Cause**: Complex task taking >30s  
**Solution**: Agent Zero supports long-running tasks via context_id continuation

## Architecture Diagram

```
User Request
    ↓
Orchestrator (orchestrator.jimbo77.com)
    ↓
DeepSeek R1 Analysis → Task Plan
    ↓
Agent Selection (Priority 1-3)
    ↓
[Agent Zero Selected] → Bridge Worker
    ↓
Cloudflare Tunnel (boxing-operator-smithsonian-rocks)
    ↓
Agent Zero (localhost:50100)
    ↓
Code Execution / Terminal / File Ops
    ↓
Response ← ← ← ← ←
```

## Next Steps

1. ✅ Integration complete
2. 🔄 Test multi-agent workflows
3. 🔄 Add dashboard monitoring UI
4. 🔄 Implement auto-recovery for tunnel failures
5. 🔄 Create task templates for common workflows

---

**Last Updated**: 19 stycznia 2026, 18:30  
**Orchestrator Version**: 99aae9dc-711c-47f8-b6d9-d707497a4037  
**Bridge Version**: 4e96c784-3e73-4007-9248-0bf91ac112e1
