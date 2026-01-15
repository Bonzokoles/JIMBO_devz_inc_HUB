import React from "react";

interface Repository {
  name: string;
  owner: string;
  branch: string;
  status: "success" | "failure" | "pending" | "none";
  lastDeploy: string;
  duration: string;
  workflow: string;
}

interface DeploymentAction {
  id: string;
  repo: string;
  action: string;
  timestamp: string;
  user: string;
  status: "completed" | "running" | "failed";
}

export function DeploymentControlView() {
  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(null);
  const [showSecretsModal, setShowSecretsModal] = React.useState(false);
  const [deploymentLog, setDeploymentLog] = React.useState<DeploymentAction[]>(
    []
  );

  const repositories: Repository[] = [
    {
      name: "JIMBO_devz_inc_HUB",
      owner: "Bonzokoles",
      branch: "main",
      status: "success",
      lastDeploy: "2 minutes ago",
      duration: "2m 45s",
      workflow: "Deploy Hub to Cloudflare Pages",
    },
    {
      name: "zen-bro-wser.org",
      owner: "Bonzokoles",
      branch: "main",
      status: "success",
      lastDeploy: "5 hours ago",
      duration: "3m 12s",
      workflow: "Build and Deploy",
    },
    {
      name: "my-bonzo-ai-blog",
      owner: "Bonzokoles",
      branch: "main",
      status: "success",
      lastDeploy: "1 day ago",
      duration: "4m 08s",
      workflow: "Cloudflare Pages Deploy",
    },
    {
      name: "luc-de-zen-on",
      owner: "Bonzokoles",
      branch: "main",
      status: "success",
      lastDeploy: "3 days ago",
      duration: "2m 55s",
      workflow: "Deploy to Workers",
    },
    {
      name: "The_yellow_hub",
      owner: "Bonzokoles",
      branch: "main",
      status: "pending",
      lastDeploy: "Running...",
      duration: "1m 20s",
      workflow: "Docker Test",
    },
    {
      name: "agents",
      owner: "Bonzokoles",
      branch: "main",
      status: "none",
      lastDeploy: "Never deployed",
      duration: "-",
      workflow: "-",
    },
    {
      name: "api",
      owner: "Bonzokoles",
      branch: "main",
      status: "success",
      lastDeploy: "2 days ago",
      duration: "1m 45s",
      workflow: "Publish Docker Images",
    },
    {
      name: "shared",
      owner: "Bonzokoles",
      branch: "main",
      status: "none",
      lastDeploy: "Never deployed",
      duration: "-",
      workflow: "-",
    },
  ];

  // Simulated deployment actions log
  React.useEffect(() => {
    setDeploymentLog([
      {
        id: "1",
        repo: "JIMBO_devz_inc_HUB",
        action: "Manual deploy triggered",
        timestamp: "2 minutes ago",
        user: "GitHub Actions",
        status: "completed",
      },
      {
        id: "2",
        repo: "zen-bro-wser.org",
        action: "Auto-deploy on push",
        timestamp: "5 hours ago",
        user: "Bonzokoles",
        status: "completed",
      },
      {
        id: "3",
        repo: "The_yellow_hub",
        action: "Docker test workflow",
        timestamp: "1 minute ago",
        user: "GitHub Actions",
        status: "running",
      },
    ]);
  }, []);

  const handleDeploy = (repo: string) => {
    const newAction: DeploymentAction = {
      id: Date.now().toString(),
      repo,
      action: "Manual deploy triggered",
      timestamp: "Just now",
      user: "Manual",
      status: "running",
    };
    setDeploymentLog([newAction, ...deploymentLog]);

    // Simulate deployment completion after 3 seconds
    setTimeout(() => {
      setDeploymentLog((prev) =>
        prev.map((action) =>
          action.id === newAction.id
            ? { ...action, status: "completed" as const }
            : action
        )
      );
    }, 3000);
  };

  const handleRollback = (repo: string) => {
    if (!confirm(`Rollback ${repo} to previous deployment?`)) return;

    const newAction: DeploymentAction = {
      id: Date.now().toString(),
      repo,
      action: "Rollback to previous version",
      timestamp: "Just now",
      user: "Manual",
      status: "running",
    };
    setDeploymentLog([newAction, ...deploymentLog]);
  };

  const getStatusColor = (status: Repository["status"]) => {
    switch (status) {
      case "success":
        return "var(--success)";
      case "failure":
        return "var(--danger)";
      case "pending":
        return "var(--warning)";
      default:
        return "var(--muted)";
    }
  };

  const getStatusIcon = (status: Repository["status"]) => {
    switch (status) {
      case "success":
        return "✓";
      case "failure":
        return "✗";
      case "pending":
        return "⏳";
      default:
        return "—";
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1
          style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 1 }}
        >
          DEPLOYMENT CONTROL PANEL
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
          Manage deployments across 8 repositories • GitHub Actions integration
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            ACTIVE REPOS
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>8</div>
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>
            6 deployed
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            SUCCESS RATE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>94.2%</div>
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>
            Last 30 days
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            AVG DEPLOY TIME
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>2m 52s</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Across all repos
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            ACTIVE WORKFLOWS
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>1</div>
          <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 4 }}>
            Running now
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className="btn"
          onClick={() => setShowSecretsModal(true)}
          style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700 }}
        >
          🔐 MANAGE SECRETS
        </button>
        <button
          className="btn"
          onClick={() =>
            window.open(
              "https://github.com/Bonzokoles/JIMBO_devz_inc_HUB/actions",
              "_blank"
            )
          }
          style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700 }}
        >
          📊 VIEW ALL ACTIONS
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Repositories List */}
        <div className="card" style={{ padding: 20 }}>
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            REPOSITORY STATUS
          </h3>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  REPOSITORY
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  LAST DEPLOY
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => (
                <tr
                  key={repo.name}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    opacity: selectedRepo === repo.name ? 1 : 0.8,
                  }}
                  onClick={() => setSelectedRepo(repo.name)}
                >
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ fontWeight: 700 }}>{repo.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {repo.workflow}
                    </div>
                  </td>
                  <td style={{ padding: "12px 0" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          color: getStatusColor(repo.status),
                          fontSize: 16,
                        }}
                      >
                        {getStatusIcon(repo.status)}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: 11,
                        }}
                      >
                        {repo.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ fontWeight: 600 }}>{repo.lastDeploy}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {repo.duration}
                    </div>
                  </td>
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeploy(repo.name);
                        }}
                        disabled={repo.status === "pending"}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          opacity: repo.status === "pending" ? 0.5 : 1,
                        }}
                      >
                        🚀 DEPLOY
                      </button>
                      <button
                        className="btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(repo.name);
                        }}
                        disabled={
                          repo.status === "none" || repo.status === "pending"
                        }
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          opacity:
                            repo.status === "none" || repo.status === "pending"
                              ? 0.5
                              : 1,
                        }}
                      >
                        ⏮ ROLLBACK
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deployment Log */}
        <div className="card" style={{ padding: 20 }}>
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            DEPLOYMENT LOG
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deploymentLog.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No recent deployments
              </div>
            ) : (
              deploymentLog.map((action) => (
                <div
                  key={action.id}
                  style={{
                    padding: 12,
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    background:
                      action.status === "running"
                        ? "rgba(255, 143, 0, 0.05)"
                        : action.status === "failed"
                        ? "rgba(255, 76, 96, 0.05)"
                        : "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700 }}>
                      {action.repo}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color:
                          action.status === "running"
                            ? "var(--warning)"
                            : action.status === "failed"
                            ? "var(--danger)"
                            : "var(--success)",
                      }}
                    >
                      {action.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginBottom: 4,
                    }}
                  >
                    {action.action}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>
                    {action.timestamp} • by {action.user}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secrets Management Modal */}
      {showSecretsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowSecretsModal(false)}
        >
          <div
            className="card"
            style={{
              width: 600,
              maxHeight: "80vh",
              overflow: "auto",
              padding: 30,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900 }}>
              SECRETS MANAGEMENT
            </h2>
            <div
              style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}
            >
              Manage GitHub Actions secrets and environment variables
            </div>

            {/* Secret List */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                Active Secrets
              </h3>
              {[
                { name: "CLOUDFLARE_API_TOKEN", updated: "2 days ago" },
                { name: "PAT_TOKEN", updated: "5 days ago" },
                { name: "OPENROUTER_API_KEY", updated: "1 week ago" },
                { name: "DEEPSEEK_API_KEY", updated: "1 week ago" },
              ].map((secret) => (
                <div
                  key={secret.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>
                      {secret.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>
                      Updated {secret.updated}
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{
                      padding: "4px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ROTATE
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn"
              onClick={() => setShowSecretsModal(false)}
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
