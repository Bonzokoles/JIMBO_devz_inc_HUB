# Task: Create Workspace Navigator Agent with MCP Server

## Context

Working in multi-repo workspace at `U:/The_yellow_hub` with 7 Git submodules, 15+ Docker services, and duplicated agents causing issues.

## Goals

1. Clean up unhealthy PraisonAI duplicates
2. Create Workspace Navigator MCP Server for VS Code
3. Create Python Agent for Docker
4. Integrate everything

## Step 1: Cleanup Unhealthy Agents

Execute:

```powershell
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\bonzo-praisonai
docker-compose down
docker rm -f bonzo-praisonai-dashboard bonzo-guardian-ai bonzo-cost-optimizer-ai bonzo-health-monitor-ai bonzo-praisonai-redis 2>$null
```

## Step 2: Create MCP Server Structure

Create directory: `U:/The_yellow_hub/mcp-servers/workspace-navigator/`

Create these files:

### `package.json`

```json
{
  "name": "@bonzo/workspace-navigator-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "better-sqlite3": "^9.2.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### `src/index.ts`

Create MCP server with 4 tools:

- `workspace_find` - search for resources (files, configs, services)
- `workspace_map` - map project structure and dependencies
- `workspace_status` - Docker/service status monitoring
- `workspace_log` - log processes and changes

Use SQLite database at `./data/navigator.db` with schema:

```sql
-- Projects tracking
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    path TEXT,
    type TEXT,
    parent_id INTEGER,
    metadata JSON
);

-- Services registry
CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name TEXT,
    type TEXT,
    port INTEGER,
    url TEXT,
    config_path TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Process log
CREATE TABLE process_log (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT,
    resource_type TEXT,
    resource_name TEXT,
    details TEXT,
    files_affected JSON
);

-- Resource index (FTS5)
CREATE VIRTUAL TABLE resource_search USING fts5(
    resource_type,
    name,
    path,
    description,
    tags,
    content
);

-- Port registry
CREATE TABLE port_registry (
    port INTEGER PRIMARY KEY,
    service_id INTEGER,
    protocol TEXT DEFAULT 'http',
    description TEXT,
    FOREIGN KEY (service_id) REFERENCES services(id)
);
```

### `src/database.ts`

```typescript
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class NavigatorDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || join(__dirname, "../data/navigator.db");
    this.db = new Database(path);
    this.initSchema();
  }

  private initSchema() {
    // Create tables as defined above
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        path TEXT,
        type TEXT,
        parent_id INTEGER,
        metadata JSON
      );

      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        project_id INTEGER,
        name TEXT,
        type TEXT,
        port INTEGER,
        url TEXT,
        config_path TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS process_log (
        id INTEGER PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        action TEXT,
        resource_type TEXT,
        resource_name TEXT,
        details TEXT,
        files_affected JSON
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS resource_search USING fts5(
        resource_type,
        name,
        path,
        description,
        tags,
        content
      );

      CREATE TABLE IF NOT EXISTS port_registry (
        port INTEGER PRIMARY KEY,
        service_id INTEGER,
        protocol TEXT DEFAULT 'http',
        description TEXT,
        FOREIGN KEY (service_id) REFERENCES services(id)
      );
    `);
  }

  search(query: string) {
    return this.db
      .prepare(
        `
      SELECT * FROM resource_search 
      WHERE resource_search MATCH ? 
      ORDER BY rank 
      LIMIT 20
    `,
      )
      .all(query);
  }

  getServices() {
    return this.db
      .prepare(
        `
      SELECT s.*, p.name as project_name 
      FROM services s 
      LEFT JOIN projects p ON s.project_id = p.id
    `,
      )
      .all();
  }

  logProcess(
    action: string,
    resourceType: string,
    resourceName: string,
    details: string,
    files: string[],
  ) {
    return this.db
      .prepare(
        `
      INSERT INTO process_log (action, resource_type, resource_name, details, files_affected)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(action, resourceType, resourceName, details, JSON.stringify(files));
  }

  close() {
    this.db.close();
  }
}
```

### `src/tools/find.ts`

```typescript
import { NavigatorDatabase } from "../database.js";

