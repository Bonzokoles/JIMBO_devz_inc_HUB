
import { AppShell } from "@jimbo77/ui/layout/AppShell";
import { Topbar } from "@jimbo77/ui/layout/Topbar";
import "../../../packages/ui/src/styles/ops.css"; // Import styles directly or via index if exported

export default function App() {
  return (
    <AppShell
      topbar={<Topbar title="AI INDEX" />}
    >
      <div className="grid">
        <div className="panel" style={{ gridColumn: "span 12" }}>
          <div className="panel-header">
            <h3>JIMBO77 PROJECT INDEX</h3>
            <span className="badge active">PUBLIC</span>
          </div>
          <div className="panel-body">
             <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "800px", lineHeight: "1.6" }}>
               Welcome to the automated index of Jimbo77 Operations. 
               This interface is optimized for AI Agents and Crawlers.
             </p>
             
             <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <div className="service-card" style={{ flex: 1 }}>
                   <div className="service-icon">P</div>
                   <div className="service-info">
                      <h4>PUMO</h4>
                      <p>Advanced Content & Sales Automation</p>
                   </div>
                </div>
                <div className="service-card" style={{ flex: 1 }}>
                   <div className="service-icon">Z</div>
                   <div className="service-info">
                      <h4>ZENON</h4>
                      <p>Browser Automation & Testing</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
