// Every Vaulz zk tool, in launcher order. `href` opens the tool directly inside the app.
export const TOOLS = [
  { id: 'shield', label: 'Shield', d: 'Your funds. A little further from view.', href: '/app?do=shield', ico: 'shield' },
  { id: 'send', label: 'Send', d: 'Pay or get paid. Privately.', href: '/app?do=send', ico: 'send' },
  { id: 'swap', label: 'Swap', d: 'Trade inside the pool. Not from your wallet.', href: '/app?do=swap', ico: 'swap' },
  { id: 'bridge', label: 'Bridge', d: 'Out to any chain. Not from your wallet.', href: '/app?do=bridge', ico: 'bridge' },
  { id: 'private-route', label: 'Private route', d: 'Solana to any chain. No wallet needed.', href: '/app#private-route', ico: 'route' },
  { id: 'privacy-swap', label: 'Privacy swap', d: 'Say what you want. Solvers fill it.', href: '/app#privacy-swap', ico: 'lock' },
  { id: 'track', label: 'Track', d: 'Every order, step by step.', href: '/app#track', ico: 'track' },
  { id: 'receive', label: 'Receive', d: 'Get paid without showing your wallet.', href: '/app?do=receive', ico: 'inbox' },
  { id: 'withdraw', label: 'Withdraw', d: 'Cash out. Come back unlinked.', href: '/app?do=withdraw', ico: 'exit' },
  { id: 'history', label: 'History', d: 'Only you can read it.', href: '/app?do=history', ico: 'clock' },
  { id: 'addresses', label: 'Addresses', d: 'Single-use exits. No clusters.', href: '/app?do=addresses', ico: 'pin' },
  { id: 'keys', label: 'Keys', d: 'Your vault. Your control.', href: '/app?do=keys', ico: 'key' },
  { id: 'chain', label: 'Chain', d: 'What the chain sees. Live.', href: '/app#chain', ico: 'term' },
  { id: 'vault', label: 'Vault', d: 'Quantum-safe SOL, opened with Face ID.', href: '/vault', ico: 'vault' },
];

const P = {
  shield: <><path d="M12 3 4.5 6v5.5c0 4.2 3.5 7.4 7.5 9.5 4-2.1 7.5-5.3 7.5-9.5V6Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" /></>,
  send: <><path d="m3 10 18-7-7 18-3.5-7.5L3 10Z" /><path d="m10.5 13.5 5-5" /></>,
  swap: <><path d="M4 8h14l-3.5-3.5" /><path d="M20 16H6l3.5 3.5" /></>,
  bridge: <><path d="M2 17h20" /><path d="M4 17c0-5 3.6-9 8-9s8 4 8 9" /><path d="M8 17v-5.5m4 5.5V8m4 9v-5.5" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  track: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
  inbox: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  exit: <><path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 22s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
  key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 9.3-9.3M17 6l2.5 2.5M14.5 8.5 17 11" /></>,
  term: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>,
  vault: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="12" cy="12" r="3.5" /><path d="M12 8.5V7m0 10v-1.5M15.5 12H17M7 12h1.5" /></>,
  book: <><path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z" /><path d="M12 5v15" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  cpu: <><rect x="5" y="5" width="14" height="14" rx="3" /><rect x="9" y="9" width="6" height="6" rx="1" /></>,
  check: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5m-14-10.5 2.5 2.5 4-4" /></>,
};

export function VzIcon({ name, size = 24, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] || null}
    </svg>
  );
}
