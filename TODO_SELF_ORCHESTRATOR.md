# 📋 JIMBO ORCHESTRATOR - INTERNAL TODO (v2.0)
Data: 2026-01-22
Cel: Wdrożenie PUMO MEGASTORE OS (zgodnie z `MASTER_PLAN_PUMO_MEGASTORE_OS.md`)

## 1. Strategia i Planowanie (ROZPOCZĘTE)
- [x] Zapoznanie z obecnym "prototypem" (pumo-frontend-legacy).
- [x] Stworzenie `MASTER_PLAN_PUMO_MEGASTORE_OS.md` - wizja "North Star". (ZROBIONE)
- [x] Stworzenie `CRUSH_SCENARIO_PUMO_FIX.md` - plan "Minimum Viable Fix" (żeby cokolwiek działało).

## 2. Faza Egzekucji "CRUSH" (Immediate Action - Tydzień 1)
*Cel: Ożywić pacjenta. Połączyć frontend z backendem i nakarmić danymi.*
- [ ] **Agent Coder:** Uruchomienie FastAPI na porcie 8001 + endpoint `/health`.
- [ ] **Agent Coder:** Implementacja Data Pipeline (import `products.json` i `orders.json` do SQLite/Postgres).
- [ ] **Agent Verifier:** Potwierdzenie, że frontend wyświetla Prawdziwe Liczby z plików exportu.
- [ ] **Agent Analyst:** Specyfikacja Bazy Wiedzy (co indeksujemy? PDFy, CSV?).

## 3. Faza Rozwoju "MEGASTORE" (Next Steps - Tydzień 2+)
- [ ] **Infrastruktura AI (CF RAG):**
    - Podłączenie do `LUCJAN MOA Worker` (Cloudflare).
    - Test zapytań wektorowych (czy baza odpowiada?).
- [ ] **Financial Module (PRIORYTET):**
    - Obliczenie "True Revenue" (Suma zamówień opłaconych).
    - Wdrożenie biblioteki `Prophet` do prognozowania przychodów.
- [ ] **Advanced Vis:**
    - Wdrożenie mapy dostaw (Leaflet/Deck.gl).

## 4. Decyzje Architektoniczne (Do potwierdzenia z Userem)
- [ ] Czy używamy lokalnego LLM (Llama 3 via Ollama) czy OpenAI API?
- [ ] Czy stawiamy pełny PostgreSQL czy na start wystarczy SQLite?
