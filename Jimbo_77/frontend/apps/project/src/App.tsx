import React from "react";
import { AppShell } from "@jimbo77/ui/layout/AppShell";
import { Topbar } from "@jimbo77/ui/layout/Topbar";
import { CommandDrawer } from "@jimbo77/ui/components/CommandDrawer";
import { api } from "@jimbo77/core/api";
import { can } from "@jimbo77/core/rbac";
import type { Project, CommandIn } from "@core/types";

function idemKey() {
  return crypto.randomUUID();
}

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const projectId = import.meta.env.VITE_PROJECT_ID ?? "unknown";

  const [me, setMe] = React.useState<{ email: string; role: any } | null>(null);
  const [globalOk, setGlobalOk] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [status, setStatus] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [m, g, p, s] = await Promise.all([
        api.me(),
        api.globalStatus(),
        api.projects(),
        api.projectStatus(projectId),
      ]);
      setMe(m);
      setGlobalOk(g.ok);
      setProjects(p);
      setStatus(s);
    })().catch(console.error);
  }, [projectId]);

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color: "var(--muted)" }}>PROJECT</div>
        <div className="kpi">{projectId}</div>
      </div>

      <div style={{ marginTop: 12, color: "var(--muted)" }}>JUMP</div>
      {projects.map((p) => (
        <a
          key={p.id}
          className="btn"
          style={{ width: "100%", justifyContent: "space-between", marginTop: 8 }}
          href={p.host}
        >
          <span>{p.name}</span>
          <small style={{ color: "var(--muted)" }}>{p.id}</small>
        </a>
      ))}
    </>
  );

  async function restartExample() {
    if (!me) return;
    if (!can(me.role, "service.restart")) return;

    setBusy(true);
    try {
      const payload: CommandIn = {
        projectId,
        action: "service.restart",
        target: `${projectId}-api`, // docelowo z configu projektu
        params: {},
        reason: "manual restart from dashboard",
      };
      const out = await api.command(payload, idemKey());
      console.log("command:", out);
      alert(`Command queued: ${out.id}`);
    } catch (e: any) {
      alert(`Error: ${String(e?.message ?? e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      topbar={
        <Topbar
          title={`PROJECT / ${projectId}`}
          env={env}
          userEmail={me?.email}
          role={me?.role}
          globalOk={globalOk}
        />
      }
      sidebar={sidebar}
      footer={`${projectId} / ${new Date().toISOString()}`}
    >
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>HEALTH</div>
          <div className="kpi">{status?.ok ? "OK" : "DEGRADED"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>SERVICES</div>
          <div className="kpi">{status ? `${status.servicesUp}/${status.servicesTotal}` : "-"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>ACTIONS</div>
          <button
            className="btn"
            disabled={busy || !me || !can(me.role, "service.restart")}
            onClick={restartExample}
          >
            RESTART (example)
          </button>
        </div>
      </div>
    </AppShell>
  );
}
