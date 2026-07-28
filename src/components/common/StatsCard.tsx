import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'green' | 'gold' | 'emerald' | 'amber' | 'slate' | 'sky' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = 'green'
}) => {
  const isGold = accentColor === 'gold' || accentColor === 'amber';
  const borderColor = isGold ? 'border-[#C9A84C]' : 'border-[#1A5B4B]';
  const iconTextColor = isGold ? 'text-[#C9A84C]' : 'text-[#1A5B4B]';

  return (
    <div className={`bg-white p-5 border-l-4 ${borderColor} rounded-r-xl shadow-sm flex items-center justify-between gap-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`p-3 bg-gray-50 rounded-lg ${iconTextColor} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tight truncate">{title}</p>
          <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{value}</p>
          {trend ? (
            <p className={`text-[10px] font-bold mt-0.5 ${trend.isPositive ? 'text-green-600' : 'text-rose-600'}`}>
              {trend.value}
            </p>
          ) : subtitle ? (
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

