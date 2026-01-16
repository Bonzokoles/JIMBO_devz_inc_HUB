-- MoE-RAG Database Schema for Cloudflare D1
-- Created: 2026-01-16

-- ============================================================================
-- QUERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS moe_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  routing_path TEXT CHECK(routing_path IN ('FAST_PATH', 'EXPERT_PATH', 'HYBRID_PATH')),
  latency_ms INTEGER,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queries_created ON moe_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_user ON moe_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_routing ON moe_queries(routing_path);

-- ============================================================================
-- RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS moe_responses (
  id TEXT PRIMARY KEY,
  query_id TEXT NOT NULL REFERENCES moe_queries(id) ON DELETE CASCADE,
  response TEXT,
  confidence REAL,
  agents_used TEXT, -- JSON array of agent names
  retrieved_docs TEXT, -- JSON array of doc IDs
  model_name TEXT,
  cost_usd REAL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responses_query ON moe_responses(query_id);
CREATE INDEX IF NOT EXISTS idx_responses_created ON moe_responses(created_at DESC);

-- ============================================================================
-- METRICS TABLE (Daily Aggregates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS moe_metrics (
  id TEXT PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_queries INTEGER DEFAULT 0,
  avg_latency_ms REAL,
  total_cost_usd REAL DEFAULT 0,
  fast_path_count INTEGER DEFAULT 0,
  expert_path_count INTEGER DEFAULT 0,
  hybrid_path_count INTEGER DEFAULT 0,
  avg_confidence REAL,
  error_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON moe_metrics(date DESC);

-- ============================================================================
-- CACHE TABLE (Query → Response cache)
-- ============================================================================
CREATE TABLE IF NOT EXISTS moe_cache (
  query_hash TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT,
  confidence REAL,
  ttl_seconds INTEGER DEFAULT 300,
  hit_count INTEGER DEFAULT 0,
  last_hit_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON moe_cache(expires_at);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Przykładowa metryka dla dzisiejszego dnia
INSERT OR IGNORE INTO moe_metrics (id, date)
VALUES ('init-' || DATE('now'), DATE('now'));
