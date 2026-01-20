
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { TunnelConfig } from '../types';

interface Props {
  tunnels: TunnelConfig[];
  onToggle: (id: string) => void;
  onRefresh?: () => void;
}

interface HistoryPoint {
  time: string;
  value: number;
}

const TunnelStatus: React.FC<Props> = ({ tunnels, onToggle, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [histories, setHistories] = useState<Record<string, HistoryPoint[]>>({});

  // Inicjalizacja danych historycznych (12 punktów = 60 min, co 5 min)
  useEffect(() => {
    setHistories(prev => {
      const next = { ...prev };
      let changed = false;
      tunnels.forEach(t => {
        if (!next[t.id]) {
          next[t.id] = Array.from({ length: 12 }, (_, i) => ({
            time: `${(11 - i) * 5}m`,
            value: Math.floor(Math.random() * 450) + 50
          }));
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tunnels]);

  // Symulacja trendu godzinnego - co 10s dodajemy nowy "odczyt"
  useEffect(() => {
    const interval = setInterval(() => {
      setHistories(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const current = next[id];
          const lastVal = current[current.length - 1].value;
          // Symulacja realistycznego dryfu danych
          const drift = (Math.random() - 0.45) * 60; 
          const newVal = Math.max(20, Math.min(1200, lastVal + drift));
          
          next[id] = [...current.slice(1), { 
            time: '0m', 
            value: Math.round(newVal) 
          }].map((p, idx) => ({
            ...p,
            time: idx === 11 ? 'Teraz' : `${(11 - idx) * 5}m`
          }));
        });
        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="bg-zinc-950/60 border border-slate-900 rounded-2xl overflow-hidden glass neon-border shadow-2xl">
      <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-blue-600/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Analiza Pasma (60 min)</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Węzły aktywne w czasie rzeczywistym</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-2 hover:bg-white/5 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-500'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-5">
        {tunnels.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">Brak aktywnych połączeń</p>
          </div>
        ) : (
          tunnels.map((tunnel) => {
            const history = histories[tunnel.id] || [];
            const peak = Math.max(...history.map(h => h.value), 1);
            const currentVal = history[history.length - 1]?.value || 0;

            return (
              <div 
                key={tunnel.id} 
                className="bg-black/40 border border-slate-900 rounded-xl p-4 space-y-4 group hover:border-blue-500/40 transition-all duration-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${tunnel.isActive ? 'bg-blue-600/10 border-blue-600/30 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>
                      {tunnel.provider === 'Cloudflare' ? (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M23.63 15.59c-.48-.74-1.31-1.3-2.15-1.46.06-.31.08-.64.08-.98 0-2.54-2.04-4.62-4.56-4.62-.61 0-1.19.12-1.72.34C14.33 6.91 12.35 5.5 10.09 5.5c-3.14 0-5.7 2.54-5.7 5.67 0 .34.03.67.09 1-.9.18-1.75.76-2.25 1.54C1.5 14.83 1.19 15.93 1.4 17c.18.96.65 1.83 1.34 2.44.68.61 1.55.94 2.45.94h14.89c.14 0 .28-.01.42-.03 1.14-.14 2.15-.81 2.76-1.81.59-.97.66-2.13.37-2.95z"/></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">{tunnel.label}</span>
                        {tunnel.isActive && <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">{tunnel.obfuscatedId} <span className="text-slate-700 ml-1">@{tunnel.localPort}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right hidden sm:block">
                      <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Peak (1h)</div>
                      <div className="text-xs font-mono text-white font-bold">{peak} <span className="text-[9px] text-slate-500">KB/s</span></div>
                    </div>
                    <button 
                      onClick={() => onToggle(tunnel.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all focus:outline-none border ${tunnel.isActive ? 'bg-blue-600 border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-slate-900 border-slate-800'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${tunnel.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Hourly Trend Chart */}
                {tunnel.isActive && (
                  <div className="space-y-2">
                    <div className="h-20 w-full bg-blue-500/[0.02] rounded-xl border border-blue-500/5 p-2 overflow-hidden relative">
                       <div className="absolute top-2 left-2 text-[7px] font-black text-slate-700 uppercase tracking-widest z-10">60m temu</div>
                       <div className="absolute top-2 right-2 text-[7px] font-black text-blue-500/50 uppercase tracking-widest z-10">Teraz</div>
                       
                       <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <defs>
                            <linearGradient id={`grad-${tunnel.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip 
                            contentStyle={{ background: '#09090b', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748b' }}
                          />
                          <YAxis hide domain={[0, peak * 1.2]} />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="Prędkość"
                            stroke="#3b82f6" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill={`url(#grad-${tunnel.id})`}
                            isAnimationActive={true}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between items-center px-1">
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Aktualne obciążenie:</span>
                          <span className="text-[10px] font-mono text-blue-400 font-black">{currentVal} KB/s</span>
                       </div>
                       <div className="text-[9px] text-slate-700 font-mono italic">Zaktualizowano: teraz</div>
                    </div>
                  </div>
                )}

                {tunnel.isActive && tunnel.publicUrl && (
                  <div className="flex items-center gap-2 text-[10px] bg-white/[0.02] p-2 rounded-lg border border-white/[0.05] group/link">
                    <svg className="w-3.5 h-3.5 text-blue-500/50 group-hover/link:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <a href={tunnel.publicUrl} target="_blank" rel="noopener noreferrer" className="mono text-slate-500 group-hover/link:text-blue-400 transition-colors truncate">
                      {tunnel.publicUrl.replace('https://', '')}
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-4 bg-white/[0.02] border-t border-slate-900 flex justify-center items-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
         <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em]">Node Flow Monitoring Active</span>
      </div>
    </div>
  );
};

export default TunnelStatus;
