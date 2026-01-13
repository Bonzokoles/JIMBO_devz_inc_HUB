# PUMO Analytics Dashboard

Real-time business intelligence dashboard for PUMO (Meble PUMO) with AI-powered insights.

## Features

### 📊 Dashboard
- **6 KPI Cards**: Revenue, AI Share, Conversion Rate, Clicks, RAG Hit Rate, API Uptime
- **Revenue Trend Chart**: 30-day line chart with total and AI revenue
- **Traffic Sources**: Pie chart showing AI SEO, Organic, Paid, Direct traffic
- **Top Products Table**: Real-time product performance with clicks, CTR, revenue

### 🤖 AI Analyst
- Natural language queries to database
- Real-time insights and recommendations
- Anomaly detection and explanations

### 🔧 Tech Stack
- React 18.3.1 + TypeScript
- Vite 5.4.21
- Chart.js 4.4.1 + react-chartjs-2
- Cyberpunk/terminal dark theme

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (port 3002)
pnpm dev

# Build for production
pnpm build
```

## API Integration

API service layer in `src/api.ts` with endpoints:
- `GET /api/analytics/kpis` - KPI metrics
- `GET /api/analytics/revenue-trend?days=30` - Revenue data
- `GET /api/analytics/traffic-sources` - Traffic breakdown
- `GET /api/analytics/top-products?limit=10` - Product performance
- `POST /api/ai-analyst` - AI query endpoint

Configure API base URL via `VITE_API_BASE` environment variable.

## AI Agents System

10 monitoring agents + AI analytics modules. See `AI_AGENTS.md` for details.

## Deployment

- **Development**: `http://localhost:3002`
- **Production**: `pumo.jimbo77.com` (Cloudflare Pages)

## Environment Variables

```env
VITE_API_BASE=https://api.pumo.jimbo77.com
```

## Project Structure

```
apps/pumo/
├── src/
│   ├── App.tsx          # Main dashboard component
│   ├── main.tsx         # React entry point
│   ├── api.ts           # API service layer
│   ├── index.css        # Styling
│   └── vite-env.d.ts    # TypeScript definitions
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── AI_AGENTS.md         # AI agents documentation
└── README.md
```

## License

Part of JIMBO77 DEVZ Inc. ecosystem
