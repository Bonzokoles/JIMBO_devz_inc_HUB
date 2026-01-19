import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import {
  NetworkService,
  TunnelConfig,
  VpnStatus,
  Agent,
  AgentStatus,
} from "../types";
import { generateAgentReport } from "../services/geminiService";

interface Props {
  services: NetworkService[];
  tunnels: TunnelConfig[];
  vpn: VpnStatus;
  agents: Agent[];
  onKillTask: (pid: number) => void;
  onOpenTask: (name: string) => void;
  onTogglePersistence: (id: string) => void;
  onCreateTunnel: (port: number, label: string, obfuscate: boolean) => void;
}

type SelectedNode = {
  type: "service" | "tunnel" | "host";
  data: any;
};

// Memoized node components for better performance
const ServiceNode = memo(({ 
  service, 
  angle, 
  centerX, 
  centerY, 
  isSelected, 
  onClick 
}: {
  service: NetworkService;
  angle: number;
  centerX: number;
  centerY: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  const x = centerX + Math.cos(angle) * 220;
  const y = centerY + Math.sin(angle) * 120;
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <rect
        x="-55"
        y="-22"
        width="110"
        height="44"
        rx="4"
        className={`fill-zinc-950 stroke-slate-800 transition-all ${
          isSelected
            ? "stroke-blue-500 fill-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            : "group-hover:stroke-slate-500"
        }`}
        strokeWidth={isSelected ? 2 : 1}
      />
      <text
        textAnchor="middle"
        dy="-2"
        className="fill-white text-[10px] font-bold uppercase tracking-tight"
      >
        {service.name}
      </text>
      <text
        textAnchor="middle"
        dy="12"
        className="fill-slate-600 text-[8px] mono"
      >
        PID: {service.pid} | {service.port}
      </text>
      {service.vulnerabilityScore > 60 && (
        <circle
          cx="48"
          cy="-15"
          r="4"
          className="fill-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
        />
      )}
    </g>
  );
});

