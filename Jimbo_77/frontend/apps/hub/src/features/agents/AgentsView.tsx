import { useState, useEffect } from "react";
import { Activity, Shield, Cpu, Database, Server, Terminal, Zap, Power } from "lucide-react";

interface AgentStatus {
  name: string;
  status: "active" | "inactive";
  port: string;
  pid?: string;
}

export function AgentsView() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Define the core agents we expect to see
  const CORE_AGENTS = [
    { name: "agent-zero-mcp", port: "50082", icon: BrainIcon },
    { name: "deployment-coordinator", port: "6001", icon: Server },
    { name: "cost-optimizer", port: "6002", icon: Zap },
    { name: "worker-health", port: "6003", icon: Activity },
    { name: "guardian-agent", port: "6004", icon: Shield },
    { name: "research-agent", port: "6062", icon: SearchIcon },
    { name: "writer-agent", port: "6030", icon: Terminal },
    { name: "seo-agent", port: "6031", icon: Database },
  ];

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      // Fetch from Backend (Podman/Docker via server.ts)
      const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3880";
      const response = await fetch(`${BACKEND_URL}/api/docker`);
      
      if (!response.ok) throw new Error("Backend unavailable");
      
      const data = await response.json();
      const containers = data.containers || [];

      // Map core agents to status
      const statusList = CORE_AGENTS.map(agent => {
        const container = containers.find((c: any) => c.name.includes(agent.name));
        return {
          name: agent.name,
          port: agent.port,
          status: container && container.status.startsWith("Up") ? "active" : "inactive",
          pid: container ? "PID: ????" : undefined // Docker/Podman PS format might vary
        } as AgentStatus;
      });

      setAgents(statusList);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch agent status:", error);
      // Fallback: Show all inactive if backend fails
      setAgents(CORE_AGENTS.map(a => ({ ...a, status: "inactive" })));
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Cpu className="text-primary" /> ACTIVE AGENT SWARM
           </h1>
           <p className="text-gray-400 mt-2 font-mono text-sm">Real-time status of Agent Zero subsystems</p>
        </div>
        <div className="flex gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono text-green-400">LIVE MONITORING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const Icon = CORE_AGENTS.find(a => a.name === agent.name)?.icon || Terminal;
          const isActive = agent.status === "active";

          return (
            <div 
              key={agent.name}
              className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
                isActive 
                  ? "bg-green-900/10 border-green-500/30 hover:border-green-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]" 
                  : "bg-red-900/5 border-red-500/20 hover:border-red-500/40 grayscale opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/10 text-red-500"}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                  isActive ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-900/50 text-red-400 border border-red-800"
                }`}>
                  {isActive ? "ONLINE" : "OFFLINE"}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-200 truncate" title={agent.name}>
                {agent.name}
              </h3>
              
              <div className="mt-4 space-y-2 font-mono text-xs text-gray-500">
                 <div className="flex justify-between border-b border-gray-800 pb-1">
                    <span>PORT</span>
                    <span className="text-gray-300">{agent.port}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>PROTOCOL</span>
                    <span className="text-gray-300">TCP/HTTP</span>
                 </div>
              </div>

              {isActive && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-green-500/5 via-transparent to-transparent opacity-50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icons
function BrainIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.97-3.284"/><path d="M17.97 14.716A4 4 0 0 1 18 18"/></svg>
}

function SearchIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
}
