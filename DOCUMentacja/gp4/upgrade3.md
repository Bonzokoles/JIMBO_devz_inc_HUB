Jasne — rozpisuję **twardy cooldown po stronie backendu** (Redis), tak żeby nawet jak ktoś obejdzie UI, API powie “spadaj, jeszcze nie”.

Założenie: cooldown dotyczy **konkretnie tego samego serwisu** (`projectId + serviceId`) dla akcji `service.restart` (i analogicznie możesz dodać dla deploy).

---

# 1) ENV (API)

Dodaj w API:

```env
REDIS_URL=redis://redis:6379/0
RESTART_COOLDOWN_SECONDS=20
DEPLOY_COOLDOWN_SECONDS=60
```

---

# 2) `api/app/redis_client.py` (NOWY)

```python
import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
```

---

# 3) `api/app/cooldown.py` (NOWY)

```python
from __future__ import annotations
import os
from .redis_client import r

RESTART_COOLDOWN_SECONDS = int(os.getenv("RESTART_COOLDOWN_SECONDS", "20"))
DEPLOY_COOLDOWN_SECONDS = int(os.getenv("DEPLOY_COOLDOWN_SECONDS", "60"))

class CooldownError(Exception):
    def __init__(self, key: str, ttl: int):
        super().__init__(f"cooldown_active ttl={ttl}")
        self.key = key
        self.ttl = ttl

def _key(project_id: str, action: str, target: str | None) -> str:
    # target w API to serviceId (np. pumo-api)
    return f"cooldown:{project_id}:{action}:{target or 'none'}"

def enforce_cooldown(project_id: str, action: str, target: str | None) -> None:
    if action == "service.restart":
        ttl = RESTART_COOLDOWN_SECONDS
    elif action == "deploy.run":
        ttl = DEPLOY_COOLDOWN_SECONDS
    else:
        return

    key = _key(project_id, action, target)

    # SET NX EX -> atomowo: jeśli nie istnieje, ustaw i przejdź; jeśli istnieje -> cooldown aktywny
    ok = r.set(key, "1", nx=True, ex=ttl)
    if ok:
        return

    remaining = r.ttl(key)
    if remaining < 0:
        remaining = ttl
    raise CooldownError(key=key, ttl=remaining)
```

---

# 4) Podpięcie w `POST /v1/commands` (API)

W Twoim `api/app/routes/commands.py` (tam gdzie robisz create command) dodaj:

* **walidację reason** (już pisałem),
* **twardy cooldown** przed stworzeniem komendy,
* i dopiero potem idempotency lookup + insert.

Przykładowy fragment do wklejenia (w środku endpointu):

```python
from fastapi import HTTPException
from ..cooldown import enforce_cooldown, CooldownError

# ... inside create_command ...

# reason required
if payload.action in ("service.restart", "deploy.run"):
    if not payload.reason or len(payload.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="reason_required_min_5")

# cooldown (twardy)
try:
    enforce_cooldown(payload.projectId, payload.action, payload.target)
except CooldownError as e:
    raise HTTPException(
        status_code=429,
        detail={"error": "cooldown_active", "retry_after_seconds": e.ttl}
    )
```

**Uwaga ważna:** cooldown działa na `payload.target`.
U Ciebie `target` to **serviceId** (np. `pumo-api`) — i tak ma być.

---

# 5) UX na froncie: pokaż retry-after (opcjonalnie, ale fajne)

W `apps/project/src/pages/Services.tsx` w `doRestart` dodaj łapanie 429:

```tsx
try {
  const out = await api.command(payload, idemKey());
  props.onCommand(out.id);
  // ...
} catch (e: any) {
  // fetch wrapper w api.ts rzuca tylko message, więc najlepiej ulepszyć api.ts,
  // ale na szybko:
  alert(`Blocked: cooldown or error. ${String(e?.message ?? e)}`);
}
```

Jeśli chcesz to zrobić porządnie, zmień `jpost` w `packages/core/src/api.ts`, żeby dla 429 zwracał JSON detail. Wtedy pokażesz “spróbuj za 12s”.

---

# 6) Cooldown vs Idempotency — jak to się zachowuje

* **Idempotency-Key**: chroni przed spamem “ten sam request” (klik 3x w 1s)
* **Cooldown**: chroni przed spamem “nowy request” co 2 sekundy (inne idempotency key)

Razem dają Ci spokój.

---

# 7) Jeśli chcesz “pancerniej”: cooldown tylko po SUCCESS

Obecna wersja blokuje od razu (nawet jeśli komenda potem padnie). To jest OK operacyjnie (bo restart co 2 sekundy to zawsze zło), ale czasem chcesz:

* cooldown startuje dopiero po `succeeded`

Wtedy cooldown ustawiasz nie w API, tylko w **workerze** po `mark_succeeded`.
Jeśli chcesz ten wariant, dopiszę dokładnie, gdzie i jak (też Redis `SET EX`).

---

Jeśli mówisz “rozpisz” w sensie: **wolisz cooldown od razu (jak teraz), czy dopiero po sukcesie?**
Ja bym defaultowo zostawił **od razu** dla restartów (bo to jest młot, który ma powstrzymywać nerwowe klikanie).
