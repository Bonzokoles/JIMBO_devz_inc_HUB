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
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--danger)", letterSpacing: ".06em" }}>DANGER</div>
            <div style={{ marginTop: 6, fontSize: 14 }}>{props.title}</div>
          </div>
          <button className="btn" onClick={props.onCancel} disabled={props.busy}>
            CLOSE
          </button>
        </div>

        <div style={{ marginTop: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          {props.warning}
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>TYPE TO CONFIRM</div>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={props.confirmWord}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border: "1px solid var(--line)",
                background: "rgba(10,18,32,.35)",
                color: "var(--fg)",
                fontFamily: "var(--mono)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>REASON (min 5 chars)</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="why are we doing this?"
              rows={4}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                border: "1px solid var(--line)",
                background: "rgba(10,18,32,.35)",
                color: "var(--fg)",
                fontFamily: "var(--mono)",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={props.onCancel} disabled={props.busy}>
            CANCEL
          </button>
          <button
            className="btn"
            style={{ borderColor: "rgba(255,59,87,.65)" }}
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
