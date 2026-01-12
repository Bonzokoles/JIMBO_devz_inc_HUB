import React from "react";
import { AppShell } from "@jimbo77/ui/layout/AppShell";
import { Topbar } from "@jimbo77/ui/layout/Topbar";
import { api } from "@jimbo77/core/api";
import type { Project } from "@core/types";

export default function App() {
  const env = import.meta.env.VITE_ENV ?? "prod";
  const [me, setMe] = React.useState<{ email: string; role: string } | null>(null);
  const [globalOk, setGlobalOk] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeView, setActiveView] = React.useState<"dashboard" | "publishing" | "operations">("dashboard");

  React.useEffect(() => {
    (async () => {
      const [m, g, p] = await Promise.all([api.me(), api.globalStatus(), api.projects()]);
      setMe(m);
      setGlobalOk(g.ok);
      setProjects(p);
    })().catch(console.error);
  }, []);

  const sidebar = (
    <>
      <div className="card">
        <div style={{ color: "var(--muted)" }}>MASTER</div>
        <div className="kpi">HUB</div>
      </div>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button 
           className="btn" 
           style={{ justifyContent: "flex-start", background: activeView === "dashboard" ? "rgba(255,255,255,0.05)" : "transparent" }}
           onClick={() => setActiveView("dashboard")}
        >
          DASHBOARD
        </button>
        <button 
           className="btn" 
           style={{ justifyContent: "flex-start", background: activeView === "publishing" ? "rgba(255,255,255,0.05)" : "transparent" }}
           onClick={() => setActiveView("publishing")}
        >
          PUBLISHING
        </button>
        <button 
           className="btn" 
           style={{ justifyContent: "flex-start", background: activeView === "operations" ? "rgba(255,255,255,0.05)" : "transparent" }}
           onClick={() => setActiveView("operations")}
        >
          OPERATIONS
        </button>
      </div>

      <div style={{ marginTop: 12, color: "var(--muted)" }}>PROJECTS</div>
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

  return (
    <AppShell
      topbar={<Topbar title="CONTROL HUB" env={env} userEmail={me?.email} role={me?.role} globalOk={globalOk} />}
      sidebar={sidebar}
      footer={`hub / ${new Date().toISOString()}`}
    >
      {activeView === "dashboard" ? (
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div style={{ color: "var(--muted)" }}>GLOBAL</div>
          <div className="kpi">{globalOk ? "OK" : "DOWN"}</div>
        </div>

        <div className="card" style={{ gridColumn: "span 8" }}>
          <div style={{ color: "var(--muted)" }}>PROJECTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {projects.map((p) => (
              <a key={p.id} className="btn" href={p.host}>
                {p.name}
              </a>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: "span 12" }}>
          <div style={{ color: "var(--muted)" }}>RECENT</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>
            tu podepniesz audit / alerty / ostatnie komendy
          </div>
        </div>
      </div>
      ) : activeView === "publishing" ? (
        <React.Suspense fallback={<div>Loading...</div>}>
           <PublishingView />
        </React.Suspense>
      ) : (
        <React.Suspense fallback={<div>Loading...</div>}>
           <OperationsView />
        </React.Suspense>
      )}
    </AppShell>
  );
}

// Lazy load to avoid cycle deps if any (though none here)
import { PublishingView } from "./features/publishing/PublishingView";
import { OperationsView } from "./features/operations/OperationsView";


