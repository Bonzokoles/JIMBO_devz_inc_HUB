import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Worker {
  id: string;
  name: string;
  route: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  errorRate: number;
  requestsPerMin: number;
  lastDeploy: string;
  costPerDay: number;
}

export function WorkersMonitoringView() {
  const [workers, setWorkers] = React.useState<Worker[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedWorker, setSelectedWorker] = React.useState<Worker | null>(
    null
  );

  // Mock data - będzie zastąpione API call do Cloudflare
  React.useEffect(() => {
    const mockWorkers: Worker[] = [
      {
        id: "1",
        name: "jimbo77-agents-orchestrator",
        route: "orchestrator.jimbo77.com",
        status: "healthy",
        uptime: 99.8,
        errorRate: 0.02,
        requestsPerMin: 145,
        lastDeploy: "2026-01-14T10:30:00Z",
        costPerDay: 0.12,
      },
      {
        id: "2",
        name: "jimbo-like-pumo-api",
        route: "jimbo-like-pumo-api.stolarnia-ams.workers.dev",
        status: "healthy",
        uptime: 99.5,
        errorRate: 0.05,
        requestsPerMin: 89,
        lastDeploy: "2026-01-13T15:20:00Z",
        costPerDay: 0.08,
      },
      {
        id: "3",
        name: "jimbo-catalog-gateway",
        route: "catalog.jimbo77.com",
        status: "degraded",
        uptime: 97.2,
        errorRate: 2.3,
        requestsPerMin: 234,
        lastDeploy: "2026-01-12T09:15:00Z",
        costPerDay: 0.15,
      },
      {
        id: "4",
        name: "jimbo-angels-worker",
        route: "angels.jimbo77.com",
        status: "healthy",
        uptime: 99.9,
        errorRate: 0.01,
        requestsPerMin: 67,
        lastDeploy: "2026-01-15T08:00:00Z",
        costPerDay: 0.06,
      },
      {
        id: "5",
        name: "mybonzo-main-worker",
        route: "mybonzo.com",
        status: "healthy",
        uptime: 99.7,
        errorRate: 0.03,
        requestsPerMin: 312,
        lastDeploy: "2026-01-14T14:45:00Z",
        costPerDay: 0.21,
      },
    ];

    setTimeout(() => {
      setWorkers(mockWorkers);
      setLoading(false);
    }, 500);
  }, []);

  const totalCost = workers.reduce((sum, w) => sum + w.costPerDay, 0);
  const totalRequests = workers.reduce((sum, w) => sum + w.requestsPerMin, 0);
  const avgUptime =
    workers.reduce((sum, w) => sum + w.uptime, 0) / workers.length;

  const healthyCount = workers.filter((w) => w.status === "healthy").length;
  const degradedCount = workers.filter((w) => w.status === "degraded").length;
  const downCount = workers.filter((w) => w.status === "down").length;

  // Mock chart data
  const chartData = [
    { time: "00:00", requests: 120, errors: 2 },
    { time: "04:00", requests: 85, errors: 1 },
    { time: "08:00", requests: 340, errors: 5 },
    { time: "12:00", requests: 520, errors: 8 },
    { time: "16:00", requests: 680, errors: 12 },
    { time: "20:00", requests: 450, errors: 6 },
    { time: "23:59", requests: 280, errors: 3 },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-gray-200">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-glass-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚙️</span>
            <h1 className="font-brand text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-jimbo-gold to-orange-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              WORKERS MONITORING
            </h1>
          </div>
          <p className="font-mono text-sm text-gray-400 tracking-wider uppercase pl-1">
            Real-time status of <span className="text-white font-bold">35</span> Cloudflare Workers
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-black/40 border border-glass-border hover:border-jimbo-gold/50 text-jimbo-gold font-mono text-xs tracking-widest uppercase rounded hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300">
            Refresh Data
          </button>
          <button className="px-6 py-2 bg-jimbo-gold/10 border border-jimbo-gold/30 hover:bg-jimbo-gold/20 text-jimbo-gold font-mono text-xs tracking-widest uppercase rounded hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300 relative overflow-hidden group">
            <span className="relative z-10">Deploy All</span>
            <div className="absolute inset-0 bg-jimbo-gold/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4 text-blue-500 group-hover:scale-110 transition-transform duration-500">#</div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Total Workers</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{workers.length}</div>
          <div className="text-xs font-mono text-gray-400 mt-3 flex gap-3">
             <span className="text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> {healthyCount} healthy</span>
             {degradedCount > 0 && <span className="text-yellow-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span> {degradedCount} degraded</span>}
             {downCount > 0 && <span className="text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> {downCount} down</span>}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-green-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4 text-green-500 group-hover:scale-110 transition-transform duration-500">%</div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Avg Uptime</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">{avgUptime.toFixed(1)}%</div>
          <div className="text-xs font-mono text-green-400 mt-3">↑ Target: 99.9%</div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4 text-purple-500 group-hover:scale-110 transition-transform duration-500">R</div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Requests / Min</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{totalRequests.toLocaleString()}</div>
          <div className="text-xs font-mono text-gray-400 mt-3">Global throughput</div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-jimbo-gold relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 text-8xl -mr-4 -mt-4 text-jimbo-gold group-hover:scale-110 transition-transform duration-500">$</div>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Daily Cost</div>
          <div className="text-5xl font-display text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">${totalCost.toFixed(2)}</div>
          <div className="text-xs font-mono text-jimbo-gold/80 mt-3">Est. ${(totalCost * 30).toFixed(0)} / month</div>
        </div>
      </div>

      {/* Request Volume Chart */}
      <div className="glass-panel p-6 rounded-xl border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
           <h2 className="font-brand text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Request Volume (24h)</h2>
           <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-mono text-purple-400"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Requests</span>
              <span className="flex items-center gap-1 text-xs font-mono text-red-400"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Errors</span>
           </div>
        </div>
        <div className="h-[300px] w-full bg-black/20 rounded-lg p-2 border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000dd', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ color: '#888', marginBottom: '5px' }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workers List */}
      <div className="glass-panel rounded-xl overflow-hidden border-t border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="font-brand text-2xl text-white tracking-wide">Workers Status</h2>
          <div className="text-xs font-mono text-gray-500 uppercase">Live Metrics</div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-jimbo-gold/30 border-t-jimbo-gold rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-jimbo-gold font-mono animate-pulse">Establishing Uplink...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-5 hover:bg-white/5 cursor-pointer transition-all duration-200 group relative border-l-2 border-l-transparent hover:border-l-jimbo-gold"
                onClick={() => setSelectedWorker(worker)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            worker.status === "healthy"
                              ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                              : worker.status === "degraded"
                              ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                              : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          }`}
                        />
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                            worker.status === "healthy" ? "bg-green-500" : worker.status === "degraded" ? "bg-yellow-500" : "bg-red-500"
                        }`}></div>
                      </div>
                      <div>
                        <div className="font-brand text-lg text-white group-hover:text-jimbo-gold transition-colors">{worker.name}</div>
                        <div className="text-xs font-mono text-gray-500 font-light">
                          {worker.route}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm font-mono">
                    <div>
                      <div className="text-gray-600 text-[10px] uppercase tracking-wider">Uptime</div>
                      <div className={`font-bold ${worker.uptime > 99 ? 'text-green-400' : 'text-yellow-400'}`}>{worker.uptime}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-[10px] uppercase tracking-wider">Error Rate</div>
                      <div className={`font-bold ${worker.errorRate < 1 ? 'text-gray-300' : 'text-red-400'}`}>{worker.errorRate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-[10px] uppercase tracking-wider">Req/min</div>
                      <div className="font-bold text-purple-300">
                        {worker.requestsPerMin}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-[10px] uppercase tracking-wider">Cost/day</div>
                      <div className="font-bold text-jimbo-gold">${worker.costPerDay}</div>
                    </div>
                  </div>

                  <div className="md:ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    <span className="text-xs font-mono text-jimbo-gold border border-jimbo-gold/30 rounded px-2 py-1 bg-jimbo-gold/10">DETAILS_VIEW &gt;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Worker Details Modal */}
      {selectedWorker && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedWorker(null)}
        >
          <div
            className="glass-panel border border-jimbo-gold/30 rounded-xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.1)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jimbo-gold to-transparent opacity-50"></div>
            
            <div className="flex items-start justify-between mb-8">
               <div>
                  <h2 className="font-brand text-3xl text-white drop-shadow-md">{selectedWorker.name}</h2>
                  <p className="font-mono text-sm text-jimbo-gold mt-1">{selectedWorker.id} // SYSTEM_WORKER</p>
               </div>
               <div className={`px-3 py-1 rounded border ${selectedWorker.status === 'healthy' ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'} font-mono text-xs uppercase tracking-widest`}>
                  {selectedWorker.status}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
               <div className="p-4 bg-black/40 rounded border border-white/5">
                 <div className="text-xs text-gray-500 font-mono uppercase mb-1">Endpoints</div>
                 <div className="text-white font-mono text-sm break-all">{selectedWorker.route}</div>
               </div>
               <div className="p-4 bg-black/40 rounded border border-white/5">
                  <div className="text-xs text-gray-500 font-mono uppercase mb-1">Last Deployment</div>
                  <div className="text-white font-mono text-sm">{new Date(selectedWorker.lastDeploy).toLocaleString()}</div>
               </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
               <div className="text-center p-3 bg-white/5 rounded border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Uptime</div>
                  <div className="text-xl font-display text-green-400">{selectedWorker.uptime}%</div>
               </div>
               <div className="text-center p-3 bg-white/5 rounded border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Errors</div>
                  <div className="text-xl font-display text-red-400">{selectedWorker.errorRate}%</div>
               </div>
               <div className="text-center p-3 bg-white/5 rounded border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">R/Min</div>
                  <div className="text-xl font-display text-purple-400">{selectedWorker.requestsPerMin}</div>
               </div>
               <div className="text-center p-3 bg-white/5 rounded border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Cost</div>
                  <div className="text-xl font-display text-jimbo-gold">${selectedWorker.costPerDay}</div>
               </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-white/10">
              <button className="flex-1 px-4 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary-200 font-mono text-xs uppercase tracking-wider rounded transition-colors group">
                 ⚡ Restart Process
              </button>
              <button className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs uppercase tracking-wider rounded transition-colors">
                 📜 View Logs
              </button>
              <button
                className="px-6 py-3 border border-white/10 hover:border-white/30 text-gray-400 font-mono text-xs uppercase tracking-wider rounded transition-colors hover:text-white hover:bg-white/5"
                onClick={() => setSelectedWorker(null)}
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
