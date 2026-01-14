# 🚀 JIMBO77 API Backend Deployment Guide

**Data**: 14 stycznia 2026  
**Status**: Ready for Production Deployment

---

## 📦 Przygotowane pliki deploymentu:

### ✅ Railway (Zalecane - najszybsze)
- `railway.json` - Konfiguracja Railway
- `Procfile` - Start command
- `runtime.txt` - Python 3.11

### ✅ Render / Fly.io
- `Procfile` - Start command (też działa)
- `requirements.txt` - Dependencies (już jest)

---

## 🎯 OPCJA 1: Railway Deploy (Zalecane)

### Krok 1: Przygotuj repo
```bash
cd U:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api
git add railway.json Procfile runtime.txt
git commit -m "feat: Add Railway deployment config"
git push
```

### Krok 2: Deploy na Railway
1. Idź na https://railway.app
2. Zaloguj się przez GitHub
3. Kliknij "New Project"
4. Wybierz "Deploy from GitHub repo"
5. Wybierz `JIMBO_devz_inc_HUB`
6. **WAŻNE**: Ustaw Root Directory: `Jimbo_77/api`
7. Railway wykryje `railway.json` automatycznie
8. Kliknij "Deploy"

### Krok 3: Konfiguruj Environment Variables (opcjonalnie)
Railway → Settings → Variables:
```
PORT=8001
ENVIRONMENT=production
DATABASE_URL=postgresql://... (jeśli używasz PostgreSQL)
REDIS_URL=redis://... (jeśli używasz Redis)
```

### Krok 4: Sprawdź deployment
Railway poda URL typu: `https://jimbo77-api-production.up.railway.app`

Test:
```bash
curl https://jimbo77-api-production.up.railway.app/health
# Powinno zwrócić: {"status":"ok"}
```

### Krok 5: Ustaw Custom Domain (opcjonalnie)
Railway → Settings → Domains:
- Add Custom Domain: `api.jimbo77.com`
- Dodaj CNAME w Cloudflare DNS:
  - Name: `api`
  - Target: `jimbo77-api-production.up.railway.app`

---

## 🎯 OPCJA 2: Render Deploy

### Krok 1: Commit files (już zrobione)

### Krok 2: Deploy na Render
1. Idź na https://render.com
2. Zaloguj się przez GitHub
3. New → Web Service
4. Connect `JIMBO_devz_inc_HUB`
5. **Root Directory**: `Jimbo_77/api`
6. **Build Command**: `pip install -r requirements.txt`
7. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
8. Instance Type: Free (lub Starter $7/mo)
9. Create Web Service

### Krok 3: Test
```bash
curl https://jimbo77-api.onrender.com/health
```

---

## 🎯 OPCJA 3: Fly.io Deploy

### Krok 1: Zainstaluj Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Krok 2: Deploy
```bash
cd Jimbo_77/api
fly launch
# Wybierz nazwę: jimbo77-api
# Wybierz region: fra (Frankfurt)
fly deploy
```

### Krok 3: Test
```bash
curl https://jimbo77-api.fly.dev/health
```

---

## ⚙️ Po deploymencie - Konfiguracja Frontendu

### Zaktualizuj API_BASE w frontend:

**Plik**: `Jimbo_77/frontend/packages/core/src/api.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_BASE ?? "https://jimbo77-api-production.up.railway.app";
```

**Lub przez environment variable** (lepsze):

Stwórz `.env` w `Jimbo_77/frontend/apps/hub/`:
```env
VITE_API_BASE=https://jimbo77-api-production.up.railway.app
VITE_MOCK=false
```

Commit i push → GitHub Actions zrobi redeploy frontendu.

---

## 🔍 Weryfikacja deployment

### 1. Health Check
```bash
curl https://YOUR_API_URL/health
# {"status":"ok"}
```

### 2. API Docs
```
https://YOUR_API_URL/docs
```

### 3. Test Agents Endpoint
```bash
curl https://YOUR_API_URL/api/agents
```

### 4. Test Projects Endpoint
```bash
curl https://YOUR_API_URL/v1/projects
```

---

## 🔧 Troubleshooting

### Problem: "Application failed to respond"
**Rozwiązanie**: Sprawdź logi deployment:
- Railway: View Logs
- Render: Logs tab
- Fly.io: `fly logs`

### Problem: CORS errors w frontend
**Rozwiązanie**: Backend już ma `allow_origins=["*"]` w `main.py`, ale sprawdź czy URL jest prawidłowy.

### Problem: Database connection errors
**Rozwiązanie**: 
- Railway: Add PostgreSQL service w tym samym projekcie
- Render: Add PostgreSQL database
- Fly.io: `fly postgres create`

---

## 📊 Kosztorys

### Railway
- Free tier: 500 godzin/miesiąc ($0)
- Starter: $5/miesiąc (zawsze online)
- Database: $5/miesiąc (PostgreSQL)

### Render
- Free tier: Usypia po 15 min nieaktywności ($0)
- Starter: $7/miesiąc (zawsze online)
- Database: $7/miesiąc (PostgreSQL)

### Fly.io
- Free tier: 3 shared-cpu VMs ($0)
- Paid: $1.94/miesiąc per VM

**Zalecenie**: Railway ($5/mo) - najszybszy setup, najlepszy DX

---

## 🎉 Po deploymencie

Frontend automatycznie:
1. ✅ Pokaże wszystkie 18 agentów (z AGENT_REGISTRY)
2. ✅ Załaduje serwisy z API (zamiast mock data)
3. ✅ Włączy CAY Converter API
4. ✅ Włączy orkiestrację agentów
5. ✅ Pokaże prawdziwe dane PUMO

---

**Status**: Wszystko gotowe do wdrożenia! Wybierz platformę i deployment!
