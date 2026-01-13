# 🚀 QUICK START: IdoSell → Cloudflare D1 Export

## Przygotowanie systemu ✅

### 1. Test klucza API (NATYCHMIAST!)

```powershell
cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\scripts
.\test_idosell_key.ps1 -ApiKey "TWÓJ_NOWY_KLUCZ"
```

**Oczekiwany wynik:**
- ✅ Products (v3) - SUCCESS
- ✅ Orders (v3) - SUCCESS
- Status: 2/4 OK (minimum)

---

### 2. Uruchom FastAPI server

```powershell
.\start_fastapi.ps1
```

**Sprawdź:**
- http://localhost:8001/docs - Swagger UI
- http://localhost:8001/health - {"status": "ok"}

---

### 3. Wykonaj pełny eksport (AUTOMATYCZNY WORKFLOW)

```powershell
.\full_export_workflow.ps1 -ApiKey "TWÓJ_KLUCZ" -SinceDate "2025-07-13"
```

**Proces:**
1. ✅ Test API key (products + orders)
2. 🚀 Start FastAPI (localhost:8001)
3. 📤 Export do D1 (6 miesięcy danych)
4. 🧹 Cleanup (stop server)

---

## Alternatywny sposób (ręczny)

### 1. Test klucza
```powershell
.\test_idosell_key.ps1 -ApiKey "KLUCZ" -Method "x-api-key"
```

### 2. Start API
```powershell
.\start_fastapi.ps1
# Zostaw terminal otwarty!
```

### 3. W nowym terminalu - wykonaj export
```powershell
curl -X POST "http://localhost:8001/v1/meble-pumo/idosell/export-to-d1" `
  -H "Content-Type: application/json" `
  -d '{
    "api_key": "TWÓJ_KLUCZ",
    "method": "x-api-key",
    "entities": ["products", "orders"],
    "since_date": "2025-07-13"
  }'
```

---

## Endpoints FastAPI

### POST `/v1/meble-pumo/idosell/export-to-d1`
Pełny eksport IdoSell → D1

**Body:**
```json
{
  "api_key": "KLUCZ_IDOSELL",
  "method": "x-api-key",
  "entities": ["products", "orders"],
  "since_date": "2025-07-13"
}
```

**Response:**
```json
{
  "success": true,
  "test_results": {
    "working_endpoints": ["products", "orders"]
  },
  "export_summary": {
    "data": {
      "products": {"total_fetched": 150, "batches": 2},
      "orders": {"total_fetched": 45, "batches": 1}
    }
  },
  "d1_results": {
    "products": {"inserted": 150, "success": true},
    "orders": {"inserted": 45, "success": true}
  }
}
```

---

## Troubleshooting

### ❌ 401 Unauthorized
- Sprawdź klucz w panelu IdoSell
- Upewnij się że scope "admin" lub "read" jest włączony
- Użyj `test_idosell_key.ps1` do debugowania

### ❌ 404 Not Found
- Endpoint może być inny dla twojego sklepu
- Sprawdź dokumentację IdoSell API v3
- Użyj `/api/v3/products` zamiast `/api/admin/v3/products/products`

### ❌ FastAPI nie startuje
- Sprawdź czy port 8001 jest wolny: `netstat -ano | findstr :8001`
- Zainstaluj dependencies: `pip install fastapi uvicorn httpx sqlalchemy`
- Aktywuj venv: `.venv\Scripts\Activate.ps1`

---

## Weryfikacja w D1

```powershell
cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-api

# Produkty
npx wrangler d1 execute pumo-analiza --remote --command "SELECT COUNT(*) as total FROM products"

# Zamówienia
npx wrangler d1 execute pumo-analiza --remote --command "SELECT COUNT(*) as total FROM orders"

# Ostatni sync
npx wrangler d1 execute pumo-analiza --remote --command "SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 5"
```

---

## WHITECAT RAG - Następne kroki

Po udanym eksporcie do D1:

1. **Cloudflare Worker cron** - codzienne sync
   - `wrangler-cron.toml` - schedule: "0 2 * * *" (02:00 UTC)
   - Endpoint: `https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/idosell/sync`

2. **Vectorize** - embedding produktów dla AI
   - Tabela: `products` → pole `description` 
   - Index: WHITECAT_PRODUCTS_INDEX
   - Use case: Rekomendacje AI w chatbocie

3. **Analytics Dashboard**
   - D1 → `analytics_summary` table
   - KPIs: total_revenue, order_count, avg_order_value
   - Real-time: Cloudflare Workers Analytics Engine

---

## Szybki test całości

```powershell
# 1. Test klucza
.\test_idosell_key.ps1 -ApiKey "KLUCZ"

# 2. Pełny workflow (jeśli test OK)
.\full_export_workflow.ps1 -ApiKey "KLUCZ" -SinceDate "2025-07-13"

# 3. Weryfikacja D1
cd ..\..\..\frontend\apps\pumo-api
npx wrangler d1 execute pumo-analiza --remote --command "SELECT entity_type, records_fetched, status FROM sync_log ORDER BY created_at DESC LIMIT 3"
```

✅ Gotowe do użycia!
