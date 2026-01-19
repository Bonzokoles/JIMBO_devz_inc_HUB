# Workspace Navigator - Naprawa Healthcheck

**Data:** 2026-01-19  
**Problem:** Container `bonzo-workspace-navigator` unhealthy  
**Status:** ✅ Naprawione

---

## 🔍 Diagnoza Problemu

### Objaw

```bash
docker ps --filter "name=bonzo-workspace-navigator"
# bonzo-workspace-navigator   Up 39 minutes (unhealthy)
```

### Analiza Logów

```bash
docker logs bonzo-workspace-navigator --tail 100
# INFO: Uvicorn running on http://0.0.0.0:6200
# INFO: Application startup complete
# INFO: 172.28.0.1:40170 - "GET /health HTTP/1.1" 200 OK
```

**Wniosek:** Aplikacja działa poprawnie (200 OK), ale healthcheck fail.

### Test Manualny

```bash
curl http://localhost:6200/health
# {"status":"healthy","service":"workspace-navigator"}
# ✅ Endpoint działa
```

### Healthcheck Logs

```bash
docker inspect bonzo-workspace-navigator --format='{{json .State.Health.Log}}' | jq
# {
#   "ExitCode": 1,
#   "Output": "/bin/sh: 1: curl: not found\n"
# }
```

**Przyczyna:** `curl` nie jest zainstalowany w obrazie `python:3.11-slim`

---

## 🛠️ Podjęte Działania

### Próba 1: Instalacja curl w Dockerfile ❌

**Plik:** `workspace-navigator-agent/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY navigator_agent.py .

EXPOSE 6200

CMD ["python", "navigator_agent.py"]
```

**Rebuild:**

```bash
docker-compose build workspace-navigator
docker-compose restart workspace-navigator
```

**Wynik:** ❌ Nadal unhealthy

- Container wciąż używał starej konfiguracji healthchecku
- `docker-compose restart` nie przeładowuje definicji healthcheck z `docker-compose.yml`

---

### Próba 2: Python-based Healthcheck ✅

**Plik:** `config/docker-compose.yml`

**Przed:**

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:6200/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
```

**Po:**

```yaml
healthcheck:
  test:
    [
      "CMD-SHELL",
      'python -c "import urllib.request; urllib.request.urlopen(''http://localhost:6200/health'')" || exit 1',
    ]
  interval: 30s
  timeout: 10s
  retries: 3
```

**Wdrożenie (WAŻNE):**

```bash
# Restart NIE działa - trzeba usunąć i odtworzyć kontener
docker-compose stop workspace-navigator
docker-compose rm -f workspace-navigator
docker-compose up -d workspace-navigator
```

**Test:**

```bash
# Czekamy ~35 sekund (interval 30s + init)
sleep 35

docker ps --filter "name=bonzo-workspace-navigator"
# bonzo-workspace-navigator   Up 49 seconds (healthy)
# ✅ SUKCES!
```

**Weryfikacja healthchecku:**

```bash
docker exec bonzo-workspace-navigator python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:6200/health').read())"
# b'{"status":"healthy","service":"workspace-navigator"}'
# ✅ Działa
```

---

## ✅ Rozwiązanie Finalne

### Zmienione Pliki

1. **workspace-navigator-agent/Dockerfile**
   - Dodano instalację curl (nieużywane ostatecznie)
   - Zachowane dla kompatybilności

2. **config/docker-compose.yml**
   - Zmieniono healthcheck na Python-based
   - **To jest aktywne rozwiązanie**

### Deployment Steps

```bash
# 1. Zatrzymaj kontener
docker-compose stop workspace-navigator

# 2. Usuń kontener (ważne!)
docker-compose rm -f workspace-navigator

# 3. Utwórz nowy z nową konfiguracją
docker-compose up -d workspace-navigator

# 4. Poczekaj na healthcheck (30s interval)
sleep 35

# 5. Weryfikuj status
docker ps --filter "name=bonzo-workspace-navigator"
```

---

## 📊 Status Final

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep workspace
# bonzo-workspace-navigator   Up 10 minutes (healthy)   0.0.0.0:6200->6200/tcp
```

