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
