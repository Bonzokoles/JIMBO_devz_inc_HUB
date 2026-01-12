OK — **wiele hostów + wszystko przez Cloudflare** to bardzo dobry układ, tylko trzeba to zrobić tak, żeby Cloudflare był **transportem i bramą**, a nie “magicznym security” zamiast RBAC i idempotencji.

Masz wtedy docelowo:

* **API** (FastAPI) — przyjmuje komendy, autoryzuje usera (Access), zapisuje do DB, wrzuca do kolejki
* **Worker** — bierze komendy z kolejki, decyduje co/where wykonać, robi locki, retry, audit
* **Agenty na hostach** — wykonują lokalnie (docker/systemd), wystawione jako **prywatne originy przez Cloudflare Tunnel**
* **Cloudflare Access** — chroni wszystko (user-facing i service-to-service)

Poniżej blueprint “pancerna” wersja pod Twój scenariusz.

---

## 1) Sieć i nazwy (czytelnie)

OPS domena:

* `hub.ops.tld` (UI) — Access (human)
* `api.ops.tld` (FastAPI) — Access (human + worker)
* `queue/redis` — najlepiej prywatnie (VPS/VPC), nie przez internet
* `agent-<host>.ops.tld` — **agent na konkretnym hoście** przez Cloudflare Tunnel (service-to-service)

Przykład:

* `agent-pumo-1.ops.tld`
* `agent-pumo-2.ops.tld`
* `agent-zenon-1.ops.tld`

Każdy host ma swój `cloudflared` tunnel i lokalnie agenta np. `127.0.0.1:8787`.

---

## 2) Cloudflare Access – dwa typy polityk

### A) Human access (Ty + ewentualne role)

* `hub.ops.tld/*` — Ty/owner
* `api.ops.tld/*` — Ty/owner/admin
* `pumo.ops.tld/*` — Ty + pumo-dev itd.

### B) Service-to-service (Worker → Agent)

Tu wchodzą **Access Service Tokens**:

* dla worker’a tworzysz token: `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`
* polityka dla `agent-*.ops.tld/*`:

  * Allow: **Service Token “ops-worker”**
  * Block: reszta

To jest klucz: agent ma być niedostępny dla człowieka z przeglądarki (chyba że świadomie dasz wyjątek).

---

## 3) Jak Worker gada z Agentem (bezpiecznie)

Worker robi request do `https://agent-pumo-1.ops.tld/execute` z nagłówkami:

* `CF-Access-Client-Id: ...`
* `CF-Access-Client-Secret: ...`
* * swój **Command Token** (podpisany) albo chociaż `X-Command-Id` (do audytu)

**Agent nie ufa workerowi “bo tak”.** Agent weryfikuje, że request przeszedł przez Access:

* najprościej: jeśli Access przepuścił service token, to agent może uznać request za uprawniony
* pancernej: agent dodatkowo wymaga **podpisu HMAC** payloadu (`X-Signature`) — wtedy nawet gdyby ktoś w środku sieci coś kombinował, nie przejdzie

Ja polecam: **Access service token + HMAC signature**. To jest proste i mocne.

---

## 4) Podział odpowiedzialności (żeby nie było chaosu)

### API (FastAPI)

* przyjmuje `POST /v1/commands` (z Idempotency-Key)
* robi RBAC: czy user może wykonać `deploy.run` w projekcie
* zapisuje w DB `commands` + `command_events`
* wrzuca job do kolejki

### Worker

* pobiera job
* sprawdza idempotencję + status
* bierze lock (`project:deploy` albo `project:service:xyz`)
* wybiera target agentów (z configu)
* wysyła do agenta `execute`
* zbiera wynik, zapisuje eventy, robi retry/backoff

### Agent (na hoście)

* ma allowlistę akcji (restart/start/stop/deploy/logs)
* mapuje akcje na lokalne komendy (docker/systemd)
* nie zna RBAC (to robi API), ale zna **politykę bezpieczeństwa** (co wolno wykonać w ogóle)
* loguje lokalnie + zwraca wynik

---

## 5) Config: gdzie trzymasz “który projekt na jakich hostach”

W `api.ops.tld` trzymasz konfigurację projektów, np.:

* `projects[]`
* `agents[]` per projekt: lista endpointów agentów
* `services[]` per projekt: mapowanie `service_id -> agent_id + executor spec`

Przykład idei:

```json
{
  "id": "pumo",
  "name": "PUMO",
  "host": "https://pumo.ops.tld",
  "modules": ["overview","services","deploy","logs"],
  "agents": [
    { "id":"pumo-1", "url":"https://agent-pumo-1.ops.tld" },
    { "id":"pumo-2", "url":"https://agent-pumo-2.ops.tld" }
  ],
  "services": [
    { "id":"pumo-api", "label":"PUMO API", "agent":"pumo-1", "executor":"docker", "unit":"pumo_api" },
    { "id":"pumo-worker", "label":"PUMO Worker", "agent":"pumo-2", "executor":"systemd", "unit":"pumo-worker" }
  ]
}
```

Dzięki temu “ster” może rosnąć do 30 projektów bez przepisywania UI.

---

## 6) Idempotencja, retry, locki – jak to wygląda w praktyce

* **Idempotency-Key**: unikalny dla kliknięcia w UI. DB ma `UNIQUE(idempotency_key)`.
* **Status**: `queued → running → succeeded/failed`
* **Lock**: Redis `SET lock_key NX EX ttl`

  * deploy blokuje deploy
  * restart serwisu blokuje restart tego serwisu
* **Retry**: tylko dla transientów (timeout, 502, agent offline)
* **Max attempts**: np. 3
* **Backoff**: 10s → 30s → 90s (+ jitter)

To sprawia, że jak user kliknie 3x “deploy” bo UI zamuliło, to dostaje **ten sam command id**, a nie 3 deploye.

---

## 7) Pancerna warstwa bezpieczeństwa agenta (to jest ważne)

Agent powinien mieć:

1. **Access-only** (service token) — bez tego nie dostaniesz się na endpoint
2. **HMAC signature** requestu — `X-Signature: sha256=...`
3. **Allowlist akcji** + allowlist jednostek (np. tylko te service/unit, które są zdefiniowane)
4. **Brak dowolnego shell-a**. Żadnego “run arbitrary command”.

To jest różnica między “sterowaniem usługami” a “zdalną konsolą dla włamywacza”.

---

## 8) Co dokładnie mogę Ci dać jako następny konkret

Skoro to już jest decyzja “wiele hostów + Cloudflare”, to następny sensowny pakiet to:

1. **Agent (FastAPI lub mały aiohttp)** z endpointami:

   * `POST /execute` (restart/deploy)
   * `GET /healthz`
   * `GET /logs/tail` (opcjonalnie)
2. **Worker (Celery)** z:

   * lock helper (Redis)
   * call to agent z Access service token
   * HMAC signing
   * retry/backoff
3. **DB modele** (SQLAlchemy/SQLModel) dla `commands` i `command_events`
4. **API endpoints** do podglądu commandów + SSE (opcjonalnie)

Jeżeli nie chcesz dłubania w wyborach: przyjmę default:

* **Postgres + Redis + Celery**
* Agenty jako **FastAPI** (jednolity stack, łatwiejszy maintenance)

Powiedz tylko dwie rzeczy (krótko, bez elaboratu):

* Na hostach usługi są głównie w **docker** czy **systemd** (może być mix)?
* Wolisz logi zbierać z **journald/docker logs** czy już masz coś typu Loki/ELK?
