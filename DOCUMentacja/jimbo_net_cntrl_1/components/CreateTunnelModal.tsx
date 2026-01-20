
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: { label: string; port: number; provider: 'Cloudflare' | 'ngrok' | 'Local'; obfuscate: boolean }) => void;
}

const CreateTunnelModal: React.FC<Props> = ({ isOpen, onClose, onCreate }) => {
  const [label, setLabel] = useState('');
  const [port, setPort] = useState<number>(3000);
  const [provider, setProvider] = useState<'Cloudflare' | 'ngrok' | 'Local'>('Cloudflare');
  const [obfuscate, setObfuscate] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !port) return;
    onCreate({ label, port, provider, obfuscate });
    onClose();
    // Reset form
    setLabel('');
    setPort(3000);
    setProvider('Cloudflare');
    setObfuscate(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-zinc-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-900 bg-blue-600/5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Inicjalizacja Tunelu</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">Konfiguracja bezpiecznego przejścia</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Nazwa Tunelu</label>
              <input 
                autoFocus
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="np. API-Staging-Bridge"
                className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Lokalny Port</label>
                <input 
                  type="number" 
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Dostawca</label>
                <select 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
                >
                  <option value="Cloudflare">Cloudflare</option>
                  <option value="ngrok">ngrok</option>
                  <option value="Local">Local (Proxy)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-300 block">Maskowanie URL</span>
                <span className="text-[10px] text-slate-600">Ukryj publiczny identyfikator</span>
              </div>
              <button 
                type="button"
                onClick={() => setObfuscate(!obfuscate)}
                className={`relative inline-flex h-5 w-11 items-center rounded-full transition-all ${obfuscate ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all ${obfuscate ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-800 rounded-xl text-xs font-black uppercase text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Anuluj
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Utwórz tunel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTunnelModal;
