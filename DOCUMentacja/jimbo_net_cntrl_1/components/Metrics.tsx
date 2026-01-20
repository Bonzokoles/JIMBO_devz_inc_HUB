
import React from 'react';
import metricsService from '../services/metricsService';

const Metrics: React.FC = () => {
  const handleExportJson = () => {
    const json = metricsService.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metrics.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = metricsService.exportToCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metrics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const pdfBytes = await metricsService.exportToPdf();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metrics.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-white uppercase tracking-wider">Metrics</h2>
      <div className="flex gap-4 mt-4">
        <button onClick={handleExportJson} className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2">
          Export JSON
        </button>
        <button onClick={handleExportCsv} className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2">
          Export CSV
        </button>
        <button onClick={handleExportPdf} className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2">
          Export PDF
        </button>
      </div>
      <div className="mt-8 bg-zinc-950 border border-slate-900 rounded-xl overflow-hidden glass">
        <div className="p-4 bg-white/5 border-b border-slate-900">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Collected Metrics</h3>
        </div>
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {metricsService.getMetrics().map((metric, index) => (
            <div key={index} className="text-xs text-slate-400">
              <span className="font-bold text-slate-300">{new Date(metric.timestamp).toLocaleString()}</span> - <span className="font-semibold text-blue-400">{metric.event}</span>
              <pre className="text-xs text-slate-500 whitespace-pre-wrap">{JSON.stringify(metric.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
