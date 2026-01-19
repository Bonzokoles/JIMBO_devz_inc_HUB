import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SpeedTestResults {
  ping: number;
  down: number;
  up: number;
}

interface SpeedTestState {
  isTesting: boolean;
  results: SpeedTestResults;
  error: string | null;
  progress: number;
}

const SPEED_TEST_DURATION = 2000; // 2 seconds
const UPDATE_INTERVAL = 100; // Update every 100ms
const MAX_PROGRESS = 100;

const SpeedTest: React.FC = () => {
  const [state, setState] = useState<SpeedTestState>({
    isTesting: false,
    results: { ping: 0, down: 0, up: 0 },
    error: null,
    progress: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateRandomResults = useCallback((): SpeedTestResults => ({
    ping: Math.floor(Math.random() * 20) + 5,
    down: Math.floor(Math.random() * 800) + 100,
    up: Math.floor(Math.random() * 300) + 50
  }), []);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runTest = useCallback(async () => {
    if (state.isTesting) return;

    cleanup();
    
    setState(prev => ({
      ...prev,
      isTesting: true,
      error: null,
      progress: 0
    }));

    let currentProgress = 0;

    // Simulate progressive results during test
    intervalRef.current = setInterval(() => {
      currentProgress += (UPDATE_INTERVAL / SPEED_TEST_DURATION) * MAX_PROGRESS;
      
      setState(prev => ({
        ...prev,
        progress: Math.min(currentProgress, MAX_PROGRESS),
        results: generateRandomResults()
      }));
    }, UPDATE_INTERVAL);

    // Complete the test after duration
    timeoutRef.current = setTimeout(() => {
      cleanup();
      
      setState(prev => ({
        ...prev,
        isTesting: false,
        progress: MAX_PROGRESS,
        results: generateRandomResults()
      }));
    }, SPEED_TEST_DURATION);
  }, [state.isTesting, cleanup, generateRandomResults]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getPingColor = (ping: number): string => {
    if (ping <= 10) return 'text-green-500';
    if (ping <= 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSpeedColor = (speed: number): string => {
    if (speed >= 500) return 'text-green-500';
    if (speed >= 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 glass neon-border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 glow-text">
          Sieciowy Speed Test
        </h3>
        <button 
          onClick={runTest}
          disabled={state.isTesting}
          className="text-[10px] font-bold px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded transition-all duration-200 transform hover:scale-105 disabled:scale-100"
        >
          {state.isTesting ? 'TESTOWANIE...' : 'URUCHOM TEST'}
        </button>
      </div>
      
      {/* Progress Bar */}
      {state.isTesting && (
        <div className="mb-4">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100 ease-out"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-500 mt-1 text-center">
            {Math.round(state.progress)}% ukończone
          </p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ping</p>
          <p className={`text-2xl font-mono font-bold ${getPingColor(state.results.ping)}`}>
            {state.results.ping} <span className="text-xs text-slate-600">ms</span>
          </p>
        </div>
        <div className="text-center border-x border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Download</p>
          <p className={`text-2xl font-mono font-bold ${getSpeedColor(state.results.down)}`}>
            {state.results.down} <span className="text-xs text-slate-600">Mb/s</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Upload</p>
          <p className={`text-2xl font-mono font-bold ${getSpeedColor(state.results.up)}`}>
            {state.results.up} <span className="text-xs text-slate-600">Mb/s</span>
          </p>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
          <p className="text-[10px] text-red-400">{state.error}</p>
        </div>
      )}

      {/* Test Status */}
      <div className="mt-4 text-center">
        <p className={`text-[9px] font-bold ${
          state.isTesting ? 'text-blue-400 animate-pulse' : 'text-slate-600'
        }`}>
          {state.isTesting ? 'Testowanie połączenia...' : 'Gotowy do testu'}
        </p>
      </div>
    </div>
  );
};

export default SpeedTest;