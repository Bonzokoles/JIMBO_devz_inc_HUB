# Bonzo PraisonAI Agents

AI-powered agents using PraisonAI framework with MCP integration to agent-zero.

## Agent Implementations

Agent implementations (`.py` files) are **gitignored** during development phase.

### Available Agents

#### 1. Cost Optimizer Agent (`cost_optimizer.py`)

**Port:** 6002  
**Purpose:** AI-driven cost optimization and predictions

**Features:**

- Real-time cost analysis using DeepSeek through MCP
- OpenRouter API usage tracking
- Cloudflare Workers/R2/KV cost monitoring
- ML-based budget predictions
- Automatic optimization suggestions
- Slack alerts for budget thresholds

**MCP Tools Used:**

- `deepseek` - AI analysis
- `cloudflare` - Analytics
- `tavily-mcp` - Research best practices

#### 2. Guardian Agent (`guardian_agent.py`)

**Port:** 6004  
**Purpose:** Emergency AI decision-making and incident response

**Features:**

- Multi-agent health monitoring
- Pattern recognition across services
- Emergency response automation
- Incident prediction using AI
- Cross-service coordination via A2A protocol

**MCP Tools Used:**

- `deepseek` - Decision analysis
- `knowledge-graph` - Historical patterns
- `github` - Auto-create incidents

#### 3. Worker Health Monitor (`health_monitor.py`)

**Port:** 6003  
**Purpose:** AI-powered anomaly detection for Cloudflare Workers

**Features:**

- Real-time health checks (every 300s)
- Anomaly detection using ML
- Predictive failure prevention
- Smart alerting (reduces false positives)
- Auto-remediation suggestions

**MCP Tools Used:**

- `cloudflare` - Worker metrics
- `deepseek` - Anomaly analysis
- `brave-search` - Error documentation

## Architecture

```python
from praisonaiagents import Agent, Task, PraisonAIAgents
from shared import MCPClient, get_redis_client

# Initialize MCP connection to agent-zero
mcp = MCPClient()

# Create PraisonAI agent
agent = Agent(
    name="Cost Optimizer",
    role="Financial Analysis Expert",
    goal="Optimize cloud costs and predict budget issues",
    backstory="AI agent specialized in cost optimization...",
    tools=[mcp.search_web, mcp.cloudflare_analytics]
)

# Define task
task = Task(
    description="Analyze current spending and suggest optimizations",
    expected_output="Cost report with recommendations",
    agent=agent
)

# Run agent
agents = PraisonAIAgents(agents=[agent], tasks=[task])
result = agents.start()
```

## Development

To implement an agent:

1. Copy `.env.example` to `.env` and add API keys
2. Implement agent in `agents/` directory
3. Use `shared.MCPClient` for agent-zero integration
4. Follow FastAPI structure for HTTP endpoints
5. Test locally before Docker deployment

## Integration Points

- **Redis:** Shared state and caching (`redis://host.docker.internal:6379/1`)
- **PostgreSQL:** Data persistence
- **Agent-Zero MCP:** AI capabilities through 17+ MCP servers
- **Slack:** Alerts and notifications

## Status

🚧 **In Development** - Agent implementations are private until production-ready.
