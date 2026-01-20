# Quick Start Guide - Bonzo PraisonAI

## Prerequisites

- Docker Desktop installed and running
- Agent-Zero running on port 50100
- Redis and PostgreSQL accessible
- API keys ready (OpenAI, Cloudflare, GitHub, etc.)

## Setup (5 minutes)

### 1. Copy and Configure Environment Variables

```bash
cd bonzo-praisonai
cp .env.example .env
```

**Edit `.env` and add your API keys:**

- `OPENAI_API_KEY` - Required for PraisonAI agents
- `CLOUDFLARE_API_TOKEN` - For cost monitoring
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account
- `OPENROUTER_API_KEY` - For OpenRouter cost tracking
- `GITHUB_TOKEN` - For incident auto-reporting
- `AGENT_ZERO_MCP_TOKEN` - Token from agent-zero (check `t-tv7qMZOoxtLgM29q`)

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Verify Services

Check all agents are running:

```bash
docker-compose ps
```

Expected output:

```
bonzo-cost-optimizer-ai      running   0.0.0.0:6002->6002/tcp
bonzo-guardian-ai            running   0.0.0.0:6004->6004/tcp
bonzo-health-monitor-ai      running   0.0.0.0:6003->6003/tcp
bonzo-praisonai-dashboard    running   0.0.0.0:6100->6100/tcp
```

### 4. Access Dashboard

Open browser: **http://localhost:6100**

You should see all three AI agents with "healthy" status.

## Quick Tests

### Test Cost Optimizer

```bash
curl -X POST http://localhost:6002/analyze \
  -H "Content-Type: application/json" \
  -d '{"period": "daily", "deep_analysis": false}'
```

### Test Guardian Agent

```bash
curl http://localhost:6004/status
```

### Test Health Monitor

```bash
curl -X POST http://localhost:6003/check/jimbo-gateway
```

## Service Endpoints

| Service           | Port | Health Check | Description                    |
| ----------------- | ---- | ------------ | ------------------------------ |
| Cost Optimizer AI | 6002 | GET /health  | AI cost analysis & predictions |
| Guardian AI       | 6004 | GET /health  | Emergency decision-making      |
| Health Monitor AI | 6003 | GET /health  | Worker anomaly detection       |
| Dashboard         | 6100 | GET /health  | Monitoring interface           |

## Logs

View logs for specific agent:

```bash
docker-compose logs -f cost-optimizer-ai
docker-compose logs -f guardian-ai
docker-compose logs -f health-monitor-ai
```

All logs:

```bash
docker-compose logs -f
```

## Stopping Services

```bash
docker-compose down
```

Keep data (Redis):

```bash
docker-compose down  # Volumes are preserved
```

Remove all data:

```bash
docker-compose down -v
```

## Troubleshooting

### Agent shows "offline" in dashboard

1. Check logs: `docker-compose logs <service-name>`
2. Verify .env has all required keys
3. Ensure agent-zero is running on port 50100
4. Check Redis connection

### MCP connection errors

1. Verify agent-zero is accessible: `curl http://localhost:50100/health`
2. Check AGENT_ZERO_MCP_TOKEN in .env
3. Verify network: `docker network ls | grep bonzo`

### High memory usage

PraisonAI is optimized for speed. Each agent uses ~200-300MB RAM.
Total expected: ~1GB for all services.

## Next Steps

1. **Integration**: Connect with existing Bonzo services (ports 6001, 6002, 6003)
2. **Production**: Review security settings in .env
3. **Monitoring**: Set up Slack webhooks for alerts
4. **Scaling**: Add more workers to docker-compose if needed

## Development

Agents are gitignored during development. To modify:

1. Edit files in `agents/` directory
2. Restart specific service: `docker-compose restart cost-optimizer-ai`
3. Check logs for errors

## Support

- Dashboard: http://localhost:6100
- Agent-Zero: http://localhost:50100
- Documentation: See README.md
