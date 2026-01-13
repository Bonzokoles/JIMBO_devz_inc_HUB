# PUMO Deployment Guide

## Cloudflare Pages Deployment

### 1. Build Settings
- **Build command**: `pnpm -F @apps/pumo build`
- **Build output directory**: `apps/pumo/dist`
- **Root directory**: `Jimbo_77/frontend`

### 2. Environment Variables
Set in Cloudflare Pages dashboard:
```
VITE_API_BASE=https://api.pumo.jimbo77.com
```

### 3. Custom Domain
- Add `pumo.jimbo77.com` in Cloudflare Pages → Custom domains
- DNS will be configured automatically

## Cloudflare Worker (Backend API)

### 1. D1 Database Setup
```bash
# Create D1 database
wrangler d1 create pumo-analytics

# Run migrations
wrangler d1 execute pumo-analytics --file=./schema.sql
```

### 2. KV Namespace
```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"
```

### 3. R2 Bucket
```bash
# Create R2 bucket
wrangler r2 bucket create pumo-backups
```

### 4. Secrets
```bash
wrangler secret put DASHBOARD_PASSWORD
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GA4_SERVICE_ACCOUNT_JSON
wrangler secret put PUMO_API_KEY
```

### 5. Deploy Worker
```bash
cd apps/pumo
wrangler deploy
```

## Local Development

### Frontend
```bash
cd apps/pumo
pnpm dev
# http://localhost:3002
```

### Worker (with local D1)
```bash
wrangler dev --local
```

## Database Schema

Create `schema.sql`:
```sql
-- Events table
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KPIs table
CREATE TABLE kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  total_revenue REAL,
  ai_revenue REAL,
  conversion_rate REAL,
  total_clicks INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  clicks INTEGER DEFAULT 0,
  ctr REAL,
  revenue REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'idle',
  last_run DATETIME,
  config JSON
);

-- Alerts table
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT,
  severity TEXT,
  message TEXT,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring

### Cloudflare Analytics
- Workers Analytics for API metrics
- Pages Analytics for frontend traffic

### Custom Dashboards
- Grafana integration (optional)
- Custom metrics via D1 queries

## CI/CD

### GitHub Actions
Create `.github/workflows/deploy-pumo.yml`:
```yaml
name: Deploy PUMO

on:
  push:
    branches: [main]
    paths:
      - 'Jimbo_77/frontend/apps/pumo/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm -F @apps/pumo build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: pumo-analytics
          directory: apps/pumo/dist
          workingDirectory: Jimbo_77/frontend
```

## Production Checklist

- [ ] D1 database created and migrated
- [ ] KV namespace created
- [ ] R2 bucket created
- [ ] All secrets set
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] Worker deployed
- [ ] Frontend deployed
- [ ] DNS propagated
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup cron job running
