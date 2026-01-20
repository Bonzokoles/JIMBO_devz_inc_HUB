# Workers (Windows + satelity)

## Worker = proces
Worker to daemon `agentd` słuchający lokalnie, np. `http://127.0.0.1:7777`.

## Endpointy (propozycja)
- `GET /health` – zdrowie
- `GET /capabilities` – co potrafi
- `POST /job/execute` – wykonanie zadania
- `POST /job/cancel` – anulowanie *(opcjonalnie)*

## Bezpieczeństwo execution
- allowlist komend/narzędzi
- limity czasu
- limity zasobów
- osobny user systemowy (bez admina)

## Cloudflare Tunnel
Każdy worker ma swój tunnel mapujący subdomenę do localhost.
