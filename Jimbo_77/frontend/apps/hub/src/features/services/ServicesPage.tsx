import React from "react";
import { api } from "@jimbo77/core/api";
import { can } from "@jimbo77/core/rbac";
import type { CommandIn, Project } from "@jimbo77/core/types";
import { DangerConfirmModal } from "@jimbo77/ui/components/DangerConfirmModal";

function idemKey() {
  return crypto.randomUUID();
}

export function ServicesPage(props: {
  projects: Project[];
  me?: { email: string; role: any } | null;
  onCommand: (id: string) => void;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<{ projectId: string; service: any } | null>(null);

  const handleRestartClick = (projectId: string, service: any) => {
      setSelectedService({ projectId, service });
      setModalOpen(true);
  };

  const confirmRestart = async (reason: string) => {
    if (!selectedService || !props.me) return;
    const { projectId, service } = selectedService;
    
    setModalOpen(false);
    setBusyId(service.id);
    
    try {
      const payload: CommandIn = {
        projectId,
        action: "service.restart",
        target: service.id,
        params: {},
        reason: reason.trim(),
      };
      const out = await api.command(payload, idemKey());
      props.onCommand(out.id);
    } catch (e) {
        console.error(e);
        alert("Failed to send command");
    } finally {
      setBusyId(null);
      setSelectedService(null);
    }
  };

  return (
    <div className="grid">
      <DangerConfirmModal 
        open={modalOpen} 
        title={`Restart ${selectedService?.service.label}?`}
        warning={`This will restart the service '${selectedService?.service.id}' on agent '${selectedService?.service.agentId}'.`}
        confirmWord="RESTART"
        confirmButtonLabel="CONFIRM RESTART"
        onConfirm={confirmRestart}
        onCancel={() => setModalOpen(false)}
      />

      <div className="panel" style={{ gridColumn: "span 12" }}>
        <div className="panel-header">
           <h3>ALL SERVICES</h3>
           <span className="badge active">Unified View</span>
        </div>
        <div className="panel-body">
           <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
             {props.projects.flatMap(p => 
                p.services.map(s => (
                    <div key={`${p.id}-${s.id}`} className="service-card">
                       <div className="service-icon">?</div>
                       <div className="service-info">
                           <h4>{s.label}</h4>
                           <p>Project: {p.name}</p>
                           <div style={{ fontSize: 10, color: "var(--faint)", fontFamily: "var(--mono)", marginTop: 4 }}>
                               ID: {s.id} · AGENT: {s.agentId} · TARGET: {s.target}
                           </div>
                       </div>
                       <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                           <button 
                             className="service-btn"
                             disabled={busyId === s.id || !props.me || !can(props.me.role, "service.restart")}
                             onClick={() => handleRestartClick(p.id, s)}
                           >
                              {busyId === s.id ? "WORKING..." : "RESTART"}
                           </button>
                       </div>
                    </div>
                ))
             )}
             {props.projects.every(p => p.services.length === 0) && (
                 <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                     No services found in configuration.
                 </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
