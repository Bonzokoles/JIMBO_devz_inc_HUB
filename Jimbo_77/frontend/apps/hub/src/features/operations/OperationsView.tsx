import React from "react";
import { api } from "@jimbo77/core/api";
import { SystemStats } from "@jimbo77/core/types";

export function OperationsView() {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = () => {
      api.analyticsSystem()
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return <div className="card">Loading telemetry...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ margin: 0 }}>UNIFIED OPERATIONS</h2>
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, fontFamily: "monospace", color: "var(--muted)" }}>
          <span>PLATFORM: {stats?.platform.toUpperCase()}</span>
          <span>UPTIME: {stats?.uptime_human}</span>
          <span>TS: {stats?.timestamp}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid">
        <MetricCard 
          label="CPU LOAD" 
          value={`${stats?.cpu_percent}%`} 
          status={getStatus(stats?.cpu_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="MEMORY RAM" 
          value={`${stats?.memory_percent}%`} 
          sub={`${stats?.memory_used_gb}GB / ${stats?.memory_total_gb}GB`}
          status={getStatus(stats?.memory_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="DISK SPACE" 
          value={`${stats?.disk_percent}%`} 
          status={getStatus(stats?.disk_percent || 0, 80, 90)} 
        />
        <MetricCard 
          label="SERVICES" 
          value="ON" 
          status="good" 
        />
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
