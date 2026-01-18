// Ngrok AI Gateway Proxy Worker
// Routes AI requests through ngrok gateway with analytics and caching

export interface Env {
  NGROK_AI_GATEWAY_URL: string;
  NGROK_API_KEY: string;
  JIMBO_API_KEY: string;
  ANALYTICS: D1Database;
}

// Analytics schema (execute on D1):
// CREATE TABLE IF NOT EXISTS requests (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   timestamp TEXT NOT NULL,
//   endpoint TEXT NOT NULL,
//   provider TEXT,
//   model TEXT,
//   tokens_input INTEGER,
//   tokens_output INTEGER,
//   latency_ms INTEGER,
//   cost_usd REAL,
//   status INTEGER,
//   error TEXT,
//   ip TEXT
// );
// CREATE INDEX idx_timestamp ON requests(timestamp);
// CREATE INDEX idx_endpoint ON requests(endpoint);
// CREATE INDEX idx_provider ON requests(provider);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          ngrok_url: env.NGROK_AI_GATEWAY_URL,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Route handlers
    if (url.pathname === "/api/chat") {
      return handleChat(request, env, ctx, corsHeaders);
    }

    if (url.pathname === "/api/embeddings") {
      return handleEmbeddings(request, env, ctx, corsHeaders);
    }

    if (url.pathname === "/api/images") {
      return handleImages(request, env, ctx, corsHeaders);
    }

    if (url.pathname === "/api/analytics") {
      return handleAnalytics(request, env, corsHeaders);
    }

    // 404
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};

// Chat completions endpoint
async function handleChat(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = (await request.json()) as any;

    // Forward to ngrok gateway
    const response = await fetch(
      `${env.NGROK_AI_GATEWAY_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.NGROK_API_KEY}`,
        },
        body: JSON.stringify(body),
      },
    );

    const responseData = (await response.json()) as any;
    const latency = Date.now() - startTime;

    // Extract provider from response headers
    const provider = response.headers.get("X-Ngrok-Provider") || "unknown";

    // Log analytics (async, don't block response)
    ctx.waitUntil(
      logAnalytics(env, {
        endpoint: "/api/chat",
        provider,
        model: body.model,
        tokens_input: responseData.usage?.prompt_tokens || 0,
        tokens_output: responseData.usage?.completion_tokens || 0,
        latency_ms: latency,
        cost_usd: estimateCost(provider, responseData.usage),
        status: response.status,
        ip: request.headers.get("CF-Connecting-IP") || "unknown",
      }),
    );

    // Return response with provider info
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "X-Provider": provider,
        "X-Latency-Ms": latency.toString(),
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;

    // Log error
    ctx.waitUntil(
      logAnalytics(env, {
        endpoint: "/api/chat",
        provider: "error",
        latency_ms: latency,
        status: 500,
        error: error.message,
        ip: request.headers.get("CF-Connecting-IP") || "unknown",
      }),
    );

    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          type: "internal_error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
}

// Embeddings endpoint
async function handleEmbeddings(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as any;

    const response = await fetch(`${env.NGROK_AI_GATEWAY_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.NGROK_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const responseData = (await response.json()) as any;
    const latency = Date.now() - startTime;
    const provider = response.headers.get("X-Ngrok-Provider") || "unknown";

    ctx.waitUntil(
      logAnalytics(env, {
        endpoint: "/api/embeddings",
        provider,
        model: body.model,
        latency_ms: latency,
        status: response.status,
        ip: request.headers.get("CF-Connecting-IP") || "unknown",
      }),
    );

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "X-Provider": provider,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// Image generation endpoint
async function handleImages(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as any;

    const response = await fetch(
      `${env.NGROK_AI_GATEWAY_URL}/images/generations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.NGROK_API_KEY}`,
        },
        body: JSON.stringify(body),
      },
    );

    const responseData = (await response.json()) as any;
    const latency = Date.now() - startTime;
    const provider = response.headers.get("X-Ngrok-Provider") || "unknown";

    ctx.waitUntil(
      logAnalytics(env, {
        endpoint: "/api/images",
        provider,
        model: body.model,
        latency_ms: latency,
        cost_usd: 0.05, // Estimate
        status: response.status,
        ip: request.headers.get("CF-Connecting-IP") || "unknown",
      }),
    );

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "X-Provider": provider,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// Analytics dashboard endpoint
async function handleAnalytics(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  try {
    // Get last 24 hours stats
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const stats = await env.ANALYTICS.prepare(
      `
      SELECT 
        endpoint,
        provider,
        COUNT(*) as count,
        AVG(latency_ms) as avg_latency,
        SUM(tokens_input) as total_input_tokens,
        SUM(tokens_output) as total_output_tokens,
        SUM(cost_usd) as total_cost,
        SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as success_count
      FROM requests
      WHERE timestamp > ?
      GROUP BY endpoint, provider
      ORDER BY count DESC
    `,
    )
      .bind(since)
      .all();

    // Overall totals
    const totals = await env.ANALYTICS.prepare(
      `
      SELECT 
        COUNT(*) as total_requests,
        SUM(cost_usd) as total_cost,
        AVG(latency_ms) as avg_latency
      FROM requests
      WHERE timestamp > ?
    `,
    )
      .bind(since)
      .all();

    return new Response(
      JSON.stringify({
        period: "24h",
        totals: totals.results[0],
        by_provider: stats.results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// Log analytics to D1
async function logAnalytics(
  env: Env,
  data: {
    endpoint: string;
    provider: string;
    model?: string;
    tokens_input?: number;
    tokens_output?: number;
    latency_ms: number;
    cost_usd?: number;
    status: number;
    error?: string;
    ip: string;
  },
) {
  try {
    await env.ANALYTICS.prepare(
      `
      INSERT INTO requests (
        timestamp, endpoint, provider, model, 
        tokens_input, tokens_output, latency_ms, 
        cost_usd, status, error, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        new Date().toISOString(),
        data.endpoint,
        data.provider,
        data.model || null,
        data.tokens_input || null,
        data.tokens_output || null,
        data.latency_ms,
        data.cost_usd || null,
        data.status,
        data.error || null,
        data.ip,
      )
      .run();
  } catch (error) {
    // Don't throw, just log
    console.error("Analytics logging failed:", error);
  }
}

// Estimate cost based on provider and usage
function estimateCost(
  provider: string,
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  },
): number {
  if (!usage) return 0;

  const input = usage.prompt_tokens || 0;
  const output = usage.completion_tokens || 0;

  // Cost per 1M tokens
  const pricing: Record<string, { input: number; output: number }> = {
    "gemini-free": { input: 0, output: 0 },
    "claude-via-openrouter": { input: 3, output: 15 },
    "deepseek-r1": { input: 0.14, output: 0.28 },
    "openai-rotation-1": { input: 10, output: 30 },
    "openai-rotation-2": { input: 10, output: 30 },
    "openai-rotation-3": { input: 10, output: 30 },
  };

  const rates = pricing[provider] || { input: 10, output: 30 };

  return (
    (input / 1_000_000) * rates.input + (output / 1_000_000) * rates.output
  );
}
