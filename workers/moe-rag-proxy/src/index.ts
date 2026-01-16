/**
 * MoE-RAG Cloudflare Worker Proxy
 * Routes requests to backend FastAPI server
 * Implements caching for repeated queries
 */

export interface Env {
  CACHE: KVNamespace;
  DB: D1Database;
  BACKEND_URL: string;
  CORS_ORIGIN: string;
  CACHE_TTL: string;
}

// CORS headers
const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
});

// Handle OPTIONS preflight
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = env.CORS_ORIGIN.split(",");

  const corsOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return new Response(null, {
    status: 204,
    headers: corsHeaders(corsOrigin),
  });
}

// Generate cache key from request
function getCacheKey(request: Request, body: any): string {
  const url = new URL(request.url);
  const path = url.pathname;

  if (body && body.query) {
    // Cache based on query text
    return `moe-rag:${path}:${body.query}`;
  }

  return `moe-rag:${path}:${Date.now()}`;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = env.CORS_ORIGIN.split(",");
    const corsOrigin = allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0];

    // Handle OPTIONS
    if (request.method === "OPTIONS") {
      return handleOptions(request, env);
    }

    try {
      // Health check - no cache
      if (url.pathname.endsWith("/health")) {
        const backendURL = `${env.BACKEND_URL}/health`;
        const response = await fetch(backendURL);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(corsOrigin),
          },
        });
      }

      // Main endpoint or debug - with caching
      if (request.method === "POST") {
        const body = await request.json();
        const cacheKey = getCacheKey(request, body);

        // Check cache first (only for main endpoint, not debug)
        if (!url.pathname.endsWith("/debug")) {
          const cached = await env.CACHE.get(cacheKey);
          if (cached) {
            console.log(`Cache HIT: ${cacheKey}`);
            const cachedData = JSON.parse(cached);
            cachedData.cache_hit = true;

            return new Response(JSON.stringify(cachedData), {
              headers: {
                "Content-Type": "application/json",
                "X-Cache": "HIT",
                ...corsHeaders(corsOrigin),
              },
            });
          }
        }

        // Forward to backend
        const backendPath = url.pathname.replace("/api/moe-rag", "");
        const backendURL = `${env.BACKEND_URL}${backendPath || ""}`;

        console.log(`Forwarding to: ${backendURL}`);

        const backendResponse = await fetch(backendURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await backendResponse.json();

        // Cache successful responses (not debug endpoint)
        if (backendResponse.ok && !url.pathname.endsWith("/debug")) {
          const ttl = parseInt(env.CACHE_TTL) || 300;
          await env.CACHE.put(cacheKey, JSON.stringify(data), {
            expirationTtl: ttl,
          });
          console.log(`Cached: ${cacheKey} for ${ttl}s`);
        }

        // Log query to D1 (async, don't await to avoid latency)
        if (env.DB && data.routing_path) {
          logQueryToD1(env, body.query || "unknown", data).catch((err) =>
            console.error("[D1] Log failed:", err)
          );
        }

        return new Response(JSON.stringify(data), {
          status: backendResponse.status,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "MISS",
            ...corsHeaders(corsOrigin),
          },
        });
      }

      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(corsOrigin),
      });
    } catch (error: any) {
      console.error("[MoE-RAG Proxy] Error:", error);

      return new Response(
        JSON.stringify({
          error: "Service unavailable",
          message: error.message,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(corsOrigin),
          },
        }
      );
    }
  },
};

/**
 * Log query to D1 database (async, non-blocking)
 */
async function logQueryToD1(env: Env, query: string, response: any) {
  try {
    const queryId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert query record
    await env.DB.prepare(
      `INSERT INTO moe_queries (id, query, routing_path, latency_ms, confidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        queryId,
        query,
        response.routing_path || "UNKNOWN",
        response.latency_ms || 0,
        response.confidence || 0.0,
        now
      )
      .run();

    // Insert response record
    await env.DB.prepare(
      `INSERT INTO moe_responses 
       (id, query_id, response, confidence, agents_used, model_name, cost_usd, tokens_input, tokens_output, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        queryId,
        response.response || "",
        response.confidence || 0.0,
        JSON.stringify(response.agents_used || []),
        response.metadata?.model_name || "unknown",
        response.cost_usd || 0.0,
        response.tokens_used?.input || 0,
        response.tokens_used?.output || 0,
        now
      )
      .run();

    console.log(`[D1] Logged query ${queryId}: ${query.substring(0, 50)}...`);
  } catch (error) {
    console.error("[D1] Failed to log query:", error);
    // Don't throw - logging failure shouldn't break the request
  }
}
