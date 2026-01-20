/**
 * ZENO Browser Bridge - Cloudflare Worker
 * Proxy dla 6 MCP tools ZENO Browser
 *
 * Tools:
 * 1. web_navigation - kontrola przeglądarki
 * 2. content_analysis - analiza HTML
 * 3. web_search - Tavily/Brave search
 * 4. bookmark_manager - zarządzanie zakładkami
 * 5. page_summarizer - AI summary
 * 6. link_extractor - ekstrakcja linków
 */

interface Env {
  ZENO_BROWSER_URL: string;
  ZENO_API_URL: string;
}

interface ZenoToolRequest {
  tool:
    | "web_navigation"
    | "content_analysis"
    | "web_search"
    | "bookmark_manager"
    | "page_summarizer"
    | "link_extractor";
  action?: string;
  params: {
    url?: string;
    query?: string;
    html?: string;
    title?: string;
    category?: string;
    content?: string;
  };
}

interface ZenoToolResponse {
  success: boolean;
  tool: string;
  action?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/health" || path === "/") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "ZENO Browser Bridge",
            version: "1.0.0",
            tools: [
              "web_navigation",
              "content_analysis",
              "web_search",
              "bookmark_manager",
              "page_summarizer",
              "link_extractor",
            ],
            zeno_browser_url: env.ZENO_BROWSER_URL,
            zeno_api_url: env.ZENO_API_URL,
            timestamp: new Date().toISOString(),
          }),
          { headers: corsHeaders },
        );
      }

      // Execute tool
      if (path === "/execute" && request.method === "POST") {
        const body = (await request.json()) as ZenoToolRequest;

        if (!body.tool) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Missing required field: tool",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        const result = await executeZenoTool(body, env);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // List available tools
      if (path === "/tools" && request.method === "GET") {
        return new Response(
          JSON.stringify({
            success: true,
            tools: [
              {
                id: "web_navigation",
                name: "Web Navigation",
                description:
                  "Navigate to URLs, open tabs, manage browser state",
                actions: ["navigate", "open_tab", "close_tab", "refresh"],
                params: ["url"],
              },
              {
                id: "content_analysis",
                name: "Content Analysis",
                description:
                  "Analyze webpage HTML, extract metadata, check SEO",
                actions: ["analyze_html", "extract_metadata", "check_seo"],
                params: ["url", "html"],
              },
              {
                id: "web_search",
                name: "Web Search",
                description: "Search the web using Tavily or Brave API",
                actions: ["search", "deep_search"],
                params: ["query"],
              },
              {
                id: "bookmark_manager",
                name: "Bookmark Manager",
                description: "Add, remove, organize browser bookmarks",
                actions: ["add", "remove", "list", "search"],
                params: ["url", "title", "category"],
              },
              {
                id: "page_summarizer",
                name: "Page Summarizer",
                description: "Generate AI summaries of web pages",
                actions: ["summarize", "extract_key_points"],
                params: ["url", "content"],
              },
              {
                id: "link_extractor",
                name: "Link Extractor",
                description: "Extract and categorize all links from a page",
                actions: ["extract_all", "filter_by_type"],
                params: ["url", "html"],
              },
            ],
          }),
          { headers: corsHeaders },
        );
      }

      return new Response(
        JSON.stringify({
          error: "Not found",
          available_endpoints: ["/health", "/execute", "/tools"],
        }),
        { status: 404, headers: corsHeaders },
      );
    } catch (error) {
      console.error("ZENO Bridge error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: corsHeaders },
      );
    }
  },
};

/**
 * Execute ZENO Browser tool
 */
async function executeZenoTool(
  request: ZenoToolRequest,
  env: Env,
): Promise<ZenoToolResponse> {
  const { tool, action, params } = request;

  try {
    switch (tool) {
      case "web_navigation":
        return await executeWebNavigation(action || "navigate", params, env);

      case "content_analysis":
        return await executeContentAnalysis(
          action || "analyze_html",
          params,
          env,
        );

      case "web_search":
        return await executeWebSearch(action || "search", params, env);

      case "bookmark_manager":
        return await executeBookmarkManager(action || "list", params, env);

      case "page_summarizer":
        return await executePageSummarizer(action || "summarize", params, env);

      case "link_extractor":
        return await executeLinkExtractor(action || "extract_all", params, env);

      default:
        return {
          success: false,
          tool,
          error: `Unknown tool: ${tool}`,
          timestamp: new Date().toISOString(),
        };
    }
  } catch (error) {
    return {
      success: false,
      tool,
      action,
      error: error instanceof Error ? error.message : "Tool execution failed",
      timestamp: new Date().toISOString(),
    };
  }
}

async function executeWebNavigation(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  const { url } = params;

  if (!url) {
    throw new Error("Missing required parameter: url");
  }

  return {
    success: true,
    tool: "web_navigation",
    action,
    data: {
      message: `Navigated to ${url}`,
      url,
      browser_url: `${env.ZENO_BROWSER_URL}?url=${encodeURIComponent(url)}`,
    },
    timestamp: new Date().toISOString(),
  };
}

async function executeContentAnalysis(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  const { url, html } = params;

  // W produkcji: wywołaj ZENO API dla analizy
  // Na razie mock response

  return {
    success: true,
    tool: "content_analysis",
    action,
    data: {
      url,
      analysis: "Content analysis would be performed here",
      metadata: {
        title: "Example Page",
        description: "Example description",
        keywords: ["example", "test"],
      },
    },
    timestamp: new Date().toISOString(),
  };
}

async function executeWebSearch(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  const { query } = params;

  if (!query) {
    throw new Error("Missing required parameter: query");
  }

  // W produkcji: wywołaj Tavily/Brave API przez ZENO

  return {
    success: true,
    tool: "web_search",
    action,
    data: {
      query,
      results: [],
      message: "Search would be performed via Tavily/Brave API",
    },
    timestamp: new Date().toISOString(),
  };
}

async function executeBookmarkManager(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  return {
    success: true,
    tool: "bookmark_manager",
    action,
    data: {
      bookmarks: [],
      message: "Bookmark management would be performed here",
    },
    timestamp: new Date().toISOString(),
  };
}

async function executePageSummarizer(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  const { url, content } = params;

  return {
    success: true,
    tool: "page_summarizer",
    action,
    data: {
      url,
      summary: "AI-generated summary would appear here",
      key_points: [],
    },
    timestamp: new Date().toISOString(),
  };
}

async function executeLinkExtractor(
  action: string,
  params: any,
  env: Env,
): Promise<ZenoToolResponse> {
  const { url, html } = params;

  return {
    success: true,
    tool: "link_extractor",
    action,
    data: {
      url,
      links: [],
      message: "Links would be extracted from HTML",
    },
    timestamp: new Date().toISOString(),
  };
}
