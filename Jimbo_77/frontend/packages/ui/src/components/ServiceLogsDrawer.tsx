import React from "react";

type Props = {
  open: boolean;
  title: string;
  url: string | null;          // pełny URL do API endpoint
  onClose: () => void;
};

export function ServiceLogsDrawer({ open, title, url, onClose }: Props) {
  const [text, setText] = React.useState<string>("");
  const [err, setErr] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<number>(200);
  const [poll, setPoll] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!open) return;
    setText("");
    setErr(null);
  }, [open]);

  React.useEffect(() => {
    if (!open || !url) return;
    let alive = true;

    async function load() {
      if (!url) return; // Guard against null
      try {
        setErr(null);
        // Append query params
        const u = new URL(url);
        u.searchParams.set("lines", String(lines));
        u.searchParams.set("timestamps", "true");

        // Use credentials: include if API requires auth
        const r = await fetch(u.toString(), { credentials: "include" });
        if (!r.ok) throw new Error(`logs ${r.status}`);
        const data = await r.json();
        
        if (!alive) return;
        setText(data.text ?? "");
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      }
    }

    load();
    const t = window.setInterval(() => {
      if (poll) load();
    }, 3000);

    return () => { alive = false; window.clearInterval(t); };
  }, [open, url, lines, poll]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, height: "100vh", width: "min(600px, 90vw)",
      background: "rgba(5,7,10,.96)", borderLeft: "1px solid var(--line)",
      zIndex: 1000, display: "flex", flexDirection: "column",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
    }}>
      <div style={{ padding: 12, borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "1px" }}>LOGS VIEWER</div>
          <div style={{ marginTop: 4, fontWeight: "bold", color: "#eee" }}>{title}</div>
        </div>
        <button className="btn" onClick={onClose} style={{ border: "1px solid #444", background: "transparent", color: "#ccc", cursor: "pointer", padding: "4px 8px" }}>CLOSE</button>
      </div>

      <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
        <label style={{ color: "var(--muted)", fontSize: 12 }}>LINES</label>
        <input
          type="number"
          value={lines}
          min={10}
          max={2000}
          onChange={(e) => setLines(Math.max(10, Math.min(2000, Number(e.target.value) || 200)))}
          style={{
            width: 80, padding: 6, border: "1px solid var(--line)",
            background: "rgba(0,0,0,.5)", color: "var(--fg)", outline: "none", fontSize: 12
          }}
        />
        <button className="btn" onClick={() => setPoll((p) => !p)} style={{ fontSize: 11, padding: "6px 8px", background: poll ? "rgba(65,255,154,.1)" : "transparent", color: poll ? "#41ff9a" : "#888", border: "1px solid var(--line)", cursor: "pointer" }}>
          {poll ? "AUTO: ON" : "AUTO: OFF"}
        </button>
        <button className="btn" onClick={() => { setPoll(false); setTimeout(() => setPoll(true), 0); }} style={{ fontSize: 11, padding: "6px 8px", background: "transparent", border: "1px solid var(--line)", color: "#ccc", cursor: "pointer" }}>
          REFRESH
        </button>
      </div>

      <div style={{ padding: 0, overflow: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {err && (
          <div style={{ padding: 12, borderBottom: "1px solid var(--line)", background: "rgba(255,59,87,.1)" }}>
            <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: "bold" }}>ERROR</div>
            <div style={{ marginTop: 4, color: "#ddd", fontSize: 12 }}>{err}</div>
          </div>
        )}

        <pre style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "var(--mono)",
          fontSize: 11,
          lineHeight: 1.4,
          color: "#ccc",
          padding: 12
        }}>
{text || "waiting for logs..."}
        </pre>
      </div>
    </div>
  );
}
