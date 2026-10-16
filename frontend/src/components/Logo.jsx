import React from 'react';

// Vaulz zk wordmark: DM Sans "vaulz" + Instrument Serif italic "zk".
export default function Logo({ size = 30, className = '' }) {
  return (
    <span
      className={`vz inline-flex items-baseline select-none text-[var(--vz-strong)] ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
      data-testid="vaulz-logo"
      aria-label="Vaulz zk"
    >
      <span style={{ fontWeight: 500, letterSpacing: '-0.075em' }}>vaulz</span>
      <span className="vz-serif" style={{ fontSize: '1.08em', marginLeft: '0.16em', letterSpacing: '-0.03em', color: 'var(--vz-dim)' }}>zk</span>
    </span>
  );
}
