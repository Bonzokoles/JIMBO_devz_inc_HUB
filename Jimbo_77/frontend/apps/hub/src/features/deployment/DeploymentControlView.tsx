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
    <div className="space-y-8 animate-fade-in text-gray-200">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-glass-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl text-jimbo-gold drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">🚀</span>
            <h1 className="font-brand text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-jimbo-gold to-orange-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              DEPLOYMENT CONTROL
            </h1>
          </div>
          <p className="font-mono text-sm text-gray-400 tracking-wide mt-2">
            MANAGE DEPLOYMENTS • <span className="text-white font-bold">{repositories.length}</span> REPOSITORIES • GITHUB ACTIONS INTEGRATED
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSecretsModal(true)}
            className="group relative px-6 py-3 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 transition-all duration-300 overflow-hidden"
          >
             <div className="absolute inset-0 bg-jimbo-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <span className="relative font-brand tracking-widest text-jimbo-gold flex items-center gap-2">
               🔐 MANAGE SECRETS
             </span>
          </button>
          <button
            onClick={() => window.open("https://github.com/Bonzokoles/JIMBO_devz_inc_HUB/actions", "_blank")}
            className="group relative px-6 py-3 bg-primary/20 border border-primary/30 rounded-lg hover:bg-primary/30 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
          >
             <span className="font-brand tracking-widest text-white flex items-center gap-2">
               📊 VIEW ALL ACTIONS
             </span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl border-t-2 border-t-blue-500 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl text-blue-500/5 group-hover:text-blue-500/10 transition-colors">⚡</div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Active Repos</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">8</div>
          <div className="text-xs font-mono text-green-400 mt-2">● 6 deployed</div>
        </div>
        
        <div className="glass-panel p-6 rounded-xl border-t-2 border-t-green-500 relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 text-8xl text-green-500/5 group-hover:text-green-500/10 transition-colors">📈</div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Success Rate</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">94.2<span className="text-3xl opacity-70">%</span></div>
          <div className="text-xs font-mono text-green-400 mt-2">↑ Last 30 days</div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-t-2 border-t-purple-500 relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 text-8xl text-purple-500/5 group-hover:text-purple-500/10 transition-colors">⏱️</div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Avg Deploy Time</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">2<span className="text-3xl opacity-70">m</span> 52<span className="text-3xl opacity-70">s</span></div>
          <div className="text-xs font-mono text-gray-500 mt-2">Across all repos</div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-t-2 border-t-jimbo-gold relative overflow-hidden group animate-pulse-glow">
           <div className="absolute -right-4 -top-4 text-8xl text-jimbo-gold/5 group-hover:text-jimbo-gold/10 transition-colors">⚙️</div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Active Workflows</div>
          <div className="text-5xl font-display text-jimbo-gold drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">1</div>
          <div className="text-xs font-mono text-jimbo-gold mt-2 animate-pulse">● Running now</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Repositories List */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
             <div className="h-2 w-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
             <h3 className="font-brand text-lg text-white tracking-widest">REPOSITORY STATUS</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="p-4 pl-6 text-xs text-gray-400 font-bold tracking-wider uppercase">Repository</th>
                  <th className="p-4 text-xs text-gray-400 font-bold tracking-wider uppercase">Status</th>
                  <th className="p-4 text-xs text-gray-400 font-bold tracking-wider uppercase">Last Deploy</th>
                  <th className="p-4 pr-6 text-right text-xs text-gray-400 font-bold tracking-wider uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {repositories.map((repo) => (
                  <tr
                    key={repo.name}
                    onClick={() => setSelectedRepo(repo.name)}
                    className={`group cursor-pointer transition-colors duration-200 ${
                       selectedRepo === repo.name ? 'bg-primary/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="p-4 pl-6">
                      <div className="font-mono font-bold text-gray-200 group-hover:text-white transition-colors">{repo.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{repo.workflow}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg drop-shadow-md filter">{getStatusIcon(repo.status)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          repo.status === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                          repo.status === 'failure' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                          repo.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                          'border-gray-500/30 bg-gray-500/10 text-gray-400'
                        }`}>
                          {repo.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-white">{repo.lastDeploy}</div>
                      <div className="text-[10px] text-gray-500">{repo.duration}</div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeploy(repo.name); }}
                          disabled={repo.status === "pending"}
                          className="px-3 py-1 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 rounded text-xs font-bold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                          Deploy
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRollback(repo.name); }}
                          disabled={repo.status === "none" || repo.status === "pending"}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded text-xs font-bold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                          Rollback
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deployment Log */}
        <div className="glass-panel rounded-xl overflow-hidden border border-white/5 flex flex-col h-[600px]">
           <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3 shrink-0">
             <div className="h-2 w-2 bg-jimbo-gold rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
             <h3 className="font-brand text-lg text-white tracking-widest">DEPLOYMENT LOG</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {deploymentLog.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-mono text-xs">NO RECENT ACTIVITY</div>
            ) : (
              deploymentLog.map((action) => (
                <div
                  key={action.id}
                  className={`p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                    action.status === "running"
                      ? "bg-jimbo-gold/5 border-jimbo-gold/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                      : action.status === "failed"
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-black/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-white">{action.repo}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        action.status === 'running' ? 'text-jimbo-gold animate-pulse' :
                        action.status === 'failed' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">{action.action}</div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono border-t border-white/5 pt-2 mt-2">
                    <span>{action.timestamp}</span>
                    <span>by <span className="text-gray-400">{action.user}</span></span>
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowSecretsModal(false)}
        >
          <div
            className="glass-panel border border-jimbo-gold/30 rounded-xl max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
                <h2 className="font-brand text-2xl text-jimbo-gold tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                  SECRETS MANAGEMENT
                </h2>
                <button onClick={() => setShowSecretsModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-8">
                <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
                   <span className="text-lg">🔐</span> Manage GitHub Actions secrets and environment variables securely.
                </p>

                <div className="space-y-2 mb-8">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Active Secrets</h3>
                  {[
                    { name: "CLOUDFLARE_API_TOKEN", updated: "2 days ago" },
                    { name: "PAT_TOKEN", updated: "5 days ago" },
                    { name: "OPENROUTER_API_KEY", updated: "1 week ago" },
                    { name: "DEEPSEEK_API_KEY", updated: "1 week ago" },
                  ].map((secret) => (
                    <div
                      key={secret.name}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors group"
                    >
                      <div>
                        <div className="font-mono text-sm font-bold text-gray-200 group-hover:text-jimbo-gold transition-colors">{secret.name}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Updated {secret.updated}</div>
                      </div>
                      <button className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-jimbo-gold border border-jimbo-gold/20 rounded hover:bg-jimbo-gold/10 transition-colors uppercase">
                        Rotate
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                   <button
                    onClick={() => setShowSecretsModal(false)}
                    className="px-6 py-2 rounded-lg text-sm font-bold tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    CLOSE
                  </button>
                  <button className="px-6 py-2 rounded-lg bg-jimbo-gold/20 text-jimbo-gold border border-jimbo-gold/30 hover:bg-jimbo-gold/30 text-sm font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    + ADD NEW SECRET
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
