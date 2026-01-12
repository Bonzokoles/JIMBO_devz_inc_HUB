export function Topbar(props: {
  title: string;
  env: string;
  userEmail?: string;
  role?: string;
  globalOk: boolean;
}) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo">JIMBO77</div>
        <div className="title">{props.title}</div>
      </div>

      <div className="status">
        <span className={`pill ${props.globalOk ? "pillOk" : "pillBad"}`}>
          {props.globalOk ? "OK" : "DOWN"}
        </span>
        <span className="pill">{props.env.toUpperCase()}</span>
      </div>

      {props.userEmail && (
        <div className="user">
          <div>{props.userEmail}</div>
          {props.role && <div style={{ fontSize: 12, color: "var(--muted)" }}>{props.role}</div>}
        </div>
      )}
    </div>
  );
}
