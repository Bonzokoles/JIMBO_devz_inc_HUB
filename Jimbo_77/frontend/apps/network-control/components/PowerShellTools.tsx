import React, { useState } from 'react';
import { powerShellService, PowerShellCommand, PowerShellResult } from '../services/powershellService';

export const PowerShellTools: React.FC = () => {
  const [selectedCommand, setSelectedCommand] = useState<PowerShellCommand | null>(null);
  const [commandResult, setCommandResult] = useState<PowerShellResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandParams, setCommandParams] = useState<Record<string, string>>({});

  const commands = powerShellService.getAvailableCommands();
  const categories = ['dns', 'cache', 'network', 'system'] as const;

  const getCategoryColor = (category: PowerShellCommand['category']) => {
    switch (category) {
      case 'dns': return 'bg-blue-600/10 text-blue-400 border-blue-600/30';
      case 'cache': return 'bg-green-600/10 text-green-400 border-green-600/30';
      case 'network': return 'bg-purple-600/10 text-purple-400 border-purple-600/30';
      case 'system': return 'bg-orange-600/10 text-orange-400 border-orange-600/30';
    }
  };

  const getCategoryIcon = (category: PowerShellCommand['category']) => {
    switch (category) {
      case 'dns': return '🌐';
      case 'cache': return '🗑️';
      case 'network': return '🔌';
      case 'system': return '⚙️';
    }
  };

  const handleExecuteCommand = async (command: PowerShellCommand) => {
    setIsExecuting(true);
    setCommandResult(null);
    
    try {
      const result = await powerShellService.executeCommand(command, commandParams);
      setCommandResult(result);
      
      // Track command execution
      if (typeof window !== 'undefined' && window.metricsService) {
        window.metricsService.trackEvent('powershell_command_executed', {
          command_id: command.id,
          command_name: command.name,
          category: command.category,
          success: result.success
        });
      }
    } catch (error) {
      setCommandResult({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        exitCode: 1
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderParamInputs = (command: PowerShellCommand) => {
    const paramMatches = command.command.match(/\{(\w+)\}/g);
    if (!paramMatches) return null;

    const params = [...new Set(paramMatches.map(match => match.slice(1, -1)))];
    
    return (
      <div className="space-y-3 mb-4">
        {params.map(param => (
          <div key={param}>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="text"
              value={commandParams[param] || ''}
              onChange={(e) => setCommandParams(prev => ({ ...prev, [param]: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder={`Wprowadź ${param}...`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
      {/* Command Categories */}
      <div className="col-span-4 space-y-6">
        <div className="bg-zinc-950/40 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-blue-500">⚡</span>
            Narzędzia PowerShell
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Wykonuj zaawansowane polecenia systemowe do zarządzania DNS, pamięcią podręczną i siecią.
          </p>
          
          {categories.map(category => {
            const categoryCommands = commands.filter(cmd => cmd.category === category);
            return (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  {getCategoryIcon(category)} {category}
                </h4>
                <div className="space-y-2">
                  {categoryCommands.map(command => (
                    <button
                      key={command.id}
                      onClick={() => setSelectedCommand(command)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        selectedCommand?.id === command.id
                          ? 'bg-blue-600/10 border-blue-600/50 text-blue-400'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-white">{command.name}</span>
                        {command.requiresAdmin && (
                          <span className="text-[9px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-600/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{command.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Command Execution Panel */}
      <div className="col-span-8">
        {selectedCommand ? (
          <div className="bg-zinc-950/40 rounded-xl border border-slate-800 p-6 h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-[9px] font-black border ${getCategoryColor(selectedCommand.category)}`}>
                    {selectedCommand.category.toUpperCase()}
                  </span>
                  {selectedCommand.name}
                </h3>
                <p className="text-sm text-zinc-400 mt-2">{selectedCommand.description}</p>
              </div>
              <button
                onClick={() => setSelectedCommand(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Parameter Inputs */}
            {renderParamInputs(selectedCommand)}

            {/* Execute Button */}
            <button
              onClick={() => handleExecuteCommand(selectedCommand)}
              disabled={isExecuting}
              className="w-full mb-6 px-4 py-3 bg-blue-600 text-white text-sm font-black uppercase rounded hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wykonywanie...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Wykonaj Polecenie
                </>
              )}
            </button>

            {/* Command Preview */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Polecenie:</h4>
              <div className="bg-zinc-900 border border-zinc-700 rounded p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
                {selectedCommand.command.replace(/\{(\w+)\}/g, (match, param) => 
                  commandParams[param] ? `<span class="text-blue-400">${commandParams[param]}</span>` : match
                )}
              </div>
            </div>

            {/* Results */}
            {commandResult && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Wynik ({commandResult.success ? 'Sukces' : 'Błąd'}):
                </h4>
                <div className={`border rounded p-4 font-mono text-xs overflow-auto max-h-64 ${
                  commandResult.success 
                    ? 'bg-green-900/10 border-green-600/30 text-green-300' 
                    : 'bg-red-900/10 border-red-600/30 text-red-300'
                }`}>
                  {commandResult.output || commandResult.error || 'Brak wyników'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-950/40 rounded-xl border border-slate-800 p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Wybierz narzędzie</h3>
              <p className="text-zinc-400">Wybierz polecenie PowerShell z listy po lewej, aby rozpocząć.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};