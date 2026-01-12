import React from "react";
import { api } from "@jimbo77/core/api";
import { SystemStats, Project, CommandIn } from "@jimbo77/core/types";
import { DangerConfirmModal, ServiceLogsDrawer } from "@jimbo77/ui";

const REFRESH_INTERVAL = 5000;

export function OperationsView() {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Restart Logic State
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<any>(null);
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>({});
  const [now, setNow] = React.useState(Date.now());

  // Logs Logic State
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [logsUrl, setLogsUrl] = React.useState<string | null>(null);
  const [logsTitle, setLogsTitle] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
        try {
            const [s, p] = await Promise.all([
                api.analyticsSystem(),
                api.projects()
            ]);
            setStats(s);
            setProjects(p);
        } catch (e) {
            console.error("Ops fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    
    return () => {
        clearInterval(interval);
        clearInterval(tick);
    }
  }, []);

  // Cooldown helper
  const getCooldown = (id: string) => Math.max(0, (cooldowns[id] || 0) - now);

  // Restart Handlers
  const openRestart = (service: any, project: Project) => {
      setSelectedService({ ...service, projectId: project.id });
      setModalOpen(true);
  }

  const openLogs = (service: any, project: Project) => {
      const baseUrl = import.meta.env.VITE_API_BASE || "https://api.ops.jimbo77.org";
      setLogsUrl(`${baseUrl}/v1/projects/${project.id}/services/${service.id}/logs`);
      setLogsTitle(`${service.label} (${service.target})`);
      setLogsOpen(true);
  }

  const doRestart = async (reason: string) => {
      if (!selectedService) return;
      const s = selectedService;
      setBusyId(s.id);
      try {
          // Idempotency key gen
          const idemKey = crypto.randomUUID();
          
          const payload: CommandIn = {
              projectId: s.projectId,
              action: "service.restart",
              target: s.id,
              params: {},
              reason: reason
          };
          
          await api.command(payload, idemKey);
          
          // Set 30s cooldown
          setCooldowns(prev => ({ ...prev, [s.id]: Date.now() + 30000 }));
          setModalOpen(false);
      } catch (err: any) {
          alert("Command Failed: " + err.message);
      } finally {
          setBusyId(null);
          setSelectedService(null);
      }
  }


  if (loading && !stats) return <div className="card">Loading telemetry...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 50 }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ margin: 0, letterSpacing: "2px" }}>UNIFIED OPERATIONS</h2>
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, fontFamily: "monospace", color: "var(--muted)" }}>
          <span>PLATFORM: {stats?.platform.toUpperCase() ?? "UNKNOWN"}</span>
          <span>UPTIME: {stats?.uptime_human ?? "-"}</span>
          <span>TS: {stats?.timestamp ?? new Date().toISOString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid">
        <MetricCard 
          label="CPU LOAD" 
          value={`${stats?.cpu_percent ?? 0}%`} 
          status={getStatus(stats?.cpu_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="MEMORY RAM" 
          value={`${stats?.memory_percent ?? 0}%`} 
          sub={stats ? `${stats.memory_used_gb}GB / ${stats.memory_total_gb}GB` : "-"}
          status={getStatus(stats?.memory_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="DISK SPACE" 
          value={`${stats?.disk_percent ?? 0}%`} 
          status={getStatus(stats?.disk_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="MANAGED SERVICES" 
          value={projects.reduce((acc, p) => acc + (p.services?.length || 0), 0).toString()} 
          status="good" 
        />
      </div>

        {/* Services / Projects List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {projects.map(p => (
                <div key={p.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                        <div style={{ fontWeight: "bold", color: "var(--text)" }}>{p.name.toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>HOST: {p.host}</div>
                    </div>
                    
                    <div style={{ display: "grid", gap: 10 }}>
                        {p.services.length === 0 && <div style={{ fontSize: 12, color: "var(--faint)" }}>No services configured.</div>}
                        {p.services.map(s => {
                            const cd = getCooldown(s.id);
                            const isBusy = busyId === s.id;
                            return (
                                <div key={s.id} style={{ 
                                    background: "rgba(255,255,255,0.03)", 
                                    padding: 10, 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center",
                                    border: "1px solid var(--line)"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: "bold", fontSize: 14 }}>{s.label}</div>
                                        <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
                                            ID: {s.id} | AGENT: {s.agentId} | TARGET: {s.target}
                                        </div>
                                    </div>
                                    <button 
                                        className="btn"
                                        onClick={() => openLogs(s, p)}
                                        style={{ 
                                            marginRight: 8,
                                            fontSize: 12,
                                            height: 32,
                                            background: "rgba(255,255,255,0.05)",
                                            color: "var(--fg)"
                                        }}
                                    >
                                        LOGS
                                    </button>
                                    <button 
                                        className="btn"
                                        disabled={isBusy || cd > 0}
                                        onClick={() => openRestart(s, p)}
                                        style={{ 
                                            borderColor: (isBusy || cd > 0) ? "transparent" : "var(--warn)",
                                            color: (isBusy || cd > 0) ? "var(--muted)" : "var(--warn)",
                                            fontSize: 12,
                                            height: 32,
                                            minWidth: 100,
                                            justifyContent: "center"
                                        }}
                                    >
                                        {isBusy ? "REQ..." : cd > 0 ? `${Math.ceil(cd/1000)}s` : "RESTART"}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
            {projects.length === 0 && !loading && <div className="card">No projects found in configuration.</div>}
        </div>

      {/* External Assets */}
      <div className="card">
        <h3>EXTERNAL ASSETS</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 10 }}>
            <AssetCard name="MyBonzo AI Blog" url="https://www.mybonzoaiblog.com" />
            <AssetCard name="Dev.to Profile" url="https://dev.to/karol_81a50ed396508bcffd7" />
            <AssetCard name="Twitter/X" url="https://twitter.com" />
            <AssetCard name="Cloudflare Dashboard" url="https://dash.cloudflare.com" />
        </div>
      </div>

      <DangerConfirmModal 
        open={modalOpen}
        title={selectedService ? `RESTART SERVICE: ${selectedService.label}` : "Confirm Action"}
        warning="This action will force a restart of the service container. Service downtime may occur."
        confirmWord="RESTART"
        confirmButtonLabel="CONFIRM RESTART"
        busy={!!busyId}
        onCancel={() => setModalOpen(false)}
        onConfirm={doRestart}
      />

      <ServiceLogsDrawer
        open={logsOpen}
        title={logsTitle}
        url={logsUrl}
        onClose={() => setLogsOpen(false)}
      />
    </div>
  );
}

function MetricCard({ label, value, sub, status }: { label: string; value: string; sub?: string; status: "good" | "warn" | "bad" }) {
  const color = status === "good" ? "var(--hot)" : status === "warn" ? "var(--warn)" : "var(--bad)";
  return (
    <div className="card" style={{ textAlign: "center", borderTop: `2px solid ${color}` }}>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: "900", color: "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AssetCard({ name, url }: { name: string; url: string }) {
    return (
        <a href={url} target="_blank" rel="noreferrer" className="btn" style={{ justifyContent: "center", height: 60, flexDirection: "column", gap: 4 }}>
            <span>{name}</span>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>{new URL(url).hostname}</span>
        </a>
    )
}

function getStatus(val: number, warn: number, bad: number) {
    if (val >= bad) return "bad";
    if (val >= warn) return "warn";
    return "good";
}
