import React from "react";

interface StatisticBannerProps {
  label: string;
  value: string | number;
  color?: string;
}

export const StatisticBanner: React.FC<StatisticBannerProps> = ({
  label,
  value,
  color = "#ff3333", // Default red
}) => {
  return (
    <div className="col-span-full glass-panel rounded-xl p-8 mb-8 relative overflow-hidden group border border-white/5 mx-auto w-full max-w-5xl">
      {/* Dynamic Glow Background */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-[size:20px_20px]"
        style={{ 
          backgroundColor: color,
          maskImage: 'linear-gradient(to bottom, transparent, black)'
        }} 
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
         <h3 className="font-mono text-3xl md:text-5xl font-bold tracking-widest text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(255,51,51,0.5)] animate-pulse"
             style={{ backgroundImage: `linear-gradient(to right, #fff, ${color})` }}>
           {label} : {value}
         </h3>
         <div className="h-px w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </div>
  );
};
