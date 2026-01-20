# Supabase Integration - JIMBO77 Workspace

## Project Details

- **Project ID**: bpkbvaxxmsfgoxavajgn
- **URL**: https://bpkbvaxxmsfgoxavajgn.supabase.co
- **Status**: Active ✅
- **Region**: Auto
- **Created**: 19 stycznia 2026

---

## Database Schema

### `jimbo77` Table (Main Projects Registry)

**Purpose**: Central registry of all JIMBO77 projects and activities

**Columns:**

- `id` - BIGINT PRIMARY KEY
- `created_at` - TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `title` - TEXT (project name)
- `description` - TEXT (project description)
- `project_type` - TEXT (website | worker | dashboard | mcp-tool | infrastructure)
- `status` - TEXT DEFAULT 'active' (active | paused | archived)
- `metadata` - JSONB (flexible metadata: URLs, tech stack, features)
- `last_activity` - TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes:**

- `idx_jimbo77_project_type` on `project_type`
- `idx_jimbo77_status` on `status`

**Current Stats:**

- Total projects: **10**
- Active projects: **10** ✅
- Project types: **5** (website, worker, dashboard, mcp-tool, infrastructure)

**Projects by Type:**

- **Websites**: 3 (AI Magnet, MyBonzo Blog, Zen Browser)
- **Workers**: 2 (PUMO RAG, Agents Orchestrator)
- **Infrastructure**: 2 (Supabase, Docker)
- **MCP Tools**: 2 (Workspace Navigator, RAG Memory)
- **Dashboard**: 1 (Control Hub)

### `workspace_files` Table

Stores registry of all workspace files across projects.

**Columns:**

- `id` - BIGSERIAL PRIMARY KEY
- `file_path` - TEXT (full path to file)
- `file_type` - TEXT (markdown, typescript, python, etc.)
- `project_name` - TEXT (project classification)
- `content_hash` - TEXT (MD5/SHA256 hash)
- `size_bytes` - INTEGER
- `last_modified` - TIMESTAMP WITH TIME ZONE
- `metadata` - JSONB (flexible metadata)
- `created_at` - TIMESTAMP WITH TIME ZONE

**Indexes:**

- `idx_workspace_files_path` on `file_path`
- `idx_workspace_files_project` on `project_name`
- `idx_workspace_files_type` on `file_type`

**Current Stats:**

- Total files: 16
- Total projects: 12
- Total size: ~138 KB

**Projects:**

1. AI Magnet (3 files, 33.78 KB)
2. MCP Tools (2 files, 30.72 KB)
3. Dashboard (2 files, 11.26 KB)
4. PUMO RAG (1 file, 15.36 KB)
5. Agents (1 file, 12.29 KB)
6. MyBonzo Blog (1 file, 8.19 KB)
7. Zen Browser (1 file, 6.14 KB)
8. Control Hub (1 file, 6.14 KB)
9. Magnet App (1 file, 4.10 KB)
10. Shared UI (1 file, 4.10 KB)
11. Infrastructure (1 file, 4.10 KB)
12. Luc De Zenon (1 file, 2.05 KB)

---

## Edge Functions

### 1. `jimbo77-projects` ⭐ NEW

**URL**: https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/jimbo77-projects
**Status**: ACTIVE ✅
**Purpose**: List all JIMBO77 projects with filtering

**Query Params:**

- `?type=website` - Filter by project type
- `?status=active` - Filter by status (default: active)

**Response:**

```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "title": "AI Magnet Strategy",
      "description": "Content hub for AI crawler discovery",
      "project_type": "website",
      "status": "active",
      "metadata": {
        "url": "https://jimbo77.org",
        "phase": "2",
        "features": ["llms.txt", "sitemap", "api-docs"]
      }
    },
    ...
  ],
  "stats": {
    "total": 10,
    "by_type": {
      "website": 3,
      "worker": 2,
      "infrastructure": 2,
      "mcp-tool": 2,
      "dashboard": 1
    }
  }
}
```

**Usage:**

```bash
# All projects
curl https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/jimbo77-projects

# Only websites
curl "https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/jimbo77-projects?type=website"

# Only workers
curl "https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/jimbo77-projects?type=worker"
```

### 2. `workspace-health`

**URL**: https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/workspace-health
**Status**: ACTIVE ✅
**Purpose**: Health check endpoint for workspace monitoring

**Response:**

```json
{
  "success": true,
  "data": {
    "total_files": 16,
    "projects": ["AI Magnet", "PUMO RAG", ...],
    "last_activity": "2026-01-19T...",
    "status": "active"
  },
  "message": "JIMBO77 Workspace is active and healthy"
}
```

**Usage:**

```bash
curl https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/workspace-health
```

### 2. `project-stats`

**URL**: https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/project-stats
**Status**: ACTIVE ✅
**Purpose**: Get statistics grouped by project

**Query Params:**

- `?project=AI%20Magnet` - Filter by specific project

**Response:**

```json
{
  "success": true,
  "projects": {
    "AI Magnet": {
      "count": 3,
      "total_size": 33780,
      "types": {
        "markdown": 1,
        "typescript": 2
      }
    },
    ...
  },
  "total_projects": 12
}
```

**Usage:**

```bash
# All projects
curl https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/project-stats

# Specific project
curl "https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/project-stats?project=PUMO%20RAG"
```

---

## Migrations

### 1. `create_workspace_files_table` (20260119135615)

- Created `workspace_files` table
- Added indexes for performance
- Enabled Row Level Security (RLS)
- Set up permissive policy for development

---

## MCP Integration

**Config Location**: `.vscode/mcp.json`

```json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=bpkbvaxxmsfgoxavajgn"
    }
  }
}
```

**Available Tools:**

- `apply_migration` - Run database migrations
- `execute_sql` - Execute SQL queries
- `create_branch` - Create development branch
- `deploy_edge_function` - Deploy Deno Edge Functions
- `list_edge_functions` - List all Edge Functions
- `list_migrations` - List applied migrations

---

## Maintenance Schedule

To keep the project active:

1. **Weekly**: Add new file entries to `workspace_files`
2. **Monthly**: Deploy updated Edge Function
3. **Quarterly**: Run analytics queries

**Automation:**

```sql
-- Add this week's activity
INSERT INTO workspace_files (file_path, file_type, project_name, size_bytes)
VALUES ('weekly_activity.log', 'log', 'Maintenance', 1024);
```

---

## API Endpoints

All Edge Functions are accessible via:

```
https://bpkbvaxxmsfgoxavajgn.supabase.co/functions/v1/{function-name}
```

**CORS Enabled**: ✅ (All origins allowed for development)

---

## Next Steps

1. ✅ Database table created
2. ✅ Sample data inserted (16 files)
3. ✅ 2 Edge Functions deployed
4. 🔄 Add to jimbo77.org/docs/api/ documentation
5. 🔄 Integrate with Control Hub dashboard
6. 🔄 Setup automated file sync from workspace

---

## Security Notes

⚠️ **Current Setup**: Development mode with permissive RLS policies
🔒 **Production**: Implement proper auth and restrictive policies
🔑 **API Keys**: Stored in MCP config (not committed to git)

---

Last Updated: 19 stycznia 2026
