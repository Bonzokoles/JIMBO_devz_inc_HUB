
import React, { useState, useEffect } from 'react';
import { api } from '@jimbo77/core';

// Styles for the "Bunker" theme
const bunkerStyles = {
  container: "p-6 bg-gray-900 min-h-screen text-gray-200 font-mono",
  header: "text-3xl font-bold text-red-500 mb-8 border-b border-red-900 pb-4 tracking-widest uppercase",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-8",
  card: "bg-gray-800 border-2 border-gray-700 p-6 shadow-xl rounded-sm",
  cardHeader: "text-xl font-bold mb-4 flex items-center justify-between",
  statRow: "flex justify-between border-b border-gray-700 py-2",
  statLabel: "text-gray-400",
  statValue: "font-bold text-white",
  statusUp: "text-green-500 font-bold",
  statusDown: "text-red-500 font-extrabold animate-pulse",
  auditPass: "text-green-500",
  auditFail: "text-red-500 font-bold",
  refreshBtn: "bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded border border-red-700 uppercase tracking-wider text-sm transition-colors"
};

const BunkerWarRoom = () => {
  const [realmanData, setRealmanData] = useState<any>(null);
  const [badData, setBadData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch for speed
      const [realman, bad] = await Promise.allSettled([
        api.getRealmanReport().catch(err => ({ error: "Agent Offline", detailed: err.message })),
        api.getBadAudit().catch(err => ({ error: "Agent Offline", detailed: err.message }))
      ]);

      setRealmanData(realman.status === 'fulfilled' ? realman.value : { error: "Agent Connection Failed" });
      setBadData(bad.status === 'fulfilled' ? bad.value : { error: "Agent Connection Failed" });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Bunker Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className={bunkerStyles.container}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={bunkerStyles.header}>
          ☢️ BUNKER WAR ROOM <span className="text-xs text-gray-600 ml-4">v1.0.0</span>
        </h1>
        <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">LAST UPDATE: {lastUpdated}</span>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className={bunkerStyles.refreshBtn}
            >
              {loading ? 'SCANNING...' : 'SCAN SYSTEM'}
            </button>
        </div>
      </div>

      <div className={bunkerStyles.grid}>
        
        {/* LEFT COLUMN: THE REALMAN */}
        <div className={`${bunkerStyles.card} border-l-4 border-l-blue-600`}>
          <div className={bunkerStyles.cardHeader}>
            <span className="text-blue-500">THE_REALMAN (Statistics)</span>
            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">PORT: 6070</span>
          </div>

          {!realmanData ? (
             <div className="text-center py-12 text-gray-600">Waiting for data...</div>
          ) : realmanData.error ? (
             <div className="text-red-500 p-4 border border-red-900 bg-red-900/20">
               ⚠️ AGENT OFFLINE OR UNREACHABLE
               <div className="text-xs mt-2 text-gray-400">{realmanData.detailed}</div>
             </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-black/30 rounded border border-gray-700">
                <div className={bunkerStyles.statRow}>
                  <span className={bunkerStyles.statLabel}>Deploy Status</span>
                  <span className={realmanData.raw_data?.deploy?.is_up ? bunkerStyles.statusUp : bunkerStyles.statusDown}>
                    {realmanData.raw_data?.deploy?.is_up ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className={bunkerStyles.statRow}>
                   <span className={bunkerStyles.statLabel}>Deploy URL</span>
                   <a href={realmanData.raw_data?.deploy?.url} target="_blank" className="text-blue-400 text-sm hover:underline truncate w-48 text-right block">
                     {realmanData.raw_data?.deploy?.url}
                   </a>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm uppercase text-gray-500 font-bold mt-4">Codebase Stats</h3>
                <div className={bunkerStyles.statRow}>
                  <span className={bunkerStyles.statLabel}>Python Files</span>
                  <span className={bunkerStyles.statValue}>{realmanData.raw_data?.stats?.python_files}</span>
                </div>
                <div className={bunkerStyles.statRow}>
                  <span className={bunkerStyles.statLabel}>TypeScript Files</span>
                  <span className={bunkerStyles.statValue}>{realmanData.raw_data?.stats?.typescript_files}</span>
                </div>
                <div className={bunkerStyles.statRow}>
                  <span className={bunkerStyles.statLabel}>Total Lines</span>
                  <span className={bunkerStyles.statValue}>{realmanData.raw_data?.stats?.total_lines.toLocaleString()}</span>
                </div>
                <div className={bunkerStyles.statRow}>
                  <span className="text-yellow-500 font-bold">TODO Count (Debt)</span>
                  <span className="text-yellow-500 font-bold">{realmanData.raw_data?.stats?.todo_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: THE BAD */}
        <div className={`${bunkerStyles.card} border-l-4 border-l-red-600`}>
          <div className={bunkerStyles.cardHeader}>
            <span className="text-red-500">THE_BAD (Audit & Risks)</span>
            <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">PORT: 6071</span>
          </div>

          {!badData ? (
             <div className="text-center py-12 text-gray-600">Waiting for data...</div>
          ) : badData.error ? (
             <div className="text-red-500 p-4 border border-red-900 bg-red-900/20">
               ⚠️ AGENT OFFLINE OR UNREACHABLE
               <div className="text-xs mt-2 text-gray-400">{badData.detailed}</div>
             </div>
          ) : (
             <div className="space-y-4">
               {/* Verdict Box */}
               <div className={`p-4 rounded border text-center ${badData.message.includes('FAIL') ? 'bg-red-900/30 border-red-600' : 'bg-green-900/30 border-green-600'}`}>
                 <div className="text-xs text-gray-400 uppercase tracking-widest">VERDICT</div>
                 <div className={`text-3xl font-black ${badData.message.includes('FAIL') ? 'text-red-500' : 'text-green-500'}`}>
                   {badData.message.includes('FAIL') ? 'FAILED' : 'PASSABLE'}
                 </div>
               </div>

                <div className="space-y-2 mt-4">
                  <h3 className="text-sm uppercase text-gray-500 font-bold">Log Analysis</h3>
                   <div className={bunkerStyles.statRow}>
                    <span className={bunkerStyles.statLabel}>Error Count</span>
                    <span className={badData.raw_data?.logs?.error_count > 0 ? "text-red-500 font-bold" : "text-green-500"}>
                      {badData.raw_data?.logs?.error_count}
                    </span>
                  </div>
                   <div className={bunkerStyles.statRow}>
                    <span className={bunkerStyles.statLabel}>Warnings</span>
                    <span className="text-yellow-500">{badData.raw_data?.logs?.warning_count}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <h3 className="text-sm uppercase text-gray-500 font-bold">Environment Security</h3>
                  <div className={bunkerStyles.statRow}>
                    <span className={bunkerStyles.statLabel}>.env Status</span>
                    <span className={badData.raw_data?.config?.status === 'OK' ? "text-green-500" : "text-red-500 font-bold"}>
                      {badData.raw_data?.config?.status}
                    </span>
                  </div>
                  {badData.raw_data?.config?.missing_keys?.length > 0 && (
                    <div className="bg-red-950 p-2 rounded border border-red-800 text-xs mt-2">
                       <div className="font-bold text-red-400 mb-1">MISSING SECRETS:</div>
                       <ul className="list-disc pl-4 text-red-300">
                         {badData.raw_data?.config?.missing_keys.map((k: string) => (
                           <li key={k}>{k}</li>
                         ))}
                       </ul>
                    </div>
                  )}
                </div>
             </div>
          )}
        </div>

      </div>
      
      <div className="mt-8 text-center text-gray-600 text-xs">
         SECURE CONNECTION / PROPRIETARY SYSTEM / DO NOT DISTRIBUTE
      </div>
    </div>
  );
};

export default BunkerWarRoom;
