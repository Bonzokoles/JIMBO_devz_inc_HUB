/**
 * React hook do zarządzania połączeniem z Go Agent
 */

import { useState, useEffect, useCallback } from "react";
import {
  checkAgentHealth,
  getTunnels,
  AgentTunnelStatus,
} from "../services/agentService";

export interface AgentConnectionState {
  isConnected: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  error: string | null;
}

export function useAgentConnection(checkInterval = 10000) {
  const [state, setState] = useState<AgentConnectionState>({
    isConnected: false,
    isChecking: true,
    lastCheck: null,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));

    const isHealthy = await checkAgentHealth();

    setState({
      isConnected: isHealthy,
      isChecking: false,
      lastCheck: new Date(),
      error: isHealthy ? null : "Agent nie odpowiada na http://localhost:8787",
    });

    return isHealthy;
  }, []);

  useEffect(() => {
    // Pierwsza weryfikacja
    checkConnection();

    // Periodyczne sprawdzanie
    const interval = setInterval(checkConnection, checkInterval);

    return () => clearInterval(interval);
  }, [checkConnection, checkInterval]);

  return {
    ...state,
    checkConnection,
  };
}

export function useAgentTunnels(refreshInterval = 5000) {
  const [tunnels, setTunnels] = useState<AgentTunnelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTunnels();
      setTunnels(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return {
    tunnels,
    loading,
    error,
    refresh,
  };
}
