# Narzędzia analizy: co zbierać, jak liczyć, jak sprawdzać

## Kategorie analityki

### A) „Własna” analityka (najbardziej sterowalna)
- eventy z frontu: wejście na produkt, klik w CTA, dodanie do koszyka, checkout, zakup
- atrybucja: *skąd przyszedł użytkownik* (utm/source/medium/campaign), *czy to ruch AI SEO*

**Zaleta:** pełna kontrola i spójne definicje.

### B) GA4 (raportowa)
- dane o ruchu, źródłach, stronach, zdarzeniach (jeśli dobrze skonfigurowane)
- pobieranie raportów przez GA4 Data API (`/api/ga4/run-report` w monolicie)

**Ryzyko:** definicje i próbkowanie zależą od konfiguracji GA4; trzeba uważać na zgodność metryk.

### C) „Hybryda”
- do KPI liczonego na dashboardzie można mieszać dane własne + GA4, ale tylko jeśli:
  - definicje są spójne,
  - jasno opiszesz, które KPI są „GA4”, a które „first-party”.

## Definicje KPI (propozycja)

### 1) Revenue
- **Źródło preferowane:** zamówienia (API sklepu) albo własny event „purchase”
- **Alternatywa:** GA4 `purchaseRevenue`

### 2) Orders
- liczba zamówień (API) albo eventów „purchase”

### 3) Conversion rate
- sensowna definicja to: `orders / sessions` albo `orders / users`
- jeśli liczysz z własnych eventów, musisz mieć liczbę sesji/użytkowników (albo proxy)

### 4) AOV (Average order value)
- `revenue / orders`

### 5) AI SEO share
- wymaga definicji „AI SEO click/session”:
  - np. `utm_source in ("chatgpt","perplexity","gemini",...)` albo
  - referer z domen narzędzi AI, albo
  - oznaczanie linków generowanych przez AI parametrem.

## Jak wykrywać „AI ruch” (praktycznie)

1) **UTM** — najprościej i najczyściej:
- linki z AI generujesz jako `?utm_source=chatgpt&utm_medium=ai_seo&utm_campaign=...`

2) **Referrer** — działa średnio:
- część ruchu jest bez referrera (privacy)

3) **Własny redirect**
- linki idą przez Twój endpoint (`/r/<slug>`) i tam tagujesz źródło

Rekomendacja: **UTM + fallback na redirect**.

## Kontrola jakości danych (żeby dashboard nie kłamał)

- walidacja eventów (schema + required fields)
- deduplikacja purchase (id zamówienia / transaction_id)
- sanity check dzienny:
  - revenue >= 0
  - orders >= 0
  - conversion w rozsądnym zakresie (0–20% typowo)
- porównanie z GA4 (różnice opisane, nie zamiatane)

## Co już jest w kodzie

- w **monolicie** (`src/index.ts`) KPI są liczone z `AnalyticsAggregator.getDailyMetrics(days)` i porównywane okres do okresu
- w **modularnym** `/api/analytics/*` zwraca dane przykładowe (do wymiany na prawdziwe zapytania do D1)
