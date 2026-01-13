-- Analytics & Tracking Schema for Pumo WhiteCat
-- Created: 9 stycznia 2026

-- Analytics events tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'click', 'view', 'purchase', 'search'
  category TEXT,            -- Product category  
  product_id TEXT,          -- Product ID
  product_name TEXT,        -- Product name
  utm_source TEXT,          -- mybonzo, direct, google
  utm_medium TEXT,          -- ai_guide, rag_search, email
  utm_campaign TEXT,        -- buying_guide_lozka, search_results
  session_id TEXT,          -- User session
  user_agent TEXT,          -- Browser info
  ip_address TEXT,          -- Client IP
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,            -- JSON with extra data
  revenue DECIMAL(10,2) DEFAULT 0, -- Revenue from this event
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_source ON analytics_events(utm_source, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_events(category, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics_events(product_id);

-- Daily KPI aggregates (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS daily_kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,        -- YYYY-MM-DD
  total_clicks INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  ai_clicks INTEGER DEFAULT 0,     -- Clicks from AI sources
  ai_revenue DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  ai_conversion_rate DECIMAL(5,2) DEFAULT 0,
  top_category TEXT,
  top_product TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_kpis_date ON daily_kpis(date DESC);

-- Product performance tracking
CREATE TABLE IF NOT EXISTS product_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  category TEXT,
  total_clicks INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  last_click_at TEXT,
  ctr DECIMAL(5,2) DEFAULT 0,      -- Click-through rate
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_position DECIMAL(5,2) DEFAULT 0, -- Average position in results
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_stats_category ON product_stats(category);
CREATE INDEX IF NOT EXISTS idx_product_stats_ctr ON product_stats(ctr DESC);

-- Reports storage
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,              -- UUID
  type TEXT NOT NULL,               -- 'daily', 'weekly', 'monthly'
  period_start TEXT NOT NULL,       -- ISO timestamp
  period_end TEXT NOT NULL,         -- ISO timestamp
  summary TEXT NOT NULL,            -- JSON summary data
  details TEXT,                     -- Detailed JSON data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_type_date ON reports(type, period_end DESC);

-- Order tracking (for revenue attribution)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,              -- Order ID from Pumo
  customer_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,             -- 'pending', 'completed', 'cancelled'
  utm_source TEXT,
  utm_medium TEXT, 
  utm_campaign TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Order items for detailed tracking
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Add missing columns to existing products table if needed
-- Note: These might already exist, hence using IF NOT EXISTS equivalent

-- Check if utm_source column exists in products table, add if missing
-- This will be handled by sync service if needed