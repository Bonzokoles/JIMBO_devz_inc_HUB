-- Ngrok Proxy Analytics Schema
-- Execute with: wrangler d1 execute ngrok-analytics --file=./schema.sql

-- Main requests table
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  latency_ms INTEGER,
  cost_usd REAL,
  status INTEGER,
  error TEXT,
  ip TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_endpoint ON requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_provider ON requests(provider);
CREATE INDEX IF NOT EXISTS idx_status ON requests(status);

-- Provider statistics view (hourly aggregation)
CREATE VIEW IF NOT EXISTS provider_stats_hourly AS
SELECT 
  strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
  provider,
  endpoint,
  COUNT(*) as request_count,
  AVG(latency_ms) as avg_latency_ms,
  SUM(tokens_input) as total_input_tokens,
  SUM(tokens_output) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd,
  SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as error_count
FROM requests
GROUP BY hour, provider, endpoint;

-- Cost analysis view (daily totals)
CREATE VIEW IF NOT EXISTS cost_analysis_daily AS
SELECT 
  DATE(timestamp) as date,
  provider,
  SUM(cost_usd) as total_cost,
  COUNT(*) as request_count,
  SUM(tokens_input) as total_input_tokens,
  SUM(tokens_output) as total_output_tokens
FROM requests
GROUP BY date, provider
ORDER BY date DESC, total_cost DESC;

-- Error analysis view
CREATE VIEW IF NOT EXISTS error_analysis AS
SELECT 
  DATE(timestamp) as date,
  provider,
  endpoint,
  status,
  error,
  COUNT(*) as error_count
FROM requests
WHERE status >= 400
GROUP BY date, provider, endpoint, status, error
ORDER BY date DESC, error_count DESC;

-- Sample queries:
-- 1. Last 24h provider distribution:
--    SELECT provider, COUNT(*) as requests FROM requests 
--    WHERE timestamp > datetime('now', '-24 hours') 
--    GROUP BY provider;
--
-- 2. Cost by provider (last 7 days):
--    SELECT * FROM cost_analysis_daily 
--    WHERE date >= date('now', '-7 days');
--
-- 3. Average latency by endpoint:
--    SELECT endpoint, AVG(latency_ms) as avg_latency 
--    FROM requests 
--    GROUP BY endpoint;
