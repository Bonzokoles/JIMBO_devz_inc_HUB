# Jimbo77 System Blueprint (Cloudflare Pages + Tunnels)

## Cel
Zbudować system agentowy z centralnym orkiestratorem **Jimbo** i orkiestratorami warstwowymi **Brain / Pinky / Elwirka**, gdzie:
- **Dashboard UI** działa na **Cloudflare Pages** pod domeną `jimbo77.com`.
- **Control-plane (API + orkiestracja)** działa pod `api.jimbo77.org` (najlepiej VPS).
- **Workery** (Windows + ewentualne inne maszyny) są wystawione **wyłącznie przez Cloudflare Tunnel** na subdomenach (`win.jimbo77.org`, `s1..s4.jimbo77.org`).
- **Brak otwartych portów** na routerach/domowych sieciach.
- **Windows jest workerem**, nie mózgiem.

## Warstwy
1. **UI (Pages)** – prezentacja, sterowanie, podgląd.
2. **Control-plane (API)** – routing zadań, kolejka, stan, autoryzacja.
3. **Workers (agentd)** – wykonanie, integracje lokalne, monitoring.
4. **Security** – Cloudflare Access + service tokens + allowlist.

## Złota zasada
> Pages to twarz. Tunnels to układ nerwowy. Jimbo to mózg. Windows to ręce.
