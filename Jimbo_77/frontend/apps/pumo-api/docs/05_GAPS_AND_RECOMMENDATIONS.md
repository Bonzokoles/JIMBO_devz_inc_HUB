# Luki, ryzyka i plan domknięcia

## Największe problemy (tu nie ma sensu udawać, że jest inaczej)

1) **Dwa entrypointy i dwa światy**
- produkcja używa modularnego (`index-new.ts`), a „prawdziwe” ficzery siedzą w monolicie (`index.ts`).

2) **Auth w modularnym jest zahardkodowany**
- `src/auth/auth.ts` trzyma `Bonzo/#HAOS77#` w kodzie.
- To jest ryzyko operacyjne i bezpieczeństwa (hasło w repo/ZIP, brak rotacji, brak sekretów).

3) **Analityka w modularnym jest placeholderem**
- `/api/analytics/*` zwraca sample dane, a nie realne zapytania do D1/GA4.

4) **Dashboardy są dwa**
- `dashboard-export.html` istnieje jako plik
- `router.ts` generuje drugi dashboard inline

## Minimalny plan (kolejność ma znaczenie)

### Etap 0 — decyzja architektoniczna (1 wybór)
- A) przełączamy `wrangler.toml` na `main = "src/index.ts"` i robimy porządek w monolicie, **albo**
- B) przenosimy logikę z monolitu do modularnej architektury i wyrzucamy `index.ts`.

Jeśli celem jest szybko „mieć działające”: **A** jest krótsze. Jeśli celem jest „ładny kod”: **B**.

### Etap 1 — bezpieczeństwo
- wyrzucić hardcode z `src/auth/auth.ts`
- używać tylko `DASHBOARD_PASSWORD` (sekret) i/lub Cloudflare Access
- dodać rate limit (chociaż prosty) na endpointy wrażliwe

### Etap 2 — jedna wersja dashboardu
- wybrać: inline HTML w workerze **albo** statyczny plik (np. `dashboard-export.html`)
- jeżeli statyczny: serwować go z `/dashboard` i trzymać JS/CSS osobno (czytelniej)

### Etap 3 — prawdziwe dane
- zastąpić stuby w `src/endpoints/analytics.ts` zapytaniami do D1 lub agregatorem
- zdefiniować schemat D1 (SQL w repo)

### Etap 4 — analityka „AI ruchu”
- wdrożyć reguły UTM/redirect
- zapewnić, że KPI „AI share” nie dzieli przez zero i nie robi cudów z matematyki

### Etap 5 — testy + obserwowalność
- minimalne testy integracyjne dla endpointów
- `wrangler tail` + sensowne logi w sync/agregacji

## Szybkie „todo” w kodzie (konkret)

- `src/auth/auth.ts`: przerobić na wersję z `env.DASHBOARD_PASSWORD` (tak jak w `src/index.ts`) i bez stałego user/pass.
- `src/endpoints/analytics.ts`: wyrzucić sample i podpiąć D1.
- `src/handlers/router.ts`: odchudzić (dashboard HTML do osobnego pliku / template).
- Zdecydować co robimy z `src/index.ts`: usuwać czy migrować.

Jeśli chcesz, mogę w kolejnym kroku przygotować PR/patch, który ujednolica entrypoint + auth i usuwa hardcode (to jest najważniejszy „pierwszy strzał”).
