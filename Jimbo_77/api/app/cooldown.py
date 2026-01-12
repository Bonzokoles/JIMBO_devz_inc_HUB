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
