# Security (Cloudflare)

## Polityki
1) `jimbo77.com` (UI) – publiczne lub za Access (Twoja decyzja)
2) `api.jimbo77.org` – **Access (login)** + opcjonalnie MFA
3) `win/s1..s4.jimbo77.org` – **Service Tokens ONLY** (bez logowania człowieka)

## Minimalny zestaw
- Cloudflare Access Application dla `api.*`
- Cloudflare Access Application dla `win/s1..s4.*`
- Service Token: `control-plane -> workers`

## Zalecenia
- rozdziel tokeny (osobny dla workerów, osobny dla observability)
- audytuj wywołania (IP, user, route, status)
- nie wkładaj sekretów do frontendu
