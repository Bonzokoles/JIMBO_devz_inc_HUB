# Zestaw agentów do monitoringu + AI w analityce biznesowej i w dashboardzie (meblepumo)

Data: 2026-01-13

Ten dokument dopina 3 rzeczy:
1) **Agenci monitoringu** dla strony **meblepumo** (technika + biznes).
2) Jak dodać **modele AI do analizy biznesowej** (insighty, prognozy, decyzje).
3) Jak dodać **modele AI do pracy w dashboardzie** i bezpośrednio przy **meblepumo** (UX: chat, rekomendacje, search).

Nie ma tu „magii”. Są role agentów, dane wejściowe, wyjściowe, harmonogram, oraz bezpieczne punkty integracji.

---

## 0) Założenia (żeby to działało, a nie wyglądało)

**Minimalny fundament danych:**
- Eventy z meblepumo (page_view, view_item, add_to_cart, begin_checkout, purchase, contact_submit, newsletter_signup itd.)
- Logi błędów (frontend + backend/worker)
- Metryki wydajności (TTFB, INP, LCP, CLS) + uptime
- Katalog produktów: SKU, cena, marża/COGS (jeśli jest), stany, kategorie
- Źródła ruchu/kosztów (Ads, social, organic) — nawet w formie csv/importu
- KPI: przychód, ROAS, CR, AOV, CAC, refund rate, lead->sale

**Bezpieczeństwo:**
- Agenci nie dostają „gołego” dostępu do wszystkiego.
- PII (mail, tel, adres) anonimizowane / pseudonimizowane.
- Prompt injection: wszystko co pochodzi z WWW / user input traktuj jako *niezaufane*.

---

## 1) Zestaw agentów monitoringu dla meblepumo

Poniżej masz zestaw agentów, które razem robią „centrum dowodzenia”. Każdy agent ma:
- **Cel**
- **Sygnały wejściowe**
- **Reguły / modele**
- **Wyjście**
- **Częstotliwość**
- **Akcje automatyczne (opcjonalne)**

### A1. Agent Uptime + Transakcje krytyczne
**Cel:** wykryć, że strona żyje *i sprzedaje*.
- Wejście: monitoring HTTP (home, category, product, cart, checkout), synthetic transactions (dodaj do koszyka, przejdź do checkout).
- Reguły: SLA (np. 99.9%), timeouty, statusy 5xx/4xx.
- Wyjście: alerty (Slack/Email/Discord), wykresy uptime, lista incydentów.
- Częstotliwość: co 1–5 min.
- Autoakcje: przełączanie feature flag (np. wyłącz kosztowny widget) jeśli rosną błędy.

### A2. Agent Performance (Core Web Vitals) + regresje
**Cel:** wykryć, że coś spowalnia (i spadnie SEO/CR).
- Wejście: RUM (Real User Monitoring), Lighthouse CI, dane serwera (TTFB), rozmiary assetów.
- Reguły: progi INP/LCP/CLS, wzrost JS bundle, wzrost TTFB.
- Wyjście: „co się pogorszyło”, diff buildów, rekomendacje (np. kompresja, code splitting).
- Częstotliwość: po deployu + dziennie.

### A3. Agent Error Budget (Frontend + Backend)
**Cel:** nie przeoczyć błędów zanim user je zobaczy.
- Wejście: stacktrace, breadcrumbs (route, user-agent), worker exceptions.
- Reguły: grupowanie po fingerprint, threshold dla nowych errorów.
- Wyjście: top 10 błędów, „nowe vs stare”, link do reprodukcji.
- Częstotliwość: near-real-time.

### A4. Agent Bezpieczeństwa (anomalia ruchu + podejrzane wzorce)
**Cel:** wykryć boty, skany, próby wstrzyknięć, nadużycia formularzy.
- Wejście: logi requestów, WAF, rate limiting, geo, user agent.
- Reguły: anomalia (nagły wzrost), podpisy (SQLi/XSS), wzorce brute-force.
- Wyjście: alert + rekomendacja reguł (WAF/rate limit).
- Częstotliwość: co 5–15 min.

### A5. Agent SEO/Indexing (zdrowie indeksacji)
**Cel:** wykryć spadki widoczności zanim zrobi się dramat.
- Wejście: sitemap, robots, statusy 404/301, canonicale, meta, structured data, GSC (jeśli jest).
- Reguły: wzrost 404, błędy indeksacji, duplikaty canonical.
- Wyjście: lista URL do naprawy + priorytety.
- Częstotliwość: dziennie/tygodniowo.

