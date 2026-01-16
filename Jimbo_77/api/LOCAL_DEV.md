# 🚀 MoE-RAG Local Development

## Quick Start

### Windows (PowerShell)

```powershell
cd JIMBO_devz_inc_HUB\Jimbo_77\api
.\start_local.ps1
```

### Linux/Mac

```bash
cd JIMBO_devz_inc_HUB/Jimbo_77/api
chmod +x start_local.sh
./start_local.sh
```

### VS Code Task

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type "Run Task"
3. Select **"MoE-RAG: Start Local Server"**

## Server URLs

| Endpoint           | URL                                      | Description                   |
| ------------------ | ---------------------------------------- | ----------------------------- |
| **API Root**       | http://localhost:8001                    | API status                    |
| **Swagger Docs**   | http://localhost:8001/docs               | Interactive API documentation |
| **MoE-RAG Health** | http://localhost:8001/api/moe-rag/health | Service health check          |
| **MoE-RAG Query**  | http://localhost:8001/api/moe-rag        | Main query endpoint (POST)    |
| **MoE-RAG Debug**  | http://localhost:8001/api/moe-rag/debug  | Debug routing logic (POST)    |

## Testing Examples

### 1. Health Check

```bash
curl http://localhost:8001/api/moe-rag/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "moe-rag",
  "version": "0.2.0",
  "components": {
    "graph": true,
    "embeddings": true,
    "input_validation": true
  }
}
```

### 2. Simple Query (FAST Path)

```bash
curl -X POST http://localhost:8001/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the shipping cost?"}'
```

### 3. Complex Query (EXPERT Path)

```bash
curl -X POST http://localhost:8001/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need detailed analysis of ergonomic office furniture including chairs, desks, and accessories with price comparisons and recommendations for small business."
  }'
```

### 4. Debug Routing

```bash
curl -X POST http://localhost:8001/api/moe-rag/debug \
  -H "Content-Type: application/json" \
  -d '{"query": "What is MoE-RAG?"}'
```

### 5. Test Security (SQL Injection)

```bash
curl -X POST http://localhost:8001/api/moe-rag \
  -H "Content-Type: application/json" \
  -d '{"query": "'; DROP TABLE users; --"}'
```

Expected: `400 Bad Request` with validation error

## Python Test Script

Use the included test script:

```bash
python test_moe_rag.py
```

## Dependencies

Auto-installed by start script:

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sentence-transformers` - Semantic search embeddings
- `pydantic` - Data validation
- `requests` - HTTP client (for testing)

Manual install:

```bash
pip install -r requirements.txt
```

## Port Configuration

Default port: **8001**

To change port, edit `run.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
```

## Troubleshooting

### Port already in use

```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
```

### Missing agents/logs directory

The start script creates it automatically. If manual creation needed:

```bash
mkdir -p ../agents/logs
```

### Import errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Embeddings model download

First run downloads 539MB model from HuggingFace. Requires internet connection.

## Development Features

- **Auto-reload**: Changes to code trigger automatic restart
- **CORS enabled**: Frontend can connect from any origin
- **Logging**: JSON structured logs with OTEL trace IDs
- **Health checks**: Monitor component availability
- **Swagger UI**: Interactive API testing at `/docs`

## Architecture

```
MoE-RAG Request Flow:
1. Input Validation (SQL/XSS/Prompt injection detection)
2. Routing (FAST/EXPERT/HYBRID path via GatingNetwork)
3. Retrieval (Semantic search with embeddings)
4. Agent Selection (Research/Writing/System experts)
5. Response Synthesis (Aggregation and formatting)
6. Metrics Tracking (Latency, tokens, cost)
```

## Next Steps

1. **Local Development**: Use `start_local.ps1` ✅
2. **Testing**: Try examples in Swagger UI ✅
3. **Deployment**: Deploy to `api.jimbo77.com` 🚀
4. **Frontend**: Integrate with dashboard UI
5. **Monitoring**: Add production telemetry

## Resources

- [PHASE_1.md](../../../docs/perpl/PHASE_1.md) - Full architecture plan
- [PHASE_opja_B.md](../../../docs/perpl/PHASE_opja_B.md) - Deployment guide
- [test.md](../../../docs/perpl/test.md) - Embeddings implementation
- [API Docs](http://localhost:8001/docs) - Live documentation (when server running)
