import { useState, useEffect } from "react";

type Agent = {
  name: string;
  status: string;
  port: number;
};

type Process = {
  pid: number;
  script: string;
};

const MOCK_AGENTS: Record<string, Agent> = {
  research: { name: "Raphael", status: "READY", port: 6062 },
  content: { name: "Gabriel", status: "READY", port: 6030 },
  graphics: { name: "Uriel", status: "READY", port: 6050 },
  supervisor: { name: "AI Supervisor", status: "ACTIVE", port: 6071 },
};

export function ControlCenterView({ onBack }: { onBack: () => void }) {
  const [agents] = useState<Record<string, Agent>>(MOCK_AGENTS);
  const [processes] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - later connect to real API
    setLoading(false);
    
    // Auto-refresh processes every 5 seconds
    const interval = setInterval(() => {
      // In real implementation: fetch processes from API
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartAgent = (key: string) => {
    console.log("Start agent:", key);
    // TODO: API call to start agent
  };

  const handleStopAgent = (key: string) => {
    console.log("Stop agent:", key);
    // TODO: API call to stop agent
  };

  const handleKillProcess = (pid: number) => {
    if (confirm(`Kill process ${pid}?`)) {
      console.log("Kill process:", pid);
      // TODO: API call to kill process
    }
  };

  const handleRefreshProcesses = () => {
    console.log("Refresh processes");
    // TODO: API call to refresh processes
  };

  return (
    <div style={{ paddingBottom: 50 }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: "var(--cold)", margin: 0 }}>
            ⚡ CONTROL CENTER
          </h1>
          <button className="btn" onClick={onBack}>
            ← BACK TO MAIN
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 11, margin: 0 }}>
          Service and agent control panel
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        
        {/* Agents Panel */}
        <div className="card">
          <div style={{ 
            background: "var(--panel2)", 
            padding: "12px 16px", 
            fontWeight: 900, 
            fontSize: 10, 
            letterSpacing: 1.5,
            borderBottom: "1px solid var(--line)"
          }}>
            AGENTS CONTROL
          </div>
          <div style={{ padding: 16 }}>
            {loading ? (
              <div style={{ color: "var(--muted)" }}>Loading agents...</div>
            ) : (
              Object.entries(agents).map(([key, agent]) => (
                <div
                  key={key}
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--line)",
                    padding: 12,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>
                      {agent.name}
                    </h4>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>
                      Port: {agent.port} | Status:{" "}
                      <span
                        style={{
                          padding: "3px 8px",
                          fontSize: 9,
                          fontWeight: 700,
                          background: agent.status === "ACTIVE" ? "var(--hot)" : "var(--cold)",
                          color: "var(--bg)",
                        }}
                      >
                        {agent.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <button
                      className="btn"
                      onClick={() => handleStartAgent(key)}
                      style={{ marginLeft: 5 }}
                    >
                      START
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleStopAgent(key)}
                      style={{ 
                        marginLeft: 5, 
                        background: "var(--bad)",
                        borderColor: "var(--bad)"
                      }}
                    >
                      STOP
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Processes Panel */}
        <div className="card">
          <div style={{ 
            background: "var(--panel2)", 
            padding: "12px 16px", 
            fontWeight: 900, 
            fontSize: 10, 
            letterSpacing: 1.5,
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>ACTIVE PROCESSES</span>
            <button 
              className="btn" 
              onClick={handleRefreshProcesses}
              style={{ fontSize: 9 }}
            >
              REFRESH
            </button>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {processes.length === 0 ? (
                <div style={{ 
                  background: "var(--bg2)", 
                  border: "1px solid var(--line)", 
                  padding: "8px 10px",
                  fontSize: 10 
                }}>
                  No active Python processes
                </div>
              ) : (
                processes.map((proc) => (
                  <div
                    key={proc.pid}
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--line)",
                      padding: "8px 10px",
                      marginBottom: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                    }}
                  >
                    <span>
                      PID {proc.pid}: {proc.script}
                    </span>
                    <button
                      className="btn"
                      onClick={() => handleKillProcess(proc.pid)}
                      style={{ 
                        background: "var(--bad)",
                        borderColor: "var(--bad)"
                      }}
                    >
                      KILL
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
