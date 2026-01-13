import type { Role } from "./types";

const PERMS: Record<Role, Set<string>> = {
  viewer: new Set(["status.read", "logs.read"]),
  dev:    new Set(["status.read", "logs.read", "service.restart", "deploy.run"]),
  admin:  new Set(["status.read", "logs.read", "service.restart", "deploy.run", "project.configure"]),
  owner:  new Set(["*"]),
};

export function can(role: Role, perm: string): boolean {
  if (!role) return false;
  const s = PERMS[role] ?? new Set();
  return s.has("*") || s.has(perm);
}
