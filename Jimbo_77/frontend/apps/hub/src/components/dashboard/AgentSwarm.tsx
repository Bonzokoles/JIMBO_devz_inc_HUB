import React from "react";

export const AgentSwarm: React.FC = () => {
  const agents = [
    { name: "JIMBO (Master)", iconClass: "lni lni-crown-3" },
    { name: "BRAIN (Strategy)", iconClass: "lni lni-bulb-4" },
    { name: "PINKY (Edgecases)", iconClass: "lni lni-microscope" },
    { name: "ELWIRKA (Finalize)", iconClass: "lni lni-check-circle-1" },
    { name: "SECURITY (Guard)", iconClass: "lni lni-shield-2-check" },
    { name: "OUTPUT (Format)", iconClass: "lni lni-text-format" },
  ];

  return (
    <div className="card" style={{ padding: 25, gridColumn: "1 / -1" }}>
      <h3
        style={{
          margin: "0 0 20px 0",
          letterSpacing: 1,
          fontSize: 24,
          borderBottom: "1px solid var(--line)",
          paddingBottom: 10,
          fontFamily: "var(--font-brand)",
          color: "#ff3333",
        }}
      >
        🤖 JIMBO77 SYSTEM REDPRINT
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 15,
        }}
      >
        {agents.map((agent) => (
          <button
            key={agent.name}
            className="btn"
            style={{
              justifyContent: "center",
              padding: "15px 10px",
              height: "auto",
              flexDirection: "column",
              gap: 8,
              background: "rgba(0, 255, 65, 0.05)",
              borderColor: "rgba(0, 255, 65, 0.2)",
            }}
          >
            <i className={agent.iconClass} style={{ fontSize: 24 }}></i>
            <span style={{ fontSize: 11, textAlign: "center" }}>{agent.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
