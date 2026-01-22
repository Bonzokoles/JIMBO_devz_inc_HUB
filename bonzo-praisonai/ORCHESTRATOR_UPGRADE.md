# Agent Zero → PraisonAI Orchestrator Upgrade

**Data wdrożenia:** 2026-01-20  
**Status:** ✅ DEPLOYED & OPERATIONAL

---

## Podsumowanie Upgrade'u

Agent Zero został rozbudowany o **orkiestrację 3 wyspecjalizowanych agentów AI** działających na frameworku PraisonAI (4138x szybszym niż CrewAI).

### Architektura po upgrade'ie:

```
┌─────────────────────────────────────────────┐
│       AGENT ZERO (Port 50100)               │
│         Master Orchestrator                  │
│  ┌──────────────────────────────────────┐   │
│  │ • 17 MCP Servers                     │   │
│  │ • JIMBO KRAFT Methodology            │   │
│  │ • PraisonAI Multi-Agent Control      │   │
│  └──────────────────────────────────────┘   │
└──────────────┬───────────────────────────────┘
               │
    ┌──────────┴──────────┬──────────────┐
    │                     │              │
┌───▼────────────┐ ┌──────▼─────────┐ ┌─▼──────────────┐
│ Cost Optimizer │ │ Guardian AI    │ │ Health Monitor │
│   (Port 6012)  │ │  (Port 6014)   │ │  (Port 6013)   │
│                │ │                │ │                │
│ • Budget AI    │ │ • Emergency    │ │ • Predictive   │
│ • Cost Tracking│ │ • Security     │ │ • Anomaly Det. │
│ • Optimization │ │ • Coordination │ │ • Performance  │
└────────────────┘ └────────────────┘ └────────────────┘
         │                 │                    │
         └─────────────────┴────────────────────┘
                           │
                ┌──────────▼────────────┐
                │  JIMBO77 Database     │
                │  (Port 5433)          │
                │  jimbo77_production   │
                └───────────────────────┘
```

---

## Co zostało wdrożone

### 1. Nowy Tool: PraisonAI Orchestrator

**Lokalizacja:** `T:\DOcker_aGENT_zero\prompts\agent.system.tool.praison_orchestrator.md`

**Funkcjonalność:**

- Delegacja zadań do 3 specjalistycznych agentów AI
- Integracja z bazą danych jimbo77
- Monitoring 18 Cloudflare Workers (jimbo77.com + jimbo77.org)
- Wzorce orkiestracji: Sequential, Parallel, Continuous

### 2. Rozszerzony Behaviour JIMBO

**Lokalizacja:** `T:\DOcker_aGENT_zero\prompts\behaviour_JIMBO.md`

**Dodane sekcje:**

- **PraisonAI Multi-Agent Orchestration** - zasady zarządzania agentami
- **JIMBO77 Database Integration** - dostęp do bazy produkcyjnej
- **Multi-Agent Coordination Patterns** - 3 wzorce współpracy
- **Agent Delegation Decision Tree** - automatyczna delegacja zadań

### 3. Zaktualizowany .env Agent Zero

**Lokalizacja:** `T:\DOcker_aGENT_zero\.env`

**Nowe zmienne:**

```bash
# PraisonAI Multi-Agent Orchestration
PRAISON_COST_OPTIMIZER_URL=http://host.docker.internal:6012
PRAISON_GUARDIAN_URL=http://host.docker.internal:6014
PRAISON_HEALTH_URL=http://host.docker.internal:6013
PRAISON_DASHBOARD_URL=http://localhost:6100

# JIMBO77 Database Connection
JIMBO77_DB_HOST=host.docker.internal
JIMBO77_DB_PORT=5433
JIMBO77_DB_NAME=jimbo77_production
JIMBO77_DB_USER=bonzo
JIMBO77_DB_PASSWORD=bonzo_dev_2026

# MCP Token for PraisonAI authentication
AGENT_ZERO_MCP_TOKEN=Bonzo1977
```

### 4. Naprawione Health Checki PraisonAI

**Lokalizacja:** `U:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai\docker-compose.yml`

**Zmiany:**

- Dodano health checki dla wszystkich 4 kontenerów
- Użycie `curl` do testowania endpointów `/health`
- Interwał: 30s, timeout: 10s, retries: 3, start_period: 40s

---

## Dostępne Agenty AI

### 🤑 Cost Optimizer AI (Port 6012)

**Endpoint:** `http://host.docker.internal:6012`

**Specjalizacja:**

