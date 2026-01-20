export interface Env {
  AGENT_ZERO_TUNNEL: string;
  AGENT_ZERO_LOCAL_PORT: string;
  AGENT_ZERO_API_KEY: string;
}

interface AgentZeroMessage {
  message: string;
  context_id?: string;
  attachments?: Array<{ filename: string; base64: string }>;
  lifetime_hours?: number;
}

interface AgentZeroResponse {
  success: boolean;
  response?: any;
  error?: string;
}

/**
 * Agent Zero Bridge Worker
 * Integrates Agent Zero with Agents Orchestrator
 * Routes: /health, /message, /status
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-KEY",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === "/health" || url.pathname === "/") {
        const healthCheck = await fetch(env.AGENT_ZERO_TUNNEL, {
          method: "GET",
        }).catch(() => null);

        return new Response(
          JSON.stringify({
            success: true,
            agent: "Agent Zero",
            status: healthCheck?.ok ? "online" : "offline",
            tunnel: env.AGENT_ZERO_TUNNEL,
            local_port: env.AGENT_ZERO_LOCAL_PORT,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Send message to Agent Zero
      if (url.pathname === "/message" && request.method === "POST") {
        const body: AgentZeroMessage = await request.json();

        if (!body.message) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Message is required",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        // Forward to Agent Zero through tunnel
        const agentResponse = await fetch(
          `${env.AGENT_ZERO_TUNNEL}/api_message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": env.AGENT_ZERO_API_KEY,
            },
            body: JSON.stringify({
              message: body.message,
              context_id: body.context_id,
              attachments: body.attachments || [],
              lifetime_hours: body.lifetime_hours || 24,
            }),
          },
        );

        const data = await agentResponse.json();

        return new Response(
          JSON.stringify({
            success: true,
            agent: "Agent Zero",
            request: {
              message: body.message,
              context_id: body.context_id,
            },
            response: data,
            via_tunnel: env.AGENT_ZERO_TUNNEL,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Get status
      if (url.pathname === "/status") {
        return new Response(
          JSON.stringify({
            success: true,
            agent: "Agent Zero",
            config: {
              tunnel_url: env.AGENT_ZERO_TUNNEL,
              local_port: env.AGENT_ZERO_LOCAL_PORT,
              api_endpoint: "/api_message",
            },
            capabilities: [
              "code_execution",
              "terminal_access",
              "file_operations",
              "web_search",
              "conversation_continuity",
            ],
            integration: "JIMBO77 Agents Orchestrator",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          agent: "Agent Zero",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
  },
};
