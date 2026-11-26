import React from 'react';

export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-[0_0_24px_rgba(139,92,246,0.45)]">
        <div className="w-full h-full rounded-[10px] bg-[#070b1a] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-cyan-400/20" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 relative z-10" fill="none">
            <path
              d="M6 3.5H14.2L18.5 7.8V20.5H6V3.5Z"
              stroke="url(#nexLogoGrad)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M14 3.5V8H18.5" stroke="#22d3ee" strokeWidth="1.6" strokeLinejoin="round" />
            <path
              d="M9 12.5L11.2 15L15.2 10.8"
              stroke="#a78bfa"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="nexLogoGrad" x1="6" y1="3.5" x2="18.5" y2="20.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c4b5fd" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Nex<span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">PDF</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/75 font-medium">
            Studio Pro
          </span>
        </div>
      )}
    </div>
  );
}
