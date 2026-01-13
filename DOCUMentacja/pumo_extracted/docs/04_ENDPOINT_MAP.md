# Mapa endpointów (stan faktyczny vs „jest w kodzie”)

## A) Aktywny po deployu (wg `wrangler.toml` → `src/index-new.ts`)

### Publiczne
- `GET /` → info o API (w routerze)
- `GET /health` → health

### Dashboard (chroniony Basic Auth)
- `GET /pumo-diagnosis-hub/*`
- `GET /dashboard` i `/dashboard/`

### Analytics API (stub)
- `GET /api/analytics/kpis`
- `GET /api/analytics/revenue-trend`
- `GET /api/analytics/category-stats`
- `GET /api/analytics/recent-events`
- `POST /api/analytics/populate-sample` (tylko POST)

### Products API (stub)
- `GET /api/products/` → zwraca count z D1 (tabela `products` musi istnieć)

## B) Obecne w repo, ale NIE podpięte w deploy (monolit `src/index.ts`)

To lista istotna, bo może być Twoim docelowym „pełnym” API:

- `POST /api/chunk/process`
- `POST /api/search`
- `POST /api/generate-guides`
- `GET  /api/guide/*`

Analityka:
- `POST /api/track`
- `GET  /api/analytics/kpis`
- `GET  /api/analytics/ai-impact`
- `GET  /api/analytics/revenue-trend`
- `GET  /api/analytics/traffic-sources`
- `GET  /api/analytics/category-performance`
- `GET  /api/analytics/top-products`
- `GET  /api/analytics/realtime`
- `GET  /api/analytics/reports`
- `GET  /api/analytics/report/:id`

Dashboard:
- `GET /dashboard` (auth: env password / Access)
- `POST /analytics` (dashboard analytics)

Sync:
- `POST /api/sync/trigger`
- `POST /api/sync/full`
- `POST /api/sync/incremental`
- `GET  /api/sync/test`
- `GET  /api/sync/status`
- `GET  /api/changes`

Orders:
- `POST /api/orders/sync`
- `GET  /api/orders/stats`
- `GET  /api/orders/:id`
- `GET  /api/revenue/attribution`

GA4:
- `POST /api/ga4/run-report`

R2:
- `POST /api/cleanup-r2`

Email:
- `POST /api/email/subscribe`
- `POST /api/email/unsubscribe`
- `POST /api/email/update-frequency`
- `GET  /api/email/subscribers`
- `GET  /api/email/stats`
- `POST /api/email/send-test`

## C) Szybki check: co się wywali, jeśli brakuje DB

Modularny `GET /api/products/` zakłada tabelę `products` w D1.
Jeśli schema nie istnieje → request zwróci błąd 500.

**Warto dodać:** endpoint `/api/schema/health` który sprawdza obecność kluczowych tabel i zwraca listę braków.
