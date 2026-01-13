CREATE TABLE IF NOT EXISTS bot_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_agent TEXT NOT NULL,
    ip_address TEXT,
    path TEXT NOT NULL,
    method TEXT,
    headers JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_known_bot BOOLEAN DEFAULT 0,
    bot_type TEXT -- 'gpt', 'claude', 'google', 'bing', 'other'
);

CREATE INDEX IF NOT EXISTS idx_bot_logs_timestamp ON bot_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_type ON bot_logs(bot_type);
