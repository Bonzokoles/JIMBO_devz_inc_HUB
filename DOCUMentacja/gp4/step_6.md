Jasne — “pancerna” wersja to dokładnie to, co chcesz, jeśli HUB ma być sterem realnych projektów, a nie klikalnym dashboardem do oglądania lampek.

Poniżej masz **konkretny wzorzec: kolejka + worker + idempotencja + audit + retry + locki**, pod FastAPI. Bez udawania magii.

---

## 1) Architektura (minimalna pancerna)

**Komponenty:**

1. **API (FastAPI)** — przyjmuje komendy, autoryzuje (Access), zapisuje do DB, wrzuca na kolejkę
2. **Queue** — Redis (na start) albo RabbitMQ/NATS (później)
3. **Worker** — wykonuje komendy, aktualizuje statusy w DB, publikuje eventy
4. **Runner/Executor** — *faktyczne wykonanie* na hostach:

   * najprościej: worker wykonuje lokalnie (docker/systemd) jeśli siedzi na tym samym serwerze
   * sensowniej: worker gada z agentami na hostach (HTTP przez Cloudflare Tunnel lub sieć prywatna)

**Dlaczego tak:**

* UI/API nigdy nie wykonuje destrukcyjnych rzeczy w request/response
* komendy są trwałe, śledzone, retry’owalne
* masz audit i historię

---

## 2) Model danych (DB) — trzon idempotencji i audytu

### Tabela `commands`

Kluczowe pola:

* `id` (UUID) — identyfikator komendy
* `idempotency_key` (string, unique) — *Twój bezpiecznik*
* `project_id`
* `action` (`service.restart`, `deploy.run`, ...)
* `target` (np. `pumo-api`)
* `params` (JSON)
* `status` (`queued|running|succeeded|failed|canceled`)
* `created_by` (email)
* `created_at`, `updated_at`
* `started_at`, `finished_at`
* `attempt` (int)
* `max_attempts`
* `last_error` (text)
* `lock_key` (opcjonalnie) — do konfliktów (np. “deploy” blokuje “restart”)

### Tabela `command_events` (audit timeline)

* `command_id`
* `ts`
* `type` (`queued|started|log|retry|done|error`)
* `message`
* `meta` (JSON)

To daje Ci:

* historię,
* timeline w UI,
* debug.

---

## 3) Idempotencja — jak to robić dobrze

### Zasada

UI wysyła `Idempotency-Key` (nagłówek) albo w body `idempotencyKey`.

* Jeśli ta sama komenda (w sensie: ten sam idempotency key) wpada drugi raz:

  * API **nie tworzy nowej**,
  * zwraca istniejącą komendę (z jej `status`).

### Jak generować idempotency key

* Najprościej: generuje frontend per klik (UUID v4) i trzyma aż do sukcesu/odpowiedzi.
* Lepiej: key = hash(`project_id + action + target + normalized_params + time_bucket`)
  ale tu trzeba uważać, żeby przypadkiem nie “skleić” dwóch różnych intencji.

Ja bym zrobił:

* UI generuje UUID,
* backend i tak dodatkowo liczy `dedupe_hash` (opcjonalnie) pod wykrywanie “podobnych” spamów.

---

## 4) Kolejka: Redis + Celery albo RQ (co wybrać)

### Celery (bardziej klasyczne, dużo opcji)

* retry, routing, backoff, ETA, chords
  – więcej konfiguracji

### RQ (prościej)

* bardzo szybki start
  – mniej funkcji “enterprise” (da się obejść)

Jeśli mówimy “pancerne”: **Celery + Redis** to najprostsza droga do “robust enough”.

---

## 5) Locking / konflikty (żeby deploy i restart nie biły się w nocy)

Wprowadzasz **lock_key** per typ akcji:

* deploy: `lock_key = f"{project_id}:deploy"`
* service.restart: `lock_key = f"{project_id}:service:{target}"`

Worker przed startem:

* robi `SET lock_key value NX EX ttl` w Redis
  (albo lock w DB `SELECT ... FOR UPDATE`)
* jeśli lock zajęty:

  * albo requeue z opóźnieniem,
  * albo fail z komunikatem “busy”.

To ratuje Ci spójność.

---

## 6) Retry + backoff + max attempts

Komendy “z natury” bywają kapryśne (pull obrazu, restart, transient network).
Dlatego:

* `max_attempts` np. 3
* retry z backoff: 10s → 30s → 90s (albo exponential + jitter)
* retry tylko na wybrane błędy (timeout, 502, “agent unavailable”), nie na “permission denied”.

---

## 7) Wykonanie komend: dwa warianty (oba pancerne, różny poziom ryzyka)

### Wariant A: Worker “lokalny” (najprostszy)

* Worker siedzi na tym samym hoście co usługi (docker/systemd)
* Wykonuje:

  * `docker restart ...`
  * `systemctl restart ...`

Plus: proste, szybkie
Minus: skaluje się gorzej, jeśli projekty są na wielu maszynach

### Wariant B: Worker + Agenty na hostach (lepsze)

* Na każdym hoście “agent” (mały serwis) wykonuje komendy lokalnie
* Worker wysyła żądanie do agenta:

  * `POST /execute` z podpisanym payloadem
* Komunikacja:

  * prywatna sieć albo Cloudflare Tunnel
* Agent nie przyjmuje nic spoza allowlisty (tylko znane akcje)

To jest docelowo “bezpieczniejsze operacyjnie”.

---

## 8) Konkretny kontrakt API (co UI ma wywoływać)

### Komendy

* `POST /v1/commands`

  * body: `{ projectId, action, target, params, reason }`
  * header: `Idempotency-Key: <uuid>`
  * response: `{ id, status }`

### Podgląd

* `GET /v1/commands/{id}`
* `GET /v1/commands?projectId=pumo&status=running`
* `GET /v1/commands/{id}/events`

### (opcjonalnie realtime)

* `GET /v1/stream/commands/{id}` (SSE) albo WS

---

## 9) Proponowany “pancer”-szkielet implementacji (bez 2000 linijek)

Jeśli chcesz, mogę Ci w następnym kroku wkleić gotowy kod:

* FastAPI + SQLAlchemy (albo SQLModel)
* Alembic migrations
* Celery worker
* Redis lock helper
* idempotency middleware
* audit events
* prosty executor (docker/systemd) + stub agenta

Żeby nie zamienić tego w epopeję, przyjmuję domyślnie:

* **Postgres** jako DB (SQLite na start, ale do audytu i komend Postgres jest po prostu pewniejszy)
* **Redis** jako queue i locki
* **Celery** jako worker

---

## 10) Jedna decyzja, która wpływa na kod (i od razu biorę default, jeśli nie chcesz wybierać)

**Gdzie będą faktycznie uruchomione usługi?**

* na jednym serwerze (wtedy Wariant A wystarczy na start)
* na wielu hostach (wtedy od razu Wariant B: agent)

Jeśli nie odpowiesz: przyjmuję rozsądny kompromis:

* startujesz z **Wariantem A**, ale interfejs executora robimy tak, żeby **bez bólu** przełączyć na agentów (B).

Powiedz tylko “docker” czy “systemd” jako główny sposób sterowania usługami (może być oba, ale jeden jako primary).