**Healthcheck Logs:**

```bash
docker inspect bonzo-workspace-navigator --format='{{json .State.Health.Log}}' | jq '.[-1]'
# {
#   "Start": "2026-01-19T03:50:13Z",
#   "End": "2026-01-19T03:50:13Z",
#   "ExitCode": 0,
#   "Output": ""
# }
```

**ExitCode: 0** = ✅ Success

---

## 🎓 Lessons Learned

### 1. Docker Compose Restart Limitation

`docker-compose restart` **NIE** przeładowuje zmian w:

- healthcheck configuration
- environment variables (niektóre)
- volume mappings (niektóre)

**Rozwiązanie:** `stop → rm → up`

### 2. Slim Images

`python:3.11-slim` nie zawiera:

- curl
- wget
- ping (niektóre wersje)
- netcat

**Rozwiązanie:** Użyj natywnych narzędzi (Python `urllib`)

### 3. Healthcheck Best Practices

**Dobre:**

```yaml
# Python (zawsze dostępne w Python images)
test: ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:6200/health')\""]

# Node.js (w Node images)
test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health')\""]

# PostgreSQL (w postgres images)
test: ["CMD-SHELL", "pg_isready -U postgres"]
```

**Złe:**

```yaml
# curl/wget - mogą nie być zainstalowane
test: ["CMD-SHELL", "curl -f http://localhost:8000/health"]
```

### 4. Debugging Healthcheck

**Krok 1:** Sprawdź czy app działa

```bash
docker logs <container> --tail 50
```

**Krok 2:** Test endpoint z hosta

```bash
curl http://localhost:{port}/health
```

**Krok 3:** Test healthcheck command w kontenerze

```bash
docker exec <container> <healthcheck-command>
```

**Krok 4:** Sprawdź healthcheck logs

```bash
docker inspect <container> --format='{{json .State.Health}}' | jq
```

---

## 🔧 Alternatywne Rozwiązania

### Opcja A: Instalacja curl (porzucona)

```dockerfile
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

**Wady:**

- Zwiększa rozmiar image
- Dodatkowe zależności
- Wymaga rebuildu

### Opcja B: Python urllib (✅ użyta)

```yaml
test:
  [
    "CMD-SHELL",
    'python -c "import urllib.request; urllib.request.urlopen(''http://localhost:6200/health'')"',
  ]
```

**Zalety:**

- Brak dodatkowych zależności
- Python zawsze dostępny
- Zmiana tylko w docker-compose.yml

### Opcja C: TCP check (nie testowana)

```yaml
test: ["CMD-SHELL", "nc -z localhost 6200"]
```

**Wady:**

- netcat może nie być dostępny
- Nie sprawdza czy endpoint działa
- Tylko test połączenia TCP

### Opcja D: Python healthcheck script (nadmierna)

```dockerfile
COPY healthcheck.py .
```

```yaml
test: ["CMD", "python", "healthcheck.py"]
```

**Wady:**

- Dodatkowy plik
- Bardziej skomplikowane
- Overkill dla prostego checku

---

## 📋 Checklist dla Podobnych Problemów

- [ ] Sprawdź logi aplikacji (`docker logs`)
- [ ] Test endpoint z hosta (`curl`)
- [ ] Test healthcheck command w kontenerze (`docker exec`)
- [ ] Sprawdź healthcheck logs (`docker inspect`)
- [ ] Zidentyfikuj brakujące narzędzie
- [ ] Wybierz rozwiązanie (native tool > install dependency)
- [ ] Update docker-compose.yml
- [ ] Stop → Remove → Up (nie restart!)
- [ ] Czekaj na healthcheck interval + retries
- [ ] Weryfikuj status (`docker ps`)

---

## 🔗 Related Files

- `workspace-navigator-agent/Dockerfile` - Build configuration
- `config/docker-compose.yml` - Service definition
- `workspace-navigator-agent/navigator_agent.py` - Application code
- `workspace-navigator-agent/requirements.txt` - Python dependencies

---

**Problem Resolved:** ✅ 2026-01-19 04:49 AM  
**Solution:** Python-based healthcheck  
**Status:** Healthy (verified)
