

export function Topbar(props: {
  title: string;
}) {
  return (
    <header className="topbar">
      <div className="toprow">
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 280 }}>
          <div style={{
            width: 32, height: 32,
            border: "1px solid rgba(231,236,255,.18)",
            background: "repeating-linear-gradient(90deg, rgba(124,255,178,.4) 0px, transparent 1px, transparent 6px)"
          }} />
          <div>
            <h1 style={{ margin: 0, font: "900 15px/1.1 var(--mono)", letterSpacing: 1.4, color: "var(--text)" }}>
              JIMBO // {props.title}
            </h1>
            <div style={{ marginTop: 3, font: "700 11px/1.1 var(--mono)", letterSpacing: 0.8, color: "var(--muted)" }}>
              UNIFIED OPERATIONS
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(27,37,66,.8)", padding: "7px 10px", background: "rgba(11,15,26,.6)" }}>
            <span style={{ width: 8, height: 8, background: "var(--hot)", boxShadow: "0 0 12px rgba(124,255,178,.35)" }} />
            <span>SYSTEM: <strong style={{ color: "var(--text)" }}>ONLINE</strong></span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, minWidth: 280, justifyContent: "flex-end" }}>
           {/* Actions can modify this later */}
           <button className="btn">REFRESH</button>
        </div>
      </div>
    </header>
  );
}
