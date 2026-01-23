import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { AgentSwarm } from "../../components/dashboard/AgentSwarm";

interface UnifiedOpsViewProps {
  onOpenPumo?: () => void;
  onOpenControlCenter?: () => void;
  onOpenEastwood?: () => void;
  onOpenMonitoring?: () => void;
  onOpenAnalytics?: () => void;
  onOpenDeployment?: () => void;
}

export function UnifiedOpsView({
  onOpenPumo,
  onOpenControlCenter,
  onOpenEastwood,
  onOpenMonitoring,
  onOpenAnalytics,
  onOpenDeployment,
}: UnifiedOpsViewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingBottom: 50,
      }}
    >
      {/* 1. Header Section */}
      <DashboardHeader />

      {/* 2. Main Dashboard Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {/* Card 1: Workers Monitoring */}
        <KpiCard
          subtitle="CLOUDFLARE"
          title="WORKERS MONITORING"
          icon="⚙️"
          color="#ff8f00"
          mainMetric="35 Workers Real-Time Status"
          subText="Live monitoring, health checks, cost tracking & deployment control"
          buttonText="OPEN MONITORING →"
          onButtonClick={onOpenMonitoring}
        />

        {/* Card 2: Multi-Domain Analytics */}
        <KpiCard
          subtitle="ANALYTICS"
          title="MULTI-DOMAIN ANALYTICS"
          icon="📊"
          color="#9d6aff"
          mainMetric="5 Domains Traffic Analysis"
          subText="Real-time traffic comparison, AI crawler detection & conversion funnels"
          buttonText="OPEN ANALYTICS →"
          onButtonClick={onOpenAnalytics}
        />

        {/* Card 3: Deployment Control Panel */}
        <KpiCard
          subtitle="GITHUB ACTIONS"
          title="DEPLOYMENT CONTROL PANEL"
          icon="🚀"
          color="#6affb8"
          mainMetric="8 Repos Deployment Manager"
          subText="Manual deploys, rollbacks, secrets management & GitHub Actions status"
          buttonText="OPEN DEPLOYMENT →"
          onButtonClick={onOpenDeployment}
        />

        {/* Card 4: Control Center */}
        <KpiCard
          subtitle="PORT 4569"
          title="CONTROL CENTER"
          icon="⚙️"
          color="#10a6ff" // var(--cold) approx
          mainMetric="Server Control"
          subText="Process management, service restart and system control"
          buttonText="OPEN CONTROLS →"
          onButtonClick={onOpenControlCenter}
        />

        {/* Card 5: PUMO Diagnostic Hub */}
        <KpiCard
          subtitle="ANALYTICS"
          title="PUMO DIAGNOSTIC HUB"
          icon="📊"
          color="#7cffb2" // var(--hot) approx
          mainMetric="Business Intelligence"
          subText="Revenue tracking, traffic analysis, and conversion metrics"
          buttonText="OPEN DASHBOARD (LEGACY) →"
          onButtonClick={() => {
            console.log("Opening PUMO...");
            window.open("/pumo-dashboard.html", "_blank");
            if (onOpenPumo) onOpenPumo();
          }}
        />

        {/* Card 6: Advanced Matrix (Coming Soon) */}
        <KpiCard
          subtitle="PORT 4575"
          title="ADVANCED MATRIX"
          icon="🎯"
          color="#10a6ff"
          mainMetric="Matrix Dashboard"
          subText="Advanced system view with GPU monitoring and visualizations"
          buttonText="COMING SOON"
          isDisabled={true}
        />

        {/* Card 7: Library Catalog (Coming Soon) */}
        <KpiCard
          subtitle="PORT 6030"
          title="LIBRARY CATALOG"
          icon="📚"
          color="#7cffb2"
          mainMetric="Unified Libraries"
          subText="Catalog of all 60 libraries (51k+ files) - Control Center + Eastwood DEVZ"
          buttonText="COMING SOON"
          isDisabled={true}
        />

        {/* Card 8: Eastwood DEVZ */}
        <KpiCard
          subtitle="PORT 6062"
          title="EASTWOOD DEVZ"
          icon="💼"
          color="#7cffb2" // Assuming same hot green color from original or close to it
          mainMetric="Business Intelligence Libs"
          subText="AI Agents: Retention, Idea, Shadow, Trend + Money Machine (52 ideas)"
          buttonText="OPEN EASTWOOD →"
          onButtonClick={onOpenEastwood}
        />

      </div>

      {/* 4. Agents Swarm Grid */}
      <AgentSwarm crawlerHits={1420} />
    </div>
  );
}
