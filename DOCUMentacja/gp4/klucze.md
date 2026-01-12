# JIMBO77 Unified Systems - Secrets Management (TEMPLATE)

Ten dokument zawiera listę wymaganych kluczy API.
**UWAGA:** Prawdziwe wartości przechowuj w Cloudflare Dashboard lub GitHub Secrets. Nie wpisuj ich tutaj!

---

## 1. Cloudflare Pages / Workers (Production Environment Variables)
W panelu Cloudflare: **Settings -> Environment Variables -> Production (& Preview)**

### Publishing Module (Twitter/X, Dev.to, R2, Blog)
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `TWITTER_API_KEY` | `[SECRET]` | API Key for Posting Tweets |
| `TWITTER_API_SECRET` | `[SECRET]` | API Secret for Posting Tweets |
| `TWITTER_ACCESS_TOKEN` | `[SECRET]` | Access Token (User Context) |
| `TWITTER_ACCESS_TOKEN_SECRET` | `[SECRET]` | Access Token Secret |
| `DEVTO_API_KEY` | `[SECRET]` | API Key for Dev.to Articles |
| `R2_ACCESS_KEY_ID` | `[SECRET]` | Access Key for R2 Uploads |
| `R2_SECRET_ACCESS_KEY` | `[SECRET]` | Secret Key for R2 Uploads |
| `R2_ACCOUNT_ID` | `7f490d58a478c6baccb0ae01ea1d87c3` | Cloudflare Account ID |
| `R2_BUCKET` | `mybonzo-blog-content` | Bucket Name |
| `R2_PUBLIC_URL` | `https://pub-mybonzo.r2.dev` | Public URL for images |

### AI & LLM Services
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | `[SECRET]` | GPT-4 / GPT-3.5 API |
| `OPENROUTER_API_KEY` | `[SECRET]` | OpenRouter (DeepSeek, etc.) |
| `CLOUDFLARE_API_TOKEN` | `[SECRET]` | Workers AI / Vectorize |
| `CLOUDFLARE_AI_MODEL` | `@cf/meta/llama-3.1-8b-instruct` | Domyslny model AI |

### Scraping & External Tools
| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `ZENROWS_API_KEY` | `[SECRET]` | ZenRows Scraper |
| `FIRECRAWL_API_KEY` | `[SECRET]` | Firecrawl API |
| `TAVILY_API_KEY` | `[SECRET]` | Tavily Search |
| `HYPERBROWSER_API_KEY` | `[SECRET]` | HyperBrowser |
| `BRAVE_API_KEY` | `[SECRET]` | Brave Search |
| `WEATHER_API_KEY` | `[SECRET]` | Weather API |
| `TMDB_API_KEY` | `[SECRET]` | The Movie DB |
| `MONGODB_API_KEY` | `[SECRET]` | MongoDB Data API |

---

## 2. GitHub Repository Secrets
W repozytorium GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret**

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | `[SECRET]` | Token z uprawnieniami `Pages:Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | `7f490d58a478c6baccb0ae01ea1d87c3` | ID Konta Cloudflare |
