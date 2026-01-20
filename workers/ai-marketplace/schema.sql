-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT NOT NULL,
  selected_models JSON NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('budget', 'standard', 'premium', 'enterprise')),
  estimated_cost REAL NOT NULL,
  actual_cost REAL,
  tokens_used INTEGER,
  execution_time INTEGER,
  quality_score REAL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Task templates
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  task_type TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  avg_tokens INTEGER,
  tiers_config JSON NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model pricing reference
CREATE TABLE IF NOT EXISTS model_pricing (
  id TEXT PRIMARY KEY,
  model_name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  cost_per_1k_tokens REAL NOT NULL,
  avg_speed_ms INTEGER,
  specialties JSON,
  active BOOLEAN DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  api_key TEXT UNIQUE,
  monthly_budget REAL DEFAULT 100.0,
  spent_this_month REAL DEFAULT 0.0,
  budget_reset_date DATE,
  subscription_tier TEXT DEFAULT 'free' CHECK(subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- API Keys for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cost tracking per user
CREATE TABLE IF NOT EXISTS cost_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id TEXT,
  model_name TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost REAL NOT NULL,
  transaction_type TEXT DEFAULT 'execution' CHECK(transaction_type IN ('execution', 'adjustment', 'refund')),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Task execution logs (for debugging)
CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  step INTEGER,
  status TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Quality ratings (user feedback)
CREATE TABLE IF NOT EXISTS quality_ratings (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_rating INTEGER CHECK(user_rating BETWEEN 1 AND 5),
  comment TEXT,
  model_performance JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_cost_transactions_user_id ON cost_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_transactions_created_at ON cost_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
