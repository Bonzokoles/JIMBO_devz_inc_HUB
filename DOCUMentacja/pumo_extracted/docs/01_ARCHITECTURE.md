# Architektura: elementy i przepływ

## Klocki (Cloudflare)

- **Worker** — główny serwer HTTP (routing, auth, API, dashboard)
- **D1 (SQLite)** — baza operacyjna (produkty, zmiany, metryki dzienne, subskrybenci itd.)
- **KV (`CACHE`)** — cache/artefakty (np. wygenerowane guide’y)
- **Vectorize (`VECTORIZE`)** — wektory do wyszukiwania semantycznego
- **R2 (`PUMO_RAW_BUCKET`)** — backup/raw payloady/snapshots
- **Cron triggers** — sync co 6h + cleanup raz w tygodniu

## Warstwy w kodzie

### Wariant modularny (aktywny w `wrangler.toml`)

- `src/index-new.ts` — deleguje do routera
- `src/handlers/router.ts` — routing + HTML dashboardu (inline)
- `src/endpoints/analytics.ts` — proste endpointy analityczne (placeholdery)
- `src/auth/auth.ts` — Basic Auth z hardcodem (ryzyko)

### Wariant monolityczny (nieaktywny, ale bogatszy)

- `src/index.ts` — routing + dużo handlerów (sync, GA4, tracking, email, AI/search)
- `src/services/*` — agregacje i logika domenowa (np. `analytics-aggregator`)
- `src/workflows/*` — cron workflow (np. daily sync)

## Przepływ danych (docelowy)

1) **Źródła**
- API sklepu (produkty, zamówienia)
- GA4 (raporty) + ewentualnie Measurement Protocol (eventy)
- Eventy z własnego trackingu (`/api/track`)

2) **Ingest**
- sync pełny / przyrostowy → D1 + snapshoty do R2
- tracking → D1 (zdarzenia) + agregacje dzienne
- GA4 raporty → odpowiedzi on-demand (albo cache w KV)

3) **Agregacja**
- job (cron) liczy metryki dzienne / tygodniowe, zapisuje do tabel agregacyjnych

4) **Serwowanie**
- dashboard pobiera KPI/serie czasowe/top listy
- AI analityk (jeśli włączony) dostaje dane kontekstowe i odpowiada na pytania

## Minimalna „zdrowa” granica

- Jedno źródło prawdy dla auth
- Jedno źródło prawdy dla routingu (jeden entrypoint)
- Jedna, jasno opisana struktura tabel w D1

Dopiero na tym fundamencie ma sens rozbudowa UI i „fancy” elementów.
