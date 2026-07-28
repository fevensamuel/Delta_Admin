import React from 'react';
import { Plane } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Loading Delta Travel...' }) => {
  return (
    <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-8 space-y-4 text-center">
      {/* Delta Travel Branded Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-20 h-20 rounded-full border-2 border-[#C9A84C]/40 animate-ping" />
        <div className="absolute w-16 h-16 rounded-full border-2 border-t-[#2D7D6B] border-r-transparent border-b-[#C8102E] border-l-transparent animate-spin" />
        
        {/* Brand Shield / Logo Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#2D7D6B] p-0.5 shadow-xl flex items-center justify-center z-10">
          <div className="w-full h-full bg-[#111827] rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Gold Accent Strip */}
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#2D7D6B] via-[#C9A84C] to-[#C8102E]" />
            <Plane className="w-6 h-6 text-[#C9A84C] -rotate-45 transform animate-bounce" />
            <span className="text-[8px] font-black tracking-widest text-white mt-0.5 uppercase">DELTA</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-black text-[#111827] tracking-wider uppercase">Delta Travel</h4>
        <p className="text-[11px] font-semibold text-[#718096]">{text}</p>
      </div>
    </div>
  );
};
