import React from "react";
import { AppShell } from "@jimbo77/ui/layout/AppShell";
import { Topbar } from "@jimbo77/ui/layout/Topbar";
import { CommandDrawer } from "@jimbo77/ui/components/CommandDrawer";
import { api } from "@jimbo77/core/api";
import type { Project } from "@jimbo77/core/types";

// Views
import DashboardView from "./features/dashboard/DashboardView";
import { ServicesPage } from "./features/services/ServicesPage";
import { LoginPage } from "./features/auth/LoginPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeTab, setActiveTab] = React.useState<"dashboards" | "services" | "agents">("dashboards");
  // const [globalOk, setGlobalOk] = React.useState(false); // Unused for now
  
  // Command Drawer State
  const [activeCommandId, setActiveCommandId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    (async () => {
      try {
        const [p] = await Promise.all([api.projects()]);
        setProjects(p);
        // setGlobalOk(g.ok);
      } catch (e) {
        console.error("Failed to load initial data", e);
      }
    })().catch(console.error);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppShell
      topbar={<Topbar title="UNIFIED OPS" />}
    >
      <CommandDrawer commandId={activeCommandId} onClose={() => setActiveCommandId(null)} />

      {/* TABS Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === "dashboards" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboards")}
        >
          DASHBOARDS
        </button>
        <button 
          className={`tab ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          SERVICES
        </button>
         <button 
          className={`tab ${activeTab === "agents" ? "active" : ""}`}
          onClick={() => setActiveTab("agents")}
        >
          AGENTS
        </button>
      </div>

      {activeTab === "dashboards" && (
        <div className="grid">
          {/* Main Dashboard (PUMO Logic port) */}
          <div className="panel" style={{ gridColumn: "span 12" }}>
             <div className="panel-header">
                <h3>MAIN DASHBOARD</h3>
                <span className="badge active">ACTIVE</span>
             </div>
             <div className="panel-body">
                <DashboardView />
             </div>
          </div>
          
          {/* Project Cards */}
          {projects.map(p => (
            <div key={p.id} className="panel">
              <div className="panel-header">
                <div>
                  <div className="label">PROJECT</div>
                  <h3>{p.name}</h3>
                </div>
                <span className="badge">LINKED</span>
              </div>
              <div className="panel-body">
                <a href={p.host} target="_blank" rel="noreferrer" className="service-btn launch" style={{ display: "block", textAlign: "center" }}>
                  OPEN COCKPIT →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "services" && (
        <ServicesPage 
          projects={projects} 
          // Mock ME for now - in real app this comes from api.me()
          me={{ email: "dev@jimbo77.com", role: "owner" }} 
          onCommand={(id) => setActiveCommandId(id)}
        />
      )}

      {activeTab === "agents" && (
        <div className="grid">
           <div className="panel" style={{ gridColumn: "span 12" }}>
             <div className="panel-body" style={{ color: "var(--muted)" }}>
               Agents View coming soon
             </div>
           </div>
        </div>
      )}
    </AppShell>
  );
}
