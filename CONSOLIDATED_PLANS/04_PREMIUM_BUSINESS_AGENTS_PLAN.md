# 👔 PREMIUM BUSINESS & SHOP AGENTS - "THE SUITS"

> **CEL**: Stworzenie elitarnej jednostki agentów AI do zadań "Hard Business" & "E-commerce Operations".
> **ZASADA**: Zero zabawy. Czysty biznes. Profesjonalizm. Zysk.

---

## 🏛️ STRUKTURA "THE SUITS" (Dział Biznesowy)

Wprowadzamy 3 nowe, wyspecjalizowane role agentów, którzy operują na najwyższym poziomie abstrakcji biznesowej.

### 1. **"The DEALMAKER" (Sales Director Agent)**
*Dla kogo: B2B, Strategia, Negocjacje*

**Główne Kompetencje:**
*   **Dynamic Pricing Strategy**: Analizuje ceny konkurencji (via Research Agent) i sugeruje optymalizację marży w sklepie (PUMO).
*   **B2B Lead Outreach**: Generuje spersonalizowane, "zimne maile" do partnerów biznesowych, które nie brzmią jak spam.
*   **Negotiation Bot**: Potrafi prowadzić wstępne negocjacje z dostawcami (według zdefiniowanych 'guardrails' cenowych).
*   **Revenue Forecasting**: Przewiduje piki sprzedaży na podstawie trendów sezonowych i danych historycznych.

**Tech Stack:**
*   Model: `GPT-4o` (zaawansowane techniki perswazji, wysokie IQ biznesowe).
*   Integracje: CRM (HubSpot/Pipedrive), Shopify/WooCommerce API (dane sprzedażowe).

### 2. **"The SHOPKEEPER" (E-commerce Operations Agent)**
*Dla kogo: Meble Pumo, Sklep, Obsługa Klienta*

**Główne Kompetencje:**
*   **Inventory Watchdog 24/7**: Monitoruje stany magazynowe. Gdy towar schodzi, sam generuje zamówienie do dostawcy (do zatwierdzenia przez człowieka).
*   **Smart RMA Handler**: Automatyzuje proces zwrotów i reklamacji. Analizuje zdjęcia uszkodzeń (Vision API) i sugeruje decyzję (Zwrot / Wymiana / Odrzucenie).
*   **Cart Recovery Sniper**: Wysyła ultra-precyzyjne wiadomości do porzuconych koszyków, ale nie "Hej, zapomniałeś!", tylko "Zauważyłem, że oglądasz narożnik X - mam dla Ciebie info o dostawie jutro.".
*   **PUMO Guide Expert**: Zna cały asortyment na pamięć. Działa jako "Wirtualny Doradca Wnętrzarski" na czacie.

**Tech Stack:**
*   Model: `DeepSeek V3` (świetny stosunek jakości do ceny przy masowych operacjach) lub `Llama 3.3` (lokalnie dla prywatności danych klientów).
*   Dostęp: Baza SQL sklepu, Pumo RAG Index.

### 3. **"The LAWYER" (Formal & Compliance Agent)**
*Dla kogo: Dokumenty, RODO, Umowy, Oficjalna Korespondencja*

**Główne Kompetencje:**
*   **Contract Drafter**: Tworzy projekty umów (B2B, NDA, zlecenie) na podstawie prostych inputów ("Potrzebuję umowy dla freelancera na 5k PLN").
*   **GDPR Guardian**: Skanuje bazy danych i treści pod kątem zgodności z RODO. Wykrywa wrażliwe dane w logach.
*   **Formal Email Polisher**: Przekształca luźne notatki ("napisz im że nie zapłacimy dopóki nie naprawią") w pismo prawnicze ("W nawiązaniu do umowy nr X, wstrzymujemy płatność do momentu usunięcia wad...").
*   **Terms Update**: Automatycznie sugeruje aktualizacje regulaminu sklepu, gdy zmienia się prawo konsumenckie.

**Tech Stack:**
*   Model: `Claude 3.5 Sonnet` (najlepszy do tekstów prawniczych i długich dokumentów).
*   Baza wiedzy: Kodeks Cywilny, Ustawy Konsumenckie (RAG).

---

## 🔄 WORKFLOW: INTEGRACJA Z BIELIKIEM

Bielik Orchestrator pozostaje "CEO", a "The Suits" to jego dyrektorzy.

**Scenariusz: "Mamy problem z dostawą narożników, klienci się wkurzą."**

1.  **Bonzo (Input)**: "Bielik, ogarnij temat opóźnienia narożników z fabryki X."
2.  **Bielik (CEO)**: Rozdziela zadania.
3.  **The SHOPKEEPER**:
    *   Identyfikuje 15 zamówień dotkniętych opóźnieniem.
    *   Blokuje dalszą sprzedaż tego modelu na stronie.
4.  **The DEALMAKER**:
    *   Wymyśla rekompensatę: "Dajmy im darmowy środek do czyszczenia tapicerki (koszt 10zł, wartość dla klienta 50zł)".
5.  **The LAWYER**:
    *   Generuje oficjalne pismo z przeprosinami i informacją o nowym terminie (zgodne z prawem konsumenckim).
6.  **The WRITER** (istniejący):
    *   Ubiera to w ładne słowa w mailingu.

**Wynik**: Bonzo dostaje raport: "Zablokowałem sprzedaż, przygotowałem maile do 15 klientów z rekompensatą. Kliknij [WYŚLIJ], żeby zatwierdzić."

---

## 🛠️ PLAN WDROŻENIA (Technical Specs)

### Faza 1: "The SHOPKEEPER" (Priorytet: Sklep)
*   **Integracja**: Podpięcie pod API sklepu (Presta/Woo/Custom).
*   **Tools**: `product_search`, `order_status`, `inventory_check`.
*   **Cel**: 50% automatyzacji zapytań "Gdzie moja paczka?".

### Faza 2: "The LAWYER" (Priorytet: Formalności)
*   **RAG**: Indeksowanie wzorów umów i regulaminów z `The_yellow_hub`.
*   **Tools**: `generate_contract`, `email_formalizer`.

### Faza 3: "The DEALMAKER" (Priorytet: Biznes)
*   **Tools**: `competitor_price_check` (via Browser Agent), `margin_calculator`.

---

> **NOTATKA DLA BONZO**: To nie są zabawki. To autonomiczne systemy, które mogą realnie zarządzać kasą i wizerunkiem firmy. Wymagają "Human in the loop" (Twojego zatwierdzenia) przy kluczowych akcjach (przelewy, wysyłka masowa).
