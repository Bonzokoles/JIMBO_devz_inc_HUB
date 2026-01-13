export type Role = "owner" | "admin" | "dev" | "viewer";

export type Me = { 
  email: string; 
  role: Role 
};

export type AgentCfg = {
  id: string;
  url: string;
};

export type ServiceCfg = {
  id: string;        // stable ID in UI (e.g. "pumo-api")
  label: string;     // Display label
  target: string;    // Container name / target
  agentId: string;   // Which agent manages this
  kind: string;      // "docker" | "systemd" etc
};

export type Project = {
  id: string;
  name: string;
  host: string;           // https://pumo.ops.tld
  modules: string[];      // ["overview","services","deploy","logs"]
  agents: AgentCfg[];
  services: ServiceCfg[];
  links?: Record<string, string>;
};

export type GlobalStatus = { ok: boolean; ts: string };
export type ProjectStatus = { ok: boolean; servicesUp: number; servicesTotal: number };

export type SystemStats = {
  platform: string;
  uptime_human: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
};

export type PublishResponse = {
  id: string;
  platform: string;
  status: "success" | "failed";
  url?: string;
  error?: string;
  created_at: string;
};

export type CommandIn = {
  projectId: string;
  action: "service.restart" | "deploy.run";
  target?: string | null;
  params?: Record<string, unknown>;
  reason?: string | null;
};

export type CommandOut = {
  id: string;
  status: string;        // "queued" | "running" | "done" | "failed"
  projectId: string;
  action: string;
  result?: any;
  error?: string;
  ts: number;
};