const TunnelNode = memo(({
  tunnel,
  idx,
  centerX,
  centerY,
  isSelected,
  onClick
}: {
  tunnel: TunnelConfig;
  idx: number;
  centerX: number;
  centerY: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  const yPos = centerY - 150 - idx * 20;
  
  return (
    <g
      transform={`translate(${centerX}, ${yPos})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <rect
        x="-60"
        y="-18"
        width="120"
        height="36"
        rx="18"
        className={`fill-blue-900/10 stroke-blue-500/40 transition-all ${
          isSelected
            ? "stroke-blue-400 fill-blue-900/30 shadow-lg"
            : "group-hover:stroke-blue-400"
        }`}
        strokeWidth={isSelected ? 2 : 1.5}
      />
      <text
        textAnchor="middle"
        dy="1"
        className="fill-blue-400 text-[9px] font-black mono tracking-tighter uppercase"
      >
        {tunnel.obfuscatedId}
      </text>
    </g>
  );
});

const NetworkGraph: React.FC<Props> = ({
  services,
  tunnels,
  vpn,
  agents,
  onKillTask,
  onOpenTask,
  onTogglePersistence,
  onCreateTunnel,
}) => {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // View State (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const centerX = 400;
  const centerY = 200;

  // Memoized callbacks for better performance
  const handleNodeClick = useCallback((
    type: "service" | "tunnel" | "host",
    data: any,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedNode({ type, data });
    setAiReport(null); // Reset report when changing nodes
  }, []);

  const handleGenerateAiReport = useCallback(async () => {
    if (!selectedNode) return;
    setIsGeneratingReport(true);
    try {
      const context =
        selectedNode.type === "service"
          ? `Usługa: ${selectedNode.data.name}, Port: ${selectedNode.data.port}, PID: ${selectedNode.data.pid}, Ryzyko: ${selectedNode.data.vulnerabilityScore}/100`
          : `Tunel: ${selectedNode.data.label}, Provider: ${selectedNode.data.provider}, Port lokalny: ${selectedNode.data.localPort}`;

      const report = await generateAgentReport(context);
      setAiReport(report);
    } catch (error) {
      console.error('Error generating AI report:', error);
      setAiReport("Nie udało się wygenerować raportu AI.");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [selectedNode]);

  // Filter logs for the specific node (memoized for performance)
  const getNodeLogs = useMemo(() => {
    if (!selectedNode) return [];
    const searchTerm =
      selectedNode.type === "service"
        ? selectedNode.data.name
        : selectedNode.data.obfuscatedId;
    return agents
      .flatMap((a) => a.log)
      .filter((log) =>
        log.toLowerCase().includes(searchTerm?.toLowerCase() || "")
      );
  }, [selectedNode, agents]);

  // Memoized event handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newK = Math.max(
      0.4,
      Math.min(3, transform.k + direction * scaleFactor)
    );
    setTransform((prev) => ({ ...prev, k: newK }));
  }, [transform.k]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, k: Math.min(3, prev.k + 0.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, k: Math.max(0.4, prev.k - 0.2) }));
  }, []);

  // Memoized connection lines
  const connectionLines = useMemo(() => {
    return services.map((s, i) => {
      const angle = (i / services.length) * Math.PI * 1.5 - Math.PI * 0.75;
      const x = centerX + Math.cos(angle) * 220;
      const y = centerY + Math.sin(angle) * 120;
      
      const isSelected = selectedNode?.type === "service" && selectedNode.data.pid === s.pid;
      
      return (
        <line
          key={`line-${s.pid}`}
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke={s.isExposed ? "#ef4444" : "#1e293b"}
          strokeWidth="1.5"
          strokeDasharray={s.isExposed ? "4 2" : "0"}
          className={
            isSelected
              ? "animate-dash-fast"
              : s.isExposed
              ? "animate-dash"
              : ""
          }
        />
      );
    });
  }, [services, selectedNode, centerX, centerY]);

  return (
    <div className="w-full bg-zinc-950/40 rounded-xl border border-slate-800 overflow-hidden flex min-h-[600px] shadow-2xl">
      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden bg-black/20">
        <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur p-2 rounded border border-white/5 pointer-events-auto">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Topology Engine v2.2
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex bg-zinc-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
            <button
              onClick={zoomIn}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white border-r border-slate-800"
              title="Przybliż"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={zoomOut}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white border-r border-slate-800"
              title="Oddal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white"
              title="Resetuj widok"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 800 400"
          className={`w-full h-full select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

            {/* Connection Lines */}
            {connectionLines}

            {/* Central Host Node */}
            <g
              transform={`translate(${centerX}, ${centerY})`}
              className="cursor-pointer group"
              onClick={(e) => handleNodeClick("host", {}, e)}
            >
              <circle
                r="42"
                className="fill-blue-600/5 stroke-blue-500/20 group-hover:stroke-blue-400 group-hover:fill-blue-500/10 transition-all"
                strokeWidth="1"
              />
              <circle
                r="36"
                className="fill-blue-600/10 stroke-blue-500/40"
                strokeWidth="2"
              />
              <text textAnchor="middle" dy="4" className="fill-white text-[10px] font-black uppercase tracking-widest">
                COMMAND
              </text>
            </g>

            {/* Service Nodes */}
            {services.map((s, i) => {
              const angle = (i / services.length) * Math.PI * 1.5 - Math.PI * 0.75;
              const isSelected = selectedNode?.type === "service" && selectedNode.data.pid === s.pid;
              
              return (
                <ServiceNode
                  key={`service-${s.pid}`}
                  service={s}
                  angle={angle}
                  centerX={centerX}
                  centerY={centerY}
                  isSelected={isSelected}
                  onClick={(e) => handleNodeClick("service", s, e)}
                />
              );
            })}

            {/* Tunnel Nodes */}
            {tunnels
              .filter((t) => t.isActive)
              .map((t, idx) => {
                const isSelected = selectedNode?.type === "tunnel" && selectedNode.data.id === t.id;
                
                return (
                  <TunnelNode
                    key={`tunnel-${t.id}`}
                    tunnel={t}
                    idx={idx}
                    centerX={centerX}
                    centerY={centerY}
                    isSelected={isSelected}
                    onClick={(e) => handleNodeClick("tunnel", t, e)}
                  />
                );
              })}
          </g>
        </svg>
      </div>

      {/* Node Inspector Panel */}
      {selectedNode && (
        <div className="w-96 border-l border-slate-800 bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl z-20">
          <div className="p-6 border-b border-slate-900 flex justify-between items-start bg-white/[0.02]">
            <div>
              <h4 className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] mb-1">
                Inspektor Węzła
              </h4>
              <h3 className="text-base font-bold text-white truncate w-64 uppercase tracking-tight leading-tight">
                {selectedNode.type === "service"
                  ? selectedNode.data.name
                  : selectedNode.type === "tunnel"
                  ? selectedNode.data.label
                  : "Główny Host"}
              </h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
              title="Zamknij panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Security Status Section */}
            {selectedNode.type === "service" && (
              <div className="space-y-4">
                <div className="bg-black/40 border border-slate-900 p-4 rounded-lg">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      Stan Bezpieczeństwa
                    </span>
                    <span className={`text-xs font-black ${
                      selectedNode.data.vulnerabilityScore > 50 ? "text-red-500" : "text-green-500"
                    }`}>
                      {selectedNode.data.vulnerabilityScore}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedNode.data.vulnerabilityScore > 70
                          ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          : selectedNode.data.vulnerabilityScore > 30
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${selectedNode.data.vulnerabilityScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-zinc-900/50 p-3 rounded border border-slate-900">
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter mb-1">
                      Protokół
                    </p>
                    <p className="text-xs font-bold text-white">
                      {selectedNode.data.protocol}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded border border-slate-900">
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter mb-1">
                      Status Portu
                    </p>
                    <p className="text-xs font-bold text-green-500 uppercase">
                      {selectedNode.data.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Report Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-blue-600 pl-3">
                  Raport AI
                </h5>
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingReport}
                  className="px-3 py-1 text-[9px] font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded transition-colors"
                >
                  {isGeneratingReport ? "Generowanie..." : "Generuj"}
                </button>
              </div>
              
              {aiReport && (
                <div className="bg-black border border-slate-900 p-4 rounded-lg">
                  <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
                    {aiReport}
                  </div>
                </div>
              )}
            </div>

            {/* Node-Specific Agent Logs */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-blue-600 pl-3">
                Logi Agentów (Dedykowane)
              </h5>
              <div className="bg-black border border-slate-900 p-4 rounded-lg space-y-3 min-h-[100px]">
                {getNodeLogs.length > 0 ? (
                  getNodeLogs.map((log, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-slate-400 italic font-mono leading-relaxed border-b border-white/[0.03] pb-2 last:border-0"
                    >
                      <span className="text-blue-500 font-bold mr-2">{">>>"}</span> {log}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-700 italic text-center py-4">
                    Brak logów dla tego węzła
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NetworkGraph);