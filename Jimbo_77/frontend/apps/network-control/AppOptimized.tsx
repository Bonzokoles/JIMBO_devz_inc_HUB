import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Agent, NetworkService, AgentStatus, TunnelConfig, SystemReport, SystemTask, VpnStatus } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkGraph from './components/NetworkGraphOptimized';
import TunnelStatus from './components/TunnelStatusOptimized';
import SpeedTest from './components/SpeedTestOptimized';
import CreateTunnelModal from './components/CreateTunnelModal';
import ArchitectureDocs from './components/ArchitectureDocs';
import { useNetworkStatus } from './hooks/useCustomHooks';

const MOCK_SERVICES: NetworkService[] = [
  { pid: 1201, name: 'nginx-main', port: 80, protocol: 'TCP', status: 'LISTEN', isExposed: true, vulnerabilityScore: 12 },
  { pid: 3452, name: 'fastapi-backend', port: 8000, protocol: 'TCP', status: 'LISTEN', isExposed: false, vulnerabilityScore: 45 },
  { pid: 991, name: 'redis-cache', port: 6379, protocol: 'TCP', status: 'LISTEN', isExposed: false, vulnerabilityScore: 5 },
  { pid: 8821, name: 'unsecured-dev-srv', port: 8080, protocol: 'TCP', status: 'LISTEN', isExposed: true, vulnerabilityScore: 88 },
];

const MOCK_VPN: VpnStatus = {
  isActive: true,
  location: 'Amsterdam, NL (Zaszyfrowano)',
  ip: '185.12.94.***',
  provider: 'Nord-Tunnel-X'
};

