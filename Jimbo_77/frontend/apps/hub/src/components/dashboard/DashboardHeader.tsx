import React from "react";

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-12 relative min-h-[180px] group">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-primary/20 blur-[100px] rounded-full opacity-50 pointer-events-none"></div>

      <img
        src="/apple-touch-icon.png"
        alt="Logo"
        className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_25px_rgba(255,51,51,0.5)] hover:scale-105 transition-transform duration-500 hover:rotate-3"
      />
      <div className="text-center md:text-left relative z-10">
        <h2 className="font-brand text-5xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 drop-shadow-sm">
          the open computa operations <span className="text-primary text-4xl align-top">V2.2</span>
        </h2>
        <div className="mt-2 text-xl md:text-2xl text-gray-400 font-display tracking-[0.3em] uppercase opacity-80 flex items-center gap-3 justify-center md:justify-start">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Central Operations Dashboard - Jimbo77 Systems
        </div>
      </div>
    </div>
  );
};
