import React from 'react';

// Cadabra brand: violet wand-and-orbit mark + wordmark.
export default function Logo({ size = 32, withWord = true }) {
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <div className="absolute inset-[12%] rounded-full bg-violet-500/40 blur-[10px] opacity-60 group-hover:opacity-100 transition-opacity" />
        <img
          src="/brand/cadabra-mark.png?v=2"
          alt="Cadabra"
          className="relative h-full w-full object-contain drop-shadow-[0_2px_10px_rgba(139,92,246,.45)]"
          draggable="false"
        />
      </div>
      {withWord && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Cada<span className="bg-gradient-to-r from-violet-300 via-violet-400 to-violet-600 bg-clip-text text-transparent">bra</span>
        </span>
      )}
    </div>
  );
}
