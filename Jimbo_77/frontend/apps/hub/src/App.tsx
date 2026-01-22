import { useState } from "react";
// Views
import { UnifiedOpsView } from "./features/unified/UnifiedOpsView";
import { PublishingView } from "./features/publishing/PublishingView";
import BunkerWarRoom from "./features/analysis/BunkerWarRoom";
import { ZenonView } from "./features/zenon";
import { MoaFlowVisualizer } from "./features/moa";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <UnifiedOpsView />;
      case "publisher": return <PublishingView />;
      case "wild_bunch": return <BunkerWarRoom />;
      case "zenon_prompts": return <ZenonView />;
      case "moa_flow": return <MoaFlowVisualizer />;
      case "agents":
        return (
          <div className="h-full flex items-center justify-center p-10">
            <div className="glass-panel p-10 rounded-2xl border border-dashed border-gray-700 text-center">
              <div className="text-6xl mb-4 animate-bounce">🚧</div>
              <h2 className="text-2xl font-bold text-primary mb-2">AGENT MANAGEMENT</h2>
              <p className="text-gray-400 font-mono">Under Construction by JIMBO_77</p>
            </div>
          </div>
        );
      case "network":
        return (
          <div className="h-full w-full bg-black relative">
            <iframe
              src="http://localhost:5173"
              className="w-full h-full border-0 opacity-90 hover:opacity-100 transition-opacity"
              title="Network Control Center"
            />
          </div>
        );
      case "services":
        return (
           <div className="h-full flex items-center justify-center p-10">
            <div className="glass-panel p-10 rounded-2xl border border-dashed border-gray-700 text-center">
              <div className="text-6xl mb-4 animate-spin-slow">⚙️</div>
              <h2 className="text-2xl font-bold text-accent mb-2">MICROSERVICES</h2>
              <p className="text-gray-400 font-mono">System Optimization in Progress...</p>
            </div>
          </div>
        );
      default: return <UnifiedOpsView />;
    }
  };

  return (
    <div className="flex h-screen gap-[10px] bg-background text-gray-200 font-sans overflow-hidden selection:bg-accent selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col bg-black/20 backdrop-blur-sm">
        {/* Top Header / Breadcrumb (Optional, simplistic for now) */}
        <header className="h-16 border-b border-glass-border flex items-center justify-between px-8 bg-glass-bg/50 backdrop-blur-sm">
             <div className="flex items-center space-x-2 text-sm font-mono text-gray-500">
                <span>JIMBO_HUB</span>
                <span>/</span>
                <span className="text-primary font-bold uppercase tracking-wider">{activeTab.replace('_', ' ')}</span>
             </div>
             
             {/* Right Side Actions */}
             <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white relative">
                   🔔
                   <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
                </button>
             </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-0 relative scrollbar-thin scrollbar-thumb-gray-800">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}
