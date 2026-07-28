import React from 'react';

export const PackageSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse p-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-11 bg-slate-200 rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <div className="w-36 h-3.5 bg-slate-200 rounded" />
              <div className="w-24 h-2.5 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="w-16 h-5 bg-slate-200 rounded-full" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-12 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-6 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
};
