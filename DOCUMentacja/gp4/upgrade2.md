OK — robimy **danger modal** (wpisz `RESTART` + obowiązkowy reason) + **cooldown** (blokada kliknięć na dany serwis na X sekund po wysłaniu komendy). Poniżej gotowe pliki.

---

# A) UI: komponent `DangerConfirmModal`

## 1) `packages/ui/src/components/DangerConfirmModal.tsx` (NOWY)

```tsx
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
```

## 2) Export w `packages/ui/src/index.ts` (DOPISZ)

```ts
export * from "./components/DangerConfirmModal";
```

---

# B) Front: cooldown + modal w ServicesPage

## 1) `apps/project/src/pages/Services.tsx` (PODMIANA na wersję “pancerną”)

```tsx
import React from "react";
import { api } from "@core/api";
import { can } from "@core/rbac";
import type { CommandIn } from "@core/types";
import { DangerConfirmModal } from "@ui";

function idemKey() {
  return crypto.randomUUID();
}

type Cooldowns = Record<string, number>; // serviceId -> unix ms until enabled

export function ServicesPage(props: {
  projectId: string;
  me: { email: string; role: any } | null;
  onCommand: (id: string) => void;
}) {
  const [project, setProject] = React.useState<any>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [cooldowns, setCooldowns] = React.useState<Cooldowns>({});
  const [now, setNow] = React.useState(Date.now());

  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<any>(null);

  // tick do odświeżania countdown
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  React.useEffect(() => {
    (async () => {
      const p = await fetch(`${import.meta.env.VITE_API_BASE}/v1/projects/${props.projectId}`, { credentials: "include" });
      if (!p.ok) throw new Error(`projects/${props.projectId} ${p.status}`);
      setProject(await p.json());
    })().catch(console.error);
  }, [props.projectId]);

  function openRestart(service: any) {
    setSelectedService(service);
    setModalOpen(true);
  }

  function cooldownLeftMs(serviceId: string) {
    const until = cooldowns[serviceId] ?? 0;
    return Math.max(0, until - now);
  }

  async function doRestart(reason: string) {
    if (!props.me || !selectedService) return;
    if (!can(props.me.role, "service.restart")) return;

    const service = selectedService;
    setBusyId(service.id);
    try {
      const payload: CommandIn = {
        projectId: props.projectId,
        action: "service.restart",
        target: service.id, // ✅ serviceId
        params: {},
        reason,
      };

      const out = await api.command(payload, idemKey());
      props.onCommand(out.id);

      // cooldown per service: np. 20s (ustaw jak chcesz)
      const cooldownMs = 20_000;
      setCooldowns((c) => ({ ...c, [service.id]: Date.now() + cooldownMs }));
      setModalOpen(false);
    } finally {
      setBusyId(null);
    }
  }

  if (!project) return <div className="card">loading project config…</div>;

  const canRestart = !!props.me && can(props.me.role, "service.restart");

  return (
    <>
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div style={{ color: "var(--muted)" }}>SERVICES</div>

          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {(project.services ?? []).map((s: any) => {
              const left = cooldownLeftMs(s.id);
              const disabled = !canRestart || busyId === s.id || left > 0;

              return (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid var(--line)",
                    padding: 10,
                    background: "rgba(10,18,32,.25)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <b>{s.label}</b>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                      id: {s.id} · agent: {s.agentId} · target: {s.target}
                    </div>
                    {left > 0 && (
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
                        cooldown: {Math.ceil(left / 1000)}s
                      </div>
                    )}
                  </div>

                  <button
                    className="btn"
                    style={{ borderColor: disabled ? "var(--line)" : "rgba(255,59,87,.55)" }}
                    disabled={disabled}
                    onClick={() => openRestart(s)}
                  >
                    {busyId === s.id ? "WORKING…" : left > 0 ? "COOLDOWN" : "RESTART"}
                  </button>
                </div>
              );
            })}

            {(project.services ?? []).length === 0 && <div style={{ color: "var(--muted)" }}>no services configured</div>}
          </div>
        </div>
      </div>

      <DangerConfirmModal
        open={modalOpen}
        title={selectedService ? `Restart: ${selectedService.label}` : "Restart"}
        warning={
          selectedService
            ? `This will restart the docker container "${selectedService.target}" on agent "${selectedService.agentId}". 
It can cause downtime. If you don't know why you're doing it, close this window.`
            : "This action can cause downtime."
        }
        confirmWord="RESTART"
        confirmButtonLabel="CONFIRM RESTART"
        busy={!!busyId}
        onCancel={() => {
          if (!busyId) {
            setModalOpen(false);
            setSelectedService(null);
          }
        }}
        onConfirm={doRestart}
      />
    </>
  );
}
```

---

# C) Drobna zmiana w `apps/project/src/App.tsx`

Upewnij się, że masz import `CommandDrawer` i render drawer (jeśli już wdrożyłeś wcześniej).

### Importy:

```tsx
import { CommandDrawer } from "@ui/components/CommandDrawer"; // lub: import { CommandDrawer } from "@ui";
import { ServicesPage } from "./pages/Services";
```

### State:

```tsx
const [activeCommandId, setActiveCommandId] = React.useState<string | null>(null);
const [tab, setTab] = React.useState<"overview" | "services">("overview");
```

### Render:

```tsx
{tab === "services" && (
  <ServicesPage
    projectId={projectId}
    me={me}
    onCommand={(id) => setActiveCommandId(id)}
  />
)}

<CommandDrawer commandId={activeCommandId} onClose={() => setActiveCommandId(null)} />
```

---

# D) Backend: “reason” obowiązkowy (żeby UI nie był jedyną barierą)

W `POST /v1/commands` dodaj walidację dla akcji destrukcyjnych:

```python
if payload.action in ("service.restart", "deploy.run"):
    if not payload.reason or len(payload.reason.strip()) < 5:
        raise HTTPException(400, "reason_required_min_5")
```

To jest ważne: UI da się obejść.

---

# E) Bonus (opcjonalny, ale przydatny): cooldown po stronie backendu

Jeśli chcesz “twardo”, możesz dodać w API limit:

* np. “nie restartuj tego samego serviceId częściej niż raz na 20s”
  To robi się przez szybki Redis key: `cooldown:{project}:{target}`.

Jak chcesz, dorzucę to w następnym kroku.

---

Masz teraz:

* potwierdzenie typu “wpisz RESTART”,
* obowiązkowy reason (front + backend),
* cooldown per serwis w UI,
* komenda idzie przez idempotency key i dostajesz timeline w drawer.

Jeśli chcesz domknąć “pancerność”, powiedz jedno: **cooldown ma być tylko UX (UI), czy też twardy na backendzie?**
