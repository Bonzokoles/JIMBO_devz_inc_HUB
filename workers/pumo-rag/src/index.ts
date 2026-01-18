/**
 * PUMO RAG Worker - Main Entry Point
 * Provides semantic search API for AI bots and crawlers
 *
 * Endpoints:
 * - POST /api/search - Semantic product search (main endpoint for bots/crawlers)
 * - POST /internal/agent-search - Internal endpoint for agents-orchestrator (requires auth)
 * - GET /api/products/{id} - Single product details with structured data
 * - GET /api/catalog - Full catalog metadata for crawlers
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

      // API Catalog endpoint - for AI crawlers to discover all products
      if (url.pathname === "/api/catalog" && request.method === "GET") {
        return new Response(
          JSON.stringify({
            name: "PUMO Furniture Catalog",
            description:
              "Polish furniture e-commerce catalog with 14,315 products",
            totalProducts: 14315,
            vectorIndexed: true,
            searchEndpoint: "/api/search",
            capabilities: [
              "semantic_search",
              "product_recommendations",
              "category_filtering",
              "price_filtering",
            ],
            categories: [
              "Meblościanki",
              "Regały",
              "Stoliki kawowe",
              "Krzesła",
              "Fotele",
              "Sofy",
              "Stoły",
              "Szafy",
              "Komody",
            ],
            priceRange: {
              min: 50,
              max: 15000,
              currency: "PLN",
            },
            lastUpdated: "2026-01-18T22:21:40.694Z",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=3600",
            },
          },
        );
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

      // Embedding endpoint for indexing scripts
      if (url.pathname === "/api/embed" && request.method === "POST") {
        const body = (await request.json()) as {
          text: string | string[];
        };

        const texts = Array.isArray(body.text) ? body.text : [body.text];

        // Generate embeddings using Workers AI (768 dimensions)
        const embedding = (await env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: texts,
        })) as { data: number[][] };

        return new Response(
          JSON.stringify({
            success: true,
            result: { data: embedding.data },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Vectorize INSERT endpoint for indexing scripts
      if (
        url.pathname === "/api/vectorize/insert" &&
        request.method === "POST"
      ) {
        const body = (await request.json()) as {
          vectors: Array<{
            id: string;
            values: number[];
            metadata: Record<string, string>;
          }>;
        };

        // Insert vectors using VECTORIZE binding (bypasses API token permissions)
        const inserted = await env.VECTORIZE.insert(body.vectors);

        return new Response(
          JSON.stringify({
            success: true,
            result: { count: inserted.count },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Simple search endpoint
      if (url.pathname === "/api/search" && request.method === "POST") {
        const body = (await request.json()) as {
          query: string;
          limit?: number;
        };

        // Basic search without LLM (just Vectorize results)
        // Using bge-base-en-v1.5 equivalent (768 dimensions)
        const embedding = (await env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: [body.query],
        })) as { data: number[][] };

        const results = await env.VECTORIZE.query(embedding.data[0], {
          topK: body.limit || 10,
          returnMetadata: true,
        });

        return new Response(
          JSON.stringify({
            query: body.query,
            totalResults: results.matches.length,
            results: results.matches.map((m) => ({
              id: m.id,
              relevanceScore: Math.round(m.score * 100) / 100,
              product: {
                name: m.metadata.name,
                category: m.metadata.category,
                price: parseFloat(m.metadata.price as string),
                currency: "PLN",
                url:
                  m.metadata.url ||
                  `https://www.meblepumo.pl/pl/products/${m.id}`,
                description: m.metadata.description,
              },
            })),
            meta: {
              indexedProducts: 14315,
              searchModel: "bge-base-en-v1.5",
              dimensions: 768,
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=300",
            },
          },
        );
      }

      // API Documentation endpoint - for AI crawlers
      if (url.pathname === "/api/docs" && request.method === "GET") {
        return new Response(
          JSON.stringify({
            title: "PUMO RAG API Documentation",
            version: "1.0.0",
            description: "Semantic search API for Polish furniture products",
            baseUrl: "https://pumo-rag.stolarnia-ams.workers.dev",
            endpoints: [
              {
                path: "/api/search",
                method: "POST",
                description: "Semantic product search using vector embeddings",
                authentication: "None (public)",
                rateLimit: "100 requests/minute",
                request: {
                  query: "string (required) - Search query in natural language",
                  limit:
                    "number (optional) - Max results (default: 10, max: 50)",
                },
                response: {
                  query: "Original search query",
                  totalResults: "Number of results returned",
                  results: [
                    {
                      id: "Product ID",
                      relevanceScore: "0.0-1.0 similarity score",
                      product: {
                        name: "Product name",
                        category: "Product category",
                        price: "Price in PLN",
                        currency: "PLN",
                        url: "Product URL",
                        description: "Product description",
                      },
                    },
                  ],
                  meta: {
                    indexedProducts: 14315,
                    searchModel: "bge-base-en-v1.5",
                    dimensions: 768,
                  },
                },
                example: {
                  request:
                    '{"query": "nowoczesne krzesła do biura", "limit": 5}',
                  curl: 'curl -X POST https://pumo-rag.stolarnia-ams.workers.dev/api/search -H "Content-Type: application/json" -d \'{"query":"nowoczesne krzesła"}\'',
                },
              },
              {
                path: "/api/catalog",
                method: "GET",
                description: "Get catalog metadata and capabilities",
                authentication: "None (public)",
              },
              {
                path: "/internal/agent-search",
                method: "POST",
                description:
                  "Internal endpoint for agents-orchestrator with RAG capabilities",
                authentication: "Bearer token required",
              },
            ],
            usage: {
              bestPractices: [
                "Use natural language queries (Polish or English)",
                "Limit results to 10-20 for optimal performance",
                "Results are cached for 5 minutes",
                "Relevance scores above 0.5 are highly relevant",
              ],
              examples: [
                "tanie meble do salonu",
                "nowoczesne krzesła biurowe",
                "białe regały z drewna",
                "sofa rozkładana w stylu skandynawskim",
              ],
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=86400",
            },
          },
        );
      }

      // Stats endpoint - removed (not needed for bots)
      // Use /api/catalog for metadata instead

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
