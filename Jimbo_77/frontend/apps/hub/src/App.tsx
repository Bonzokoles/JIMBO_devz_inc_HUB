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
import { EastwoodView } from "./features/eastwood/EastwoodView";
import { WorkersMonitoringView } from "./features/monitoring/WorkersMonitoringView";
import { MultiDomainAnalyticsView } from "./features/analytics/MultiDomainAnalyticsView";
import { DeploymentControlView } from "./features/deployment/DeploymentControlView";
import { PublishingView } from "./features/publishing/PublishingView";
import { PumoView } from "./features/pumo/PumoView";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeTab, setActiveTab] = React.useState<
    | "dashboards"
    | "services"
    | "agents"
    | "eastwood"
    | "monitoring"
    | "analytics"
    | "deployment"
    | "publishing"
  >("dashboards");

  // Dashboard Sub-navigation state
  const [currentDashboard, setCurrentDashboard] = React.useState<
    "main" | "pumo" | null
  >("main");
  
  // Command Drawer State
  const [activeCommandId, setActiveCommandId] = React.useState<string | null>(
    null
  );

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
    <AppShell topbar={<Topbar title="UNIFIED OPS" />}>
      <CommandDrawer
        commandId={activeCommandId}
        onClose={() => setActiveCommandId(null)}
      />

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
        <button
          className={`tab ${activeTab === "eastwood" ? "active" : ""}`}
          onClick={() => setActiveTab("eastwood")}
        >
          EASTWOOD
        </button>
        <button
          className={`tab ${activeTab === "monitoring" ? "active" : ""}`}
          onClick={() => setActiveTab("monitoring")}
        >
          MONITORING
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          ANALYTICS
        </button>
        <button
          className={`tab ${activeTab === "deployment" ? "active" : ""}`}
          onClick={() => setActiveTab("deployment")}
        >
          DEPLOYMENT
        </button>
        <button
          className={`tab ${activeTab === "publishing" ? "active" : ""}`}
          onClick={() => setActiveTab("publishing")}
        >
          PUBLISHER 2.0
        </button>
      </div>

      <div style={{ padding: "20px", maxWidth: 1800, margin: "0 auto" }}>
        {activeTab === "dashboards" &&
          (currentDashboard === "pumo" ? (
            <PumoView onBack={() => setCurrentDashboard("main")} />
          ) : (
            <UnifiedOpsView
              onOpenPumo={() => setCurrentDashboard("pumo")}
              onOpenEastwood={() => setActiveTab("eastwood")}
              onOpenMonitoring={() => setActiveTab("monitoring")}
              onOpenAnalytics={() => setActiveTab("analytics")}
              onOpenDeployment={() => setActiveTab("deployment")}
            />
          ))}
        {activeTab === "services" && (
          <ServicesPage
            projects={projects}
            onCommand={(id) => setActiveCommandId(id)}
          />
        )}
        {activeTab === "agents" && <AgentsView />}
        {activeTab === "eastwood" && <EastwoodView />}
        {activeTab === "monitoring" && <WorkersMonitoringView />}
        {activeTab === "analytics" && <MultiDomainAnalyticsView />}
        {activeTab === "deployment" && <DeploymentControlView />}
        {activeTab === "publishing" && <PublishingView />}
      </div>
    </AppShell>
  );
}
