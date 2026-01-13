import { useState } from "react";

type Props = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "Jimbo77" && password === "#HAOS77#") {
      setError("");
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(1200px 800px at 15% 0%, rgba(124, 255, 178, .08), transparent 60%), radial-gradient(1200px 800px at 90% 5%, rgba(106, 166, 255, .08), transparent 60%), linear-gradient(180deg, var(--bg), var(--bg2) 70%)"
    }}>
      {/* Topbar */}
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
                EASTWOOD DEVZ
              </h1>
              <div style={{ marginTop: 3, font: "700 11px/1.1 var(--mono)", letterSpacing: 0.8, color: "var(--muted)" }}>
                BUSINESS INTELLIGENCE LIBS
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(27,37,66,.8)", padding: "7px 10px", background: "rgba(11,15,26,.6)" }}>
              <span style={{ width: 8, height: 8, background: "var(--hot)", boxShadow: "0 0 12px rgba(124,255,178,.35)" }} />
              <span>STATUS: <strong style={{ color: "var(--text)" }}>ONLINE</strong></span>
            </div>
            <div style={{ border: "1px solid rgba(27,37,66,.8)", padding: "7px 10px", background: "rgba(11,15,26,.6)" }}>
              PORT: <strong style={{ color: "var(--text)" }}>6062</strong>
            </div>
          </div>

          <div style={{ minWidth: 280 }} />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          {/* Hero Logo */}
          <div style={{ marginBottom: 40 }}>
            <img 
              src="/apple-touch-icon.png" 
              alt="JIMBO Unified" 
              style={{ width: 120, height: 120, marginBottom: 20 }}
              onError={(e) => {
                console.error("Logo failed to load");
                e.currentTarget.style.display = 'none';
              }}
            />
            <h2 style={{ 
              fontSize: 32, 
              fontWeight: 900, 
              letterSpacing: 2, 
              margin: "0 0 10px",
              background: "linear-gradient(135deg, var(--hot) 0%, var(--cold) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              EASTWOOD DEVZ
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, letterSpacing: 1 }}>
              BUSINESS INTELLIGENCE LIBS
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ 
            background: "var(--panel)", 
            border: "1px solid var(--line)", 
            padding: 40,
            boxShadow: "var(--shadow)"
          }}>
            <h3 style={{ 
              margin: "0 0 30px", 
              fontSize: 18, 
              fontWeight: 700, 
              letterSpacing: 1.5,
              color: "var(--text)"
            }}>
              SECURE ACCESS
            </h3>

            <div style={{ marginBottom: 20, textAlign: "left" }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontSize: 12, 
                fontWeight: 700, 
                letterSpacing: 1,
                color: "var(--muted)"
              }}>
                ADMIN
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "var(--mono)",
                  outline: "none"
                }}
                placeholder="Enter admin username"
              />
            </div>

            <div style={{ marginBottom: 30, textAlign: "left" }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontSize: 12, 
                fontWeight: 700, 
                letterSpacing: 1,
                color: "var(--muted)"
              }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "var(--mono)",
                  outline: "none"
                }}
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div style={{ 
                marginBottom: 20, 
                padding: "12px 16px", 
                background: "rgba(255, 77, 109, .1)", 
                border: "1px solid var(--bad)",
                color: "var(--bad)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "var(--hot)",
                color: "var(--bg)",
                border: "none",
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 1.5,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              ACCESS SYSTEM →
            </button>
          </form>
        </div>
      </main>

      <footer style={{ 
        padding: "20px", 
        textAlign: "center", 
        fontSize: 11, 
        color: "var(--faint)",
        fontFamily: "var(--mono)",
        letterSpacing: 1
      }}>
        JIMBO UNIFIED CONTROL HUB © 2026 | EASTWOOD DEVZ | Port 6062
      </footer>
    </div>
  );
}
