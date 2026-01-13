# Plan najlepszego wdrożenia (PUMO Dashboard)

Data: 2026-01-13

Ten dokument opisuje **praktyczny, bezpieczny i powtarzalny** sposób wdrożenia PUMO na Cloudflare (Workers + D1/KV/R2), z podziałem na etapy: **MVP → staging → produkcja**.

> Założenie: obecnie w repo są dwa „wejścia” (`src/index-new.ts` modularny i `src/index.ts` monolit). Najlepsza ścieżka wdrożenia to **jedno źródło prawdy** (jedno entrypoint) + środowiska + sekrety + observability.

---

## 0) Cel wdrożenia i definicja „gotowe”
Wdrożenie uznajemy za gotowe, jeśli:

- dashboard działa pod stałym adresem (prod) i ma staging,
- logowanie nie jest „na sztywno” w kodzie (sekrety w CF),
- analityka i eventy zapisują się do danych (D1/KV/R2) i można je raportować,
- mamy monitoring (logs + alerty) oraz plan kopii danych,
- deployment jest powtarzalny (CI/CD lub przynajmniej skrypt `wrangler deploy` z jasną konfiguracją).

---

## 1) Decyzja architektoniczna: **jeden entrypoint**
### Rekomendacja
- Wybierz **jeden** entrypoint i usuń nieużywany.
- Jeśli modularny (`index-new.ts`) jest już spięty z `wrangler.toml`, to:
  1) przenieś brakujące funkcje z monolitu do modułów,
  2) zrób to iteracyjnie (endpoint po endpoincie),
  3) ustaw testy/regresję na kluczowych trasach.

### Dlaczego to ważne
W tej chwili najłatwiej „wdrożyć” coś, co działa, ale potem pojawia się chaos: jedna wersja na serwerze, druga w kodzie. To jest klasyk, który kończy się w piątek o 23:40.

---

## 2) Środowiska: **staging i production**
### Pliki i konfiguracja
- `wrangler.toml` powinien mieć:
  - `name` dla produkcji,
  - `[env.staging]` z inną nazwą, innymi bindingami i inną bazą D1,
  - osobne zasoby (D1/KV/R2) per env (lub przynajmniej osobne namespace’y KV).

### Minimalny standard
- **staging**: testy integracyjne, QA, testy danych
- **prod**: tylko release tag / merge do `main`

---

## 3) Sekrety i konfiguracja (BEZ hardcode)
### Co przenieść do sekretów Cloudflare
- hasła / klucze (Basic Auth, tokeny webhooków, API keys),
- credentials do usług zewnętrznych (np. GA4, email),
- klucze do podpisywania sesji/JWT.

### Jak
- `wrangler secret put <NAZWA>` per środowisko
- nic w `.env` w repo (jeśli `.env` istnieje – do `.gitignore`)

> Jeżeli gdziekolwiek jest „login:admin / password:admin” w kodzie, to jest to nie bug, tylko zaproszenie dla problemów.

---

## 4) Uwierzytelnianie i dostęp
### Rekomendacja docelowa
- Zamiast Basic Auth: **sesje podpisywane** (cookie httpOnly) albo **JWT** + rotacja kluczy.
- Minimalnie: jeśli zostaje Basic Auth, to:
  - hasło tylko w sekretach,
  - rate-limit na endpointy admin,
  - logowanie prób logowania.

### Dodatkowo
- rozdziel „read-only dashboard” i „admin” (inne uprawnienia),
- zablokuj wrażliwe endpointy po IP/Access (jeśli to ma sens w twoim kontekście).

---

## 5) Dane i migracje
### D1
- wprowadź katalog `migrations/` i numerowane migracje SQL,
- pipeline:
  - staging: migracje automatycznie
  - prod: migracje kontrolowane (manual approval lub release step)

### Backup
- D1: regularny export (np. dziennie/tygodniowo) do R2
- R2: lifecycle policy (retencja)
- KV: traktuj jako cache/stan pomocniczy (nie jedyne źródło prawdy)

---

## 6) Observability: logi, metryki, alerty
### Minimalnie na start
- request id / correlation id w logach,
- logowanie błędów (stack + context bez sekretów),
- proste alerty (np. wzrost 5xx, latency).

### Docelowo
- Sentry (lub podobne) dla błędów w runtime,
- dashboard metryk: p95 latency, 4xx/5xx, throughput, czas odpowiedzi z D1,
- alerty na:
  - 5xx > X/min,
  - czas odpowiedzi > Y ms,
  - błędy migracji/DB.

---

## 7) CI/CD (najlepsza praktyka)
### Rekomendacja (GitHub Actions)
- workflow:
  - PR → testy/lint → deploy do **staging**
  - merge do main + tag → deploy do **prod**
- osobne tokeny API Cloudflare per env
- blokada wdrożenia prod bez zielonych testów

Jeśli nie robisz CI/CD od razu:
- przynajmniej `make deploy-staging` i `make deploy-prod` / `npm run deploy:*`.

---

## 8) Testy, zanim klikniesz „deploy”
### Checklist „nie psuj produkcji”
- ✅ endpointy krytyczne (health, auth, dashboard, analytics ingest) przechodzą,
- ✅ staging ma własną bazę,
- ✅ sekrety są w CF, nie w kodzie,
- ✅ wrangler deploy działa z czystego checkoutu,
- ✅ logi nie pokazują sekretów,
- ✅ w dokumentacji jest „jak odtworzyć środowisko”.

---

## 9) Plan wdrożenia krok po kroku (praktyczny)
1. **Porządek w repo**: wybór jednego entrypoint, usunięcie dead code / flag.
2. **Staging**:
   - dodaj env w `wrangler.toml`,
   - podłącz osobne zasoby (D1/KV/R2),
   - wrzuć sekrety,
   - deploy staging.
3. **Auth**:
   - usuń hardcode,
   - ustaw rate-limit (jeśli jest),
   - logowanie zdarzeń auth.
4. **Dane**:
   - migracje D1,
   - seed (opcjonalnie),
   - backup do R2 (nawet prosty cron).
5. **Observability**:
   - logi + alerty podstawowe,
   - smoke test po deploy.
6. **Prod**:
   - deploy z tagu release,
   - smoke test,
   - weryfikacja danych/ingestu.

---

## 10) Największe ryzyka (i jak je zdjąć)
- **Hardcoded auth / klucze w kodzie** → przenieść do sekretów, wymusić rotację.
- **Dwa entrypointy** → ujednolicić, inaczej wdrożysz „nie to”.
- **Brak migracji** → po pierwszej zmianie schematu D1 zacznie boleć.
- **Brak staging** → testy robisz na prod, a prod nie jest od tego.
- **Brak backupu** → kiedy coś pójdzie źle, będziesz liczyć na cud.

---

## 11) Co mogę zrobić dalej (konkretnie)
Jeśli chcesz, mogę:
- dopisać/naprawić `wrangler.toml` dla staging+prod,
- przygotować szkic GitHub Actions pod deploy,
- zmapować sekrety i bindingi (D1/KV/R2) na podstawie kodu,
- zrobić checklistę migracji D1 i podstawowy schemat tabel pod analytics.

