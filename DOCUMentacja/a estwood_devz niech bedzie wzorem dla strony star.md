<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# a estwood_devz niech bedzie wzorem dla strony startowej gdzie trzeba podać pasworld, tez wkleje te pliki dla gpt5

```markdown
# ULTYMATIVE PROMPT DLA GPT-5: jimbo77.org Mission Control

## ZAŁĄCZONE PLIKI DO ANALIZY
```

file:56 - UNIFIED_OPERATIONS_DASHBOARD.html (dashboard wzór)
file:57 - eastwood_devz.html (start page z hasłem wzór)
file:23 - dashboard-export.html (do poprawy)

```

## ZADANIE 1: DASHBOARD (analytics.jimbo77.org)
**Przerób UNIFIED_OPERATIONS_DASHBOARD.html** na **multi-project hub**:
```

PROJECT TABS: [PUMO | ZENON | BLOG | ALL]
API: /api/analytics/kpis?project={pumo|zenon|blog}
Neon theme (\#00ff41/\#0affff), Chart.js, real-time
Zachowaj LAYOUT + styling z file:56

```

## ZADANIE 2: START PAGE (jimbo77.org) 
**Na bazie eastwood_devz.html** – **prosta strona z hasłem**:
```

1. Hero: "Jimbo77 Mission Control" (cyberpunk neon)
2. Password input (jak eastwood_devz.html)
3. Po logowaniu → Quick links:
[🚀 Analytics Hub] → analytics.jimbo77.org
[🔌 API Gateway] → api.jimbo77.org/docs
[⚡ Real-time] → ws.jimbo77.org/test
[🔄 Sync] → sync.jimbo77.org/status
4. Hasło w localStorage (session only)
5. Mobile responsive
```

## TECHNICAL SPECS (DLA OBOCH)
```

NEON THEME:

- \#0a0a0a → \#1a1a1a gradient background
- \#00ff41 primary (glow hover)
- \#0affff secondary (AI/chat)
- Courier New monospace

DASHBOARD (file:56 bazą):

- Multi-project tabs (PUMO/ZENON/BLOG/ALL)
- API_BASE = '/api'
- Charts: revenue-trend, traffic-sources, top-products
- AI Chat: POST /ai-analyst
- Auto-refresh 30s
- Error handling (graceful)

START PAGE (eastwood_devz bazą):

- Password → localStorage 'jimbo77-auth'
- Success → Quick links grid
- Fail → Shake animation + retry
- Noindex meta (private)

WIZUALIZACJA:

- Glassmorphism cards (backdrop-filter: blur)
- Neon glow borders + hover pulse
- Smooth transitions (0.3s)
- Loading spinners (neon rotate)

RESPONSE: 2 pliki HTML gotowe do deploy:

1. index.html (start page z hasłem)
2. dashboard.html (multi-project analytics hub)
```
```

**Ten prompt wykorzysta**:

- **file:56** → profesjonalny dashboard layout/charts
- **file:57** → elegancki password screen
- **file:23** → dane do poprawy

**GPT-5 wygeneruje** perfekcyjne, spójne wizualnie pliki **gotowe do wrangler pages deploy**. Zero konfiguracji! 🚀
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: UNIFIED_OPERATIONS_DASHBOARD.html

[^2]: eastwood_devz.html

[^3]: simple_library_viewer.html

[^4]: UNIFIED_OPERATIONS_DASHBOARD.html

[^5]: Plan-Rozwoju-Dashboard-TYLKO-Real-Data.md

[^6]: WHITECAT-Analytics-Complete-Implementation.md

[^7]: index.ts

[^8]: types.ts

[^9]: daily-sync.ts

[^10]: analytics-aggregator.ts

[^11]: email-service.ts

[^12]: order-sync.ts

[^13]: product-sync.ts

[^14]: ga4-analytics.ts

[^15]: report-generator.ts

[^16]: search-service.ts

[^17]: pumo-api-client.ts

[^18]: pumo-orders-client.ts

[^19]: subscriber-manager.ts

[^20]: chunk-processor.ts

[^21]: guide-generator.ts

[^22]: index.ts

[^23]: index.ts

[^24]: index.ts

[^25]: dashboard-export.html

[^26]: image.jpg

[^27]: image.jpg

