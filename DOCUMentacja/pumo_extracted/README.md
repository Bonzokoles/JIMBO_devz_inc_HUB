# PUMO Whitecat Worker (Deploy-ready)

Ten folder zawiera niezależnego Cloudflare Workera (API + dashboard).

## Lokalne uruchomienie

W tym folderze:

- `npm ci`
- `npx wrangler dev --port 8787`

Dashboard:

- `http://127.0.0.1:8787/`

## Konfiguracja (bez sekretów w repo)

### Vars (jawne, w `wrangler.toml` / `.dev.vars`)

- `PUMO_API_BASE_URL` (np. `https://api.meblepumo.pl/v1`)
- `ALLOWED_ORIGINS`
- `DASHBOARD_API_BASE` (opcjonalnie; domyślny base URL do requestów dashboardu)
- `GA4_PROPERTY_ID` (dla GA4 Data API odczytu raportów)

### Secrets (tylko Cloudflare / GitHub secrets → Wrangler)

Ustaw przez `wrangler secret put <NAME>`:

- `DASHBOARD_PASSWORD` - **NOWE!** Proste hasło do dashboardu (np. `#HAOS77#`)
  - Alternatywa dla Cloudflare Access (enterprise SSO)
  - Browser wyświetli prompt Basic Auth
  - Username może być dowolny, liczy się tylko hasło
- `PUMO_API_KEY`
- `GA4_SERVICE_ACCOUNT_JSON`
- (opcjonalnie) `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` (Measurement Protocol – wysyłka eventów)

### Autoryzacja dashboardu

Worker wspiera **3 metody** auth (w kolejności priorytetu):

1. **Lokalny development** - brak auth gdy `localhost` lub `127.0.0.1`
2. **Simple Password** (HTTP Basic Auth) - gdy ustawiony `DASHBOARD_PASSWORD`
   ```bash
   wrangler secret put DASHBOARD_PASSWORD
   # Wprowadź: #HAOS77#
   ```
3. **Cloudflare Access** (enterprise SSO) - gdy ustawione `CF_ACCESS_AUD` i `CF_ACCESS_JWKS_URL`

Aby wyłączyć całkowicie auth: ustaw `DASHBOARD_DISABLE_AUTH=true` w vars (NIE ZALECANE w produkcji!).

## GitHub Actions deploy

Repo ma workflow:

- `.github/workflows/deploy-pumo-whitecat-worker.yml`

Workflow automatycznie deployuje workera i ustawia `DASHBOARD_PASSWORD`.

### Wymagane GitHub Secrets:

W GitHub ustaw:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token z uprawnieniami Workers edit
- `CLOUDFLARE_ACCOUNT_ID` - Twoje Cloudflare account ID
- `DASHBOARD_PASSWORD` - Hasło do dashboardu workera (zalecane: `#HAOS77#`)

**Aby ustawić GitHub Secret:**

1. Idź do: **Settings → Secrets and variables → Actions**
2. Kliknij **New repository secret**
3. Dodaj secret:
   - Name: `DASHBOARD_PASSWORD`
   - Value: `#HAOS77#`

Po ustawieniu, każdy deploy automatycznie zaktualizuje hasło w Cloudflare.

Deploy wykona się na `push` do `main` dla zmian w `src/workers/pumo-whitecat/**`.

## Domeny

Domyślnie Worker dostaje adres `*.workers.dev` (zależny od nazwy workera z `wrangler.toml`).
Custom domain (`www.jimbolikepumo.dev`) podpina się w Cloudflare: Workers & Pages → Worker → Triggers → Custom Domains.