- Analiza kosztów OpenRouter, Cloudflare, OpenAI
- Predykcja miesięcznych wydatków
- Optymalizacja dystrybucji wywołań API
- Alerty budżetowe i rekomendacje

**Przykładowe użycie:**

```bash
POST http://host.docker.internal:6012/api/optimize
{
  "task": "analyze_monthly_costs",
  "provider": "openrouter",
  "period": "last_30_days"
}
```

### 🛡️ Guardian AI (Port 6014)

**Endpoint:** `http://host.docker.internal:6014`

**Specjalizacja:**

- Podejmowanie decyzji awaryjnych
- Koordynacja incydentów w wielu serwisach
- Odpowiedź na zagrożenia bezpieczeństwa
- Rozpoznawanie wzorców w systemach rozproszonych

**Przykładowe użycie:**

```bash
POST http://host.docker.internal:6014/api/emergency
{
  "incident_type": "service_outage",
  "affected_services": ["cloudflare-worker", "database"],
  "severity": "critical"
}
```

### 📊 Health Monitor AI (Port 6013)

**Endpoint:** `http://host.docker.internal:6013`

**Specjalizacja:**

- Predykcyjne wykrywanie awarii
- Analiza anomalii w logach i metrykach
- Monitoring Cloudflare Workers
- Proaktywna optymalizacja wydajności

**Przykładowe użycie:**

```bash
POST http://host.docker.internal:6013/api/analyze
{
  "target": "cloudflare_workers",
  "metrics": ["cpu", "memory", "response_time"],
  "window": "24h"
}
```

---

## Integracja z JIMBO77

### Baza Danych

**Połączenie:** `postgresql://bonzo:bonzo_dev_2026@host.docker.internal:5433/jimbo77_production`

**Tabele dostępne dla agentów:**

- `workers_health` - stan zdrowia wszystkich Cloudflare Workers
- `api_costs` - historia kosztów API
- `deployment_logs` - logi wdrożeń
- `incidents` - historia incydentów

### Monitorowane Workery

**jimbo77.com** (Control Hub):

- agents-orchestrator (orchestrator.jimbo77.com)
- api-gateway (api.jimbo77.com)
- auth-service
- content-delivery
- analytics
- ... (łącznie 18 workerów)

**jimbo77.org** (AI Magnet):

- Public catalog dla AI crawlerów
- Dokumentacja API
- Indexing service

---

## Wzorce Użycia

### Wzorzec 1: Proaktywny Monitoring (24/7)

```markdown
Health Monitor → Co 5 minut:
├─ Sprawdź workers_health dla jimbo77.com
├─ Wykryj anomalie w CPU/pamięci/response time
├─ Jeśli wykryto problem:
│ ├─ Eskaluj do Guardian (severity > threshold)
│ └─ Zapisz w knowledge-graph
└─ Kontynuuj monitoring
```

### Wzorzec 2: Monthly Cost Review

```markdown
Bonzo zapytuje: "Co wydaliśmy na AI w grudniu?"

Agent Zero:

1. Deleguje do Cost Optimizer → Analiza api_costs za grudzień
2. Otrzymuje raport z rozbiciem na dostawców
3. Cost Optimizer rekomenduje optymalizacje
4. Prezentuje Bonzo tabelę + oszczędności
```

### Wzorzec 3: Incident Response

```markdown
Alert: "jimbo77.com nie odpowiada!"

Agent Zero:

1. Health Monitor → Natychmiastowa diagnostyka
2. Guardian → Plan awaryjny (AI decision)
3. Cost Optimizer → Koszt przełączenia na backup
4. Wykonanie naprawy
5. Raport co 2 min do rozwiązania
```

---

## Dashboard

**URL:** http://localhost:6100

**Funkcje:**

- Real-time monitoring wszystkich 3 agentów (ostatnie 24h)
- Wykresy kosztów (jimbo77.com + jimbo77.org)
- Metryki zdrowia dla 18 Cloudflare Workers
- Timeline incydentów
- Statystyki wydajności agentów

**Kolory alertów:**

- 🔴 Czerwony → Krytyczny problem (natychmiastowa akcja)
- 🟡 Żółty → Ostrzeżenie (zająć się w ciągu 1h)
- 🟢 Zielony → Wszystko działa

---

## Weryfikacja Wdrożenia

### Test 1: Agent Zero + PraisonAI Communication

