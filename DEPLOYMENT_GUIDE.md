# PUMO Analytics - Deployment Guide
# Wdrożenie aplikacji webowej na Cloudflare Pages

## 📦 Aplikacja dostępna na GitHub:
https://github.com/Bonzokoles/JIMBO_devz_inc_HUB

## 🚀 Deployment Options:

### OPCJA 1: Cloudflare Pages (ZALECANE dla frontend)

#### Frontend Dashboard Deploy:
1. **Cloudflare Dashboard** → Workers & Pages → Create Application → Pages
2. **Connect to Git** → Select Repository: `JIMBO_devz_inc_HUB`
3. **Build Configuration**:
   - Framework preset: **Vite**
   - Build command: `cd Jimbo_77/frontend/apps/pumo-frontend-legacy && npm install && npm run build`
   - Build output directory: `Jimbo_77/frontend/apps/pumo-frontend-legacy/dist`
   - Root directory: `/`
   - Environment variables:
     ```
     VITE_API_URL=https://your-api.workers.dev
     ```
4. **Deploy** → URL: `https://pumo-analytics.pages.dev`

#### Backend API Deploy (Cloudflare Worker):
```bash
cd Jimbo_77/frontend/apps/pumo-api
npx wrangler deploy
```
URL: `https://jimbo-like-pumo-api.stolarnia-ams.workers.dev`

### OPCJA 2: Vercel (alternatywa)

```bash
npm install -g vercel
cd Jimbo_77/frontend/apps/pumo-frontend-legacy
vercel --prod
```

### OPCJA 3: Netlify

1. Netlify Dashboard → New Site from Git
2. Repository: `JIMBO_devz_inc_HUB`
3. Build command: `cd Jimbo_77/frontend/apps/pumo-frontend-legacy && npm install && npm run build`
4. Publish directory: `Jimbo_77/frontend/apps/pumo-frontend-legacy/dist`

## 🔧 Environment Variables (Production):

### Frontend (.env):
```env
VITE_API_URL=https://your-backend-api.workers.dev
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

### Backend (Cloudflare secrets):
```bash
npx wrangler secret put IDOSELL_API_KEY
npx wrangler secret put DATABASE_URL
```

## 📊 Automated Sync Setup:

### Windows Server / VPS:
```powershell
# Jako Administrator
cd Jimbo_77/api/scripts
.\setup_scheduled_task.ps1
```

### Linux (cron):
```bash
# Dodaj do crontab
crontab -e

# 10x dziennie (co 2h24m)
0 0,2,4,7,9,12,14,16,19,21 * * * /usr/bin/pwsh /path/to/scheduled_sync_10x_daily.ps1
```

### Cloud Functions (Cloudflare Cron Triggers):
W `wrangler.toml` dodaj:
```toml
[triggers]
crons = [
  "0 */2 * * *",  # Co 2 godziny jako backup
]
```

## 🌐 Live URLs (po deploy):

- **Frontend Dashboard**: https://pumo-analytics.pages.dev
- **Backend API**: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev
- **Docs API**: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/docs
- **Health Check**: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/health

## 📈 Monitoring:

- Cloudflare Analytics: Dashboard → Analytics
- Worker Logs: `npx wrangler tail`
- Frontend Vitals: Cloudflare Web Analytics

## 🔒 Security Checklist:

- [ ] `.env` w `.gitignore` ✅
- [ ] API keys w Cloudflare secrets
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS only
- [ ] Authentication dla sensitive endpoints

## 📚 Więcej informacji:

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
