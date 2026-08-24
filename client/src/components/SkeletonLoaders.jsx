import React from 'react';

export const ShowCardSkeleton = () => (
  <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 animate-pulse">
    <div className="h-44 bg-slate-900 rounded-2xl w-full"></div>
    <div className="space-y-2">
      <div className="h-5 bg-slate-900 rounded-lg w-3/4"></div>
      <div className="h-3 bg-slate-900 rounded-lg w-1/2"></div>
    </div>
    <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
      <div className="h-4 bg-slate-900 rounded-md w-24"></div>
      <div className="h-8 bg-slate-900 rounded-xl w-28"></div>
    </div>
  </div>
);

export const SeatMapSkeleton = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="h-10 bg-slate-900/80 rounded-2xl w-full max-w-md mx-auto"></div>
    <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 max-w-2xl mx-auto py-8">
      {Array.from({ length: 48 }).map((_, idx) => (
        <div key={idx} className="h-8 rounded-lg bg-slate-900/60"></div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="h-14 bg-slate-900/60 rounded-2xl border border-slate-800/40"></div>
    ))}
  </div>
);
