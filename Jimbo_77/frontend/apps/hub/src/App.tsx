
import React, { useState, useEffect } from "react";
// Remove AppShell, Topbar, CommandDrawer if not used in new design, or re-integrate them.
// For "Bunker War Room", we want a full screen distinct look, but maybe consistent for other tabs.
// The user approved "Bunker War Room" which implies a distinct look.
// I will keep the clean Sidebar approach I proposed.

import { api } from "@jimbo77/core/api";
import type { Project } from "@jimbo77/core/types";

// Views
import { UnifiedOpsView } from "./features/unified/UnifiedOpsView";
import { PublishingView } from "./features/publishing/PublishingView";
import BunkerWarRoom from "./features/analysis/BunkerWarRoom"; // New View
// import { ServicesPage } from "./features/services/ServicesPage"; // Optional: Re-enable later
// import { AgentsView } from "./features/agents/AgentsView"; // Optional

// Components
const SidebarItem = ({ icon, label, id, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded m-1 transition-all duration-200 font-mono text-sm ${
      active
        ? "bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <UnifiedOpsView />;
      case "publisher":
        return <PublishingView />;
      case "wild_bunch":
        return <BunkerWarRoom />;
      case "agents":
        return <div className="text-gray-500 p-10 flex items-center justify-center font-mono">AGENT MANAGEMENT [COMING SOON]</div>;
      case "services":
         return <div className="text-gray-500 p-10 flex items-center justify-center font-mono">MICROSERVICES [COMING SOON]</div>;
      default:
        return <UnifiedOpsView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Sidebar - Fixed Width */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-800 flex flex-col">
          <span className="font-black text-2xl tracking-tighter text-yellow-500">
            JIMBO<span className="text-white">HUB</span>
          </span>
          <span className="text-xs text-gray-500 tracking-widest mt-1">OPERATIONS v2.1</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-gray-600 px-4 py-2 mt-2 mb-1 tracking-wider">MAIN</div>
          <SidebarItem
            icon="📊"
            label="DASHBOARD"
            id="dashboard"
            active={activeTab === "dashboard"}
            onClick={setActiveTab}
          />
          <SidebarItem
            icon="📢"
            label="PUBLISHER"
            id="publisher"
            active={activeTab === "publisher"}
            onClick={setActiveTab}
          />

          <div className="text-xs font-bold text-gray-600 px-4 py-2 mt-6 mb-1 tracking-wider">INTELLIGENCE</div>
          <SidebarItem
            icon="☢️"
            label="WILD BUNCH"
            id="wild_bunch"
            active={activeTab === "wild_bunch"}
            onClick={setActiveTab}
          />
          
          <div className="text-xs font-bold text-gray-600 px-4 py-2 mt-6 mb-1 tracking-wider">SYSTEM</div>
          <SidebarItem
            icon="🤖"
            label="AGENTS"
            id="agents"
            active={activeTab === "agents"}
            onClick={setActiveTab}
          />
          <SidebarItem
            icon="🛠️"
            label="SERVICES"
            id="services"
            active={activeTab === "services"}
            onClick={setActiveTab}
          />
        </nav>

        <div className="p-4 bg-gray-900 border-t border-gray-800">
           <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 border border-yellow-300"></div>
             <div className="text-sm">
               <div className="font-bold text-gray-200">Admin User</div>
               <div className="text-xs text-green-500">● Online</div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content - Flex Grow */}
      <div className="flex-1 overflow-hidden bg-gray-900 relative">
        <div className="absolute inset-0 overflow-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
