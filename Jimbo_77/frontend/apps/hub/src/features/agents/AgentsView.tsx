import { useState } from "react";
import { AGENT_REGISTRY, type Agent, type AgentType } from "@jimbo77/core/agents/registry";

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  research: "Research",
  analytics: "Analytics",
  system: "System",
  content: "Content",
  automation: "Automation",
  security: "Security",
};

export function AgentsView() {
  const [selectedType, setSelectedType] = useState<AgentType | "all">("all");
  const [agents] = useState<Agent[]>(AGENT_REGISTRY);

  const filteredAgents = selectedType === "all" 
    ? agents 
    : agents.filter(a => a.type === selectedType);

  const handleStart = (id: string) => {
    console.log("Start agent:", id);
    // TODO: API call to start agent
  };

  const handleStop = (id: string) => {
    console.log("Stop agent:", id);
    // TODO: API call to stop agent
  };

  const handleConfigure = (id: string) => {
    console.log("Configure agent:", id);
    // TODO: Open config modal
  };

  return (
    <div style={{ paddingBottom: 50 }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: "var(--cold)", margin: "0 0 10px 0" }}>
          🤖 AGENT SYSTEM
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 11, margin: 0 }}>
          {agents.length} agents • {agents.filter(a => a.status === "active").length} active
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: "flex", 
        gap: 10, 
        marginBottom: 20, 
        flexWrap: "wrap" 
      }}>
        <button
          className="btn"
          onClick={() => setSelectedType("all")}
          style={{
            background: selectedType === "all" ? "var(--cold)" : "var(--panel2)",
            color: selectedType === "all" ? "var(--bg)" : "var(--text)",
          }}
        >
          ALL ({agents.length})
        </button>
        {Object.entries(AGENT_TYPE_LABELS).map(([type, label]) => {
          const count = agents.filter(a => a.type === type).length;
          return (
            <button
              key={type}
              className="btn"
              onClick={() => setSelectedType(type as AgentType)}
              style={{
                background: selectedType === type ? "var(--cold)" : "var(--panel2)",
                color: selectedType === type ? "var(--bg)" : "var(--text)",
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Agent Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
        gap: 20 
      }}>
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="card">
            {/* Agent Header */}
            <div style={{ 
              background: "var(--panel2)", 
              padding: "12px 16px", 
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ 
                  fontSize: 12, 
                  fontWeight: 900, 
                  letterSpacing: 1.5, 
                  margin: 0 
                }}>
                  {agent.name}
                </h3>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
                  {agent.language.toUpperCase()} • {agent.type.toUpperCase()}
                </div>
              </div>
              <span
                style={{
                  padding: "3px 8px",
                  fontSize: 9,
                  fontWeight: 700,
                  background: 
                    agent.status === "active" ? "var(--hot)" :
                    agent.status === "error" ? "var(--bad)" :
                    agent.status === "disabled" ? "var(--faint)" :
                    "var(--cold)",
                  color: agent.status === "disabled" ? "var(--text)" : "var(--bg)",
                }}
              >
                {agent.status.toUpperCase()}
              </span>
            </div>

            {/* Agent Body */}
            <div style={{ padding: 16 }}>
              <p style={{ 
                fontSize: 11, 
                color: "var(--muted)", 
                margin: "0 0 12px 0",
                lineHeight: 1.5
              }}>
                {agent.description}
              </p>

              {/* Capabilities */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ 
                  fontSize: 9, 
                  color: "var(--faint)", 
                  marginBottom: 6,
                  letterSpacing: 1
                }}>
                  CAPABILITIES
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {agent.capabilities.slice(0, 4).map((cap) => (
                    <span
                      key={cap}
                      style={{
                        padding: "2px 6px",
                        fontSize: 9,
                        background: "var(--bg2)",
                        border: "1px solid var(--line)",
                        color: "var(--muted)",
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 4 && (
                    <span
                      style={{
                        padding: "2px 6px",
                        fontSize: 9,
                        color: "var(--faint)",
                      }}
                    >
                      +{agent.capabilities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn"
                  onClick={() => handleStart(agent.id)}
                  disabled={agent.status === "active" || agent.status === "disabled"}
                  style={{ 
                    flex: 1,
                    opacity: agent.status === "active" || agent.status === "disabled" ? 0.5 : 1,
                    cursor: agent.status === "active" || agent.status === "disabled" ? "not-allowed" : "pointer"
                  }}
                >
                  START
                </button>
                <button
                  className="btn"
                  onClick={() => handleStop(agent.id)}
                  disabled={agent.status !== "active"}
                  style={{ 
                    flex: 1,
                    background: agent.status === "active" ? "var(--bad)" : "var(--panel2)",
                    borderColor: agent.status === "active" ? "var(--bad)" : "var(--line)",
                    opacity: agent.status !== "active" ? 0.5 : 1,
                    cursor: agent.status !== "active" ? "not-allowed" : "pointer"
                  }}
                >
                  STOP
                </button>
                <button
                  className="btn"
                  onClick={() => handleConfigure(agent.id)}
                  style={{ flex: 1 }}
                >
                  CONFIG
                </button>
              </div>

              {/* Port Info */}
              {agent.port && (
                <div style={{ 
                  marginTop: 12, 
                  fontSize: 9, 
                  color: "var(--faint)",
                  textAlign: "center"
                }}>
                  PORT: {agent.port}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--muted)" }}>No agents found for this filter</p>
        </div>
      )}
    </div>
  );
}
