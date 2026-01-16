/**
 * PUMO RAG Worker - Main Entry Point
 * Provides RAG-powered search and chat for PUMO Guide
 *
 * Endpoints:
 * - POST /api/chat - Public chat endpoint for blog widget
 * - POST /api/search - Simple product search
 * - POST /internal/agent-search - Internal endpoint for agents-orchestrator
 * - GET /api/stats - Query statistics
 * - GET /health - Health check
 */

import { ragChat } from "./rag-engine";
import { logQuery } from "./logging";

export interface Env {
  VECTORIZE: Vectorize;
  LOGS: KVNamespace;
  CACHE: KVNamespace;
  AI: Ai;
  OPENROUTER_API_KEY: string;
  INTERNAL_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      // Health check
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "pumo-rag",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Public chat endpoint
      if (url.pathname === "/api/chat" && request.method === "POST") {
        const body = (await request.json()) as {
          query: string;
          context?: string[];
        };

        if (!body.query || typeof body.query !== "string") {
          return new Response(
            JSON.stringify({ error: "Missing or invalid 'query' field" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Check cache
        const cacheKey = `chat:${body.query}`;
        const cached = await env.CACHE.get(cacheKey);
        if (cached) {
          return new Response(cached, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "X-Cache": "HIT",
            },
          });
        }

        // RAG query
        const result = await ragChat(body.query, env, body.context);

        // Log query
        ctx.waitUntil(
          logQuery(env.LOGS, {
            query: body.query,
            answer: result.answer,
            sources: result.sources.length,
            confidence: result.confidence,
            source: "blog",
            timestamp: Date.now(),
          }),
        );

        // Cache result (5 min TTL)
        const responseData = JSON.stringify(result);
        ctx.waitUntil(
          env.CACHE.put(cacheKey, responseData, { expirationTtl: 300 }),
        );

        return new Response(responseData, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Cache": "MISS",
          },
        });
      }

      // Internal agent endpoint (requires auth)
      if (
        url.pathname === "/internal/agent-search" &&
        request.method === "POST"
      ) {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${env.INTERNAL_API_KEY}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = (await request.json()) as { query: string };
        const result = await ragChat(body.query, env);

        ctx.waitUntil(
          logQuery(env.LOGS, {
            query: body.query,
            answer: result.answer,
            sources: result.sources.length,
            confidence: result.confidence,
            source: "agent",
            timestamp: Date.now(),
          }),
        );

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Simple search endpoint
      if (url.pathname === "/api/search" && request.method === "POST") {
        const body = (await request.json()) as {
          query: string;
          limit?: number;
        };

        // Basic search without LLM (just Vectorize results)
        const embedding = (await env.AI.run("@cf/baai/bge-small-en-v1.5", {
          text: [body.query],
        })) as { data: number[][] };

        const results = await env.VECTORIZE.query(embedding.data[0], {
          topK: body.limit || 10,
          returnMetadata: true,
        });

        return new Response(
          JSON.stringify({
            query: body.query,
            results: results.matches.map((m) => ({
              id: m.id,
              score: m.score,
              ...m.metadata,
            })),
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Stats endpoint
      if (url.pathname === "/api/stats" && request.method === "GET") {
        // TODO: Implement stats aggregation from LOGS KV
        return new Response(
          JSON.stringify({
            message: "Stats endpoint - implementation pending",
            totalQueries: 0,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
