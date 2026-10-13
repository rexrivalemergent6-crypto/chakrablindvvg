import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo';

const X_URL = 'https://x.com/darkinatorswaps';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Swap', to: '/swap' },
  { label: 'ZK Shield', to: '/shield' },
  { label: 'How it works', to: '/docs' },
];

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07060c]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/"><Logo /></Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              data-testid={`nav-${l.to.replace('/', '') || 'home'}`}
              className={`transition-colors ${isActive(l.to) ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/track" className="text-sm text-white/70 hover:text-white transition-colors">Track order</Link>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Darkinator on X"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <XIcon />
          </a>
          <Link
            to="/swap"
            className="aurora-btn group inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Launch app
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <button className="md:hidden text-white/80" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#07060c] px-5 py-4 space-y-3">
          {[...links, { label: 'Track order', to: '/track' }].map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)}
              className="block text-sm text-white/80 hover:text-white">{l.label}</Link>
          ))}
          <a href={X_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <XIcon className="h-3.5 w-3.5" /> Follow on X
          </a>
          <Link to="/swap" onClick={() => setOpen(false)}
            className="aurora-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">
            Launch app <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
