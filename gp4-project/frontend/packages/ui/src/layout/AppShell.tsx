import React from "react";
import "../styles/ops.css";

export function AppShell(props: {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      {props.topbar}
      <div className="main">
        <aside className="sidebar">{props.sidebar}</aside>
        <main className="content">{props.children}</main>
      </div>
      <div className="footer">{props.footer ?? "build: ops-ui"}</div>
    </div>
  );
}
