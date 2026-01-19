import React, { useState, useRef, useEffect } from "react";
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
  const [newTunnelObfuscate, setNewTunnelObfuscate] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // View State (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const centerX = 400;
  const centerY = 200;

  const handleNodeClick = (
    type: "service" | "tunnel" | "host",
    data: any,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedNode({ type, data });
    setAiReport(null); // Reset report when changing nodes
  };

  const handleGenerateAiReport = async () => {
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
      setAiReport("Nie udało się wygenerować raportu AI.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Filter logs for the specific node (mock logic: match by name or ID)
  const getNodeLogs = () => {
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
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newK = Math.max(
      0.4,
      Math.min(3, transform.k + direction * scaleFactor)
    );
    setTransform((prev) => ({ ...prev, k: newK }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);
  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });
  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, k: Math.min(3, prev.k + 0.2) }));
  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, k: Math.max(0.4, prev.k - 0.2) }));

  return (
    <div className="w-full bg-zinc-950/40 rounded-xl border border-slate-800 overflow-hidden flex min-h-[600px] shadow-2xl">
      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden bg-black/20">
        <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur p-2 rounded border border-white/5 pointer-events-auto">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Topology Engine v2.1
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex bg-zinc-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
            <button
              onClick={zoomIn}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white border-r border-slate-800"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
            <button
              onClick={zoomOut}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white border-r border-slate-800"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-2.5 hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
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
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.02)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              x="-2000"
              y="-2000"
              width="4000"
              height="4000"
              fill="url(#grid)"
            />

            {/* Connection Lines */}
            {services.map((s, i) => {
              const angle =
                (i / services.length) * Math.PI * 1.5 - Math.PI * 0.75;
              const x = centerX + Math.cos(angle) * 220;
              const y = centerY + Math.sin(angle) * 120;
              return (
                <line
                  key={`line-${s.pid}`}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke={s.isExposed ? "#dc2626" : "#334155"}
                  strokeWidth="1.5"
                  strokeDasharray={s.isExposed ? "4 2" : "0"}
                  className={
                    isSelected(s)
                      ? "animate-dash-fast"
                      : s.isExposed
                      ? "animate-dash"
                      : ""
                  }
                />
              );
              function isSelected(serv: NetworkService) {
                return (
                  selectedNode?.type === "service" &&
                  selectedNode.data.pid === serv.pid
                );
              }
            })}

            {/* Nodes (Central, Service, Tunnel) */}
            <g
              transform={`translate(${centerX}, ${centerY})`}
              className="cursor-pointer group"
              onClick={(e) => handleNodeClick("host", {}, e)}
            >
              <circle
                r="42"
                className="fill-zinc-800/30 stroke-zinc-600/40 group-hover:stroke-zinc-500 group-hover:fill-zinc-700/20 transition-all"
                strokeWidth="1"
              />
              <circle
                    r="36"
                    className="fill-zinc-600/40 stroke-blue-500/40"
                    strokeWidth="2"
                  />
              <text
                textAnchor="middle"
                dy="4"
                className="fill-white text-[10px] font-black uppercase tracking-widest"
              >
                COMMAND
              </text>
            </g>

            {services.map((s, i) => {
              const angle =
                (i / services.length) * Math.PI * 1.5 - Math.PI * 0.75;
              const x = centerX + Math.cos(angle) * 220;
              const y = centerY + Math.sin(angle) * 120;
              const isSelected =
                selectedNode?.type === "service" &&
                selectedNode.data.pid === s.pid;
              return (
                <g
                  key={`node-${s.pid}`}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer group"
                  onClick={(e) => handleNodeClick("service", s, e)}
                >
                  <rect
                    x="-55"
                    y="-22"
                    width="110"
                    height="44"
                    rx="4"
                    className={`fill-zinc-900/80 stroke-zinc-700/60 transition-all ${
                      isSelected
                        ? "stroke-blue-500 fill-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                        : "group-hover:stroke-zinc-500 group-hover:fill-zinc-800/60"
                    }`}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    textAnchor="middle"
                    dy="-2"
                    className="fill-zinc-200 text-[10px] font-bold uppercase tracking-tight"
                  >
                    {s.name}
                  </text>
                  <text
                    textAnchor="middle"
                    dy="12"
                    className="fill-zinc-500 text-[8px] mono"
                  >
                    PID: {s.pid} | {s.port}
                  </text>
                  {s.vulnerabilityScore > 60 && (
                    <circle
                      cx="48"
                      cy="-15"
                      r="4"
                      className="fill-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    />
                  )}
                </g>
              );
            })}

            {tunnels
              .filter((t) => t.isActive)
              .map((t, idx) => {
                const yPos = centerY - 150 - idx * 20;
                const isSelected =
                  selectedNode?.type === "tunnel" &&
                  selectedNode.data.id === t.id;
                return (
                  <g
                    key={`node-tunnel-${t.id}`}
                    transform={`translate(${centerX}, ${yPos})`}
                    className="cursor-pointer group"
                    onClick={(e) => handleNodeClick("tunnel", t, e)}
                  >
                    <rect
                      x="-60"
                      y="-18"
                      width="120"
                      height="36"
                      rx="18"
                      className={`fill-zinc-800/40 stroke-zinc-600/40 transition-all ${
                        isSelected
                          ? "stroke-blue-400 fill-blue-900/30 shadow-lg"
                          : "group-hover:stroke-zinc-400"
                      }`}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    <text
                      textAnchor="middle"
                      dy="1"
                      className="fill-zinc-300 text-[9px] font-black mono tracking-tighter uppercase"
                    >
                      {t.obfuscatedId}
                    </text>
                  </g>
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
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
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
                    <span
                      className={`text-xs font-black ${
                        selectedNode.data.vulnerabilityScore > 50
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
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
                      style={{
                        width: `${selectedNode.data.vulnerabilityScore}%`,
                      }}
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

            {/* Node-Specific Agent Logs */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-blue-600 pl-3">
                Logi Agentów (Dedykowane)
              </h5>
              <div className="bg-black border border-slate-900 p-4 rounded-lg space-y-3 min-h-[100px]">
                {getNodeLogs().length > 0 ? (
                  getNodeLogs().map((log, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-slate-400 italic font-mono leading-relaxed border-b border-white/[0.03] pb-2 last:border-0"
                    >
                      <span className="text-blue-500 font-bold mr-2">
                        {">>>"}
                      </span>{" "}
                      {log}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-700 italic text-center py-4">
                    Brak bezpośrednich zdarzeń dla tego węzła.
                  </p>
                )}
              </div>
            </div>

            {/* Gemini AI Insights Section */}
            <div className="space-y-4 pt-4 border-t border-slate-900">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                  Analiza AI (Raportier)
                </h5>
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingReport}
                  className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded transition-all disabled:opacity-50"
                  title="Generuj nowy raport bezpieczeństwa"
                >
                  {isGeneratingReport ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {aiReport ? (
                <div className="bg-blue-600/5 border border-blue-500/20 p-4 rounded-lg text-[10px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiReport}
                </div>
              ) : (
                <div className="bg-zinc-900/30 p-4 rounded-lg border border-slate-900 text-center">
                  <p className="text-[9px] text-slate-600 uppercase font-black">
                    Gotowy do analizy bezpieczeństwa
                  </p>
                </div>
              )}
            </div>

            {/* Actions Section */}
            <div className="pt-6 border-t border-slate-900 space-y-3">
              {selectedNode.type === "service" && (
                <button
                  onClick={() => onKillTask(selectedNode.data.pid)}
                  className="w-full py-3 bg-red-600/5 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase rounded border border-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Zabij Proces (SIGKILL)
                </button>
              )}
              {selectedNode.type === "tunnel" && (
                <button
                  onClick={() => onTogglePersistence(selectedNode.data.id)}
                  className="w-full py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white text-[10px] font-black uppercase rounded border border-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {selectedNode.data.isPersistent
                    ? "Wyłącz Watchdog"
                    : "Aktywuj Watchdog"}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-900 bg-black/40 text-center">
            <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">
              Jimbo Net Control Node Inspection
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -20; } }
        @keyframes dash-fast { to { stroke-dashoffset: -40; } }
        .animate-dash { animation: dash 3s linear infinite; }
        .animate-dash-fast { animation: dash-fast 1s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default NetworkGraph;
