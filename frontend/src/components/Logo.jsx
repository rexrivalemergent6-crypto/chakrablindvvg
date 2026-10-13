import React from 'react';

// Cadabra brand: violet wand-and-orbit mark + wordmark.
export default function Logo({ size = 32, withWord = true }) {
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <img
          src="/brand/cadabra-mark.png?v=2"
          alt="Cadabra"
          className="relative h-full w-full object-contain"
          draggable="false"
        />
      </div>
      {withWord && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Cada<span className="text-violet-400">bra</span>
        </span>
      )}
    </div>
  );
}
