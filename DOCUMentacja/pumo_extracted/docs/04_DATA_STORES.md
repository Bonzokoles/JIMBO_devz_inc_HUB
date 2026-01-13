# Składowanie danych (D1/KV/Vectorize/R2)

## D1 (SQLite)

W kodzie modularnym są tylko ślady (np. `SELECT COUNT(*) FROM products`). W monolicie jest dużo więcej logiki, ale bez pełnej definicji schematu w tym ZIP.

**Docelowe tabele (propozycja minimalna):**

- `products` — katalog produktów (id, nazwa, kategoria, cena, status, updated_at)
- `orders` — zamówienia (id, revenue, currency, items_count, created_at, source)
- `events` — tracking (id, event_name, ts, session_id, user_id, product_id, order_id, utm_*, referrer, value)
- `daily_metrics` — agregaty dzienne (date, revenue, orders, sessions, product_clicks, ai_seo_clicks, conversion_rate, ...)
- `sync_runs` — historia sync (type, started_at, finished_at, status, counts, error)
- `changes` — log zmian produktów (product_id, field, old, new, ts)

## KV (`CACHE`)

Użyteczne do:

- cache raportów GA4 (np. na 15–60 min)
- cache gotowych treści dashboardu/guide’ów
- cache wyników expensive queries

KV nie nadaje się na źródło prawdy (brak transakcyjności, eventual consistency).

## Vectorize (`VECTORIZE`)

- przechowuje embeddingi fragmentów/produktów
- używane w wyszukiwaniu semantycznym (RAG)

Kluczowe: wersjonowanie embeddingów (model + timestamp), żeby móc robić reindex bez chaosu.

## R2 (`PUMO_RAW_BUCKET`)

- backup raw payloadów z API sklepu
- snapshoty (np. raz dziennie) dla audytu
- trzymanie plików eksportów

W monolicie jest endpoint czyszczenia starych backupów.
