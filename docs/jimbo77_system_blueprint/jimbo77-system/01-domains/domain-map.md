# Mapa domen i subdomen

## Publiczne
- `https://jimbo77.com` – Dashboard UI (Cloudflare Pages)

## Prywatne (Access / login)
- `https://api.jimbo77.org` – Control-plane API
- `https://stream.jimbo77.org` – live status (SSE/WebSocket) *(opcjonalnie)*
- `https://logs.jimbo77.org` / `https://grafana.jimbo77.org` *(opcjonalnie)*

## Prywatne (service-to-service; bez logowania człowieka)
- `https://win.jimbo77.org` – Windows worker (tunnel -> localhost)
- `https://s1.jimbo77.org` – Satellite #1 (tunnel -> localhost)
- `https://s2.jimbo77.org` – Satellite #2
- `https://s3.jimbo77.org` – Satellite #3
- `https://s4.jimbo77.org` – Satellite #4

## Uwaga
Jeśli „4 strony” to tylko Cloudflare Pages (hosting statyczny), **nie są workerami**. Worker wymaga procesu (daemon). Wtedy satelity oznaczają inne maszyny/VPS/komputery.
