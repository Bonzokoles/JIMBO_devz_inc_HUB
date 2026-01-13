# AI Agents System for PUMO

Based on `07_AGENTS_AI_INTEGRATION_MEBLEPUMO.md`

## 10 Monitoring Agents

### A1. Uptime + Transactions Agent
- **Goal**: Detect site availability and sales functionality
- **Inputs**: HTTP monitoring, synthetic transactions
- **Rules**: SLA 99.9%, timeouts, 5xx/4xx status codes
- **Outputs**: Alerts (Slack/Email), uptime charts, incident list
- **Frequency**: Every 1-5 minutes

### A2. Performance Agent (Core Web Vitals)
- **Goal**: Detect slowdowns affecting SEO/conversion
- **Inputs**: RUM, Lighthouse CI, TTFB, asset sizes
- **Rules**: INP/LCP/CLS thresholds, JS bundle growth
- **Outputs**: Performance regressions, build diffs, recommendations
- **Frequency**: After deploy + daily

### A3. Error Budget Agent
- **Goal**: Catch errors before users see them
- **Inputs**: Stack traces, breadcrumbs, worker exceptions
- **Rules**: Error grouping, threshold for new errors
- **Outputs**: Top 10 errors, new vs old, reproduction links
- **Frequency**: Near real-time

### A4. Security Agent
- **Goal**: Detect bots, scans, injection attempts
- **Inputs**: Request logs, WAF, rate limiting, geo, user agent
- **Rules**: Traffic anomalies, SQLi/XSS signatures, brute-force patterns
- **Outputs**: Alerts + WAF rule recommendations
- **Frequency**: Every 5-15 minutes

### A5. SEO/Indexing Agent
- **Goal**: Detect visibility drops before disaster
- **Inputs**: Sitemap, robots.txt, 404/301 status, canonicals, meta, structured data, GSC
- **Rules**: 404 growth, indexing errors, canonical duplicates
- **Outputs**: URL fix list + priorities
- **Frequency**: Daily/weekly

### A6. Conversion & Funnel Agent
- **Goal**: Catch conversion rate drops before cashflow suffers
- **Inputs**: E-commerce events + traffic sources
- **Rules**: CR anomalies, AOV, add-to-cart rate, checkout drop-off
- **Outputs**: Where it broke + segment (device, channel, category)
- **Frequency**: Every 1-6 hours

### A7. Products & Inventory Agent
- **Goal**: Ensure selling what you have at sensible prices
- **Inputs**: Product feed, stock levels, prices, margins
- **Rules**: Out-of-stock top sellers, price anomalies, margin < threshold
- **Outputs**: Action list (restock, adjust price, pause ads)
- **Frequency**: Every 6-24 hours

### A8. Campaigns Agent (ROAS/CAC)
- **Goal**: Cut unprofitable campaigns before budget drain
- **Inputs**: Campaign costs, attributed revenue, attribution
- **Rules**: ROAS < threshold, CAC > threshold, lead quality drop
- **Outputs**: Recommendations (pause/change creative/landing)
- **Frequency**: Daily

### A9. Sentiment Agent
- **Goal**: Catch quality/service issues before returns and negatives
- **Inputs**: Emails, chat, forms, comments
- **Models**: Topic classification, sentiment, cause extraction
- **Outputs**: Top 5 weekly problems, quotes/problem classes, SLA response
- **Frequency**: Daily/weekly

### A10. Deploy Tracking Agent
- **Goal**: Correlate "after this deploy something broke"
- **Inputs**: Deploy logs, config, feature flags, versions
- **Rules**: Time correlations with A1-A3
- **Outputs**: Incident timeline + suspicious changes
- **Frequency**: After each deploy

## AI Analytics Modules

### D1. NLQ → SQL Chat
- Natural language queries to database
- Safe SQL generation (SELECT only, whitelist tables)
- LLM summarizes results + suggests next steps

### D2. Auto-Reports
- Daily/weekly CEO brief
- KPIs, changes vs previous period, biggest deviations, recommendations

### D3. Anomaly Detection + Explain
- System detects: CR drop on mobile
- Agent explains possible causes with evidence (charts, numbers)

### D4. Incident Assistant
- On alert from A1/A3: collects logs, recent deploys, top endpoints
- Generates debug checklist

### D5. Task Generator
- From agent recommendations → Jira/Trello/Issues
- Example: "Fix 404: /kolekcja/...", "Optimize LCP on /product/..."

## Implementation Priority

### Phase 1 (Foundation, 1-2 weeks)
- Event schema + data collection
- A1 uptime + A3 errors
- Daily KPI report (with/without AI summary)
- Basic RBAC in dashboard

### Phase 2 (Business Value, 2-4 weeks)
- A6 conversion + anomaly detection
- D1 NLQ→SQL (with guardrails)
- A7 inventory/prices
- Basic AI product assistant (RAG) on meblepumo

### Phase 3 (Scaling, 1-2 months)
- Performance + SEO agents
- AI Search (hybrid + embeddings)
- Campaigns/ROAS agent (after cost integration)
- Automated tasks + incident assistant

## Security Checklist
- [ ] PII masking in logs and prompts
- [ ] RAG data allowlist (no secrets)
- [ ] SQL guardrails: SELECT-only, limit, timeout
- [ ] Rate limiting on AI endpoints
- [ ] Audit trail: who asked what, what data was used
- [ ] Prompt injection: separate system instructions from external content

## API Endpoints (To Implement)

```
POST /api/agents/run/:agent
POST /api/ai/nlq
POST /api/ai/rag
GET  /api/agents/status
GET  /api/agents/list
```

## Next Steps

1. Create agent registry (JSON/YAML)
2. Implement agent endpoints in backend
3. Create D1 tables for events, alerts, recommendations
4. Add Agents tab to dashboard UI
5. Implement AI Console for NLQ queries