### A6. Agent Konwersji i lejka (biznesowy „alarm”)
**Cel:** wyłapać spadek CR zanim spadnie cashflow.
- Wejście: eventy e-commerce + źródła ruchu.
- Reguły: anomalia w CR, AOV, add_to_cart rate, checkout drop-off.
- Wyjście: „gdzie się rozjechało” + segment (device, channel, category).
- Częstotliwość: co 1–6 h.

### A7. Agent Produktów i Stanów (inventory + ceny)
**Cel:** pilnować, że sprzedajesz to co masz, po sensownej cenie.
- Wejście: feed produktów, stany, ceny, marże (jeśli są).
- Reguły: out-of-stock top sellers, price anomalies, marża < próg.
- Wyjście: lista „do działań” (uzupełnij stan, podnieś/obniż cenę, wyłącz reklamę).
- Częstotliwość: co 6–24 h.

### A8. Agent Kampanii (ROAS/CAC + „co przepala kasę”)
**Cel:** wycinać nierentowne kampanie zanim zrobią dziurę w budżecie.
- Wejście: koszt kampanii, przychód przypisany, atrybucja (nawet prosta).
- Reguły: ROAS < próg, CAC > próg, spadek jakości leadów.
- Wyjście: rekomendacje: pauza/zmiana kreacji/landing.
- Częstotliwość: dziennie.

### A9. Agent Opinie/Sentyment (obsługa klienta)
**Cel:** wyłapać problemy jakości/obsługi zanim zrobią się zwroty i negatywy.
- Wejście: maile, czat, formularze, komentarze (jeśli integrujesz).
- Modele: klasyfikacja tematów, sentyment, ekstrakcja przyczyn.
- Wyjście: „top 5 problemów tygodnia”, cytaty/klasy problemów, SLA odpowiedzi.
- Częstotliwość: dziennie/tygodniowo.

### A10. Agent Zmian (deploy/config drift)
**Cel:** korelować: „po tym deployu coś padło”.
- Wejście: logi deployów, config (feature flags), wersje.
- Reguły: korelacje czasowe z A1–A3.
- Wyjście: timeline incydentów + podejrzane zmiany.
- Częstotliwość: po każdym deployu.

---

## 2) Jak dodać modele AI do analizy biznesowej (praktycznie)

### 2.1. Warstwy AI, które mają sens
1) **Descriptive**: „co się stało” (podsumowania, raporty)
2) **Diagnostic**: „dlaczego” (segmentacja, korelacje, przyczyny)
3) **Predictive**: „co będzie” (forecast, churn/zwroty, popyt)
4) **Prescriptive**: „co zrobić” (rekomendacje + symulacje wpływu)

Nie próbuj od razu robić 4). Najpierw 1–2, bo bez porządnych danych 3–4 robią storytelling.

### 2.2. Minimalny „AI Analytics Stack”
**Dane → Feature store → Modele → Decyzje**
- Dane: eventy + koszty + produkty
- Feature store: zmaterializowane widoki (dzienne/tygodniowe) na KPI
- Modele:
  - Anomaly detection (statystycznie + modelowo)
  - Forecast przychodu (np. model sezonowy + regresory)
  - Segmentacja klientów (RFM/cluster)
  - Text analytics (opinie/maile)

### 2.3. Model Router (żeby nie zabetonować się w 1 dostawcy)
W kodzie rób abstrakcję:
- `LLM_PROVIDER=openai|anthropic|local`
- `MODEL_FAST` (tani/szybki do klasyfikacji)
- `MODEL_REASON` (lepszy do wnioskowania/raportów)
- `EMBEDDINGS_MODEL` (wektory)

To daje Ci „wymienialność” bez przepisywania pół systemu.

### 2.4. Wzorzec: AI robi wnioski, ale nie dotyka pieniędzy bez reguł
AI może:
- wskazać kampanię do pauzy
- zasugerować zmianę ceny
- zasugerować poprawki w UX

Ale **egzekucja** idzie przez:
- reguły (thresholdy)
- aprobata człowieka
- albo „safe automation” (np. pauza tylko jeśli 3 dni ROAS < X)

---

## 3) Jak dodać AI do pracy w dashboardzie (PUMO) — konkretne moduły

### D1. Chat „Zapytaj dane” (NLQ → SQL)
**Użycie:** „Dlaczego spadła sprzedaż w kategorii X w ostatnim tygodniu?”
- Pipeline:
  1) LLM mapuje pytanie na **bezpieczny SQL** (tylko SELECT, whitelist tabel/kolumn)
  2) Uruchamiasz query
  3) LLM streszcza wynik + wskazuje next steps
- Wymóg: SQL guardrails (parser, allowlist, limity czasu/rekordów)

