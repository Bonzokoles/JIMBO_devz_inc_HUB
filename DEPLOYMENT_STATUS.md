# 🚀 Quick Start - Jimbo77 Agents Deployment

## Status: ✅ Kod w GitHub | ⏳ Deployment w toku

### 1. GitHub ✅ DONE
```bash
✅ Commit: "Cloudflare deployment setup + GitHub Actions CI/CD"
✅ Push: origin/main
✅ Files:
   - .github/workflows/deploy-jimbo77.yml (GitHub Actions)
   - CLOUDFLARE_DEPLOYMENT_GUIDE.md (dokumentacja)
   - Jimbo_77/api/wrangler.toml (config)
   - Jimbo_77/frontend/apps/hub/.env.example
   - AgentsView.tsx (env vars)
```

### 2. Cloudflare Pages Deployment (Frontend) ⏳ IN PROGRESS

```bash
cd Jimbo_77/frontend/apps/hub

# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=jimbo77-hub

# Expected URL: https://jimbo77-hub.pages.dev
```

**Status**: Komenda uruchomiona, czekam na output...

### 3. API Backend Deployment (Następny krok)

⚠️ **WYBIERZ PLATFORMĘ**:

#### Opcja A: Railway (Zalecana - obsługuje Python)
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd Jimbo_77/api
railway init
railway up

# Zapisz URL (np. https://jimbo77-api.up.railway.app)
```

#### Opcja B: Fly.io
```bash
cd Jimbo_77/api
fly launch
fly deploy
```

#### Opcja C: Render
1. https://render.com → New Web Service
2. Connect GitHub repo
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 4. Połącz Frontend z API

Po deploymencie API, zaktualizuj frontend:

```bash
cd Jimbo_77/frontend/apps/hub

# Set API URL w Cloudflare
npx wrangler pages secret put VITE_API_BASE --project-name=jimbo77-hub
# Wpisz: https://twoj-api-url.com

# Redeploy
npm run build
npx wrangler pages deploy dist --project-name=jimbo77-hub
```

## 📊 Current Status

| Component | Status | URL | Next Action |
|-----------|--------|-----|-------------|
| GitHub Repo | ✅ Pushed | [JIMBO77_DEVZ_inc_HUB](https://github.com/user/JIMBO77_DEVZ_inc_HUB) | - |
| Frontend Build | ⏳ Running | - | Czekam na build output |
| Cloudflare Pages | ⏳ Deploying | - | Czekam na deployment URL |
| Backend API | ❌ Not deployed | - | Deploy na Railway/Fly/Render |
| GitHub Actions | ✅ Configured | - | Auto-deploy on push |

## 🎯 Po Deploymencie

### Test Systemu
```bash
# 1. Sprawdź frontend
curl https://jimbo77-hub.pages.dev

# 2. Sprawdź API
curl https://twoj-api-url.com/health

# 3. Test agentów przez UI
# Otwórz: https://jimbo77-hub.pages.dev
# Kliknij: AGENTS → Start agent
```

### Monitoring
```bash
# Cloudflare Pages logs
npx wrangler pages deployment tail --project-name=jimbo77-hub

# Railway logs (jeśli Railway)
railway logs

# GitHub Actions
# GitHub → Actions → Deploy Jimbo77
```

## ⚡ Next Steps

1. **Poczekaj na output `wrangler pages deploy`** - zapisz URL
2. **Deploy API** na Railway/Fly.io/Render
3. **Set VITE_API_BASE** w Cloudflare Pages secrets
4. **Redeploy frontend** z nowym API URL
5. **Test agentów** przez UI

## 🆘 Jeśli coś nie działa

### Frontend build failed
```bash
cd Jimbo_77/frontend/apps/hub
rm -rf node_modules dist
npm ci
npm run build
```

### Cloudflare login required
```bash
npx wrangler login
# Otwórz browser, zaloguj się, autoryzuj
```

### API nie łączy się
- Sprawdź CORS w `app/main.py`
- Dodaj frontend URL do `allow_origins`
- Redeploy API

---

**Current Command Running**: `npx wrangler pages deploy dist --project-name=jimbo77-hub`  
**Waiting for**: Deployment URL z Cloudflare
