import React from "react";

export function EastwoodView() {
  const [agents] = React.useState([
    {
      id: "retention-agent",
      name: "Retention Agent",
      kb: "bucket_blood_kb",
      status: "idle",
      description: "Customer retention & engagement analysis",
    },
    {
      id: "idea-agent",
      name: "Idea Agent",
      kb: "money_machine_kb",
      status: "idle",
      description: "Business idea generation & validation",
    },
    {
      id: "shadow-agent",
      name: "Shadow Agent",
      kb: "shadow_boxing_kb",
      status: "idle",
      description: "Competitive intelligence & market analysis",
    },
    {
      id: "trend-agent",
      name: "Trend Agent",
      kb: "the_now_kb",
      status: "idle",
      description: "Real-time trend detection & reporting",
    },
  ]);

  const [moneyMachine] = React.useState([
    { name: "Affiliate Marketing", path: "affiliate-marketing", ideas: 5 },
    { name: "AI Content Creation", path: "ai-content-creation", ideas: 8 },
    { name: "AI Monetization", path: "ai-monetization", ideas: 12 },
    { name: "Cloudflare Workers", path: "cloudflare-workers", ideas: 6 },
    { name: "Digital Products", path: "digital-products", ideas: 10 },
    { name: "E-commerce", path: "ecommerce", ideas: 7 },
    { name: "Payment Systems", path: "payment-systems", ideas: 4 },
  ]);

    return (
    <div className="space-y-8 animate-fade-in text-gray-200">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-glass-border">
        <div>
           <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🤠</span>
            <h1 className="font-brand text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              PROJECT EASTWOOD
            </h1>
          </div>
          <p className="font-mono text-sm text-gray-400 tracking-wide mt-2">
            AI AGENT ORCHESTRATION • <span className="text-white font-bold">{agents.length}</span> ACTIVE AGENTS • MONEY MACHINE v2.0
          </p>
        </div>
        
         <div className="flex items-center gap-4">
          <button className="group relative px-6 py-3 bg-jimbo-gold/10 border border-jimbo-gold/30 rounded-lg hover:bg-jimbo-gold/20 transition-all duration-300 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]">
             <span className="relative font-brand tracking-widest text-jimbo-gold flex items-center gap-2">
               💰 NEW MONEY MACHINE
             </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Money Machine Categories */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="font-brand text-2xl text-white tracking-widest flex items-center gap-3">
             <span className="w-2 h-8 bg-jimbo-gold rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]"></span>
             MONEY MACHINES
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {moneyMachine.map((category) => (
              <div
                key={category.path}
                className="glass-panel p-6 rounded-xl border border-white/5 hover:border-jimbo-gold/50 transition-all duration-300 cursor-pointer group relative overflow-hidden hover:bg-jimbo-gold/5"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl grayscale group-hover:grayscale-0">
                    {category.path.includes("ai") ? "🤖" : category.path.includes("money") ? "💰" : "🚀"}
                 </div>
                
                <h3 className="font-brand text-xl tracking-wider mb-2 text-gray-300 group-hover:text-jimbo-gold transition-colors">
                    {category.name}
                </h3>
                <div className="flex items-center justify-between">
                   <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">{category.ideas} Concepts</div>
                   <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 text-gray-600 group-hover:border-jimbo-gold group-hover:text-jimbo-gold transition-all">→</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agents Grid */}
        <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h2 className="font-brand text-2xl text-white tracking-widest flex items-center gap-3">
                <span className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
                ACTIVE AGENTS
              </h2>
              <div className="flex gap-2">
                  <span className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                    {agents.length} Online
                  </span>
              </div>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-900/50 to-black border border-white/10 flex items-center justify-center text-2xl shadow-inner relative overflow-hidden">
                       <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
                       {agent.name.includes("Retention") ? "🤝" : agent.name.includes("Idea") ? "💡" : agent.name.includes("Shadow") ? "🥷" : "📈"}
                    </div>
                    <div>
                      <h3 className="font-brand text-lg text-white tracking-wide group-hover:text-purple-400 transition-colors">{agent.name}</h3>
                      <div className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block mt-1">
                        Running
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 bg-green-500/10 border-green-500/30 text-green-400`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                    {agent.status}
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-6 flex-grow leading-relaxed font-light border-l-2 border-white/5 pl-3">
                    {agent.description}
                </p>

                <div className="border-t border-white/5 pt-4 mt-auto">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="uppercase tracking-widest font-bold text-[10px]">Knowledge Base</span>
                    <span className="text-white font-mono">{agent.kb}</span>
                  </div>
                   <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]" 
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                      ></div>
                   </div>
                   <div className="text-[10px] text-right text-gray-600 mt-1 font-mono">
                      MEMORY USAGE
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
