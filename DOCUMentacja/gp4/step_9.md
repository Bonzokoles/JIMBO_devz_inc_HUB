# Realizacja: AISEO Crawler Analytics System (Live Production)

Ten dokument opisuje wdrożony i działający system analityki botów AI (AISEO), który integruje się z ekosystemem PUMO oraz JIMBO77.

## 1. Architektura Systemu

System składa się z trzech głównych komponentów połączonych w czasie rzeczywistym:

1.  **Źródło Danych (The Trap)**: Blog (`my-bonzo-ai-blog`) wykrywa wizyty botów.
2.  **Kolektor (The Hub)**: Pumo API (Cloudflare Worker) odbiera sygnały i zapisuje je w bazie D1.
3.  **Wizualizacja (The Eye)**: Dashboard (`apps/hub`) pobiera statystyki i wyświetla je w widgecie.

```mermaid
graph LR
    Bot[AI Crawler / GPT] -->|Visits| Blog[MyBonzo Blog\n(Astro)]
    Blog -->|POST /track-bot| API[Pumo API\n(CF Worker)]
    API -->|Insert| DB[(D1 Database\n'bot_logs')]
    Dashboard[JIMBO77 Hub\n(React)] -->|GET /track-bot| API
    Dashboard -->|Display| UI[AICrawlerWidget]
```

## 2. Komponenty Techniczne

### A. Baza Danych (D1 `jimbo-rag-db`)

Tabela `bot_logs` przechowująca ślady wizyt.

```sql
CREATE TABLE IF NOT EXISTS bot_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_agent TEXT,
    ip TEXT,
    path TEXT,
    headers TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_known_bot BOOLEAN DEFAULT 0,
    bot_type TEXT -- 'gpt', 'claude', 'google', 'bing', 'meta', 'other'
);
```

### B. Backend (Pumo API)

Plik: `apps/pumo-api/src/endpoints/analytics.ts`
Endpoint: `/api/analytics/track-bot`

Obsługuje dwie metody:
- **POST**: Zapisuje log (używane przez Bloga). Rozpoznaje typ bota po `User-Agent`.
- **GET**: Zwraca statystyki (używane przez Dashboard). Agreguje ilość wizyt i zwraca ostatnie logi.

```typescript
// Fragment logiki detekcji
const ua = userAgent.toLowerCase();
if (ua.includes('gpt') || ua.includes('openai')) botType = 'gpt';
else if (ua.includes('claude')) botType = 'claude';
// ...
```

### C. Frontend (Blog Tracking)

Plik: `src/pages/api/ai-metadata.json.ts` (w repo Bloga)

Każde odpytanie pliku `ai-metadata.json` (który jest "honeypotem" dla botów AI szukających kontekstu) wysyła sygnał do API.

```typescript
// Fire-and-forget (ale z await dla pewności w serverless)
await fetch('https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/analytics/track-bot', {
    method: 'POST',
    // ...
});
```

### D. Dashboard Widget

Plik: `apps/hub/src/features/pumo/components/AICrawlerWidget.tsx`

Komponent React odświeżający się co 30 sekund.
- Wyświetla **Total Hits**.
- Pokazuje listę **Ostatnich Wizyt** (IP, Agent, Czas).
- Koloruje typy botów (GPT=zielony, Claude=pomarańczowy itd.).

## 3. Status Wdrożenia (Production)

Wszystkie elementy są wdrożone i aktywne na produkcji Cloudflare.

| Komponent | URL Produkcyjny | Status |
| :--- | :--- | :--- |
| **API** | `jimbo-like-pumo-api.stolarnia-ams.workers.dev` | ✅ Live |
| **Blog** | `mybonzoaiblog.pages.dev` | ✅ Live |
| **Dashboard** | `jimbo77-ops-hub.pages.dev` (oraz `jimbo77.com`) | ✅ Live |

## 4. Jak Testować?

1.  Wejdź na `https://mybonzoaiblog.pages.dev/api/ai-metadata.json` (symulacja wizyty bota).
2.  Odśwież Dashboard (`https://jimbo77.com`).
3.  Licznik "Total Visits" powinien wzrosnąć, a Twoje wejście pojawić się w tabeli "Recent Activity" (jako `other` browser lub `gpt` jeśli użyjesz curl z odpowiednim UA).
