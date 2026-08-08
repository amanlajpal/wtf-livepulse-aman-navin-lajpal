import React from 'react';

export function SkeletonLoader({ height = 'h-24', className = '' }) {
  return (
    <div className={`animate-pulse bg-[#16162A] rounded-xl border border-[#2D2D4D] ${height} ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-[#252545] to-transparent opacity-30"></div>
    </div>
  );
}