### D2. Auto-raporty: dzienny/tygodniowy „CEO brief”
- KPI, zmiany vs poprzedni okres, największe odchylenia, rekomendacje.
- Źródło: widoki agregacyjne (nie surowe eventy).

### D3. Detekcja anomalii + „Explain”
- System wykrywa: spadek CR na mobile → agent tłumaczy możliwe powody (performance, zmiana ceny, błąd checkout).
- „Explain” musi podawać **dowody** (wykresy, liczby), nie prozę.

### D4. Asystent dla incidentów
- Na alert z A1/A3: agent zbiera logi, ostatnie deploye, top endpoints, generuje checklistę debug.

### D5. Generator zadań (Jira/Trello/Issues)
- Z rekomendacji agentów powstają taski: „Napraw 404: /kolekcja/…”, „Zoptymalizuj LCP na /product/…”.

---

## 4) Jak dodać AI bezpośrednio do meblepumo (frontend/UX)

### M1. AI Search (hybrydowy)
- Tekst + embeddings (wektory) + filtry (cena, kategoria, rozmiar, dostępność)
- „Sofa do małego salonu, jasna, do 2500” → wyniki + uzasadnienie + filtry

### M2. Asystent produktowy (Q&A na kartach produktów)
- RAG: opis produktu + instrukcje + FAQ + polityki dostawy/zwrotów
- Twarde zasady: nie wymyślaj parametrów, jeśli brak w źródłach → „nie mam danych”

### M3. Doradca doboru (quiz → rekomendacje)
- Pytania o styl, wymiary, budżet
- Wynik: 3–5 propozycji + dlaczego + alternatywa
- Działa nawet bez LLM (reguły), LLM robi tylko opis/uzasadnienie.

### M4. Copy/SEO helper (ale z kontrolą)
- AI proponuje:
  - tytuły, opisy kategorii
  - Q&A schema
  - warianty nagłówków do A/B testów
- Publikacja: zawsze przez workflow „review”.

### M5. Lead qualifier (formularz/czat)
- Zbiera wymagania, budżet, termin, adres (opcjonalnie)
- Wysyła lead do CRM z podsumowaniem
- Uwaga: tu najłatwiej o PII — maskuj i loguj ostrożnie.

---

## 5) Proponowany podział: co robi się najpierw (najlepszy „bang for buck”)

### Etap 1 (fundament, 1–2 tyg.)
- Event schema + zbieranie danych
- A1 uptime + A3 errors
- Dzienny raport KPI (bez AI albo z prostym LLM summary)
- Podstawowe RBAC w dashboardzie

### Etap 2 (wartość biznesowa, 2–4 tyg.)
- A6 konwersja + anomalia
- D1 NLQ→SQL (z guardrails)
- A7 inventory/ceny
- Podstawowy AI asystent produktowy (RAG) na meblepumo

### Etap 3 (skalowanie, 1–2 mies.)
- Performance agent + SEO agent
- AI Search (hybryda + embeddings)
- Kampanie/ROAS agent (po integracji kosztów)
- Automatyczne taski i „incident assistant”

---

## 6) Checklista bezpieczeństwa (konkretna)
- [ ] Maskowanie PII w logach i promptach
- [ ] Allowlist danych do RAG (żadnych sekretów)
- [ ] SQL guardrails: SELECT-only, limit, timeout
- [ ] Rate limiting endpointów AI
- [ ] Audit trail: kto zadał pytanie, jakie dane były użyte
- [ ] Prompt injection: separacja instrukcji systemowych od treści zewnętrznych

---

## 7) Szkielet promptów (do startu)

### Agent „Anomalia konwersji”
**Wejście:** tabela dzienna KPI + segmenty (device/channel/category)
**Wyjście:** 3 hipotezy + dowody + next steps

**Instrukcja:**
- Podawaj liczby i różnice procentowe.
- Jeśli brak danych: powiedz to wprost.
- Nie proponuj działań wysokiego ryzyka bez potwierdzenia.

### Agent „Incident assistant”
- Zbierz: top errors, endpoints, deploy diff, czas startu incydentu.
- Zaproponuj 5 kroków debug w kolejności.
- Wskaż „najbardziej prawdopodobną przyczynę” + co ją potwierdza.

---

## 8) Co mogę dopiąć dalej (konkretnie w kodzie)
Jeśli chcesz, dopnę w repo:
- plik konfiguracyjny „agent registry” (JSON/YAML)
- gotowe endpointy:
  - `/api/agents/run/:agent`
  - `/api/ai/nlq`
  - `/api/ai/rag`
- szkielety tabel (D1/SQLite) pod eventy, alerty, rekomendacje
- minimalny UI w dashboardzie: zakładka **Agents** + **AI Console**

