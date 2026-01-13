# Mapa endpointów (modular vs monolit)

## 1) Modular (aktywny w deployu: `src/index-new.ts`)

### System
- `GET /` — info o API (json)
- `GET /health` — healthcheck

### Dashboard
- `GET /pumo-diagnosis-hub/` oraz `GET /dashboard` — serwuje inline HTML
- auth: `src/auth/auth.ts` (Basic Auth, hardcode)

### Analytics (stub)
- `GET /api/analytics/kpis`
- `GET /api/analytics/revenue-trend`
- `GET /api/analytics/category-stats`
- `GET /api/analytics/recent-events`
- `POST /api/analytics/populate-sample`

### Products (stub)
- `GET /api/products/` — zwraca count z tabeli `products`

## 2) Monolit (nieaktywny w deployu, ale realnie użyteczny)

Poniższe ścieżki są zaimplementowane w `src/index.ts` (stan z ZIP). Jeżeli przełączysz `wrangler.toml` na `main = "src/index.ts"`, one zaczną działać.

### Dashboard
- `GET /dashboard`
- auth: `DASHBOARD_PASSWORD` (Basic Auth) lub Cloudflare Access JWT; lokalnie brak auth

### Search / AI / Guides
- `POST /api/search`
- `POST /api/chunk/process`
- `POST /api/generate-guides`
- `GET /api/guide/*`

### Tracking + Analytics
- `POST /api/track`
- `GET /api/analytics/kpis`
- `GET /api/analytics/ai-impact`
- `GET /api/analytics/revenue-trend`
- `GET /api/analytics/traffic-sources`
- `GET /api/analytics/category-performance`
- `GET /api/analytics/top-products`
- `GET /api/analytics/realtime`
- `GET /api/analytics/reports`
- `GET /api/analytics/report/:id`

### Sync
- `POST /api/sync/trigger`
- `POST /api/sync/full`
- `POST /api/sync/incremental`
- `GET  /api/sync/test`
- `GET  /api/sync/status`
- `GET  /api/changes`

### Orders
- `POST /api/orders/sync`
- `GET  /api/orders/stats`
- `GET  /api/orders/:id`

### Attribution
- `GET /api/revenue/attribution`

### GA4
- `POST /api/ga4/run-report`

### R2
- `POST /api/cleanup-r2`

### Email
- `POST /api/email/subscribe`
- `POST /api/email/unsubscribe`
- `POST /api/email/update-frequency`
- `GET  /api/email/subscribers`
- `GET  /api/email/stats`
- `POST /api/email/send-test`

## Wniosek

Jeśli celem jest „dashboard wraz z narzędziami analizy i całą resztą”, to **modularny wariant nie dowozi** (to jest UI + placeholdery). Funkcjonalnie bliżej celu jest monolit — albo trzeba go przenieść do modularnej architektury.
