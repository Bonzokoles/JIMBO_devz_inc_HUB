export type Role = "owner" | "admin" | "dev" | "viewer";

export type Me = { email: string; role: Role };

export type Project = {
  id: string;
  name: string;
  host: string;
  modules: string[];
  agents?: { id: string; url: string }[];
};

export type GlobalStatus = { ok: boolean; ts: string };
export type ProjectStatus = { ok: boolean; servicesUp: number; servicesTotal: number };

export type CommandIn = {
  projectId: string;
  action: "service.restart" | "deploy.run";
  target?: string | null;
  params?: Record<string, unknown>;
  reason?: string | null;
};

export type CommandOut = {
  id: string;
  status: string;
  projectId: string;
  action: string;
};

export interface PublishResponse {
  id: string;
  platform: string;
  status: "success" | "failed" | "pending";
  url?: string;
  error?: string;
  created_at: string;
}

export interface PublishEverywhereRequest {
  article_markdown: string;
  image_path?: string;
}

export interface R2UploadResponse {
  status: string;
  url: string;
  key: string;
}

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  uptime_seconds: number;
  uptime_human: string;
  platform: string;
  timestamp: string;
}