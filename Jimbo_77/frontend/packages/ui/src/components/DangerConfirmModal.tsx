import React from "react";

type Props = {
  open: boolean;
  title: string;
  warning: string;
  confirmWord: string;          // np. "RESTART"
  confirmButtonLabel?: string;  // np. "CONFIRM RESTART"
  busy?: boolean;

  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export function DangerConfirmModal(props: Props) {
  const [typed, setTyped] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (props.open) {
      setTyped("");
      setReason("");
    }
  }, [props.open]);

  if (!props.open) return null;

  const canConfirm =
    typed.trim().toUpperCase() === props.confirmWord.toUpperCase() &&
    reason.trim().length >= 5 &&
    !props.busy;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
      onMouseDown={(e) => {
        // klik poza modalem zamyka
        if (e.target === e.currentTarget) props.onCancel();
      }}
    >
      <div
        className="card"
        style={{
          width: "min(720px, 100%)",
          borderColor: "rgba(255,59,87,.55)",
          background: "rgba(10,12,16,.96)",
          // basic card styles in case globally not available here
          padding: "20px",
          border: "1px solid rgba(255, 59, 87, 0.3)",
          color: "#eee"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--danger, #ff3b57)", letterSpacing: ".06em", fontWeight: "bold" }}>DANGER</div>
            <div style={{ marginTop: 6, fontSize: 14 }}>{props.title}</div>
          </div>
          <button className="btn" onClick={props.onCancel} disabled={props.busy} style={{padding: "6px 12px", background: "transparent", border: "1px solid #444", color: "#ccc", cursor: "pointer"}}>
            CLOSE
          </button>
        </div>

        <div style={{ marginTop: 12, color: "var(--muted, #888)", lineHeight: 1.6 }}>
          {props.warning}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: "var(--muted, #888)", fontSize: 12 }}>TYPE TO CONFIRM</div>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={props.confirmWord}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border: "1px solid var(--line, #333)",
                background: "rgba(10,18,32,.35)",
                color: "var(--fg, #eee)",
                fontFamily: "var(--mono, monospace)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ color: "var(--muted, #888)", fontSize: 12 }}>REASON (min 5 chars)</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are we doing this?"
              rows={4}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border: "1px solid var(--line, #333)",
                background: "rgba(10,18,32,.35)",
                color: "var(--fg, #eee)",
                fontFamily: "var(--mono, monospace)",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={props.onCancel} disabled={props.busy} style={{padding: "8px 16px", background: "transparent", border: "1px solid #444", color: "#eee", cursor: "pointer"}}>
            CANCEL
          </button>
          <button
            className="btn"
            style={{ 
                borderColor: "rgba(255,59,87,.65)", 
                padding: "8px 16px", 
                background: canConfirm ? "rgba(255,59,87,.2)" : "transparent",
                border: "1px solid rgba(255,59,87,.65)",
                color: canConfirm ? "#fff" : "#666",
                cursor: canConfirm ? "pointer" : "not-allowed"
            }}
            disabled={!canConfirm}
            onClick={() => props.onConfirm(reason.trim())}
          >
            {props.busy ? "WORKING…" : props.confirmButtonLabel ?? "CONFIRM"}
          </button>
        </div>
      </div>
    </div>
  );
}
