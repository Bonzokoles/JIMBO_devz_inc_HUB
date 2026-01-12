import React from "react";
import { api } from "@jimbo77/core/api";
import { can } from "@jimbo77/core/rbac";
import type { CommandIn } from "@jimbo77/core/types";
import { DangerConfirmModal } from "@jimbo77/ui";

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

      // cooldown per service: 20s
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
