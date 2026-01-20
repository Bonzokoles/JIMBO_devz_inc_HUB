# Bonzo PraisonAI Integration

AI-powered agents for Bonzo microservices using PraisonAI framework with MCP integration.

## Architecture

```
bonzo-praisonai/
├── agents/                    # AI agent implementations
│   ├── cost_optimizer.py     # Port 6002 - AI cost optimization
│   ├── guardian_agent.py     # Port 6004 - Emergency AI decision-making
│   └── health_monitor.py     # Port 6003 - AI anomaly detection
├── config/                    # Configuration files
│   ├── mcp_config.json       # MCP server connections
│   └── agent_config.yaml     # Agent settings
├── dashboard/                 # Monitoring dashboard
│   ├── app.py                # Dashboard backend
│   └── templates/            # UI templates
├── shared/                    # Shared utilities
│   ├── mcp_client.py         # MCP client wrapper
│   └── redis_client.py       # Redis connection pool
└── docker-compose.yml        # Docker orchestration
```

## Features

- **PraisonAI Framework**: 4138x faster than CrewAI
- **Native MCP Support**: Direct integration with agent-zero's 17+ MCP servers
- **Production Ready**: Docker deployment with Redis/PostgreSQL
- **A2A Protocol**: Agent-to-agent communication across microservices

## Services

### 1. Cost Optimizer Agent (Port 6002)

- AI-driven cost analysis and predictions
- OpenRouter & Cloudflare cost tracking
- Automatic optimization recommendations
- Budget alerts with ML predictions

### 2. Guardian Agent (Port 6004)

- Emergency decision-making with AI
- Pattern recognition across services
- Automatic incident response
- Multi-agent coordination

### 3. Worker Health Monitor (Port 6003)

- AI-powered anomaly detection
- Predictive failure prevention
- Cloudflare Workers monitoring
- Smart health checks

## Quick Start

1. **Copy environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Install dependencies:**

   ```bash
   pip install praisonaiagents fastapi uvicorn redis psycopg2-binary httpx
   ```

3. **Start services:**

   ```bash
   docker-compose up -d
   ```

4. **Access dashboard:**
   ```
   http://localhost:6100
   ```

## MCP Integration

Agents connect to agent-zero's MCP servers for:

- DeepSeek AI models
- Tavily search
- GitHub operations
- Cloudflare management
- Brave search
- Perplexity
- Knowledge graphs

## Configuration

API keys are managed through `.env` file (never committed to git).

See `.env.example` for required variables.

## Development Status

🔒 **Private Development**: Agent implementations are gitignored until production-ready.
✅ **Infrastructure**: Docker, configs, and dashboard are version controlled.

## License

MIT - Part of Bonzokoles JIMBO DevZ Hub
