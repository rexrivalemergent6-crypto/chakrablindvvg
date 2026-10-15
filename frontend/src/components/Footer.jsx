import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const X_URL = 'https://x.com/usenullcash';

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#07060c]">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-white/45 leading-relaxed">
              Cross-chain swaps out of Solana. No wallet connection, no sign-up — you review a live
              quote and send a single deposit from your own wallet.
            </p>
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl chip px-3.5 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" /> Follow @darkinatorswaps
            </a>
          </div>
          <div className="flex gap-14 text-sm">
            <div className="space-y-2.5">
              <div className="text-white/40 text-xs uppercase tracking-wider">Product</div>
              <Link to="/swap" className="block text-white/70 hover:text-white transition-colors">Swap</Link>
              <Link to="/track" className="block text-white/70 hover:text-white transition-colors">Track order</Link>
              <Link to="/docs" className="block text-white/70 hover:text-white transition-colors">How it works</Link>
            </div>
            <div className="space-y-2.5">
              <div className="text-white/40 text-xs uppercase tracking-wider">Resources</div>
              <Link to="/docs#chains" className="block text-white/70 hover:text-white transition-colors">Supported chains</Link>
              <Link to="/docs#near" className="block text-white/70 hover:text-white transition-colors">NEAR Intents</Link>
              <Link to="/docs#zk" className="block text-white/70 hover:text-white transition-colors">Shielded / ZK</Link>
              <Link to="/docs#faq" className="block text-white/70 hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/35">
          <span>© {new Date().getFullYear()} Darkinator. All rights reserved.</span>
          <span>Always verify the destination chain and address before you deposit.</span>
        </div>
      </div>
    </footer>
  );
}
