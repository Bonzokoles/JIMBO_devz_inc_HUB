import type { Me, Project, GlobalStatus, ProjectStatus, CommandIn, CommandOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.ops.jimbo77.org";

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

async function jpost<T>(path: string, body: unknown, headers?: Record<string,string>): Promise<T> {
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
  command: (payload: CommandIn, idempotencyKey: string) =>
    jpost<CommandOut>("/v1/commands", payload, { "Idempotency-Key": idempotencyKey }),
  commandGet: (id: string) => jget<any>(`/v1/commands/${id}`),
  commandEvents: (id: string) => jget<any[]>(`/v1/commands/${id}/events`),
  audit: (limit = 50) => jget<any[]>(`/v1/audit?limit=${limit}`),
  
  // Publishing
  publishEverywhere: (payload: import("./types").PublishEverywhereRequest) => 
    jpost<import("./types").PublishResponse[]>("/v1/publish/everywhere", payload),
    
  publishR2: (formData: FormData) => fetch(`${API_BASE}/v1/publish/r2`, {
      method: "POST",
      body: formData, // Browser handles Content-Type for FormData
    }).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),


  publishHistory: () => jget<any[]>("/v1/publish/history"),

  // Analytics
  analyticsSystem: () => jget<import("./types").SystemStats>("/v1/analytics/system"),
};


