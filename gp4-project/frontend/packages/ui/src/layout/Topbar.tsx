import React from "react";

export function Topbar(props: {
  title: string;
  env: string;
  userEmail?: string;
  role?: string;
  globalOk?: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <b>JIMBO77</b>
          <span style={{ color: "var(--muted)" }}>/ {props.title}</span>
          <span className={`pill ${props.globalOk ? "pillOk" : "pillBad"}`}>
            {props.globalOk ? "CORE OK" : "CORE DOWN"}
          </span>
          <span className="pill">{props.env}</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="pill">{props.role ?? "unknown-role"}</span>
          <span className="pill">{props.userEmail ?? "unknown-user"}</span>
          <a className="btn" href="https://hub.ops.jimbo77.org">HUB</a>
        </div>
      </div>
    </header>
  );
}
