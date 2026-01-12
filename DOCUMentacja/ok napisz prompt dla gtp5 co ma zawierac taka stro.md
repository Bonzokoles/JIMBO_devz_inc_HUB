<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# ok napisz prompt dla gtp5 co ma zawierac taka strona , co tworzymy ,jak ma to wszystko być połączone a kaze mu rozpisac html dashboardu i strony (on tworzy najlepsze wizualnie zeczy) i zeby zrobił prostą stone startową

```markdown
# PROMPT DLA GPT-5: Jimbo77 Central Control Dashboard

## ZADANIE
Stwórz **profesjonalny, neon-dark theme dashboard** dla **Jimbo77 Mission Control** – centralnego hubu sterowania moimi projektami AI/e-commerce. Strona musi być **ultra-wizualna**, responsywna, z **Chart.js charts**, **real-time updates**, **AI chat** i **multi-project tabs**.

## STRUKTURA SYSTEMU (WAŻNE)
```

jimbo77.org (Control Center)
├── api.jimbo77.org → API Gateway (wszystkie projekty)
├── analytics.jimbo77.org → TEN DASHBOARD
├── ws.jimbo77.org → WebSocket (real-time)
├── sync.jimbo77.org → Inter-project sync
└── magnets.jimbo77.com → AI crawler bait

Projekty: pumo (meble), zenon (video), blog (RAG)

```

## API ENDPOINTS (real data)
```

GET /api/analytics/kpis?project=pumo → {total_revenue, ai_share, conversion_rate}
GET /api/analytics/revenue-trend?days=30 → [{date, total_revenue, ai_revenue}]
GET /api/analytics/top-products?limit=10 → [{name, clicks, ctr, revenue}]
GET /api/analytics/traffic-sources → {ai_seo: 32, organic: 28, paid: 15, direct: 25}
POST /ai-analyst → {query} → AI response
WebSocket ws.jimbo77.org → real-time alerts

```

## WYMAGANIA WIZUALNE (NEON-DARK PROFESSIONAL)
```

COLORS:

- Primary: \#00ff41 (neon green)
- Secondary: \#0affff (cyan)
- Background: \#0a0a0a → \#1a1a1a gradient
- Cards: \#141414 + \#00ff41 border + hover glow

LAYOUT:

1. HERO: "Jimbo77 Mission Control" + project selector tabs [PUMO | ZENON | BLOG | ALL]
2. KPI GRID (6 cards): Revenue, AI Share, Conv Rate, Clicks, RAG Hit, Uptime
3. CHARTS ROW: Revenue trend (line) + Traffic pie (doughnut)
4. TOP PRODUCTS: Interactive table (hover effects)
5. AI ANALYST: Chat input + message bubbles
6. SYNC STATUS: Green/red indicators + buttons

ANIMATIONS:

- KPI numbers counting up
- Chart smooth transitions
- Card hover glow (\#00ff41 box-shadow)
- Loading spinners (neon pulse)

RESPONSIVE: Mobile-first (grid adapts)
FONT: 'Courier New', monospace (tech look)

```

## HTML STRUCTURE (Chart.js + Vanilla JS)
```

- Chart.js CDN (v4)
- No frameworks (pure JS)
- API_BASE = '/api' (relative)
- Auto-refresh KPIs 30s
- Enter key → AI chat
- Error handling (graceful fallbacks)

```

## START PAGE (jimbo77.org)
**Prosta landing page** (1 sekunda load):
```

HERO: "Jimbo77 Mission Control"
"Central hub for AI projects \& e-commerce analytics"

QUICK LINKS:
[🚀 Analytics Hub] → analytics.jimbo77.org
[🔌 API Gateway] → api.jimbo77.org/docs
[⚡ Real-time] → ws.jimbo77.org (WebSocket test)
[🔄 Sync Engine] → sync.jimbo77.org/status

FOOTER: Private Operations | jimbo77.org

```

## TECHNICAL SPECS
```

- Pure HTML/CSS/JS (no React/Vue)
- Chart.js charts (revenue line + traffic pie)
- CSS Grid + Flexbox
- CSS custom properties (easy theme switch)
- Service Worker (offline capable)
- PWA manifest (installable)
- Meta viewport + favicon

```

## WYNIK OCZEKIWANY
1. **dashboard.html** – kompletny, gotowy do wrangler pages deploy
2. **index.html** – prosta startowa strona jimbo77.org  
3. **Zero zależności** poza Chart.js CDN

**STYL**: Cyberpunk neon + enterprise dashboard (jak TradingView + Vercel). Zrób to **NAJLEPIEJ JAK POTRAFIĘ**!
```

**Ten prompt da Ci perfekcyjny dashboard** – GPT-5 zrobi wizualnie top-tier efekt z real data integration. Wklej i deploy! 🚀
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: simple_library_viewer.html

[^2]: UNIFIED_OPERATIONS_DASHBOARD.html

[^3]: Plan-Rozwoju-Dashboard-TYLKO-Real-Data.md

[^4]: WHITECAT-Analytics-Complete-Implementation.md

[^5]: index.ts

[^6]: types.ts

[^7]: daily-sync.ts

[^8]: analytics-aggregator.ts

[^9]: email-service.ts

[^10]: order-sync.ts

[^11]: product-sync.ts

[^12]: ga4-analytics.ts

[^13]: report-generator.ts

[^14]: search-service.ts

[^15]: pumo-api-client.ts

[^16]: pumo-orders-client.ts

[^17]: subscriber-manager.ts

[^18]: chunk-processor.ts

[^19]: guide-generator.ts

[^20]: index.ts

[^21]: index.ts

[^22]: index.ts

[^23]: dashboard-export.html

[^24]: image.jpg

[^25]: image.jpg

