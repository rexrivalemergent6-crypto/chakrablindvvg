import React, { useEffect, useState } from 'react';
import NmNav from '../components/NmNav';
import Logo from '../components/Logo';
import { TOOLS, VzIcon } from '../components/vzTools';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { JOURNEY, METHODS, CLAIMS, PRICES, QA, TECH, SEEN } from './landingCopy';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const BF = `${BACKEND}/api/bifrost/v1`;

/* live pool stats (relay refreshes upstream every few seconds) */
function useLiveStats() {
  const [s, setS] = useState({ leaves: null, nullifiers: null, assets: null, at: 0, live: false });
  useEffect(() => {
    let dead = false;
    const j = (u) => fetch(u, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    const stats = () => {
      if (document.hidden) return;
      j(`${BF}/indexer/v1/stats`)
        .then((d) => !dead && setS((p) => ({ ...p, leaves: d.leaves, nullifiers: d.nullifiers, at: Date.now(), live: true })))
        .catch(() => !dead && setS((p) => ({ ...p, live: false })));
    };
    const assets = () => {
      if (document.hidden) return;
      j(`${BF}/indexer/v1/assets`).then((d) => !dead && setS((p) => ({ ...p, assets: (d.assets || []).length }))).catch(() => {});
    };
    stats(); assets();
    const t1 = setInterval(stats, 5000);
    const t2 = setInterval(assets, 60000);
    const vis = () => { if (!document.hidden) stats(); };
    document.addEventListener('visibilitychange', vis);
    return () => { dead = true; clearInterval(t1); clearInterval(t2); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return s;
}
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString());

function useAgo(at) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  if (!at) return 'connecting';
  return `synced ${Math.max(0, Math.round((Date.now() - at) / 1000))}s ago`;
}

/* ---------- stage: the chain's view, live ---------- */
function ChainView({ s, unseen, setUnseen }) {
  const ago = useAgo(s.at);
  const val = (v) => (unseen ? <span className="tracking-[-.02em] text-[var(--vz-faint)]">••••</span> : fmt(v));
  return (
    <div className="flex flex-col items-center gap-5" data-testid="hero-live">
      <p className="text-[11px] text-[var(--vz-dim)]" aria-live="polite">{unseen ? 'Now the chain sees even less.' : 'Some things are better left unseen.'}</p>
      <div className="vz-glass w-[min(380px,86vw)] p-5" style={{ background: 'rgba(16,23,28,.48)' }}>
        <div className="flex items-center justify-between">
          <span className="vz-eyebrow">What the chain sees</span>
          <span className="flex items-center gap-2 text-[10px] text-[var(--vz-faint)]" data-testid="hero-live-ago">
            <i className={`h-1.5 w-1.5 rounded-full ${s.live ? 'bg-[var(--vz-ok)]' : 'bg-[var(--vz-warn)]'}`} />{s.live ? ago : 'reconnecting'}
          </span>
        </div>
        <div className="mt-5 text-[64px] font-normal leading-none tracking-[-.07em] text-[var(--vz-strong)]" data-testid="hero-notes">{val(s.leaves)}</div>
        <div className="mt-2 text-[11px] text-[var(--vz-dim)]">sealed notes in the pool. <span className="vz-serif text-[14px]">None has a name.</span></div>
        <div className="mt-5 grid grid-cols-3 border-t border-[var(--vz-hair)] pt-4" data-testid="hero-stats">
          <div><div className="vz-eyebrow !text-[8px]">Nullifiers</div><div className="mt-1.5 text-[17px] tracking-[-.04em]">{val(s.nullifiers)}</div></div>
          <div><div className="vz-eyebrow !text-[8px]">Tokens</div><div className="mt-1.5 text-[17px] tracking-[-.04em]">{val(s.assets)}</div></div>
          <div><div className="vz-eyebrow !text-[8px]">Swap to</div><div className="mt-1.5 text-[17px] tracking-[-.04em]">Any chain</div></div>
        </div>
      </div>
      <button type="button" onClick={() => setUnseen((v) => !v)} aria-pressed={unseen} className="vz-pill !gap-4 !text-[10px]" data-testid="hero-go-unseen">
        <span aria-hidden="true" className="flex gap-[3px]"><i className="block h-[2px] w-[6px] bg-current" /><i className="block h-[2px] w-[6px] bg-current" /></span>
        {unseen ? 'Show me' : 'Go unseen'} <span aria-hidden="true">&#8599;</span>
      </button>
    </div>
  );
}

/* ---------- why privacy dialog ---------- */
function WhyDialog({ onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const P = [
    ['shield', 'Separate your activity', 'Shield funds into a shared pool. Private payments come from that pool, not straight from your wallet.'],
    ['route', 'Leave without a trail', 'Bridge, private routes and intent swaps take you to any chain without a wallet link.'],
    ['check', 'Check for yourself', 'Every move is a zero-knowledge proof, verified on-chain. Keys never leave your browser.'],
  ];
  return (
    <div className="vz vz-dialog-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="why-dialog">
      <div role="dialog" aria-modal="true" aria-labelledby="why-title" className="vz-glass relative w-[min(760px,100%)] p-8 sm:p-10" style={{ background: 'var(--vz-glass)' }}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 h-9 w-9 rounded-full border border-[var(--vz-edge)] text-[18px] text-[var(--vz-dim)] hover:text-white" data-testid="why-close">&times;</button>
        <p className="vz-eyebrow">The point of BlindSpot</p>
        <h2 id="why-title" className="vz-h2 mt-5 !text-[44px] sm:!text-[56px]">Privacy is room<br /><span className="vz-serif">to be yourself.</span></h2>
        <p className="mt-5 max-w-[520px] text-[14px] leading-[1.6] text-[var(--vz-dim)]">An open blockchain shouldn&rsquo;t mean an open book. BlindSpot brings private balances, payments and swaps into one place.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {P.map(([i, h, t]) => (
            <div key={h}><VzIcon name={i} size={22} className="text-[var(--vz-dim)]" /><h3 className="mt-3 text-[16px] tracking-[-.03em]">{h}</h3><p className="mt-2 text-[12px] leading-[1.6] text-[var(--vz-muted)]">{t}</p></div>
          ))}
        </div>
        <p className="mt-8 border-t border-[var(--vz-hair)] pt-5 text-[11px] leading-[1.6] text-[var(--vz-faint)]">Privacy has boundaries. Deposits are on-chain, and recipients can see the payments they receive. Odd amounts and instant in-and-out timing make you easier to spot.</p>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, a, b, children }) {
  return (
    <div className="max-w-[760px]">
      <p className="vz-eyebrow">{eyebrow}</p>
      <h2 className="vz-h2 mt-6">{a}<br /><span className="vz-serif">{b}</span></h2>
      {children && <p className="mt-6 max-w-[520px] text-[14px] leading-[1.65] text-[var(--vz-dim)]">{children}</p>}
    </div>
  );
}

export default function LandingPage() {
  const s = useLiveStats();
  const [why, setWhy] = useState(false);
  const [unseen, setUnseen] = useState(false);
  useEffect(() => {
    document.title = 'BlindSpot — Everywhere. Unseen.';
    if (window.location.hash) {
      const t = document.getElementById(window.location.hash.slice(1));
      if (t) setTimeout(() => t.scrollIntoView(), 80);
    }
  }, []);

  return (
    <div className="vz relative min-h-screen overflow-x-hidden bg-[#090d10]" data-testid="landing-page">
      <div className="vz-world" aria-hidden="true"><div className="vz-orb" style={{ opacity: unseen ? 0.15 : undefined }} /></div>
      <NmNav onWhy={() => setWhy(true)} />

      {/* ---------------- stage ---------------- */}
      <main id="top" className="relative z-[1] mx-auto flex min-h-[100svh] w-[91.6%] flex-col pt-[96px]">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="vz-rise py-6">
            <a href="/app#private-route" className="vz-glass mb-8 inline-flex max-w-full items-center gap-3 py-3 pl-3 pr-5 text-[var(--vz-fg)] no-underline transition hover:bg-white/[.06]" data-testid="hero-callout">
              <span className="rounded-[4px] bg-[#d9a85a] px-2 py-[3px] text-[8px] font-semibold tracking-[.12em] text-[#090d10]">NEW</span>
              <VzIcon name="route" size={20} className="shrink-0 text-[var(--vz-dim)]" />
              <span className="min-w-0"><b className="block text-[13px] font-medium tracking-[-.01em]">Private route: Solana to any chain</b><span className="block text-[11px] text-[var(--vz-dim)]">No wallet to connect. One deposit, delivered anywhere.</span></span>
              <span aria-hidden="true" className="ml-2 text-[var(--vz-dim)]">&#8599;</span>
            </a>
            <p className="vz-eyebrow mb-6">The art of leaving no trace</p>
            <h1 className="vz-h1" data-testid="hero-title">Hit send.<br /><span className="vz-serif">Leave no trace.</span></h1>
            <p className="mt-6 text-[13px] leading-[1.7] text-[var(--vz-dim)]">Private balances. Private payments. Private swaps.<br />For a chain that sees too much.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a href="/app?do=shield" className="vz-enter" data-testid="hero-launch">Enter BlindSpot <span aria-hidden="true">&#8599;</span></a>
              <a href="/app#private-route" className="vz-link text-[12px] underline decoration-[var(--vz-edge)] underline-offset-4" data-testid="hero-swap">Swap without a wallet</a>
            </div>
          </div>
          <div className="vz-rise flex justify-center pb-6 lg:pb-0" style={{ animationDelay: '.15s' }}>
            <ChainView s={s} unseen={unseen} setUnseen={setUnseen} />
          </div>
        </div>

        <div className="vz-rise pb-10" style={{ animationDelay: '.25s' }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="vz-eyebrow">Your world. Your business.</span>
            <a href="/docs" className="vz-link text-[10px] underline underline-offset-2" data-testid="launcher-docs">Read the docs <span aria-hidden="true">&#8599;</span></a>
          </div>
          <ul className="vz-glass vz-launcher" data-testid="launcher">
            {TOOLS.map((t, i) => (
              <li key={t.id}>
                <a href={t.href} data-testid={`tool-${t.id}`}>
                  <VzIcon name={t.ico} size={20} className="mt-0.5 shrink-0 text-[var(--vz-dim)]" />
                  <div className="min-w-0"><b>{t.label}</b><small>{t.d}</small></div>
                  <span className="vz-arrow" aria-hidden="true">&#8599;</span>
                  <span className="vz-num">{String(i + 1).padStart(2, '0')}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* ---------------- how it works ---------------- */}
      <section id="flow" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-flow">
        <SectionHead eyebrow="How it works" a="In publicly." b="Out unseen.">One signature seals your coins into notes. From there everything moves by proof, and you leave whenever, wherever you like.</SectionHead>
        <ol className="vz-glass mt-12 grid sm:grid-cols-5">
          {JOURNEY.map((j, i) => (
            <li key={j.t} className="border-b border-[var(--vz-hair)] p-6 last:border-0 sm:border-b-0 sm:border-r">
              <span className="vz-mono text-[9px] text-[var(--vz-faint)]">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 text-[22px] tracking-[-.045em]">{j.t}</h3>
              <p className="mt-2 text-[12px] leading-[1.55] text-[var(--vz-dim)]">{j.d}</p>
              <span className={`mt-5 inline-block text-[9px] uppercase tracking-[.22em] ${j.tone === 'dark' ? 'text-[var(--vz-ok)]' : 'text-[var(--vz-faint)]'}`}>{j.tone === 'dark' ? 'unseen' : 'public'}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- privacy model ---------------- */}
      <section id="zk" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-zk">
        <SectionHead eyebrow="Privacy model" a="Less trust." b="More proof.">Hiding data is not the same as proving it. BlindSpot proves every move is valid without showing who made it.</SectionHead>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {METHODS.map((m) => (
            <div key={m.k} className={`vz-glass p-6 ${m.zk ? '!border-[var(--vz-edge-hi)]' : ''}`}>
              <p className="vz-eyebrow">{m.k}</p>
              <p className="mt-4 text-[20px] tracking-[-.04em]">{m.line}</p>
              <p className={`vz-serif mt-3 text-[18px] ${m.zk ? 'text-[var(--vz-strong)]' : 'text-[var(--vz-faint)]'}`}>{m.verdict}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="vz-glass p-6">
            <p className="vz-eyebrow">Every proof says</p>
            <ul className="mt-4 space-y-3">{CLAIMS.map((c) => (
              <li key={c} className="flex gap-3 text-[14px] text-[var(--vz-fg)]"><span className="mt-[9px] h-px w-3 shrink-0 bg-[var(--vz-dim)]" />{c}</li>
            ))}</ul>
          </div>
          <div className="vz-glass p-6">
            <p className="vz-eyebrow">Under the hood</p>
            <dl className="mt-4 divide-y divide-[var(--vz-hair)]">{TECH.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[190px_1fr]"><dt className="text-[13px] text-[var(--vz-strong)]">{k}</dt><dd className="text-[12px] text-[var(--vz-dim)]">{v}</dd></div>
            ))}</dl>
          </div>
        </div>
        <div className="vz-glass mt-4 overflow-x-auto" data-testid="landing-visibility">
          <table className="vz-table w-full min-w-[640px] text-left text-[13px]">
            <thead><tr className="border-b border-[var(--vz-hair)]"><th className="px-5 py-4">Action</th><th className="px-5 py-4">The chain sees</th><th className="px-5 py-4">Stays unseen</th></tr></thead>
            <tbody>{SEEN.map((v) => (
              <tr key={v.a} className="border-b border-[var(--vz-hair)] last:border-0"><td className="px-5 py-3.5 text-[var(--vz-strong)]">{v.a}</td><td className="px-5 py-3.5 text-[var(--vz-dim)]">{v.out}</td><td className="px-5 py-3.5">{v.inn}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {/* ---------------- fees ---------------- */}
      <section id="fees" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-fees">
        <SectionHead eyebrow="Fees" a="Shown before" b="you confirm.">Private payments carry no protocol fee. Everything else is a small, fixed share, always visible up front.</SectionHead>
        <div className="vz-glass mt-12 overflow-x-auto">
          <table className="vz-table w-full min-w-[560px] text-left text-[13px]" data-testid="fees-table">
            <thead><tr className="border-b border-[var(--vz-hair)]"><th className="px-5 py-4">Action</th><th className="px-5 py-4">Protocol fee</th><th className="px-5 py-4">Network cost</th></tr></thead>
            <tbody>{PRICES.map((f) => (
              <tr key={f[0]} className="border-b border-[var(--vz-hair)] last:border-0"><td className="px-5 py-3.5 text-[var(--vz-strong)]">{f[0]}</td><td className="px-5 py-3.5">{f[1]}</td><td className="px-5 py-3.5 text-[var(--vz-dim)]">{f[2]}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section id="faq" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-faq">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <SectionHead eyebrow="Questions" a="Asked," b="answered." />
          <Accordion type="single" collapsible className="vz-glass px-6">
            {QA.map(([q, a], i) => (
              <AccordionItem key={q} value={`q${i}`} className="border-[var(--vz-hair)] last:border-0">
                <AccordionTrigger className="py-5 text-left text-[15px] font-normal tracking-[-.02em] text-[var(--vz-fg)] hover:no-underline" data-testid={`faq-${i}`}>{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[13px] leading-[1.65] text-[var(--vz-dim)]">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ---------------- closing ---------------- */}
      <section className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24 text-center" data-testid="section-cta">
        <p className="vz-eyebrow">Ready when you are</p>
        <h2 className="vz-h2 mt-6">Everywhere.<br /><span className="vz-serif">Unseen.</span></h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <a href="/app?do=shield" className="vz-enter" data-testid="cta-launch">Enter BlindSpot <span aria-hidden="true">&#8599;</span></a>
          <a href="/docs" className="vz-pill !h-[46px]" data-testid="cta-docs">Read the docs</a>
        </div>
      </section>

      <footer className="relative z-[1] mx-auto flex w-[91.6%] flex-col items-center justify-between gap-4 border-t border-[var(--vz-hair)] py-8 text-[11px] text-[var(--vz-faint)] sm:flex-row" data-testid="site-footer">
        <Logo size={20} />
        <nav className="flex flex-wrap justify-center gap-5">
          <a className="vz-link" href="/app">App</a><a className="vz-link" href="/vault">Vault</a><a className="vz-link" href="/docs">Docs</a>
          <a className="vz-link" href="#flow">How it works</a><a className="vz-link" href="#fees">Fees</a><a className="vz-link" href="#faq">FAQ</a>
        </nav>
        <span>&copy; {new Date().getFullYear()} BlindSpot</span>
      </footer>

      {why && <WhyDialog onClose={() => setWhy(false)} />}
    </div>
  );
}
