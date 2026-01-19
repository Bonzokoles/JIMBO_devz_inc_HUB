# Network Control Center - Quick Start Guide

**Czas instalacji:** ~5 minut  
**Poziom:** Intermediate  
**Wymagania:** Docker, Node.js, npm

---

## 🚀 Start w 3 Krokach

### 1. Backend API (już działa ✅)

```bash
# Verify backend is running
curl http://localhost:3885/api/network/health
# {"status":"healthy","active_connections":42,"listening_ports":18}

# If not running:
cd U:/The_yellow_hub/config
docker-compose restart api-gateway
```

### 2. Network Control Frontend

```bash
# Navigate to app
cd U:/The_yellow_hub/JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/network-control

# Install dependencies (pierwszy raz)
npm install

# Create environment config
cp .env.example .env.local

# Edit .env.local - dodaj OpenRouter API key (opcjonalne)
# VITE_OPENROUTER_API_KEY=sk-or-v1-xxx

# Start dev server
npm run dev
```

**Otwórz:** http://localhost:5173

### 3. Hub Dashboard Integration

```bash
# Navigate to Hub
cd U:/The_yellow_hub/JIMBO_devz_inc_HUB/Jimbo_77/frontend/apps/hub

# Start Hub dev server
npm run dev

# W przeglądarce:
# 1. Otwórz Hub URL (np. http://localhost:3000)
# 2. Kliknij 🌐 NETWORK CTRL w menu
# 3. Zobaczysz Network Control w iframe
```

---

## 📋 Podstawowe Funkcje

### Dashboard (Tab 1)

**Network Services:**

- Kliknij przycisk "Scan Network" (jeśli dostępny)
- Zobacz listę aktywnych portów
- Sprawdź vulnerability scores (0-100)

**VPN Status:**

- Status Proton VPN
- Lokalizacja i IP
- Connect/Disconnect (wymaga Proton VPN CLI)

**PowerShell Tools:**

- DNS: Clear cache, Show cache, Resolve
- Network: Active ports, Kill port, Reset
- System: Info, Services, Clean temp

### AI Analysis

**Security Scan:**

1. Kliknij przycisk AI analysis (jeśli dostępny)
2. Agent Zero analizuje (local, fast)
3. Jeśli Agent Zero offline → OpenRouter fallback
4. Zobacz rekomendacje bezpieczeństwa

### Export Data

**Generate Report:**

1. Tab: Metrics
2. Przycisk "Export to PDF"
3. Pobierz comprehensive report
4. Lub CSV/JSON dla raw data

---

## 🔧 Konfiguracja (Opcjonalnie)

### OpenRouter API Key

**Dlaczego:** Fallback gdy Agent Zero offline

**Jak:**

1. Zarejestruj się: https://openrouter.ai
2. Stwórz API key
3. Edytuj `.env.local`:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-xxx
   ```
4. Restart dev server

**Koszt:** ~$0.10 per 1M tokens (Qwen 2.5 72B)

### Proton VPN CLI (Opcjonalnie)

**Dlaczego:** Full VPN control (connect/disconnect)

**Instalacja:**

```bash
pip install protonvpn-cli
```

**Bez CLI:** Status monitoring działa, control wymaga CLI

---

## 🐛 Troubleshooting

### Problem: Frontend nie łączy się z Backend

**Symptom:** Network errors w console

**Rozwiązanie:**

```bash
# 1. Sprawdź Backend
curl http://localhost:3885/api/network/health

# 2. Jeśli nie działa:
docker logs bonzo-api-gateway --tail 50
docker-compose restart api-gateway

# 3. Sprawdź CORS w .env.local
VITE_BACKEND_API_URL=http://localhost:3885
```

### Problem: AI Analysis timeout

**Symptom:** "Agent Zero unavailable"

**Rozwiązanie:**

```bash
# 1. Sprawdź Agent Zero
curl http://localhost:50100/health

# 2. Jeśli nie działa:
docker ps | grep agent-zero

# 3. Fallback (OpenRouter) powinien zadziałać automatycznie
# Sprawdź czy masz VITE_OPENROUTER_API_KEY w .env.local
```

### Problem: PowerShell fails

**Symptom:** Command errors

**Rozwiązanie:**

```powershell
# 1. Sprawdź execution policy
Get-ExecutionPolicy

