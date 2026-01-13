import React from "react";
import "../styles/ops.css";

export function AppShell(props: {
  topbar: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      {props.topbar}
      <main className="container">
        {props.children}
      </main>
      <footer>{props.footer ?? "JIMBO UNIFIED CONTROL HUB"}</footer>
    </>
  );
}
