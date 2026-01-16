/**
 * Go Agent Integration Service
 * Komunikacja z jimbo-agent-go (localhost:8787)
 */

const AGENT_API = import.meta.env.VITE_AGENT_API || "http://localhost:8787";

export interface AgentTunnelStatus {
  name: string;
  id: string;
  status: "active" | "inactive" | "error";
  localPort: number;
  publicUrl: string;
  bandwidth?: string;
  connections?: number;
  uptime?: string;
  lastError?: string;
}

export interface AgentTunnelConfig {
  localPort: number;
  tunnelName: string;
  persistent: boolean;
  provider?: "cloudflare" | "ngrok" | "local";
}

export interface AgentSystemInfo {
  hostname: string;
  os: string;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkInterfaces: Array<{
    name: string;
    ip: string;
    mac: string;
  }>;
}

/**
 * Pobiera status wszystkich tuneli
 */
export async function getTunnels(): Promise<AgentTunnelStatus[]> {
  try {
    const res = await fetch(`${AGENT_API}/tunnel/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ getTunnels failed:", error);
    return [];
  }
}

/**
 * Uruchamia nowy tunel
 */
export async function startTunnel(
  config: AgentTunnelConfig
): Promise<{ success: boolean; tunnelId?: string; error?: string }> {
  try {
    const res = await fetch(`${AGENT_API}/tunnel/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const error = await res.text();
      return { success: false, error };
    }

    const data = await res.json();
    return { success: true, tunnelId: data.tunnelId };
  } catch (error) {
    console.error("❌ startTunnel failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Zatrzymuje tunel
 */
export async function stopTunnel(tunnelId: string): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_API}/tunnel/stop/${tunnelId}`, {
      method: "POST",
    });
    return res.ok;
  } catch (error) {
    console.error("❌ stopTunnel failed:", error);
    return false;
  }
}

/**
 * Restartuje tunel
 */
export async function restartTunnel(tunnelId: string): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_API}/tunnel/restart/${tunnelId}`, {
      method: "POST",
    });
    return res.ok;
  } catch (error) {
    console.error("❌ restartTunnel failed:", error);
    return false;
  }
}

/**
 * Pobiera informacje systemowe z agenta
 */
export async function getSystemInfo(): Promise<AgentSystemInfo | null> {
  try {
    const res = await fetch(`${AGENT_API}/system/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ getSystemInfo failed:", error);
    return null;
  }
}

/**
 * Sprawdza czy agent jest dostępny
 */
export async function checkAgentHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_API}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2s timeout
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Pobiera logi agenta (ostatnie N wpisów)
 */
export async function getAgentLogs(limit = 50): Promise<string[]> {
  try {
    const res = await fetch(`${AGENT_API}/logs?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.logs || [];
  } catch (error) {
    console.error("❌ getAgentLogs failed:", error);
    return [];
  }
}

/**
 * Subskrybuje logi agenta przez SSE (Server-Sent Events)
 */
export function subscribeToAgentLogs(
  callback: (log: string) => void,
  onError?: (error: Event) => void
): EventSource {
  const eventSource = new EventSource(`${AGENT_API}/logs/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data.message || data.log || String(data));
    } catch {
      callback(event.data);
    }
  };

  if (onError) {
    eventSource.onerror = onError;
  } else {
    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      eventSource.close();
    };
  }

  return eventSource;
}

/**
 * Ustawia konfigurację tunelu jako trwałą (persistent)
 */
export async function setTunnelPersistence(
  tunnelId: string,
  persistent: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_API}/tunnel/${tunnelId}/persistence`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persistent }),
    });
    return res.ok;
  } catch (error) {
    console.error("❌ setTunnelPersistence failed:", error);
    return false;
  }
}
