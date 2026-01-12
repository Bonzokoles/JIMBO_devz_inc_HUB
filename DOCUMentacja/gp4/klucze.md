# JIMBO77 Unified Systems - Secrets Management

Ten dokument zawiera uporządkowaną listę kluczy API.
**UWAGA:** To są tajne dane. Nie udostępniaj tego pliku publicznie.

---
cludflare jimbo77 
curl "https://api.cloudflare.com/client/v4/accounts/7f490d58a478c6baccb0ae01ea1d87c3/tokens/verify" \
-H "Authorization: Bearer Qj2HNgIYeLtpmUzPFWnvrFIDpBklKTliBk0FuSuI"

Qj2HNgIYeLtpmUzPFWnvrFIDpBklKTliBk0FuSuI



## 1. Cloudflare Pages / Workers (Production Environment Variables)
W panelu Cloudflare: **Settings -> Environment Variables -> Production (& Preview)**

### Publishing Module (Twitter/X, Dev.to, R2, Blog)
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `TWITTER_API_KEY` | *(Check Twitter Developer Portal)* | API Key for Posting Tweets |
| `TWITTER_API_SECRET` | *(Check Twitter Developer Portal)* | API Secret for Posting Tweets |
| `TWITTER_ACCESS_TOKEN` | *(Check Twitter Developer Portal)* | Access Token (User Context) |
| `TWITTER_ACCESS_TOKEN_SECRET` | *(Check Twitter Developer Portal)* | Access Token Secret |
| `DEVTO_API_KEY` | *(From dev.to Settings)* | API Key for Dev.to Articles |
| `R2_ACCESS_KEY_ID` | *(Cloudflare R2 API Token)* | Access Key for R2 Uploads |
| `R2_SECRET_ACCESS_KEY` | *(Cloudflare R2 API Token)* | Secret Key for R2 Uploads |
| `R2_ACCOUNT_ID` | `7f490d58a478c6baccb0ae01ea1d87c3` | Cloudflare Account ID |
| `R2_BUCKET` | `mybonzo-blog-content` | Bucket Name |
| `R2_PUBLIC_URL` | `https://pub-mybonzo.r2.dev` | Public URL for images |

### AI & LLM Services
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | `sk-PLACEHOLDER_OPENAI_KEY` | GPT-4 / GPT-3.5 API |
| `OPENROUTER_API_KEY` | `sk-or-v1-PLACEHOLDER_OPENROUTER_KEY` | OpenRouter (DeepSeek, etc.) |
| `CLOUDFLARE_API_TOKEN` | `a3zjDoXkS4-tP4Vg0KZx951l9WbH5m3TFl-tVAfN` | Workers AI / Vectorize |
| `CLOUDFLARE_AI_MODEL` | `@cf/meta/llama-3.1-8b-instruct` | Domyslny model AI |

### Scraping & External Tools
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `ZENROWS_API_KEY` | `7e19c83b1ecc5f405f67a4886bcc2f6d6f861d3f` | ZenRows Scraper |
| `FIRECRAWL_API_KEY` | `fc-a96b5283038545d0829eb6fe473fb897` | Firecrawl API |
| `TAVILY_API_KEY` | `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` | Tavily Search |
| `HYPERBROWSER_API_KEY` | `hb_2184b34e1926353ef4c7837edace` | HyperBrowser |
| `BRAVE_API_KEY` | `BSAa8VqK4CjkKCwCNtTqlCDMcLLDvWD` | Brave Search |
| `WEATHER_API_KEY` | `67a0b73aa29134cdee57d717501b2327` | Weather API |
| `TMDB_API_KEY` | `f1044d027d1751fec72a3b6d8129249c` | The Movie DB |
| `MONGODB_API_KEY` | `8bb55db9-c6cc-4bbb-92b6-0f3b0bb27c65` | MongoDB Data API |

---

## 2. GitHub Repository Secrets
W repozytorium GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret**
Wymagane do automatycznego deployu (CI/CD).

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | `a3zjDoXkS4-tP4Vg0KZx951l9WbH5m3TFl-tVAfN` | Token z uprawnieniami `Pages:Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | `7f490d58a478c6baccb0ae01ea1d87c3` | ID Konta Cloudflare |

Jeśli używasz VPS i Docker do backendu, dodaj również:
| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `SSH_HOST` | *(Your VPS IP)* | IP Serwera |
| `SSH_USERNAME` | `root` (lub inny user) | Użytkownik SSH |
| `SSH_KEY` | *(Twój klucz prywatny)* | Zawartość id_rsa |

---

## 3. Other / Legacy Keys
Klucze znalezione w pliku, do weryfikacji czy są używane.

```env
PUBLIC_FLOWISE_API_URL=https://your-flowise-instance.com/api/v1/prediction/your-flow-id
FLOWISE_API_TOKEN=XIPZPcZ-RD-hGJWfmm3AzxorIoNT4I8rb-msnLaDWYY
PUBLIC_ACTIVEPIECES_API_URL=https://your-activepieces-instance.com/api/v1/flows/your-flow-id/run
GOOGLE_API_KEY=AIza-PLACEHOLDER_GOOGLE_KEY
SEARCHAPI_API_KEY=9Jueik7zhyNBA36xDpSsGf2a
GITHUB_TOKEN=YOUR_GITHUB_TOKEN_HERE

```
