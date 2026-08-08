import React from 'react';

export function LiveStatusDot({ isLive = true }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${
            isLive ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        ></span>
      </span>
      <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
        {isLive ? 'LIVE' : 'DISCONNECTED'}
      </span>
    </div>
  );
}
