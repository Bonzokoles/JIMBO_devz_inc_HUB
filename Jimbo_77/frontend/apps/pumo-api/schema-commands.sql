CREATE TABLE IF NOT EXISTS commands (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    action TEXT,
    target TEXT,
    params TEXT, -- JSON
    status TEXT DEFAULT 'queued', -- queued, running, succeeded, failed
    result TEXT, -- JSON output
    reason TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_project ON commands(project_id);
