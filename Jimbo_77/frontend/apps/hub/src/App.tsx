import React from "react";
import { AppShell } from "@jimbo77/ui/layout/AppShell";
import { Topbar } from "@jimbo77/ui/layout/Topbar";
import { CommandDrawer } from "@jimbo77/ui/components/CommandDrawer";
import { api } from "@jimbo77/core/api";
import type { Project } from "@jimbo77/core/types";

// Views
import { ServicesPage } from "./features/services/ServicesPage";
import { LoginPage } from "./features/auth/LoginPage";
import { UnifiedOpsView } from "./features/unified/UnifiedOpsView";
import { AgentsView } from "./features/agents/AgentsView";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeTab, setActiveTab] = React.useState<"dashboards" | "services" | "agents">("dashboards");
  
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
        {activeTab === "dashboards" && <UnifiedOpsView />}
        {activeTab === "services" && <ServicesPage projects={projects} onCommand={(id) => setActiveCommandId(id)} />}
        {activeTab === "agents" && <AgentsView />}
      </div>
    </AppShell>
  );
}
