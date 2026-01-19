
import React, { useState } from 'react';

interface SpeedTestProps {
  onTest?: (results: { ping: number; down: number; up: number }) => void;
}

const SpeedTest: React.FC<SpeedTestProps> = ({ onTest }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState({ ping: 0, down: 0, up: 0 });

  const runTest = () => {
    setTesting(true);
    let count = 0;
    let finalResults = { ping: 0, down: 0, up: 0 };
    const interval = setInterval(() => {
      finalResults = {
        ping: Math.floor(Math.random() * 20) + 5,
        down: Math.floor(Math.random() * 800) + 100,
        up: Math.floor(Math.random() * 300) + 50
      };
      setResults(finalResults);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setTesting(false);
        // Call the callback with final results
        if (onTest) {
          onTest(finalResults);
        }
      }
    }, 100);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 glass neon-border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 glow-text">Sieciowy Speed Test</h3>
        <button 
          onClick={runTest}
          disabled={testing}
          className="text-[10px] font-bold px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded transition-all"
        >
          {testing ? 'TESTOWANIE...' : 'URUCHOM TEST'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ping</p>
          <p className="text-2xl font-mono font-bold text-white">{results.ping} <span className="text-xs text-slate-600">ms</span></p>
        </div>
        <div className="text-center border-x border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Download</p>
          <p className="text-2xl font-mono font-bold text-green-500">{results.down} <span className="text-xs text-slate-600">Mb/s</span></p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Upload</p>
          <p className="text-2xl font-mono font-bold text-blue-500">{results.up} <span className="text-xs text-slate-600">Mb/s</span></p>
        </div>
      </div>
      {testing && (
        <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]"></div>
        </div>
      )}
      <style>{`
        @keyframes progress {
          0% { width: 0%; left: 0%; }
          50% { width: 100%; left: 0%; }
          100% { width: 0%; left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SpeedTest;
