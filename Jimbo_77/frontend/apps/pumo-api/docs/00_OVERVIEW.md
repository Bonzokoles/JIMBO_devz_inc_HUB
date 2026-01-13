# PUMO Dashboard + Analityka — rozpiska techniczna

Projekt ma być Cloudflare Workerem, który serwuje jednocześnie API i dashboard.

## Co się deployuje dzisiaj (stan z ZIP)

W `wrangler.toml` ustawiono `main = "src/index-new.ts"`, więc **produkcyjnie uruchamiany jest wariant modularny**:

- `src/index-new.ts` → `src/handlers/router.ts`
- dashboard jest generowany inline w `router.ts` (`serveDashboard()`)
- `/api/analytics/*` idzie do `src/endpoints/analytics.ts` (tam są przykładowe/stubowe dane)
- auth dashboardu w tej ścieżce jest w `src/auth/auth.ts` i ma **zahardkodowane** `Bonzo/#HAOS77#`.

Równolegle w repo jest **drugi, dużo bogatszy** entrypoint `src/index.ts` (monolit), który ma masę endpointów (sync, GA4, tracking, AI/search itd.) i sensowniejszą obsługę auth (sekret `DASHBOARD_PASSWORD`, opcjonalnie Cloudflare Access). Tyle że **ten plik nie jest podpięty w `wrangler.toml`**, więc nie działa w deployu, dopóki go nie wybierzesz.

## Po co są te dokumenty

W `docs/` dostajesz:

- mapę modułów i odpowiedzialności,
- mapę endpointów (modular vs monolit),
- opis narzędzi analitycznych (co zbierać, jak liczyć KPI, jak weryfikować dane),
- listę luk/ryzyk i konkretny plan domknięcia.

Jeśli masz tylko jedną rzecz wynieść z tej rozpiski: **najpierw trzeba ujednolicić entrypoint i auth**, bo w obecnym stanie repo jest „dwa projekty w jednym”, a produkcja używa tej uboższej i mniej bezpiecznej ścieżki.
