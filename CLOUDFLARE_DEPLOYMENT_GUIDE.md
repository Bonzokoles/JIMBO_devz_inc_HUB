# Cloudflare Pages Deployment - Jimbo77 Hub

## 🚀 Quick Deploy

### 1. Frontend (Hub Dashboard)
```bash
cd Jimbo_77/frontend/apps/hub
npm run build
npx wrangler pages deploy dist --project-name=jimbo77-hub
```

### 2. Backend API (Python Workers - ALTERNATYWNIE)
⚠️ **UWAGA**: Cloudflare Workers nie obsługuje bezpośrednio Pythona.  
Zalecane podejście: **Deploy API jako Cloudflare Pages Functions**

```bash
cd Jimbo_77/api
# Przekonwertuj FastAPI na Pages Functions (JavaScript/TypeScript)
# LUB hostuj API na zewnętrznym serwerze (Railway, Fly.io, Render)
```

## 🏗️ Architektura Deployment

### Opcja A: Hybrid (Zalecana)
```
┌─────────────────────────────────────┐
│ Cloudflare Pages                    │
│ https://hub.jimbo77.com             │
│ - Frontend (Vite React)             │
│ - Static assets                     │
└─────────────────────────────────────┘
                ↓ API calls
┌─────────────────────────────────────┐
│ External API Server                 │
│ https://api.jimbo77.com             │
│ - Railway/Fly.io/Render             │
│ - Python FastAPI                    │
│ - Agent management                  │
└─────────────────────────────────────┘
```

### Opcja B: Full Cloudflare (Workers dla API)
Wymaga przepisania API z Python na JavaScript/TypeScript

### Opcja C: Cloudflare Tunnel (Dev/Staging)
```bash
# Tunel z lokalnego serwera do Cloudflare
cloudflared tunnel --url http://localhost:8001
```

## 📦 Setup Cloudflare Pages

### 1. Login do Wrangler
```bash
npx wrangler login
```

### 2. Create Pages Project
```bash
cd Jimbo_77/frontend/apps/hub
npx wrangler pages project create jimbo77-hub
```

### 3. Set Environment Variables
```bash
npx wrangler pages secret put VITE_API_BASE --project-name=jimbo77-hub
# Wpisz: https://api.jimbo77.com (lub URL twojego API)
```

### 4. Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name=jimbo77-hub
```

## 🔧 Custom Domain Setup

### Dashboard URL
```bash
npx wrangler pages deployment tail --project-name=jimbo77-hub
# Otrzymasz: https://jimbo77-hub.pages.dev
```

### Add Custom Domain (Optional)
1. Cloudflare Dashboard → Pages → jimbo77-hub → Custom domains
2. Add domain: `hub.jimbo77.com`
3. DNS automatycznie skonfigurowany ✅

## 🤖 Deploy Backend API

### Opcja 1: Railway (Zalecana dla Python)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd Jimbo_77/api
railway init
railway up

# URL: https://jimbo77-api.up.railway.app
```

### Opcja 2: Fly.io
```bash
# Install Fly CLI
# Windows: https://fly.io/docs/hands-on/install-flyctl/

cd Jimbo_77/api
fly launch
fly deploy

# URL: https://jimbo77-api.fly.dev
```

### Opcja 3: Render
1. Połącz GitHub repo: https://render.com
2. New Web Service → Select repo
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 🔗 Connect Frontend to Deployed API

Po deploymencie API, zaktualizuj frontend:

```bash
cd Jimbo_77/frontend/apps/hub
npx wrangler pages secret put VITE_API_BASE --project-name=jimbo77-hub
# Wpisz URL deployed API (np. https://jimbo77-api.up.railway.app)

# Redeploy frontend
npm run build
npx wrangler pages deploy dist --project-name=jimbo77-hub
```

## 🎯 GitHub Actions Auto-Deploy

Utworzę workflow dla auto-deployment:

```yaml
# .github/workflows/deploy-jimbo77.yml
name: Deploy Jimbo77

on:
  push:
    branches: [main]
    paths:
      - 'Jimbo_77/**'

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Build Frontend
        working-directory: Jimbo_77/frontend/apps/hub
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=jimbo77-hub
          workingDirectory: Jimbo_77/frontend/apps/hub

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 🔐 Required Secrets

### GitHub Secrets
Settings → Secrets and variables → Actions

| Secret Name | Gdzie znaleźć |
|------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard → Overview → Account ID |
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |
| `RAILWAY_PROJECT_ID` | Railway → Project Settings → ID |

## ✅ Deployment Checklist

### Frontend (Pages)
- [ ] `wrangler login`
- [ ] `npm run build`
- [ ] `wrangler pages deploy dist --project-name=jimbo77-hub`
- [ ] Set `VITE_API_BASE` secret
- [ ] Test: https://jimbo77-hub.pages.dev

### Backend (Railway/Fly/Render)
- [ ] Create account on platform
- [ ] Connect GitHub repo
- [ ] Configure build & start commands
- [ ] Deploy API
- [ ] Copy deployment URL
- [ ] Update frontend `VITE_API_BASE`

### Agents (Python)
⚠️ Agenci działają jako procesy backendu - są częścią API deployment

### Domain (Optional)
- [ ] Add custom domain in Cloudflare
- [ ] Configure DNS
- [ ] Test: https://hub.jimbo77.com

## 🐛 Troubleshooting

### Frontend nie łączy się z API
```bash
# Sprawdź CORS w API
# app/main.py dodaj:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://jimbo77-hub.pages.dev", "https://hub.jimbo77.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Agenci nie startują
- Agenci wymagają backendu API - nie działają standalone na Cloudflare
- Deploy API na platformie obsługującej długotrwałe procesy (Railway/Fly)

### Build fails
```bash
# Wyczyść cache i rebuild
rm -rf node_modules dist
npm ci
npm run build
```

## 📊 Monitoring

### Cloudflare Pages
```bash
npx wrangler pages deployment tail --project-name=jimbo77-hub
```

### Railway
```bash
railway logs
```

## 🚀 Final URLs

Po deploymencie:
- Frontend: `https://jimbo77-hub.pages.dev`
- API: `https://jimbo77-api.up.railway.app` (lub inna platforma)
- Custom: `https://hub.jimbo77.com`

---

**Next Steps**: Deploy API na Railway/Fly.io, potem frontend na Cloudflare Pages