# 2. Jeśli Restricted:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Test backend endpoint
Invoke-WebRequest -Uri "http://localhost:3885/api/network/powershell" -Method POST -Body '{"command":"Get-Date"}' -ContentType "application/json"
```

### Problem: Port 5173 already in use

**Symptom:** `npm run dev` fails

**Rozwiązanie:**

```bash
# Option A: Kill existing process
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Option B: Use different port
npm run dev -- --port 5174
```

---

## 📊 Przykładowe Scenariusze

### Scenariusz 1: Security Audit

**Cel:** Znajdź podatne usługi

**Kroki:**

1. Otwórz Network Control (http://localhost:5173)
2. Dashboard → Zobacz listę services
3. Szukaj wysokich vulnerability scores (>70)
4. Kliknij service → Zobacz details
5. Kliknij "AI Analysis" → Rekomendacje
6. Metrics → Export PDF report

**Oczekiwany czas:** 2-3 minuty

### Scenariusz 2: Port Management

**Cel:** Zamknij proces blokujący port

**Kroki:**

1. PowerShell Tools → Network
2. Wybierz "Pokaż aktywne porty"
3. Zobacz listę → Znajdź port (np. 8080)
4. Wybierz "Zamknij port"
5. Wpisz numer portu → Execute
6. Verify: Port już nie listen

**Oczekiwany czas:** 1 minuta

### Scenariusz 3: VPN Check

**Cel:** Sprawdź czy VPN działa

**Kroki:**

1. Dashboard → VPN Status section
2. Zobacz:
   - isActive: true/false
   - Location: Country, City
   - IP: Masked IP
   - Provider: Proton VPN
3. (Opcjonalnie) Connect/Disconnect

**Oczekiwany czas:** 10 sekund

---

## 🎯 Najlepsze Praktyki

### Development

**✅ DO:**

- Zawsze testuj Backend endpoint najpierw (`curl`)
- Użyj Agent Zero dla prostych analiz (fast, free)
- Export metrics regularnie (PDF/CSV)
- Monitoruj vulnerability scores >70

**❌ DON'T:**

- Nie uruchamiaj PowerShell commands bez zrozumienia
- Nie kill critical processes (lsass, csrss, etc.)
- Nie share OpenRouter API key
- Nie ignoruj high vulnerability alerts

### Production

**Przed wdrożeniem:**

- [ ] Build production: `npm run build`
- [ ] Test all endpoints
- [ ] Configure CORS properly
- [ ] Setup RBAC for PowerShell
- [ ] Enable rate limiting
- [ ] Setup monitoring alerts

---

## 📚 Następne Kroki

### Po Quick Start

1. **Przeczytaj:** `INTEGRATION_GUIDE.md` - Full documentation
2. **Przeczytaj:** `NETWORK_CONTROL_DEPLOYMENT_REPORT.md` - Technical details
3. **Test:** Wszystkie PowerShell commands
4. **Configure:** OpenRouter API key
5. **Explore:** Metrics & exports

### Integracja z Systemem

**Hub Dashboard:**

- Network Control już dodany (🌐 NETWORK CTRL)
- Testuj iframe integration
- Verify wszystkie features działają

**Agent System:**

- Network Control może współpracować z:
  - bonzo-guardian-agent (security)
  - bonzo-deployment-coordinator (orchestration)
  - bonzo-research-agent (data collection)

---

## 📞 Support

**Documentation:**

- `INTEGRATION_GUIDE.md` - Comprehensive guide
- `NETWORK_CONTROL_DEPLOYMENT_REPORT.md` - Deployment details
- `WORKSPACE_NAVIGATOR_FIX.md` - Healthcheck troubleshooting

**API Docs:**

- Backend: http://localhost:3885/docs
- Network routes: `/api/network/*`
- VPN routes: `/api/vpn/*`

**Logs:**

```bash
# Backend
docker logs bonzo-api-gateway --tail 100

# Frontend (console)
# Open browser DevTools → Console
```

---

**Quick Start Complete!** 🎉  
**Next:** Explore all features → Read full docs → Integrate with agents

**Estimated Time to Full Productivity:** ~30 minutes
