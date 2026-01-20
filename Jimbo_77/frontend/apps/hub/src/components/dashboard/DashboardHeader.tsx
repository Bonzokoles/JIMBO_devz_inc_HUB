import React from "react";

export const DashboardHeader: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        padding: "40px 0 20px 0",
        position: "relative",
        minHeight: 160,
      }}
    >
      <img
        src="/apple-touch-icon.png"
        alt="Logo"
        style={{
          width: 100,
          height: 100,
          filter: "drop-shadow(0 0 20px rgba(255, 51, 51, 0.8))",
        }}
      />
      <div style={{ textAlign: "left" }}>
        <h2
          style={{
            margin: 0,
            letterSpacing: "4px",
            fontFamily: "var(--font-brand)",
            fontSize: 72,
            lineHeight: 1,
            textShadow: "0 0 10px rgba(255,255,255,0.1)",
          }}
        >
          the open computa operations V2.2
        </h2>
        <div
          style={{
            marginTop: 10,
            fontSize: 24,
            color: "var(--muted)",
            fontFamily: "var(--font-brand)",
            letterSpacing: "2px",
            opacity: 0.8,
          }}
        >
          Central Operations Dashboard - Jimbo77 Systems
        </div>
      </div>
    </div>
  );
};
