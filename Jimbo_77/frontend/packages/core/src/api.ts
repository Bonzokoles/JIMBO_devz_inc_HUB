import type { Me, Project, GlobalStatus, ProjectStatus, SystemStats, CommandIn, CommandOut, PublishResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.ops.tld";

async function jget<T>(path: string): Promise<T> {
  // In a real app, we would fetch from API_BASE
  // For now, we might mock if API_BASE is not reachable, but let's assume we want real fetch logic
  // If we are in MOCK mode, we can intercept here.
  
  if (import.meta.env.VITE_MOCK === "true") {
      return mockGet<T>(path);
  }

  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

async function jpost<T>(path: string, body: unknown, headers?: Record<string,string>): Promise<T> {
  if (import.meta.env.VITE_MOCK === "true") {
      return mockPost<T>(path, body);
  }

  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type":"application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

export const api = {
  me: () => jget<Me>("/v1/me"),
  projects: () => jget<Project[]>("/v1/projects"),
  globalStatus: () => jget<GlobalStatus>("/v1/status/global"),
  projectStatus: (id: string) => jget<ProjectStatus>(`/v1/status/project/${id}`),
  analyticsSystem: () => jget<SystemStats>("/v1/analytics/system"),
  publishEverywhere: (payload: any) => jpost<PublishResponse[]>("/v1/publish/everywhere", payload),
  commandGet: (id: string) => jget<any>(`/v1/commands/${id}`),
  commandEvents: (id: string) => jget<any[]>(`/v1/commands/${id}/events`),
  command: (payload: CommandIn, idempotencyKey: string) =>
    jpost<CommandOut>("/v1/commands", payload, { "Idempotency-Key": idempotencyKey }),
};


// --- MOCKS FOR LOCAL DEV UNTIL BACKEND IS READY ---
async function mockGet<T>(path: string): Promise<T> {
    await new Promise(r => setTimeout(r, 400)); // lag
    
    if (path === "/v1/analytics/system") {
        return {
            platform: "linux",
            uptime_human: "2d 4h 12m",
            timestamp: new Date().toISOString(),
            cpu_percent: 12,
            memory_percent: 45,
            memory_used_gb: 7.2,
            memory_total_gb: 16,
            disk_percent: 34
        } as any;
    }
    if (path === "/v1/me") {
        return { email: "dev@jimbo77.com", role: "owner" } as any;
    }
    if (path.startsWith("/v1/commands/") && path.endsWith("/events")) {
        return [
            { id: "e1", type: "info", ts: new Date().toISOString(), message: "Command accepted" },
            { id: "e2", type: "info", ts: new Date().toISOString(), message: "Worker polled task" },
        ] as any;
    }
    if (path.startsWith("/v1/commands/")) {
        return {
            id: path.split("/").pop(),
            status: "succeeded",
            projectId: "proj_1",
            action: "service.restart",
            target: "srv_nginx",
            attempt: 1,
            maxAttempts: 3,
            createdBy: "dev@jimbo77.com"
        } as any;
    }
    if (path === "/v1/status/global") {
        return { ok: true, ts: new Date().toISOString() } as any;
    }
    if (path === "/v1/projects") {
        return [
            {
                id: "pumo",
                name: "PUMO",
                host: "https://pumo.jimbo77.com",
                modules: ["overview", "services", "logs"],
                agents: [{ id: "pumo-1", url: "https://agent-pumo-1.internal" }],
                services: [
                    { id: "pumo-api", label: "PUMO API", target: "pumo-api", agentId: "pumo-1", kind: "docker" },
                     { id: "pumo-worker", label: "PUMO Worker", target: "pumo-worker", agentId: "pumo-1", kind: "docker" }
                ]
            }
        ] as any;
    }
    if (path.startsWith("/v1/status/project/")) {
        return { ok: true, servicesUp: 2, servicesTotal: 2 } as any;
    }
    throw new Error(`Mock not found for ${path}`);
}

async function mockPost<T>(path: string, body: any): Promise<T> {
    await new Promise(r => setTimeout(r, 800));
    if (path === "/v1/commands") {
        return {
            id: crypto.randomUUID(),
            status: "queued",
            projectId: body.projectId,
            action: body.action,
            ts: Date.now()
        } as any;
    }
    throw new Error(`Mock POST not found for ${path}`);
}
