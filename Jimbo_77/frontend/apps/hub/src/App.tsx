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
import { UnifiedOpsView } from "./features/unified/UnifiedOpsView";
import { ControlCenterView } from "./features/control/ControlCenterView";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeTab, setActiveTab] = React.useState<"dashboards" | "services" | "agents">("dashboards");
  const [dashboardView, setDashboardView] = React.useState<"main" | "pumo" | "control-center">("main");
  
  // Command Drawer State
  const [activeCommandId, setActiveCommandId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    (async () => {
      try {
        const [p] = await Promise.all([api.projects()]);
        setProjects(p);
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

      <div style={{ padding: "20px", maxWidth: 1800, margin: "0 auto" }}>
        {activeTab === "dashboards" && dashboardView === "main" && (
          <UnifiedOpsView 
            onOpenPumo={() => setDashboardView("pumo")}
            onOpenControlCenter={() => setDashboardView("control-center")}
          />
        )}
        {activeTab === "dashboards" && dashboardView === "pumo" && (
          <div>
            <button 
              className="btn" 
              onClick={() => setDashboardView("main")}
              style={{ marginBottom: 20 }}
            >
              ← BACK TO MAIN
            </button>
            <DashboardView />
          </div>
        )}
        {activeTab === "dashboards" && dashboardView === "control-center" && (
          <ControlCenterView onBack={() => setDashboardView("main")} />
        )}
        {activeTab === "services" && <ServicesPage projects={projects} onCommand={(id) => setActiveCommandId(id)} />}
        {activeTab === "agents" && <div className="card">Agents view - Coming soon</div>}
      </div>
    </AppShell>
  );
}
