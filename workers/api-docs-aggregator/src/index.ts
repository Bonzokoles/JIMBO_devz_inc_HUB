export interface Env {
  API_ENDPOINTS?: string[];
}

// Default API endpoints
const DEFAULT_APIS = [
  {
    name: "PUMO RAG API",
    url: "https://pumo-api.jimbo77.com",
    description: "Furniture search with hybrid RAG (vector + keyword)",
    version: "1.0.0",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/search",
        description: "Search furniture catalog using natural language",
        request: {
          query: "string - Search query in Polish",
          limit: "number - Max results (default: 10)",
          includeMetadata: "boolean - Include product metadata",
        },
        response: {
          results: "array - Matched products",
          metadata: "object - Search metadata",
        },
        example: {
          request: {
            query: "nowoczesne krzesła do jadalni",
            limit: 5,
            includeMetadata: true,
          },
          response: {
            results: [
              {
                id: "prod_123",
                name: "Krzesło NORDIC",
                price: 299.99,
                score: 0.92,
              },
            ],
          },
        },
      },
      {
        method: "GET",
        path: "/api/v1/health",
        description: "Service health check",
        response: {
          status: "ok | error",
          timestamp: "ISO 8601 timestamp",
        },
      },
    ],
  },
  {
    name: "Agents Orchestrator API",
    url: "https://orchestrator.jimbo77.com",
    description: "Multi-agent task orchestration with 18 specialized AI agents",
    version: "1.0.0",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/tasks",
        description: "Create new task for agent orchestration",
        request: {
          task: "string - Task description",
          priority: "1 | 2 | 3 - Task priority",
          agents: "array - Required agent IDs",
        },
        response: {
          taskId: "string - Task UUID",
          status: "pending | running | completed",
          assignedAgents: "array - Agent assignments",
        },
      },
      {
        method: "GET",
        path: "/api/v1/tasks/:id",
        description: "Get task status and results",
        response: {
          taskId: "string",
          status: "string",
          results: "object - Task results",
          executionTime: "number - Milliseconds",
        },
      },
      {
        method: "GET",
        path: "/api/v1/agents",
        description: "List all available agents",
        response: {
          agents: "array - Agent details",
          count: "number",
        },
      },
    ],
  },
  {
    name: "MCP Workspace Navigator",
    url: "https://jimbo77.org/mcp/workspace-navigator",
    description: "VS Code MCP server for multi-repo workspace navigation",
    version: "1.0.0",
    endpoints: [
      {
        method: "mcp/tools",
        path: "list_workspace_files",
        description: "List all files in workspace",
        returns: "array - File paths",
      },
      {
        method: "mcp/tools",
        path: "search_workspace",
        description: "Semantic search across workspace",
        params: {
          query: "string - Search query",
        },
        returns: "array - Matching files with scores",
      },
    ],
  },
];

function generateHTML(apis: typeof DEFAULT_APIS): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - JIMBO77 DEVZ INC</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Monaco', 'Courier New', monospace;
      background: #0a0a0a;
      color: #e0e0e0;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #fbbf24;
      font-size: 2.5rem;
      margin-bottom: 10px;
      border-bottom: 3px solid #fbbf24;
      padding-bottom: 10px;
    }
    .subtitle {
      color: #9ca3af;
      margin-bottom: 40px;
    }
    .api-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .api-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #fbbf24;
    }
    .api-name {
      color: #fbbf24;
      font-size: 1.8rem;
      font-weight: bold;
    }
    .api-version {
      background: #374151;
      color: #fbbf24;
      padding: 5px 15px;
      border-radius: 5px;
      font-size: 0.9rem;
    }
    .api-description {
      color: #9ca3af;
      margin-bottom: 20px;
      font-size: 1.1rem;
    }
    .endpoint {
      background: #111;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .endpoint-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .method {
      background: #10b981;
      color: #000;
      padding: 5px 12px;
      border-radius: 4px;
      font-weight: bold;
      margin-right: 15px;
      font-size: 0.9rem;
    }
    .method.GET { background: #3b82f6; }
    .method.POST { background: #10b981; }
    .method.PUT { background: #f59e0b; }
    .method.DELETE { background: #ef4444; }
    .path {
      color: #fbbf24;
      font-size: 1.2rem;
      font-family: monospace;
    }
    .endpoint-desc {
      color: #d1d5db;
      margin-bottom: 15px;
    }
    .params, .response, .example {
      margin-top: 15px;
    }
    .section-title {
      color: #60a5fa;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 1.1rem;
    }
    pre {
      background: #000;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      color: #10b981;
    }
    code {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.95rem;
    }
    .param-list {
      background: #0a0a0a;
      border-radius: 4px;
      padding: 15px;
    }
    .param-item {
      padding: 8px 0;
      border-bottom: 1px solid #222;
    }
    .param-item:last-child {
      border-bottom: none;
    }
    .param-name {
      color: #fbbf24;
      font-weight: bold;
    }
    .param-type {
      color: #60a5fa;
      font-style: italic;
    }
    a {
      color: #fbbf24;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 JIMBO77 API Documentation</h1>
    <p class="subtitle">Complete API reference for all JIMBO77 DEVZ INC services</p>

    ${apis
      .map(
        (api) => `
    <div class="api-section">
      <div class="api-header">
        <div class="api-name">${api.name}</div>
        <div class="api-version">v${api.version}</div>
      </div>
      <div class="api-description">${api.description}</div>
      <div style="color: #9ca3af; margin-bottom: 20px;">
        <strong>Base URL:</strong> <a href="${api.url}" target="_blank">${api.url}</a>
      </div>

      ${api.endpoints
        .map(
          (endpoint) => `
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method ${endpoint.method}">${endpoint.method}</span>
          <span class="path">${endpoint.path}</span>
        </div>
        <div class="endpoint-desc">${endpoint.description}</div>

        ${
          endpoint.request
            ? `
        <div class="params">
          <div class="section-title">📥 Request Parameters</div>
          <div class="param-list">
            ${Object.entries(endpoint.request)
              .map(
                ([key, value]) => `
            <div class="param-item">
              <span class="param-name">${key}</span>: <span class="param-type">${value}</span>
            </div>`,
              )
              .join("")}
          </div>
        </div>`
            : ""
        }

        ${
          endpoint.response
            ? `
        <div class="response">
          <div class="section-title">📤 Response</div>
          <div class="param-list">
            ${Object.entries(endpoint.response)
              .map(
                ([key, value]) => `
            <div class="param-item">
              <span class="param-name">${key}</span>: <span class="param-type">${value}</span>
            </div>`,
              )
              .join("")}
          </div>
        </div>`
            : ""
        }

        ${
          endpoint.example
            ? `
        <div class="example">
          <div class="section-title">💡 Example</div>
          <pre><code>${JSON.stringify(endpoint.example, null, 2)}</code></pre>
        </div>`
            : ""
        }
      </div>`,
        )
        .join("")}
    </div>`,
      )
      .join("")}

    <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #333; color: #6b7280; text-align: center;">
      <p>📚 For more information, visit <a href="https://jimbo77.org">jimbo77.org</a></p>
      <p style="margin-top: 10px;">Last updated: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Main API docs page
    if (url.pathname === "/docs/api" || url.pathname === "/docs/api/") {
      const html = generateHTML(DEFAULT_APIS);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Individual API docs (future enhancement)
    if (url.pathname.startsWith("/docs/api/")) {
      const apiName = url.pathname.split("/")[3];
      const api = DEFAULT_APIS.find((a) =>
        a.name.toLowerCase().includes(apiName),
      );

      if (api) {
        const html = generateHTML([api]);
        return new Response(html, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
