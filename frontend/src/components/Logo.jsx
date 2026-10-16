import React from 'react';

// BlindSpot brand: the split-lens mark + DM Sans wordmark.
export default function Logo({ size = 30, withWord = true, className = '' }) {
  return (
    <span className={`vz inline-flex items-center select-none text-[var(--vz-strong)] ${className}`}
      style={{ fontSize: size * 0.82, lineHeight: 1, gap: size * 0.32 }} data-testid="blindspot-logo" aria-label="BlindSpot">
      <img src="/brand/blindspot-mark.png?v=7" alt="BlindSpot" width={size} height={size}
        style={{ width: size, height: size }} className="shrink-0 object-contain" draggable="false" />
      {withWord && <span style={{ fontWeight: 500, letterSpacing: '-0.045em' }}>BlindSpot</span>}
    </span>
  );
}