```bash
# W interfejsie Agent Zero (http://localhost:50100):
"Sprawdź status wszystkich agentów PraisonAI"

# Oczekiwany wynik:
✅ Cost Optimizer: healthy (localhost:6012)
✅ Guardian AI: healthy (localhost:6014)
✅ Health Monitor: healthy (localhost:6013)
```

### Test 2: Delegacja do Cost Optimizer

```bash
"Ile wydaliśmy na OpenRouter w ostatnim tygodniu?"

# Agent Zero powinien:
1. Rozpoznać pytanie o koszty
2. Delegować do Cost Optimizer
3. Otrzymać analizę
4. Przedstawić wynik w formacie tabeli
```

### Test 3: Health Monitor Alert

```bash
"Jakie są metryki dla jimbo77.com workers?"

# Agent Zero powinien:
1. Delegować do Health Monitor
2. Otrzymać dane z workers_health table
3. Wykryć ewentualne anomalie
4. Jeśli critical → auto-eskalacja do Guardian
```

---

## Monitorowanie

### Docker Status Check

```bash
# Sprawdź wszystkie kontenery:
docker ps --filter "name=agent-zero|bonzo-"

# Oczekiwany output:
agent-zero                   Up X minutes
bonzo-cost-optimizer-ai      Up X minutes (healthy)
bonzo-guardian-ai            Up X minutes (healthy)
bonzo-health-monitor-ai      Up X minutes (healthy)
bonzo-praisonai-dashboard    Up X minutes (healthy)
```

### Logs Check

```bash
# Agent Zero:
docker logs agent-zero --tail 50 | grep -i "praison\|cost\|guardian\|health"

# PraisonAI Agents:
docker logs bonzo-cost-optimizer-ai --tail 20
docker logs bonzo-guardian-ai --tail 20
docker logs bonzo-health-monitor-ai --tail 20
```

### Health Endpoints

```bash
curl http://localhost:6012/health  # Cost Optimizer
curl http://localhost:6014/health  # Guardian
curl http://localhost:6013/health  # Health Monitor
curl http://localhost:6100/api/status  # Dashboard
```

---

## Troubleshooting

### Problem: Agent nie odpowiada

```bash
# 1. Check Docker status
docker ps | grep bonzo-{agent-name}

# 2. View logs
docker logs bonzo-{agent-name}-ai --tail 50

# 3. Restart
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai
docker-compose restart {agent-name}-ai

# 4. Full restart if needed
docker-compose down && docker-compose up -d
```

### Problem: Agent Zero nie widzi agentów

```bash
# 1. Weryfikuj zmienne środowiskowe
docker exec agent-zero env | grep PRAISON

# 2. Sprawdź network connectivity
docker exec agent-zero ping -c 3 host.docker.internal

# 3. Restart Agent Zero
docker restart agent-zero
```

### Problem: Dashboard pokazuje "Unhealthy"

```bash
# 1. Check Redis connection
docker exec bonzo-cost-optimizer-ai redis-cli -h host.docker.internal -p 6379 ping

# 2. Verify database access
docker exec bonzo-health-monitor-ai psql -h host.docker.internal -p 5433 -U bonzo -d jimbo77_production -c "SELECT 1"

# 3. Check health endpoint directly
curl http://localhost:6012/health -v
```

---

## Next Steps

### Rekomendowane ulepszenia:

1. **Auto-delegation rules** - Automatyczne reguły w Agent Zero kiedy delegować zadania
2. **Slack integration** - Notyfikacje z Guardian do Slack przy critical incidents
3. **Cost alerts** - Automatyczne alerty gdy budżet > 80% limitu
4. **Performance baseline** - Historyczna analiza wydajności workerów
5. **AI learning** - Knowledge graph dla wzorców incydentów

### Monitoring długoterminowy:

- Tygodniowe raporty kosztów (Cost Optimizer)
- Miesięczna analiza incydentów (Guardian)
- Kwartalne predykcje infrastruktury (Health Monitor)

---

## Kontakty & Wsparcie

**Agent Zero Interface:** http://localhost:50100  
**PraisonAI Dashboard:** http://localhost:6100  
**JIMBO77 Database:** host.docker.internal:5433

**Dokumentacja:**

- Agent Zero: `T:\DOcker_aGENT_zero\README.md`
- PraisonAI: `U:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai\README.md`
- JIMBO Behaviour: `T:\DOcker_aGENT_zero\prompts\behaviour_JIMBO.md`

---

**Status:** ✅ System gotowy do produkcji  
**Ostatnia aktualizacja:** 2026-01-20 16:45 UTC+01:00
