import "../styles/ops.css";

export function AppShell(props: {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  footer: string;
}) {
  return (
    <div className="app">
      {props.topbar}
      <div className="main">
        <div className="sidebar">{props.sidebar}</div>
        <div className="content">{props.children}</div>
      </div>
      <div className="footer">{props.footer}</div>
    </div>
  );
}
