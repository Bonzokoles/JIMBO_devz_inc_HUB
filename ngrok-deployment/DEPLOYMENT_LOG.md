# Ngrok AI Gateway - Deployment Log

**Start Date:** 18 stycznia 2026  
**Domain:** smallish-apocalyptically-candis.ngrok-free.dev  
**Gateway ID:** rd_33FaSZ9e7c6yHF9q1mFNNme2fDG  
**Region:** Global

---

## Deployment Plan Overview

Following the 5-document deployment package from [docs/wszystkie 4.md](../../docs/wszystkie%204.md):

- **Document 0:** SUMMARY - Deployment guide
- **Document 1:** NGROK_CONFIG.yml - Production YAML configuration
- **Document 2:** CLOUDFLARE_WORKERS.md - Worker code + D1 analytics
- **Document 3:** MONITORING_DASHBOARD.md - OpenTelemetry + Prometheus + Grafana
- **Document 4:** BACKUP_STRATEGY.md - 5-layer disaster recovery

**Estimated Total Time:** 1.5 hours  
**Expected Cost Savings:** $320-470/month (42-61% reduction from $770/mo baseline)

---

## Phase 1: Ngrok Configuration (15 minutes)

### 1.1 Dashboard Access

- [ ] Login to https://dashboard.ngrok.com/ai-gateway
- [ ] Navigate to domain: smallish-apocalyptically-candis.ngrok-free.dev
- [ ] Retrieve API key for CLI operations

### 1.2 Provider Configuration (Vault Management)

**Priority Providers:**

1. **Gemini 1.5 Pro (FREE Tier)** - 50% traffic target
   - Limit: 60 RPM (1,800/hour)
   - Cost: $0
   - Vault: `VAULT_GEMINI_KEY`

2. **Claude 3.5 Sonnet (via OpenRouter)** - 30% traffic
   - Cost: ~$3/1M tokens input, ~$15/1M output
   - Monthly: ~$360
   - Vault: `VAULT_OPENROUTER_KEY`

3. **DeepSeek R1 (via OpenRouter)** - 20% traffic
   - Cost: ~$0.14/1M tokens input, ~$0.28/1M output
   - Monthly: ~$193
   - Vault: `VAULT_DEEPSEEK_KEY`

**API Key Rotation (OpenAI for rate limit mitigation):**

- [ ] `VAULT_OPENAI_KEY_1` - Primary
- [ ] `VAULT_OPENAI_KEY_2` - Rotation A
- [ ] `VAULT_OPENAI_KEY_3` - Rotation B

### 1.3 Ngrok YAML Configuration

Status: Creating production config file...

---

## Phase 2: Cloudflare Worker Deployment (20 minutes)

### 2.1 Worker Code Setup

- [ ] Create worker in: `JIMBO_devz_inc_HUB/workers/ngrok-proxy`
- [ ] Implement 4 endpoints:
  - `/api/chat` - Chat completions
  - `/api/embeddings` - Text embeddings
  - `/api/images` - Image generation
  - `/health` - Health check

### 2.2 D1 Analytics Database

- [ ] Create D1 database: `ngrok-analytics`
- [ ] Deploy schema (requests table)
- [ ] Configure worker bindings

### 2.3 Worker Deployment

- [ ] Set secrets via `npx wrangler secret put`
- [ ] Deploy to Cloudflare: `npx wrangler deploy`
- [ ] Test all endpoints

---

## Phase 3: Integration with Existing Workers

### 3.1 Agents Orchestrator

**Location:** `JIMBO_devz_inc_HUB/workers/agents-orchestrator`  
**Benefit:** Multi-provider failover, 99.95% uptime

- [ ] Update environment variables
- [ ] Replace direct OpenRouter calls with ngrok proxy
- [ ] Test orchestration with 18 agents
- [ ] Verify KV state persistence

### 3.2 PUMO RAG

