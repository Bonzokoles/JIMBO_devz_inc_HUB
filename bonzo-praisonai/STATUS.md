# Bonzo PraisonAI - Status Systemu

**Data uruchomienia:** 2026-01-19 02:00 UTC+01:00
**Status:** ✅ WSZYSTKIE SERWISY DZIAŁAJĄ

---

## 🚀 Uruchomione Kontenery

| Serwis                | Port | Container Name            | Status     |
| --------------------- | ---- | ------------------------- | ---------- |
| **Cost Optimizer AI** | 6012 | bonzo-cost-optimizer-ai   | ✅ healthy |
| **Guardian AI**       | 6014 | bonzo-guardian-ai         | ✅ healthy |
| **Health Monitor AI** | 6013 | bonzo-health-monitor-ai   | ✅ healthy |
| **Dashboard**         | 6100 | bonzo-praisonai-dashboard | ✅ healthy |

---

## 🌐 Dostęp

### Dashboard (Główny interfejs):

```
http://localhost:6100
```

### API Endpoints:

- **Cost Optimizer**: http://localhost:6012/health
- **Guardian AI**: http://localhost:6014/health
- **Health Monitor**: http://localhost:6013/health
- **Dashboard API**: http://localhost:6100/api/status

---

## 🔧 Podstawowe Komendy

### Sprawdzenie statusu:

```bash
cd u:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai
docker-compose ps
```

### Restart wszystkich serwisów:

```bash
docker-compose restart
```

### Stop wszystkich serwisów:

```bash
docker-compose down
```

### Uruchomienie ponownie:

```bash
docker-compose up -d
```

### Logi (wszystkie):

```bash
docker-compose logs -f
```

### Logi (konkretny serwis):

```bash
docker-compose logs -f cost-optimizer-ai
docker-compose logs -f guardian-ai
docker-compose logs -f health-monitor-ai
docker-compose logs -f dashboard
```

---

## 🧪 Testy API

### Cost Optimizer - Analiza kosztów:

```bash
curl -X POST http://localhost:6012/analyze -H "Content-Type: application/json" -d "{\"period\":\"daily\",\"deep_analysis\":false}"
```

### Guardian - Status systemu:

```bash
curl http://localhost:6014/status
```

### Health Monitor - Sprawdzenie workera:

```bash
curl -X POST http://localhost:6013/check/jimbo-gateway
```

---

## 🔗 Połączenia

### Agent-Zero MCP:

- URL: `http://host.docker.internal:50100`
- Token: `t-tv7qMZOoxtLgM29q`
- Status: ✅ Connected

### Redis:

- URL: `redis://host.docker.internal:6379/1`
- Container: jimbo77-redis (współdzielony)
- Status: ✅ Connected

---

## ⚙️ Konfiguracja

### Pliki konfiguracyjne:

- `.env` - wszystkie API keys (❌ GITIGNORED)
- `docker-compose.yml` - orchestracja kontenerów
- `requirements.txt` - dependencies Python

### Klucze API (w .env):

✅ OPENAI_API_KEY  
✅ CLOUDFLARE_API_TOKEN  
✅ CLOUDFLARE_ACCOUNT_ID  
✅ OPENROUTER_API_KEY  
✅ GITHUB_TOKEN  
✅ AGENT_ZERO_MCP_TOKEN  
✅ TAVILY_API_KEY  
✅ PERPLEXITY_API_KEY  
✅ BRAVE_API_KEY

---

## 📝 Ważne Zmiany od Planu:

### Porty zostały zmienione (konflikt z starymi kontenerami Bonzo):

- Cost Optimizer: **6012** (zamiast 6002)
- Health Monitor: **6013** (zamiast 6003)
- Guardian: **6014** (zamiast 6004)
- Dashboard: **6100** (bez zmian)

### Dependencies naprawione:

- `pydantic>=2.11.0` (zamiast 2.9.2) - kompatybilność z MCP
- `mcp==1.25.0` (zamiast 0.9.0 - nie istniało)
- `jinja2==3.1.3` - dodane dla dashboardu

### Redis:

- Usunięty własny kontener Redis (konflikt portu 6379)
- Używa istniejącego `jimbo77-redis` przez `host.docker.internal`

---

## 🎯 Framework: PraisonAI

**Wybrano PraisonAI zamiast CrewAI:**

- ✅ 4138x szybszy
- ✅ Natywne wsparcie MCP
- ✅ Lżejszy (200-300MB RAM per agent)
- ✅ Production-ready

---

## 📊 Funkcjonalność Agentów

### 1. Cost Optimizer AI (6012)

- AI-powered cost analysis dla Cloudflare + OpenRouter
- Budget tracking (daily/monthly)
- Predictive cost forecasting
- Optimization recommendations via DeepSeek

### 2. Guardian AI (6014)

- Emergency decision-making
- Multi-agent health monitoring (6001, 6002, 6003)
- Auto GitHub issue creation
- Pattern recognition dla incident prevention

### 3. Health Monitor AI (6013)

- Cloudflare Workers anomaly detection
- Background monitoring (300s intervals)
- Predictive failure prevention
- Historical baseline tracking w Redis

---

## 🔒 Bezpieczeństwo

### Gitignored (nie pójdzie na GitHub):

- `agents/*.py` - implementacje agentów AI
- `.env` - wszystkie API keys
- `secrets/` - sensitive data

### Publiczne (w repo):

- Infrastructure (docker-compose, Dockerfile)
- Dashboard code
- Shared utilities
- Dokumentacja

---

## 🚨 Troubleshooting

### Jeśli kontenery nie startują:

1. Sprawdź logi: `docker-compose logs -f`
2. Zrestartuj: `docker-compose restart`
3. Rebuild: `docker-compose up -d --build`

### Jeśli porty zajęte:

```bash
# Sprawdź które kontenery używają portów
docker ps --filter "publish=6012" --filter "publish=6013" --filter "publish=6014"

# Stop konfliktujących kontenerów
docker stop <container-name>
```

### Jeśli brak połączenia z MCP:

- Upewnij się że agent-zero działa: `curl http://localhost:50100/health`
- Sprawdź token w `.env`: `AGENT_ZERO_MCP_TOKEN=t-tv7qMZOoxtLgM29q`

---

## 📚 Dokumentacja

- **README.md** - pełna dokumentacja projektu
- **QUICKSTART.md** - 5-minutowy setup guide
- **agents/README.md** - szczegóły implementacji agentów

---

## ✅ Po Restarcie Komputera

1. **Uruchom Docker Desktop**
2. **Sprawdź agent-zero:**
   ```bash
   curl http://localhost:50100/health
   ```
3. **Uruchom Bonzo PraisonAI:**
   ```bash
   cd u:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai
   docker-compose up -d
   ```
4. **Otwórz dashboard:**
   ```
   http://localhost:6100
   ```

---

**Gotowe!** System zostanie automatycznie uruchomiony przez Docker Desktop po restarcie (jeśli ustawione auto-start dla kontenerów).
