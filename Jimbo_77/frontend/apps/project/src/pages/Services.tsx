import React from "react";
import { api } from "@jimbo77/core/api";
import { can } from "@jimbo77/core/rbac";
import type { CommandIn } from "@jimbo77/core/types";

function idemKey() {
  return crypto.randomUUID();
}

export function ServicesPage(props: {
  projectId: string;
  me: { email: string; role: any } | null;
  onCommand: (id: string) => void;
}) {
  const [project, setProject] = React.useState<any>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const p = await fetch(`${import.meta.env.VITE_API_BASE}/v1/projects/${props.projectId}`, { credentials: "include" });
      if (!p.ok) throw new Error(`projects/${props.projectId} ${p.status}`);
      setProject(await p.json());
    })().catch(console.error);
  }, [props.projectId]);

  async function restart(service: any) {
    if (!props.me) return;
    if (!can(props.me.role, "service.restart")) return;

    const reason = window.prompt(`Reason for RESTART (${service.label})?`, "manual restart");
    if (!reason || reason.trim().length < 3) return;

    setBusyId(service.id);
    try {
      const payload: CommandIn = {
        projectId: props.projectId,
        action: "service.restart",
        target: service.id,      // ✅ serviceId, nie kontener
        params: {},
        reason: reason.trim(),
      };
      const out = await api.command(payload, idemKey());
      props.onCommand(out.id);
    } finally {
      setBusyId(null);
    }
  }

  if (!project) return <div className="card">loading project config…</div>;

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 12" }}>
        <div style={{ color: "var(--muted)" }}>SERVICES</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {(project.services ?? []).map((s: any) => (
            <div key={s.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(10,18,32,.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <b>{s.label}</b>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                    id: {s.id} · agent: {s.agentId} · target: {s.target}
                  </div>
                </div>

                <button
                  className="btn"
                  disabled={busyId === s.id || !props.me || !can(props.me.role, "service.restart")}
                  onClick={() => restart(s)}
                >
                  {busyId === s.id ? "WORKING…" : "RESTART"}
                </button>
              </div>
            </div>
          ))}
          {(project.services ?? []).length === 0 && <div style={{ color: "var(--muted)" }}>no services configured</div>}
        </div>
      </div>
    </div>
  );
}
