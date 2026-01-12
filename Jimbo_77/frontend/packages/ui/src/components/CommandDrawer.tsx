import React from "react";
import { api } from "@jimbo77/core/api";

type Props = {
  commandId: string | null;
  onClose: () => void;
};

function isDone(status?: string) {
  return status === "succeeded" || status === "failed" || status === "canceled";
}

export function CommandDrawer({ commandId, onClose }: Props) {
  const [cmd, setCmd] = React.useState<any>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!commandId) return;

    let alive = true;
    setCmd(null);
    setEvents([]);
    setError(null);

    const tick = async () => {
      try {
        const [c, ev] = await Promise.all([
          api.commandGet(commandId),
          api.commandEvents(commandId),
        ]);
        if (!alive) return;
        setCmd(c);
        setEvents(ev);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message ?? e));
      }
    };

    tick();

    const interval = window.setInterval(async () => {
      await tick();
    }, 1500);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [commandId]);

  if (!commandId) return null;

  const status = cmd?.status ?? "loading";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 420,
        background: "rgba(5,7,10,.92)",
        borderLeft: "1px solid var(--line)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ color: "var(--muted)" }}>COMMAND</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>{commandId}</div>
          <div style={{ marginTop: 8 }}>
            <span className={`pill ${status === "succeeded" ? "pillOk" : status === "failed" ? "pillBad" : ""}`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>
        <button className="btn" onClick={onClose}>CLOSE</button>
      </div>

      <div style={{ padding: 12, overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <div className="card" style={{ borderColor: "rgba(255,59,87,.55)" }}>
            <div style={{ color: "var(--danger)" }}>ERROR</div>
            <div style={{ marginTop: 8, color: "var(--muted)" }}>{error}</div>
          </div>
        )}

        <div className="card">
          <div style={{ color: "var(--muted)" }}>DETAILS</div>
          <div style={{ marginTop: 10, lineHeight: 1.6, color: "var(--muted)" }}>
            <div>project: <span style={{ color: "var(--fg)" }}>{cmd?.projectId ?? "-"}</span></div>
            <div>action: <span style={{ color: "var(--fg)" }}>{cmd?.action ?? "-"}</span></div>
            <div>target: <span style={{ color: "var(--fg)" }}>{cmd?.target ?? "-"}</span></div>
            <div>attempt: <span style={{ color: "var(--fg)" }}>{cmd?.attempt ?? "-"}</span> / {cmd?.maxAttempts ?? "-"}</div>
            <div>by: <span style={{ color: "var(--fg)" }}>{cmd?.createdBy ?? "-"}</span></div>
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--muted)" }}>EVENTS</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {events.length === 0 && <div style={{ color: "var(--muted)" }}>no events yet</div>}
            {events.map((e) => (
              <div key={e.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(10,18,32,.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <b style={{ fontSize: 12 }}>{String(e.type).toUpperCase()}</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{e.ts}</span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)" }}>{e.message}</div>
              </div>
            ))}
          </div>
        </div>

        {isDone(status) && (
          <div className="card" style={{ borderColor: "rgba(65,255,154,.25)" }}>
            <div style={{ color: "var(--muted)" }}>DONE</div>
            <div style={{ marginTop: 8, color: "var(--muted)" }}>
              command finished. you can close this drawer.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
