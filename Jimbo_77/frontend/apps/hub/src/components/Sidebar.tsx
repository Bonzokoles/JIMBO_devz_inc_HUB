// Icons (Using simple emojis for now, but wrapped in sleek spans)
const menuItems = [
  { id: "dashboard", label: "COMMAND", icon: "📊", category: "MAIN" },
  { id: "publisher", label: "PUBLISHER", icon: "📢", category: "MAIN" },
  { id: "wild_bunch", label: "WAR ROOM", icon: "☢️", category: "INTELLIGENCE" },
  { id: "zenon_prompts", label: "ZENON", icon: "🧠", category: "INTELLIGENCE" },
  { id: "moa_flow", label: "MOA FLOW", icon: "🔄", category: "INTELLIGENCE" },
  { id: "agents", label: "AGENTS", icon: "🤖", category: "SYSTEM" },
  { id: "network", label: "NET CTRL", icon: "🌐", category: "SYSTEM" },
  { id: "services", label: "SERVICES", icon: "🛠️", category: "SYSTEM" },
  {
    id: "marketplace",
    label: "MARKET",
    icon: "🛒",
    category: "SYSTEM",
    external: true,
    url: "https://ai-marketplace.stolarnia-ams.workers.dev",
  },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-80 h-full flex flex-col border-r border-glass-border bg-glass-bg backdrop-blur-xl shadow-2xl z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-8 border-b border-glass-border relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
        <h1 className="relative text-4xl font-brand font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:from-primary group-hover:to-accent transition-all duration-300">
          JIMBO<span className="text-primary font-light">_77</span>
        </h1>
        <div className="flex items-center space-x-2 mt-2">
          <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-mono tracking-[0.2em] text-jimbo-gold/80 group-hover:text-jimbo-gold transition-colors">
            DEVZ_INC HUB
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {["MAIN", "INTELLIGENCE", "SYSTEM"].map(category => (
          <div key={category} className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-gray-500 tracking-[0.15em] mb-2 font-mono uppercase opacity-70">
              {category}
            </h3>
            {menuItems
              .filter(item => item.category === category)
              .map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      item.external ? window.open(item.url, "_blank") : setActiveTab(item.id)
                    }
                    className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 group relative overflow-hidden
                    ${
                      isActive
                        ? "bg-primary/10 text-white shadow-neon border border-primary/20"
                        : "text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent hover:border-white/5"
                    }
                  `}
                  >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary shadow-[0_0_10px_#3B82F6] rounded-r-md"></div>
                    )}

                    <span
                      className={`text-xl transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-md" : "group-hover:scale-110 grayscale group-hover:grayscale-0"}`}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-sm font-medium tracking-wide ${isActive ? "font-bold" : ""}`}
                    >
                      {item.label}
                    </span>

                    {/* Hover Glow Effect */}
                    <div
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isActive ? "hidden" : ""}`}
                    />
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-glass-border bg-black/20">
        <div className="glass-panel rounded-xl p-3 flex items-center space-x-3 hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-jimbo-gold to-orange-600 p-[2px] shadow-lg group-hover:shadow-orange-500/30 transition-shadow">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              <span className="text-lg">🦁</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white group-hover:text-jimbo-gold transition-colors">
              Admin User
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-gray-400 font-mono">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
