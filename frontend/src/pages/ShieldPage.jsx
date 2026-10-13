import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, RotateCw, ShieldCheck, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const BIFROST = `${BACKEND}/api/bifrost/v1`;

const VIEWS = [
  { id: 'app', label: 'Wallet', path: '/app/' },
  { id: 'site', label: 'Overview', path: '/site/' },
  { id: 'docs', label: 'Docs', path: '/app/docs' },
  { id: 'security', label: 'Security', path: '/app/security' },
  { id: 'launch', label: 'Launch post', path: '/app/launch' },
  { id: 'compliance', label: 'Compliance', path: '/app/compliance' },
];

const SERVICES = ['app', 'indexer', 'relayer', 'rpc'];

export default function ShieldPage() {
  const [view, setView] = useState('app');
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const frameRef = useRef(null);

  const current = VIEWS.find((v) => v.id === view) || VIEWS[0];
  const src = useMemo(() => `${BIFROST}${current.path}`, [current]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`${BIFROST}/_health`)
        .then((r) => r.json())
        .then((j) => alive && setHealth(j))
        .catch(() => alive && setHealth({}));
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => { setLoading(true); }, [src, nonce]);

  const up = (k) => {
    const s = health?.[k]?.status;
    // indexer/relayer return 404 on "/" (no root route) which still means reachable
    return s && s < 500;
  };

  return (
    <div className="min-h-screen bg-ambient flex flex-col">
      <Navbar />
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-2">
            <ShieldCheck className="h-4 w-4 text-white" />
            <span className="font-display text-sm font-semibold">ZK Shield</span>
            <span className="text-[0.65rem] uppercase tracking-wider text-white/40">via Veil · Bifrost v1</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                data-testid={`shield-view-${v.id}`}
                onClick={() => setView(v.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v.id ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2" data-testid="shield-health">
              {SERVICES.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] text-white/60">
                  <span className={`h-1.5 w-1.5 rounded-full ${health == null ? 'bg-white/30' : up(k) ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {k}
                </span>
              ))}
            </div>
            <button
              data-testid="shield-reload"
              onClick={() => setNonce((n) => n + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              aria-label="Reload"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <a
              data-testid="shield-fullscreen"
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/5"
            >
              Open full screen <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[calc(100vh-64px-53px)]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#07060c]">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading Veil…
            </div>
          </div>
        )}
        <iframe
          key={`${src}-${nonce}`}
          ref={frameRef}
          data-testid="shield-frame"
          title="Veil ZK Shield"
          src={src}
          onLoad={() => setLoading(false)}
          className="absolute inset-0 h-full w-full border-0 bg-[#07060c]"
          allow="clipboard-read; clipboard-write; camera; web-share; publickey-credentials-get *; publickey-credentials-create *"
        />
      </div>
    </div>
  );
}