const MOCK_TUNNELS: TunnelConfig[] = [
  { id: 't-1', label: 'Cloudflare Prod Bridge', obfuscatedId: 'cf-x9j-22a', provider: 'Cloudflare', localPort: 8000, publicUrl: 'https://cf-x9j-22a.jimbo.net', isActive: true, isPersistent: true, bandwidth: '240 KB/s' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arch'>('dashboard');
  const [services, setServices] = useState<NetworkService[]>(MOCK_SERVICES);
  const [tunnels, setTunnels] = useState<TunnelConfig[]>(MOCK_TUNNELS);
  const [vpn] = useState<VpnStatus>(MOCK_VPN);
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'g-1', name: 'Strażnik Portów', role: 'Security Ops', status: AgentStatus.IDLE, lastActivity: 'Teraz', log: ['System uzbrojony.', 'Analiza nginx-main: Brak podatności.'] },
    { id: 'a-1', name: 'Architekt Połączeń', role: 'System Orchestrator', status: AgentStatus.IDLE, lastActivity: 'Teraz', log: ['Hub gotowy.', 'Mapowanie cf-x9j-22a zakończone pomyślnie.'] }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = useNetworkStatus();

  // Memoized callbacks for better performance
  const addAgentLog = useCallback((agentId: string, message: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { ...a, log: [message, ...a.log].slice(0, 10), status: AgentStatus.WORKING, lastActivity: 'Teraz' } 
        : a
    ));
    
    setTimeout(() => {
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: AgentStatus.IDLE } : a
      ));
    }, 2000);
  }, []);

  // Watchdog logic for persistent tunnels
  useEffect(() => {
    const interval = setInterval(() => {
      setTunnels(prev => prev.map(t => {
        if (t.isPersistent && !t.isActive) {
          addAgentLog('a-1', `WATCHDOG: Przywracanie tunelu ${t.obfuscatedId}...`);
          return { ...t, isActive: true };
        }
        return t;
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [addAgentLog]);

  const handleKillTask = useCallback((pid: number) => {
    const service = services.find(s => s.pid === pid);
    if (!service) return;
    
    setServices(prev => prev.filter(s => s.pid !== pid));
    addAgentLog('g-1', `KILLTASK: Proces ${service.name} (PID: ${pid}) został unicestwiony.`);
  }, [services, addAgentLog]);

  const handleOpenTask = useCallback(() => {
    try {
      const name = window.prompt("Podaj nazwę nowej usługi (np. api-v2, worker-node):", "new-service");
      
      if (name && name.trim()) {
        const newPid = Math.floor(Math.random() * 9000) + 1000;
        const newPort = Math.floor(Math.random() * 5000) + 3000;
        const newService: NetworkService = {
          pid: newPid,
          name: name.trim(),
          port: newPort,
          protocol: 'TCP',
          status: 'LISTEN',
          isExposed: false,
          vulnerabilityScore: Math.floor(Math.random() * 40)
        };

        setServices(prev => [...prev, newService]);
        addAgentLog('a-1', `OPENTASK: Inicjalizacja ${newService.name} na localhost:${newPort} (PID: ${newPid}).`);
      }
    } catch (error) {
      console.error('Error creating new service:', error);
      setError('Nie udało się utworzyć nowej usługi');
    }
  }, [addAgentLog]);

  const handleTogglePersistence = useCallback((id: string) => {
    const tunnel = tunnels.find(t => t.id === id);
    setTunnels(prev => prev.map(t => 
      t.id === id ? { ...t, isPersistent: !t.isPersistent } : t
    ));
    addAgentLog('a-1', `TRWAŁOŚĆ: Zmieniono tryb tunelu ${tunnel?.obfuscatedId || id}.`);
  }, [tunnels, addAgentLog]);

  const handleCreateTunnel = useCallback((port: number, serviceName: string, obfuscate: boolean) => {
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const obfuscatedId = obfuscate 
        ? `cf-${randomSuffix}-${Math.floor(Math.random() * 99)}` 
        : `srv-${serviceName.toLowerCase()}`;
      
      const newTunnel: TunnelConfig = {
        id: `t-${Date.now()}`,
        label: `Tunel dla ${serviceName}`,
        obfuscatedId: obfuscatedId,
        provider: 'Cloudflare',
        localPort: port,
        publicUrl: `https://${obfuscatedId}.jimbo.net`,
        isActive: true,
        isPersistent: true,
        bandwidth: '0 KB/s'
      };

      setTunnels(prev => [...prev, newTunnel]);
      addAgentLog('a-1', `GATEWAY: Zestawiono nowy tunel dla ${serviceName} (Port ${port}). ID: ${obfuscatedId}`);
    } catch (error) {
      console.error('Error creating tunnel:', error);
      setError('Nie udało się utworzyć tunelu');
    }
  }, [addAgentLog]);

  const handleAdvancedCreateTunnel = useCallback((config: { 
    label: string; 
    port: number; 
    provider: 'Cloudflare' | 'ngrok' | 'Local'; 
    obfuscate: boolean; 
  }) => {
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const prefix = config.provider === 'Cloudflare' ? 'cf' : config.provider === 'ngrok' ? 'ng' : 'lc';
      const obfuscatedId = config.obfuscate 
        ? `${prefix}-${randomSuffix}-${Math.floor(Math.random() * 99)}` 
        : `${prefix}-${config.label.toLowerCase().replace(/\s+/g, '-')}`;
      
      const newTunnel: TunnelConfig = {
        id: `t-${Date.now()}`,
        label: config.label,
        obfuscatedId: obfuscatedId,
        provider: config.provider,
        localPort: config.port,
        publicUrl: `https://${obfuscatedId}.${config.provider.toLowerCase()}-gateway.io`,
        isActive: true,
        isPersistent: true,
        bandwidth: '0 KB/s'
      };

      setTunnels(prev => [...prev, newTunnel]);
      addAgentLog('a-1', `GATEWAY: Inicjalizacja tunelu ${config.provider} dla portu ${config.port}. Nazwa: ${config.label}`);
    } catch (error) {
      console.error('Error creating advanced tunnel:', error);
      setError('Nie udało się utworzyć zaawansowanego tunelu');
    }
  }, [addAgentLog]);

  // Memoized components data
  const memoizedServices = useMemo(() => services, [services]);
  const memoizedTunnels = useMemo(() => tunnels, [tunnels]);
  const memoizedAgents = useMemo(() => agents, [agents]);

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center p-8 bg-zinc-900 rounded-lg border border-red-500/20">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Brak połączenia z siecią</h2>
          <p className="text-slate-400">Sprawdź swoje połączenie internetowe i spróbuj ponownie.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-black text-slate-300">
        {/* Side-Nav */}
        <aside className="w-64 bg-zinc-950 border-r border-slate-900 flex flex-col shrink-0">
          <div className="p-8">
            <h1 className="text-xl font-bold text-white tracking-tighter flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(37,99,235,0.4)]">J</div>
              Jimbo_net
            </h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-2 glow-text">Control Center v2.0</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('arch')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-all ${
                activeTab === 'arch' 
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Infrastruktura
            </button>
          </nav>

          <div className="p-6 border-t border-slate-900">
            <div className="bg-blue-900/10 p-4 rounded border border-blue-500/20">
              <div className="flex justify-between items-center text-[8px] uppercase font-black text-blue-400 mb-1">
                <span>Ochrona Tunelowa</span>
                <span className="animate-pulse">Active</span>
              </div>
              <div className="text-[11px] text-white font-bold truncate">{vpn.location}</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#020202]">
          <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-slate-900 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                {activeTab === 'dashboard' ? 'Command Hub' : 'Architektura'}
              </h2>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">
                Interfejs bezpośredniej orkiestracji
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                Dodaj Tunel
              </button>
              <button 
                onClick={handleOpenTask} 
                className="px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase rounded hover:bg-slate-200 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Uruchom Zadanie
              </button>
            </div>
          </header>

          <div className="p-8 space-y-8 max-w-[1440px] mx-auto">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-300 hover:text-red-200"
                >
                  Zamknij
                </button>
              </div>
            )}
            
            {activeTab === 'dashboard' ? (
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <NetworkGraph 
                    services={memoizedServices} 
                    tunnels={memoizedTunnels} 
                    vpn={vpn} 
                    agents={memoizedAgents}
                    onKillTask={handleKillTask}
                    onOpenTask={handleOpenTask}
                    onTogglePersistence={handleTogglePersistence}
                    onCreateTunnel={handleCreateTunnel}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TunnelStatus 
                      tunnels={memoizedTunnels} 
                      onToggle={(id) => setTunnels(prev => prev.map(t => t.id === id ? {...t, isActive: !t.isActive} : t))} 
                      onRefresh={() => addAgentLog('a-1', 'Odświeżanie statystyk bram Cloudflare...')}
                    />
                    <SpeedTest />
                  </div>
                </div>
                
                <div className="col-span-12 lg:col-span-4 space-y-8">
                  {/* Agent Activity Log */}
                  <div className="bg-zinc-950 border border-slate-900 rounded-xl overflow-hidden glass">
                    <div className="p-4 bg-white/5 border-b border-slate-900">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Globalny Log Agentów</h3>
                    </div>
                    <div className="p-4 space-y-6">
                      {memoizedAgents.map(agent => (
                        <div key={agent.id} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-white uppercase">{agent.name}</span>
                            <span className={`px-1.5 py-0.5 rounded font-black ${
                              agent.status === AgentStatus.WORKING 
                                ? 'bg-green-600/20 text-green-500' 
                                : 'text-slate-700'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                          <div className="bg-black/40 border border-slate-900 p-3 rounded text-[11px] leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar">
                            {agent.log.map((line, idx) => (
                              <div key={idx} className={`${
                                idx === 0 ? 'text-slate-300 font-bold' : 'text-slate-600'
                              } italic`}>
                                {idx === 0 ? '> ' : '  '} {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Process Mini-List */}
                  <div className="bg-zinc-950 border border-slate-900 rounded-xl p-5 glass">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Zasoby Orkiestrowane</h3>
                    <div className="space-y-3">
                      {memoizedServices.map(s => (
                        <div key={s.pid} className="group flex justify-between items-center p-2 rounded hover:bg-white/5 transition-all">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{s.name}</span>
                            <span className="text-[9px] text-slate-600 mono">PORT {s.port} | {s.protocol}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full self-center ${
                              s.isExposed 
                                ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                                : 'bg-blue-500'
                            }`}></div>
                            <button 
                              onClick={() => handleKillTask(s.pid)} 
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"
                              title="Zakończ proces"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ArchitectureDocs />
            )}
          </div>

          <CreateTunnelModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onCreate={handleAdvancedCreateTunnel} 
          />
        </main>
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
          .glow-text { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default App;