import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Loading Delta Travel...' }) => {
  return (
    <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
      {/* Delta Travel Logo with Animation */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-[#C8102E]/30 animate-ping" />
        
        {/* Spinning ring */}
        <div className="absolute w-20 h-20 rounded-full border-4 border-t-[#C8102E] border-r-transparent border-b-[#C8102E]/40 border-l-transparent animate-spin" />
        
        {/* Logo Image */}
        <div className="w-16 h-16 rounded-full bg-white p-1 shadow-xl z-10 border-2 border-[#C8102E]/20">
          <img 
            src="/logo/logo.jpg" 
            alt="Delta Travel & Tour" 
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              // Fallback if logo fails to load
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23C8102E" rx="32"/%3E%3Ctext x="32" y="40" text-anchor="middle" dy=".3em" fill="white" font-size="28" font-family="sans-serif" font-weight="bold"%3EΔ%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-black text-[#111827] tracking-wider uppercase">Delta Travel</h4>
        <p className="text-[11px] font-semibold text-[#718096]">{text}</p>
        
        {/* Loading dots animation */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-[#C8102E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