**Location:** `JIMBO_devz_inc_HUB/workers/pumo-rag`  
**Benefit:** 70% cost reduction ($200→$60/month)

- [ ] Update embeddings endpoint to ngrok proxy
- [ ] Configure smart routing (Gemini FREE → Claude fallback)
- [ ] Test Vectorize integration
- [ ] Verify indexing continues (current: 8,500/13,388 products)

### 3.3 Image Generators

**CF AI Image Gen:** `JIMBO_devz_inc_HUB/workers/cf-ai-image-gen`  
**Replicate Image Gen:** `JIMBO_devz_inc_HUB/workers/replicate-image-gen`

- [ ] Add ngrok as failover for Replicate API
- [ ] Configure cost-based routing (CF FREE → Replicate)
- [ ] Test image generation pipeline

---

## Phase 4: Monitoring Stack (30 minutes)

### 4.1 OpenTelemetry Collector

- [ ] Deploy collector container
- [ ] Configure ngrok trace export
- [ ] Test span collection

### 4.2 Prometheus + Grafana

- [ ] Deploy via Docker Compose
- [ ] Import 3 dashboards:
  - Request rate/latency
  - Cost analysis
  - Provider health
- [ ] Configure 8 production alerts

### 4.3 Jaeger + Loki

- [ ] Deploy distributed tracing (Jaeger)
- [ ] Configure log aggregation (Loki)
- [ ] Verify end-to-end observability

### 4.4 Alert Configuration

- [ ] Slack webhook integration
- [ ] PagerDuty (optional)
- [ ] Test alert firing

---

## Phase 5: Backup & Disaster Recovery (Optional - 2 hours)

### 5.1 Layer 3: Ollama Local Inference

**Infrastructure:** AWS g4dn.xlarge spot instance or local GPU

- [ ] Deploy Ollama container
- [ ] Load models: Llama 3 8B, Mistral 7B
- [ ] Configure as Layer 3 fallback
- [ ] Test offline capability

### 5.2 Layer 4: Cache Layer

- [ ] Configure Redis cache
- [ ] Implement cache-first strategy for Layer 4
- [ ] Test cache hit rate

### 5.3 Layer 5: Queue + Degraded Service

- [ ] Setup request queue
- [ ] Implement degraded mode responses
- [ ] Test queue processing

### 5.4 Disaster Recovery Testing

- [ ] Test ngrok outage scenario
- [ ] Test direct API failover
- [ ] Test Ollama offline mode
- [ ] Document recovery procedures

---

## Success Metrics

### Cost Analysis

- **Baseline:** $770/month
- **Target:** $300-450/month
- **Expected Savings:** 42-61% reduction

### Performance

- **Uptime:** 99.95% target (vs 99.5% baseline)
- **Latency:** <500ms p95 (via ngrok routing)
- **Throughput:** 3x improvement via API rotation

### Traffic Split (Target)

- Gemini FREE: 50% (rate limit aware)
- Claude: 30% (premium quality)
- DeepSeek: 20% (cost optimization)

---

## Current Status

**Phase:** 3 - Integration with Workers  
**Step:** Documentation complete, ready for code changes  
**Next Action:** Apply patches to agents-orchestrator, pumo-rag, image-gen workers  
**Blockers:** Need GEMINI_API_KEY and NGROK_API_KEY (will add later)  
**Notes:** All deployment scripts and test suite created

---

## Timeline

- **Phase 1 (Ngrok Config):** 15 min - ⏸️ PAUSED (waiting for API keys)
- **Phase 2 (Worker Deploy):** 20 min - ✅ READY (code + scripts created)
- **Phase 3 (Integration):** 30 min - ✅ READY (patches prepared)
- **Phase 4 (Monitoring):** 30 min - NOT STARTED
- **Phase 5 (DR/Backup):** 2 hours - OPTIONAL

**Total Core Deployment:** ~1.5 hours  
**Total with DR:** ~3.5 hours