export function findResource(query: string, db: NavigatorDatabase) {
  const results = db.search(query);

  return {
    matches: results.map((r: any) => ({
      type: r.resource_type,
      name: r.name,
      path: r.path,
      description: r.description,
      relevance: r.rank,
    })),
  };
}
```

### `src/tools/status.ts`

```typescript
import { execSync } from "child_process";

export function getWorkspaceStatus() {
  try {
    const dockerOutput = execSync(
      'docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}"',
      {
        encoding: "utf-8",
      },
    );

    const containers = dockerOutput
      .trim()
      .split("\n")
      .map((line) => {
        const [name, status, ports] = line.split("|");
        return {
          name,
          status: status.includes("(healthy)")
            ? "healthy"
            : status.includes("(unhealthy)")
              ? "unhealthy"
              : "running",
          ports: ports || "none",
          uptime: status.match(/Up (.+?)(?:\(|$)/)?.[1] || "unknown",
        };
      });

    return {
      docker: {
        total: containers.length,
        healthy: containers.filter((c) => c.status === "healthy").length,
        unhealthy: containers.filter((c) => c.status === "unhealthy").length,
        running: containers.filter((c) => c.status === "running").length,
      },
      containers,
    };
  } catch (error) {
    return { error: "Failed to get Docker status" };
  }
}
```

### Main `src/index.ts`

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NavigatorDatabase } from "./database.js";
import { findResource } from "./tools/find.js";
import { getWorkspaceStatus } from "./tools/status.js";

const db = new NavigatorDatabase();
const server = new Server(
  {
    name: "workspace-navigator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "workspace_find",
      description:
        "Search for resources in workspace (files, configs, services)",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
    {
      name: "workspace_status",
      description: "Get status of all Docker services and agents",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "workspace_log",
      description: "Log a process or change to workspace",
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string" },
          resource_type: { type: "string" },
          resource_name: { type: "string" },
          details: { type: "string" },
          files: { type: "array", items: { type: "string" } },
        },
        required: ["action", "resource_type", "resource_name", "details"],
      },
    },
  ],
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "workspace_find":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(findResource(args.query, db), null, 2),
          },
        ],
      };

    case "workspace_status":
      return {
        content: [
          { type: "text", text: JSON.stringify(getWorkspaceStatus(), null, 2) },
        ],
      };

    case "workspace_log":
      db.logProcess(
        args.action,
        args.resource_type,
        args.resource_name,
        args.details,
        args.files || [],
      );
      return {
        content: [{ type: "text", text: "Process logged successfully" }],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);

console.error("Workspace Navigator MCP Server started");
```

## Step 3: Install & Build MCP Server

```powershell
cd U:\The_yellow_hub\mcp-servers\workspace-navigator
mkdir data -Force
npm install
npm run build
```

## Step 4: Update VS Code Settings

Add to `U:/The_yellow_hub/.vscode/settings.json` in `github.copilot.chat.mcp.servers` section:

```json
"workspace-navigator": {
  "command": "node",
  "args": ["./mcp-servers/workspace-navigator/dist/index.js"],
  "env": {
    "WORKSPACE_ROOT": "U:/The_yellow_hub"
  }
}
```

## Step 5: Create Python Agent

Create `U:/The_yellow_hub/workspace-navigator-agent/`

### `navigator_agent.py`

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
import sqlite3
import os
import glob
from pathlib import Path

WORKSPACE_ROOT = os.getenv('WORKSPACE_ROOT', 'U:/The_yellow_hub')
DB_PATH = '/app/data/navigator.db'

app = FastAPI(title="Workspace Navigator Agent")

def index_workspace():
    """Index all workspace files"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔍 Indexing workspace...")

    # Index projects (submodules)
    projects = [
        'JIMBO_devz_inc_HUB', 'agents', 'api', 'dashboard',
        'luc-de-zen-on', 'my-bonzo-ai-blog', 'zen-bro-wser.org', 'shared'
    ]

    for idx, project in enumerate(projects, 1):
        cursor.execute("""
            INSERT OR IGNORE INTO projects (id, name, path, type)
            VALUES (?, ?, ?, ?)
        """, (idx, project, f'/{project}', 'submodule'))

    # Index files for FTS5 search
    file_count = 0
    for pattern in ['**/*.md', '**/*.env*', '**/*.yml', '**/*.toml', '**/*.json']:
        for file_path in Path(WORKSPACE_ROOT).glob(pattern):
            if 'node_modules' in str(file_path) or '.git' in str(file_path):
                continue

            rel_path = file_path.relative_to(WORKSPACE_ROOT)
            cursor.execute("""
                INSERT INTO resource_search (resource_type, name, path, description)
                VALUES (?, ?, ?, ?)
            """, ('file', file_path.name, str(rel_path), f'File: {rel_path}'))
            file_count += 1

    conn.commit()
    conn.close()
    print(f"✅ Indexed {file_count} files")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if os.path.exists(DB_PATH):
        index_workspace()
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "workspace-navigator"}

@app.get("/api/search")
def search(q: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    results = cursor.execute(
        "SELECT * FROM resource_search WHERE resource_search MATCH ? LIMIT 20",
        (q,)
    ).fetchall()
    conn.close()
    return {"query": q, "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6200)
```

### `requirements.txt`

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
```

### `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY navigator_agent.py .

EXPOSE 6200

CMD ["python", "navigator_agent.py"]
```

### `docker-compose.yml`

```yaml
services:
  workspace-navigator:
    build: .
    container_name: bonzo-workspace-navigator
    ports:
      - "6200:6200"
    environment:
      - WORKSPACE_ROOT=/workspace
    volumes:
      - U:/The_yellow_hub:/workspace:ro
      - ../mcp-servers/workspace-navigator/data:/app/data
    networks:
      - bonzo-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6200/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  bonzo-network:
    external: true
```

## Step 6: Add to Main Docker Compose

Append to `U:/The_yellow_hub/config/docker-compose.yml`:

```yaml
workspace-navigator:
  build: ../workspace-navigator-agent
  container_name: bonzo-workspace-navigator
  ports:
    - "6200:6200"
  environment:
    - WORKSPACE_ROOT=/workspace
  volumes:
    - U:/The_yellow_hub:/workspace:ro
    - ../mcp-servers/workspace-navigator/data:/app/data
  networks:
    - bonzo-net
  restart: unless-stopped
```

## Step 7: Deploy

```powershell
# Build and start
cd U:\The_yellow_hub\workspace-navigator-agent
docker-compose build
docker-compose up -d

# Verify
docker ps | grep navigator
curl http://localhost:6200/health
```

## Validation

After completion:

1. **MCP Server**: Open VS Code, reload window (Ctrl+Shift+P → "Reload Window")
   - Test in Copilot Chat: `@workspace-navigator where is cloudflare config?`

2. **Docker Agent**:

   ```powershell
   docker ps | grep bonzo-workspace-navigator
   # Should show: Up (healthy)
   ```

3. **API Test**:

   ```powershell
   curl http://localhost:6200/api/search?q=cloudflare
   ```

4. **Database Check**:
   ```powershell
   cd U:\The_yellow_hub\mcp-servers\workspace-navigator\data
   sqlite3 navigator.db "SELECT COUNT(*) FROM resource_search;"
   # Should return 1000+ indexed files
   ```

## Expected Output

- ✅ MCP Server working in VS Code Copilot Chat
- ✅ Docker agent running on port 6200 (healthy)
- ✅ Database with 1000+ indexed files
- ✅ Clean agent setup (4 unhealthy PraisonAI agents removed)
- ✅ All config/ agents remain healthy

## Post-Deployment

The Workspace Navigator will:

- Answer questions about workspace structure
- Find configs, services, ports instantly
- Track all changes and processes
- Monitor Docker service health
- Provide navigation shortcuts

Use it in VS Code:

- `@workspace-navigator where is the R2 config?`
- `@workspace-navigator what ports are in use?`
- `@workspace-navigator show all docker services`
- `@workspace-navigator log: cleaned up R2 buckets`

---

**Execute all steps in order. Report status after each major phase.**
