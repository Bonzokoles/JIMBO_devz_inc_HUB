import React from "react";

interface AgentSwarmProps {
  crawlerHits?: number;
}

export const AgentSwarm: React.FC<AgentSwarmProps> = ({ crawlerHits = 1420 }) => {
  const agents = [
    { name: "JIMBO (Master)", iconClass: "lni lni-crown-3", color: "text-amber-400" },
    { name: "BRAIN (Strategy)", iconClass: "lni lni-bulb-4", color: "text-purple-400" },
    { name: "PINKY (Edgecases)", iconClass: "lni lni-microscope", color: "text-pink-400" },
    { name: "ELWIRKA (Finalize)", iconClass: "lni lni-check-circle-1", color: "text-green-400" },
    { name: "SECURITY (Guard)", iconClass: "lni lni-shield-2-check", color: "text-blue-400" },
    { name: "OUTPUT (Format)", iconClass: "lni lni-text-format", color: "text-gray-400" },
  ];

  return (
    <div className="glass-panel rounded-xl p-8 col-span-full border border-jimbo-red/20 shadow-[0_0_30px_rgba(255,51,51,0.05)]">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-brand text-3xl text-jimbo-red tracking-widest drop-shadow-[0_0_8px_rgba(255,51,51,0.5)]">
                JIMBO77 SYSTEM REDPRINT
              </h3>
              <p className="text-xs font-mono text-gray-500 tracking-[0.3em] uppercase mt-1">
                Active Agent Swarm Configuration
              </p>
            </div>
          </div>
          
          {/* Stats Display */}
          <div className="text-right">
             <div className="font-brand text-2xl text-jimbo-red tracking-widest animate-pulse opacity-90 drop-shadow-[0_0_5px_rgba(255,51,51,0.8)]">
                TOTAL_AI_CRAWLERS_HITS : {crawlerHits}
             </div>
          </div>
       </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {agents.map((agent) => (
          <button
            key={agent.name}
            className="group relative overflow-hidden rounded-xl bg-black/40 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 p-6 flex flex-col items-center gap-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <i className={`${agent.iconClass} text-4xl ${agent.color} transition-transform duration-300 group-hover:scale-110 drop-shadow-md`}></i>
            
            <span className="font-display tracking-wider text-sm text-gray-400 group-hover:text-white transition-colors text-center uppercase">
              {agent.name}
            </span>
            
            {/* Status indicator */}
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow"></div>
          </button>
        ))}
      </div>
    </div>
  );
};
