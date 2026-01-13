# PUMO Diagnosis Hub - Advanced Analytics Setup

## ✅ Co zostało dodane:

### 1. **Backend API Endpoints** (`analytics_ai.py`)
Nowe endpointy do zaawansowanej analityki:

- `GET /v1/analytics/business-overview` - Kompleksowy przegląd KPIs
- `GET /v1/analytics/revenue-trend?days=30` - Trend przychodów z wykresami  
- `GET /v1/analytics/top-products?limit=10` - Top produkty według sprzedaży
- `GET /v1/analytics/customer-segments` - Segmentacja klientów (nowi/powracający)
- `GET /v1/analytics/payment-methods` - Analiza metod płatności
- `GET /v1/analytics/order-sources` - Źródła zamówień (Allegro/strona)
- `GET /v1/analytics/customers-detailed?limit=20` - Szczegóły top klientów
- `POST /v1/analytics/ai-predictions` - AI predictions z ML models
- `GET /v1/analytics/health` - Status systemu analytics

**Lokalizacja**: `u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\app\routes\analytics_ai.py`

### 2. **Frontend Dashboard** (`AppAdvanced.tsx`)
Rozszerzony dashboard z zakładkami:

- **Overview** - KPIs, wykresy przychodów, segmentacja klientów, metody płatności, źródła zamówień
- **Products** - Tabela top produktów z klikami, CTR, przychodami
- **Customers** - Top klienci według wydanych pieniędzy, status VIP
- **AI Predictions** - Prognoza przychodów na 7/30 dni, analiza trendów, rekomendacje AI
- **Chat AI** - Real-time analiza przez AI (dostępny na każdej zakładce)

**Komponenty**:
- 5 agentów monitorujących (Data Export, Analytics Engine, AI Predictor, Customer Segmentation, Revenue Tracker)
- Auto-refresh co 60 sekund
- Wykresy: Line (przychody), Doughnut (segmenty/płatności), Bar (źródła zamówień)

**Lokalizacja**: `u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy\src\AppAdvanced.tsx`

### 3. **Zainstalowane biblioteki Python**
```bash
pandas numpy scikit-learn prophet statsmodels plotly
```

Do zaawansowanej analizy danych i AI predictions.

### 4. **API Client rozszerzony** (api.ts)
Typy TypeScript + metody:
- `getCustomerSegments()`
- `getPaymentMethods()`
- `getOrderSources()`
- `getAIPredictions()`
- `getTopCustomers(limit)`

## 🚀 Jak uruchomić:

### Backend (FastAPI):
```bash
cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api
U:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/.venv/Scripts/python.exe main.py
```
API będzie działać na: http://localhost:8000

### Frontend (React + Vite):
```bash
cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\frontend\apps\pumo-frontend-legacy
npm run dev
```
Dashboard będzie na: http://localhost:3002

## 📊 Wymagania danych:

Backend czyta dane z:
```
u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports/
├── analytics_[timestamp].json  # Główna analytics (revenue, customer segments, payment methods, order sources, daily sales)
├── products_[timestamp].json   # Produkty
├── orders_[timestamp].json     # Zamówienia
└── customers_[timestamp].json  # Klienci z historią zakupów
```

Te pliki są generowane przez `export_business_analytics.ps1`.

## ⚠️ Stan eksportu danych:

Skrypt `export_business_analytics.ps1` był uruchomiony i osiągnął **6000 produktów** z auto-save.

### Sprawdź co zostało wyeksportowane:
```powershell
Get-ChildItem "u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB\Jimbo_77\api\exports\*.json" | Select-Object Name, Length, LastWriteTime
```

### Jeśli dane niekompletne - uruchom ponownie:
```powershell
cd u:\JIMBO_UNIFIELD_WEBSIDES_hub\JIMBO77_DEVZ_inc_HUB
.\export_business_analytics.ps1
```

## 🔄 Workflow automatyzacji:

Dashboard automatycznie:
1. Ładuje dane przy starcie
2. Odświeża co 60 sekund
3. Wyświetla status 5 agentów
4. Pokazuje trendy w czasie rzeczywistym

## 🎯 Co dalej:

### Krótkoterminowo:
- [ ] Dokończyć eksport danych (6000 → ~7000 produktów)
- [ ] Zweryfikować poprawność JSON files
- [ ] Przetestować backend endpoints z prawdziwymi danymi

### AI & ML:
- [ ] Dodać prawdziwy ML model do predictions (Prophet/scikit-learn)
- [ ] Training AI na historical data
- [ ] Anomaly detection
- [ ] Seasonal pattern analysis

### Dashboard Enhancements:
- [ ] Filtry czasowe (ostatnie 7/30/90 dni)
- [ ] Export raportów do PDF/Excel
- [ ] Real-time notifications (alerts)
- [ ] Mobile responsive design

## 📝 Integracja z istniejącym systemem:

- ✅ Backend zintegrowany z `app/main.py` (router dodany)
- ✅ Frontend zmieniony na `AppAdvanced` w `main.tsx`
- ✅ API endpoints używają tych samych danych co export scripts
- ✅ Chart.js już skonfigurowany
- ✅ TypeScript types zdefiniowane

## 🐛 Known Issues:

1. Backend wymaga prawdziwych danych w `exports/` directory
2. AI predictions używają mock data - trzeba dodać ML model
3. Auto-refresh może być za częsty dla dev (można zmienić na 5 min)

## 📚 Dokumentacja:

- Backend API docs: http://localhost:8000/docs (gdy backend działa)
- React komponenty: Sprawdź `AppAdvanced.tsx` dla struktury
- Data schema: Zobacz typy w `api.ts`
