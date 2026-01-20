/**
 * Agents Orchestrator & Agent Zero Integration Service
 * Komunikacja z Cloudflare Workers orchestratorem i Agent Zero bridge
 */

const ORCHESTRATOR_API =
  import.meta.env.VITE_ORCHESTRATOR_API ||
  "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev";
const AGENT_ZERO_BRIDGE =
  import.meta.env.VITE_AGENT_ZERO_BRIDGE ||
  "https://agent-zero-bridge.stolarnia-ams.workers.dev";

export interface OrchestratorTask {
  query: string;
  context?: Record<string, any>;
  model?: string;
}

export interface OrchestratorResult {
  taskId: string;
  query: string;
  plan: Array<{
    agentId: string;
    action: string;
    priority: number;
  }>;
  results: any[];
  answer: string;
  execution_time: number;
  model_used: string;
}

export interface AgentZeroMessage {
  message: string;
  context_id?: string;
  attachments?: Array<{ filename: string; base64: string }>;
  lifetime_hours?: number;
}

export interface AgentZeroResponse {
  success: boolean;
  agent: string;
  request: {
    message: string;
    context_id?: string;
  };
  response: {
    context_id: string;
    response: string;
  };
  via_tunnel: string;
}

export interface OrchestratorHealth {
  status: string;
  orchestrator: string;
  model: string;
  agents: number;
  special_agents?: {
    "agent-zero"?: {
      status: string;
      endpoint: string;
      capabilities: string[];
    };
  };
}

/**
 * Sprawdź health orchestratora
 */
export async function getOrchestratorHealth(): Promise<OrchestratorHealth | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_API}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Orchestrator health check failed:", error);
    return null;
  }
}

/**
 * Uruchom zadanie przez orchestrator
 */
export async function executeTask(
  task: OrchestratorTask,
): Promise<OrchestratorResult | null> {
  try {
    console.log(`📡 Calling orchestrator at: ${ORCHESTRATOR_API}/orchestrate`);

    const res = await fetch(`${ORCHESTRATOR_API}/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: task.query,
        context: task.context || {},
        model: task.model || "deepseek/deepseek-r1",
      }),
    });

    console.log(`📡 Orchestrator response status: ${res.status}`);

    if (!res.ok) {
      const error = await res.text();
      console.error(`❌ Orchestrator error (${res.status}):`, error);
      throw new Error(`HTTP ${res.status}: ${error}`);
    }

    const data = await res.json();
    console.log("✅ Orchestrator data:", data);
    return data;
  } catch (error) {
    console.error("❌ Task execution failed:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(
        "🌐 Network error - check CORS or orchestrator availability",
      );
    }
    return null;
  }
}

/**
 * Sprawdź status Agent Zero
 */
export async function getAgentZeroHealth(): Promise<any> {
  try {
    const res = await fetch(`${AGENT_ZERO_BRIDGE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Agent Zero health check failed:", error);
    return null;
  }
}

/**
 * Wyślij wiadomość bezpośrednio do Agent Zero
 */
export async function sendToAgentZero(
  message: AgentZeroMessage,
): Promise<AgentZeroResponse | null> {
  try {
    console.log(
      `📡 Calling Agent Zero bridge at: ${AGENT_ZERO_BRIDGE}/message`,
    );

    const res = await fetch(`${AGENT_ZERO_BRIDGE}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    console.log(`📡 Agent Zero response status: ${res.status}`);

    if (!res.ok) {
      const error = await res.text();
      console.error(`❌ Agent Zero error (${res.status}):`, error);
      throw new Error(`HTTP ${res.status}: ${error}`);
    }

    const data = await res.json();
    console.log("✅ Agent Zero data:", data);
    return data;
  } catch (error) {
    console.error("❌ Agent Zero message failed:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("🌐 Network error - check CORS or bridge availability");
    }
    return null;
  }
}

/**
 * Pobierz konfigurację Agent Zero
 */
export async function getAgentZeroConfig(): Promise<any> {
  try {
    const res = await fetch(`${AGENT_ZERO_BRIDGE}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Agent Zero config failed:", error);
    return null;
  }
}

/**
 * Pobierz status zadania z orchestratora
 */
export async function getTaskStatus(taskId: string): Promise<any> {
  try {
    const res = await fetch(`${ORCHESTRATOR_API}/task/${taskId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Task status failed:", error);
    return null;
  }
}

/**
 * Hook React do monitorowania orchestratora
 */
export function useOrchestratorStatus(intervalMs: number = 30000) {
  const [health, setHealth] = React.useState<OrchestratorHealth | null>(null);
  const [agentZeroHealth, setAgentZeroHealth] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchHealth = async () => {
      const [orchHealth, azHealth] = await Promise.all([
        getOrchestratorHealth(),
        getAgentZeroHealth(),
      ]);
      setHealth(orchHealth);
      setAgentZeroHealth(azHealth);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return { health, agentZeroHealth };
}

import React from "react";
