# 🏰 MASTER PLAN: PUMO MEGASTORE OS (v2.0)
**Data:** 2026-01-22
**Cel Strategiczny:** Transformacja Meble Pumo w "Autonomous Enterprise" - sklep zarządzany przez dane i AI, z wizualizacją klasy NASA dla zarządu.

## 🌟 WIZJA KOŃCOWA (The "North Star")

Dashboard nie jest "tabelką w Excelu". Jest **Centrum Dowodzenia**.
- **Wizualizacja Procesów:** Mapa magazynu 3D, mapa dostaw na żywo, "krwiobieg" zamówień (flowcharts).
- **Prawda Czasu Rzeczywistego:** Zero fake data. Jeśli API sklepu nie działa -> czerpiemy z lokalnych eksportów/cache.
- **Autorska Baza Wiedzy (Pumo Brain):** System wie o meblach wszystko. Uczy się z instrukcji PDF, maili, reklamacji.
- **Python Power:** Cała ciężka analityka (prognozy, optymizacja cen) dzieje się w tle na potężnych bibliotekach Pythona.

---

## 🏛️ FILARY SYSTEMU (4 MODUŁY)

### 1. 🧠 MODUŁ "PUMO BRAIN" (Cloudflare RAG Integration)
*Serce systemu. Wykorzystujemy istniejącą infrastrukturę Cloudflare.*

**Technologia:** Cloudflare Vectorize (Baza Wektorowa), Workers AI (Llama/Mistral), D1 (Metadane).
**Status:** Podłączamy się do instancji `LUCJAN MOA` (istniejący worker).

- **[A] Baza Wiedzy Produktowej (Deep Index):**
  - **Źródło:** Cloudflare Vectorize (już tam są lub będą indeksowane instrukcje/opisy).
  - **Dostęp:** Przez API `guides.py` (LUCJAN MOA Worker).
  - Cel: AI rozumie kontekst mebli bez mielenia PDFów lokalnie.
- **[B] Asystent Analityczny (Data Sage):**
  - Wykorzystuje RAG do "rozmowy z danymi".
  - Analiza sentymentu i trendów bezpośrednio na chmurze CF.

### 2. 👁️ MODUŁ "VISUAL COMMAND CENTER" (Frontend)
*Twarz systemu. Ma wyglądać jak UI z filmu sci-fi, ale być czytelny.*

**Technologia:** React, Vite, Framer Motion (animacje), Tremor/Recharts (wykresy), Deck.gl (mapy).

- **[A] Financial Cockpit (PRIORYTET #1):**
  - **Revenue Stream:** Ile zarobiliśmy dzisiaj? (Suma zamówień z `orders.json`/API).
  - **Profit Estimator:** Przychód minus szacunkowe COGS (marża).
  - **Trend:** "Jesteśmy 15% nad celem".
- **[B] Dashboard "Front Page":**
  - **Live Ticker:** Pasek przesuwny z ostatnimi zamówieniami (jak giełda).
  - **Heatmapa Sprzedaży:** Mapa Polski z gorącymi strefami zamówień.
- **[C] Magazyn Wizualny:**
  - Reprezentacja stanów magazynowych jako bloków.

### 3. ⚙️ MODUŁ "HEAVY DUTY OPS" (Python Analytics)
*Mięśnie systemu. Gotowe biblioteki Python robią robotę.*

**Technologia:** FastAPI, Pandas/Polars, Prophet (Facebook), Scikit-learn.

- **[A] Revenue Forecasting:**
  - Biblioteka `Prophet`: Prognoza przychodu na 30 dni (na bazie historii zamówień).
- **[B] Dynamic Pricing:**
  - Algorytmy analizy cen konkurencji (moduł scrapujący).
- **[C] Automated Reporting:**
  - Generowanie PDF "Poranny Raport Prezesa".

### 4. 🔌 MODUŁ "CONNECTOR" (Integracja)
*Nerwy systemu. Łączy wszystko w całość.*

**Technologia:** Redis (cache), IdoSell API Wrappers, CSV/XML Importers.

- **Strategia "Data Lake":**
  1. Pobieramy dane z API (jeśli działa).
  2. Jeśli brak API -> importujemy pliki XML/CSV (drop zone).
  3. Dane lądują w naszej bazie ujednoliconej (PostgreSQL/SQLite).
  4. Dashboard czyta TYLKO z naszej bazy (szybkość + niezależność).

---

## 📅 HARMONOGRAM REALIZACJI (Roadmapa)

### FAZA 1: FUNDAMENT (Tydzień 1-2)
*Cel: Uruchomić system, który "widzi" dane (z plików lub API).*

1. **Setup Środowiska:** Repo monorepo, backend FastAPI, frontend React.
2. **Data Ingestion Pipeline:**
   - Skrypt Python do wciągania `products.json` i `orders.json` (z exportów) do bazy SQL.
   - *Placeholder* dla kluczy API (obsługa braku połączenia).
3. **Dashboard v1:**
   - Wyświetlenie Top 50 produktów i trendu sprzedaży z PRAWDZIWYCH danych (zaciągniętych z plików).
   - Usunięcie wszystkich "mock data" z kodu.

### FAZA 2: INTELIGENCJA (Tydzień 2-3)
*Cel: Nauczyć system wiedzy o sklepie.*

1. **Budowa RAG:**
   - Indeksowanie opisów produktów.
   - Prosty Chatbot w Dashboardzie: "Pokaż mi najlepiej sprzedające się szafy białe".
2. **Analityka Python:**
   - Wdrożenie biblioteki `Prophet` do prognozy sprzedaży na 7 dni.

### FAZA 3: WIZUALIZACJA I PROCESY (Tydzień 4+)
*Cel: Efekt WOW i użyteczność operacyjna.*

1. **Wdrożenie Map i Heatmap:** Gdzie wysyłamy meble?
2. **Alerting System:** Powiadomienia Slack/Email o spadkach sprzedaży/awariach.
3. **Automatyzacja:** Generowanie listy zakupowej dla działu zaopatrzenia.

---

## 🛠️ ZESTAW NARZĘDZI (TECH STACK)

### BACKEND (The Engine)
- **Język:** Python 3.12
- **API:** FastAPI (super szybkie, async)
- **Data Proc:** Pandas (standard analityczny), Polars (super szybkie dataframes)
- **AI/ML:** LangChain, OpenAI SDK, Facebook Prophet
- **Task Queue:** Celery + Redis (do zadań w tle, np. mielenie raportów)

### FRONTEND (The View)
- **Framework:** React + TypeScript (stabilność)
- **Build:** Vite (szybkość dev)
- **Styling:** Tailwind CSS (nowoczesny design) + Framer Motion
- **Wizualizacja:**
  - `Recharts` (wykresy liniowe/słupkowe)
  - `Nivo` (zaawansowane heatmapy/sankeys)
  - `React-Leaflet` (mapy)

### DATABASE & STORAGE
- **Główna:** PostgreSQL (dane transakcyjne)
- **Wektory (AI):** ChromaDB (lokalna) lub PGVector
- **Cache:** Redis

---

## 📝 CO ROBIMY TERAZ? (Next Steps)

1. **Zatwierdzenie Planu.**
2. **Uruchomienie Pipeline Danych:** Musimy nakarmić "bestię" danymi z Twoich plików JSON (skoro API klucze później).
3. **Start Dashboardu:** Uruchomienie go na porcie 3002 i podpięcie pod ten nowy, prawdziwy backend.

*Podpisano: Jimbo Orchestrator*
