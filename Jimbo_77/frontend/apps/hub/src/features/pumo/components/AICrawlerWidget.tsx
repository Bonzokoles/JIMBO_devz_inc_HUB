import { useState, useEffect } from "react";
import { D1BotLog } from "./types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BotStats {
  summary: {
    total_hits: number;
    unique_bots_24h: number;
  };
  by_type: Array<{ bot_type: string; count: number }>;
  recent_logs: D1BotLog[];
  history?: Array<{ day: string; count: number }>;
}

export function AICrawlerWidget() {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/analytics/track-bot");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch crawler stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBotIcon = (type: string) => {
    switch(type) {
      case 'gpt': return '🧠'; 
      case 'claude': return '🤖';
      case 'google': return '🔍';
      case 'bing': return '🌐';
      case 'meta': return '📱';
      default: return '👾';
    }
  };

  return (
    <div className="card">
      <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>REAL-TIME ANALYTICS</div>
           <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>AI CRAWLER ACTIVITY</h3>
        </div>
        {loading && <div style={{ fontSize: 10, color: "var(--brand)" }}>UPDATING...</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Main Stat */}
          <div style={{ padding: 16, background: "rgba(0,0,0,0.2)", borderRadius: 8, textAlign: "center", border: "1px solid var(--line)" }}>
             <div style={{ fontSize: 32, fontWeight: 900, color: "var(--brand)" }}>
               {stats?.summary.total_hits || 0}
             </div>
             <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>TOTAL HITS (ALL TIME)</div>
          </div>

          {/* Types List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
             {stats?.by_type.slice(0, 3).map((bot) => (
               <div key={bot.bot_type} style={{ display: "flex", alignItems: "center", fontSize: 12, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{getBotIcon(bot.bot_type)}</span>
                    <span style={{ textTransform: 'capitalize' }}>{bot.bot_type}</span>
                  </div>
                  <span style={{ fontWeight: "bold" }}>{bot.count}</span>
               </div>
             ))}
             {(!stats?.by_type || stats.by_type.length === 0) && (
               <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>No specific bot data yet</div>
             )}
          </div>
      </div>

        {/* Chart Section */}
        {stats?.history && stats.history.length > 0 && (
          <div style={{ height: "150px", marginTop: "20px" }}>
            <Line
              data={{
                labels: stats.history.map(h => h.day.substring(5)), // MM-DD
                datasets: [
                  {
                    label: "Bot Hits",
                    data: stats.history.map(h => h.count),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { 
                    backgroundColor: "#1e293b",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    borderColor: "#334155",
                    borderWidth: 1
                  }
                },
                scales: {
                  x: { 
                    grid: { display: false, color: "#334155" },
                    ticks: { color: "#94a3b8", font: { size: 10 } }
                  },
                  y: { 
                    grid: { color: "#334155", tickLength: 5 },
                    ticks: { color: "#94a3b8", font: { size: 10 } },
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        )}

        <div style={{ marginTop: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Recent Activity</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats?.recent_logs.map((log, i) => (
              <div key={i} style={{ 
                display: "flex", 
                justifyContent: "space-between",
                fontSize: "12px",
                padding: "8px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "4px"
              }}>
                <span style={{ color: "var(--primary)" }}>{log.bot_type}</span>
                <span style={{ color: "var(--muted)" }}>{log.path}</span>
                <span style={{ color: "#666" }}>
                   {new Date(typeof log.timestamp === 'string' ? log.timestamp : Number(log.timestamp)).toLocaleTimeString()}
                </span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
