type Props = {
  onOpenPumo: () => void;
};

export function UnifiedOpsView({ onOpenPumo }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 50 }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ margin: 0, letterSpacing: "2px" }}>UNIFIED OPERATIONS</h2>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          Central Operations Dashboard - All Systems
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        
        {/* Main Dashboard */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>PORT 4560</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>MAIN DASHBOARD</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(106, 166, 255, .12) 0px, rgba(106, 166, 255, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--cold)"
            }}>
              ⚡
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Dashboard Server</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Main control panel with system cards and component status
              </p>
            </div>
          </div>
        </div>

        {/* Control Center */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>PORT 4569</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>CONTROL CENTER</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(106, 166, 255, .12) 0px, rgba(106, 166, 255, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--cold)"
            }}>
              ⚙️
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Server Control</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Process management, service restart and system control
              </p>
            </div>
          </div>
        </div>

        {/* PUMO Diagnostic Hub */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>ANALYTICS</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>PUMO DIAGNOSTIC HUB</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(124, 255, 178, .12) 0px, rgba(124, 255, 178, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--hot)"
            }}>
              📊
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Business Intelligence</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Revenue tracking, traffic analysis, and conversion metrics
              </p>
              <button 
                className="btn" 
                style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                onClick={onOpenPumo}
              >
                OPEN DASHBOARD →
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Matrix */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>PORT 4575</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>ADVANCED MATRIX</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(106, 166, 255, .12) 0px, rgba(106, 166, 255, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--cold)"
            }}>
              🎯
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Matrix Dashboard</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Advanced system view with GPU monitoring and visualizations
              </p>
            </div>
          </div>
        </div>

        {/* Library Catalog */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>PORT 6030</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>LIBRARY CATALOG</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(124, 255, 178, .12) 0px, rgba(124, 255, 178, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--hot)"
            }}>
              📚
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Unified Libraries</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Catalog of all 60 libraries (51k+ files) - Control Center + Eastwood DEVZ
              </p>
            </div>
          </div>
        </div>

        {/* Eastwood DEVZ */}
        <div className="card">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>PORT 6062</div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>EASTWOOD DEVZ</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 42, height: 42, minWidth: 42,
              border: "1px solid var(--line)",
              background: "repeating-linear-gradient(45deg, rgba(124, 255, 178, .12) 0px, rgba(124, 255, 178, .12) 1px, transparent 1px, transparent 4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "var(--hot)"
            }}>
              💼
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Business Intelligence Libs</h4>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Specialized business intelligence libraries and tools
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
