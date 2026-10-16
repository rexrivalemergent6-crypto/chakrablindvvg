import React, { useEffect, useRef, useState } from 'react';
import NmNav from '../components/NmNav';
import Logo from '../components/Logo';
import { TOOLS, VzIcon } from '../components/vzTools';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { JOURNEY, PRICES, QA } from './landingCopy';

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
    return () => { dead = true; clearInterval(t1); clearInterval(t2); };
  }, []);
  return s;
}
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString());
const REDUCED = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* numbers roll up to their value (and roll on to each live update) */
function CountUp({ value }) {
  const [v, setV] = useState(null);
  const from = useRef(0);
  useEffect(() => {
    if (value === null || value === undefined) return undefined;
    if (REDUCED) { setV(value); from.current = value; return undefined; }
    const a = from.current, b = Number(value), t0 = performance.now(), dur = a === 0 ? 1400 : 700;
    let raf;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      setV(Math.round(a + (b - a) * e));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{fmt(v)}</span>;
}

/* fade-and-rise for anything marked .bs-reveal once it scrolls into view */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.bs-reveal'));
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('bs-in')); return undefined; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('bs-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

/* headline words rise one by one */
function Words({ text, base = 0 }) {
  return text.split(' ').map((w, i) => (
    <span key={`${w}-${i}`} className="bs-word"><span style={{ animationDelay: `${base + i * 90}ms` }}>{w}</span></span>
  ));
}

/* the BlindSpot disc: concentric rings + a split lens that slowly turns */
function Disc({ size = 420, label, sub, tone = 'shield', className = '' }) {
  return (
    <div className={`bs-disc bs-disc-${tone} ${className}`} style={{ width: size, height: size }} aria-hidden={!label}>
      <span className="bs-disc-rings" />
      <span className="bs-disc-lens" />
      <span className="bs-disc-sweep" />
      <span className="bs-disc-core" />
      {label && (
        <span className="bs-disc-label"><b>{label}</b>{sub && <small>{sub}</small>}</span>
      )}
    </div>
  );
}

function Status({ kind }) {
  const map = { live: ['Live', 'bs-st-live'], safe: ['Quantum-safe', 'bs-st-safe'], research: ['Research', 'bs-st-res'], no: ['Not quantum-safe', 'bs-st-no'] };
  const [t, c] = map[kind];
  return <span className={`bs-st ${c}`}><i />{t}</span>;
}

function WhyDialog({ onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const P = [
    ['shield', 'Shield what you move', 'Payments, swaps and exits come from a shared zero-knowledge pool, not from your wallet.'],
    ['vault', 'Vault what you keep', 'Long-term SOL sits behind hash-based signatures, built to outlast quantum computers.'],
    ['check', 'Verify, do not trust', 'Every move is a proof checked on-chain. Keys never leave your device.'],
  ];
  return (
    <div className="vz vz-dialog-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="why-dialog">
      <div role="dialog" aria-modal="true" aria-labelledby="why-title" className="bs-panel relative w-[min(760px,100%)] p-8 sm:p-10">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 h-9 w-9 rounded-full border border-[var(--vz-edge)] text-[18px] text-[var(--vz-dim)] hover:text-white" data-testid="why-close">&times;</button>
        <p className="bs-kick">Why privacy</p>
        <h2 id="why-title" className="bs-h2 mt-5">Privacy is room<br /><span className="vz-serif">to be yourself.</span></h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {P.map(([i, h, t]) => (
            <div key={h}><span className="bs-ico"><VzIcon name={i} size={18} /></span><h3 className="mt-4 text-[16px] tracking-[-.03em]">{h}</h3><p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--vz-muted)]">{t}</p></div>
          ))}
        </div>
        <p className="mt-8 border-t border-[var(--vz-hair)] pt-5 text-[11.5px] leading-[1.6] text-[var(--vz-faint)]">Privacy has limits. Deposits are on-chain, recipients see what they receive, and odd amounts or instant in-and-out timing make you easier to spot.</p>
      </div>
    </div>
  );
}

const QUANTUM = [
  ['Quantum vault', 'SOL is released only against a hash-based signature from your passkey or 24 words.', 'safe'],
  ['ZK shield', 'Private balances, payments and swaps, proven with Groth16 zero-knowledge proofs.', 'live'],
  ['Post-quantum shield', 'Hash-based (STARK-style) proofs and ML-KEM note encryption for the pool.', 'research'],
  ['Ordinary wallets', 'Standard Solana signatures (Ed25519) are not quantum-safe. Keep long-term SOL in the vault.', 'no'],
];

const DISC_TOOLS = ['shield', 'send', 'swap', 'bridge', 'private-route', 'privacy-swap', 'track', 'vault'];

export default function LandingPage() {
  const s = useLiveStats();
  const [why, setWhy] = useState(false);
  useEffect(() => {
    document.title = 'BlindSpot — ZK shield. Quantum vault.';
    if (window.location.hash) {
      const t = document.getElementById(window.location.hash.slice(1));
      if (t) setTimeout(() => t.scrollIntoView(), 80);
    }
  }, []);
  const tools = DISC_TOOLS.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean);
  useReveal();
  const stage = useRef(null);
  const onMove = (e) => {
    if (REDUCED || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    stage.current.style.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`);
    stage.current.style.setProperty('--ry', `${(x * 18).toFixed(2)}deg`);
    stage.current.style.setProperty('--px', `${(x * 26).toFixed(1)}px`);
    stage.current.style.setProperty('--py', `${(y * 20).toFixed(1)}px`);
  };
  const onLeave = () => { if (stage.current) ['--rx', '--ry', '--px', '--py'].forEach((k) => stage.current.style.setProperty(k, '0')); };

  return (
    <div className="vz bs relative min-h-screen overflow-x-hidden bg-[#090d10]" data-testid="landing-page">
      <div className="vz-world" aria-hidden="true" />
      <NmNav onWhy={() => setWhy(true)} />

      {/* ---------------- hero ---------------- */}
      <main id="top" className="relative z-[1] mx-auto grid min-h-[100svh] w-[91.6%] items-center gap-12 pb-16 pt-[110px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="vz-rise">
          <p className="bs-kick bs-fade" style={{ animationDelay: '40ms' }} data-testid="hero-kicker"><span className="bs-dot" />Solana-first · ZK shield · Quantum vault</p>
          <h1 className="bs-h1 mt-7" data-testid="hero-title" aria-label="Your money's blind spot."><span aria-hidden="true"><Words text="Your money’s" base={120} /><br /><span className="vz-serif"><Words text="blind spot." base={340} /></span></span></h1>
          <p className="bs-fade mt-7 max-w-[470px] text-[15px] leading-[1.7] text-[var(--vz-dim)]" style={{ animationDelay: '620ms' }}>
            Shield what you move with zero-knowledge proofs. Vault what you keep behind quantum-safe signatures. All on Solana, all from your browser.
          </p>
          <div className="bs-fade mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '760ms' }}>
            <a href="/app" className="bs-btn" data-testid="hero-launch"><span className="bs-btn-lens" />Enter BlindSpot</a>
            <a href="/vault" className="bs-btn-ghost" data-testid="hero-vault">Open the quantum vault</a>
          </div>
          <dl className="bs-stats bs-fade mt-12" style={{ animationDelay: '900ms' }} data-testid="hero-stats">
            <div><dt>Sealed notes</dt><dd data-testid="hero-notes"><CountUp value={s.leaves} /></dd></div>
            <div><dt>Nullifiers</dt><dd><CountUp value={s.nullifiers} /></dd></div>
            <div><dt>Shieldable tokens</dt><dd><CountUp value={s.assets} /></dd></div>
            <div><dt>Pool</dt><dd className="flex items-center gap-2 !text-[15px]"><i className={`h-1.5 w-1.5 rounded-full ${s.live ? 'bg-[var(--vz-ok)]' : 'bg-[var(--vz-warn)]'}`} />{s.live ? 'Live' : 'Reconnecting'}</dd></div>
          </dl>
        </div>
        <div ref={stage} onPointerMove={onMove} onPointerLeave={onLeave} className="bs-stage vz-rise relative flex justify-center" style={{ animationDelay: '.15s' }} data-testid="hero-disc">
          <div className="bs-tilt"><Disc size={460} className="bs-hero-disc" /></div>
          <span className="bs-orbit bs-orbit-a"><b>ZK shield</b><small>Live on mainnet</small></span>
          <span className="bs-orbit bs-orbit-b"><b>Quantum vault</b><small>Hash-based signatures</small></span>
        </div>
      </main>

      {/* ---------------- tool discs ---------------- */}
      <section className="relative z-[1] mx-auto w-[91.6%] pb-24" data-testid="tool-discs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="bs-kick">Everything in one place</p>
          <a href="/docs" className="vz-link text-[11px] underline underline-offset-4" data-testid="discs-docs">Read the docs</a>
        </div>
        <ul className="bs-discs bs-reveal bs-stagger mt-8">
          {tools.map((t) => (
            <li key={t.id}>
              <a href={t.href} data-testid={`tool-${t.id}`} title={t.d}>
                <span className="bs-disc-btn"><VzIcon name={t.ico} size={22} /></span>
                <b>{t.label}</b>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- two pillars ---------------- */}
      <section id="zk" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-pillars">
        <p className="bs-kick">Two layers</p>
        <h2 className="bs-reveal bs-h2 mt-6 max-w-[760px]">Shield what you move.<br /><span className="vz-serif">Vault what you keep.</span></h2>
        <div className="bs-reveal bs-stagger mt-14 grid gap-5 lg:grid-cols-2">
          <article className="bs-panel bs-pillar" data-testid="pillar-shield">
            <Disc size={150} tone="shield" />
            <div>
              <div className="flex flex-wrap items-center gap-3"><h3>ZK shield</h3><Status kind="live" /></div>
              <p>Deposit once and your coins become sealed notes in a shared pool. Send, swap and withdraw by proof: the chain checks every move is valid without learning who made it or how much moved.</p>
              <ul>
                <li>Groth16 proofs, verified on-chain</li>
                <li>Relayers submit for you: no wallet pop-ups, no gas trail</li>
                <li>Exit to a fresh address or to any chain via private routes</li>
              </ul>
              <a href="/app?do=shield" className="bs-btn-ghost mt-6" data-testid="pillar-shield-cta">Shield funds</a>
            </div>
          </article>
          <article className="bs-panel bs-pillar" data-testid="pillar-vault">
            <Disc size={150} tone="vault" />
            <div>
              <div className="flex flex-wrap items-center gap-3"><h3>Quantum vault</h3><Status kind="safe" /></div>
              <p>A vault for SOL you plan to hold for years. The on-chain program pays out only against a hash-based signature, so its security rests on hash functions rather than the elliptic curves a quantum computer could break.</p>
              <ul>
                <li>Opened with your passkey (Face ID / Touch ID) or 24 words</li>
                <li>Keys are created on your device and never leave it</li>
                <li>Fill it from any wallet, release with your vault keys</li>
              </ul>
              <a href="/vault" className="bs-btn-ghost mt-6" data-testid="pillar-vault-cta">Open the vault</a>
            </div>
          </article>
        </div>
      </section>

      {/* ---------------- the quantum question ---------------- */}
      <section id="quantum" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-quantum">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="bs-kick">The quantum question</p>
            <h2 className="bs-reveal bs-h2 mt-6">Ready for the day<br /><span className="vz-serif">the maths changes.</span></h2>
            <p className="mt-6 max-w-[460px] text-[14px] leading-[1.7] text-[var(--vz-dim)]">Large quantum computers would break the elliptic-curve maths behind most of crypto. Hash functions are expected to hold. Here is exactly where each part of BlindSpot stands today.</p>
            <a href="/docs#quantum" className="vz-link mt-6 inline-block text-[12px] underline underline-offset-4" data-testid="quantum-docs">Read the research</a>
          </div>
          <ol className="bs-panel bs-reveal bs-stagger divide-y divide-[var(--vz-hair)]">
            {QUANTUM.map(([h, t, k]) => (
              <li key={h} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-[460px]"><h3 className="text-[18px] tracking-[-.035em] text-[var(--vz-strong)]">{h}</h3><p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--vz-dim)]">{t}</p></div>
                <Status kind={k} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="flow" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-flow">
        <p className="bs-kick">How it works</p>
        <h2 className="bs-reveal bs-h2 mt-6">In publicly.<br /><span className="vz-serif">Out unseen.</span></h2>
        <ol className="bs-path bs-reveal bs-stagger mt-14">
          {JOURNEY.map((j) => (
            <li key={j.t} className={j.tone === 'dark' ? 'is-dark' : ''}>
              <span className="bs-path-dot" />
              <h3>{j.t}</h3>
              <p>{j.d}</p>
              <small>{j.tone === 'dark' ? 'unseen' : 'public'}</small>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- fees ---------------- */}
      <section id="fees" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-fees">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="bs-kick">Fees</p>
            <h2 className="bs-reveal bs-h2 mt-6">Shown before<br /><span className="vz-serif">you confirm.</span></h2>
            <p className="mt-6 max-w-[440px] text-[14px] leading-[1.7] text-[var(--vz-dim)]">Private payments carry no protocol fee. Everything else is a small, fixed share, always visible up front.</p>
          </div>
          <div className="bs-panel bs-reveal overflow-x-auto">
            <table className="vz-table w-full min-w-[520px] text-left text-[13px]" data-testid="fees-table">
              <thead><tr className="border-b border-[var(--vz-hair)]"><th className="px-6 py-4">Action</th><th className="px-6 py-4">Protocol fee</th><th className="px-6 py-4">Network cost</th></tr></thead>
              <tbody>{PRICES.map((f) => (
                <tr key={f[0]} className="border-b border-[var(--vz-hair)] last:border-0"><td className="px-6 py-3.5 text-[var(--vz-strong)]">{f[0]}</td><td className="px-6 py-3.5">{f[1]}</td><td className="px-6 py-3.5 text-[var(--vz-dim)]">{f[2]}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section id="faq" className="relative z-[1] mx-auto w-[91.6%] border-t border-[var(--vz-hair)] py-24" data-testid="section-faq">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <div><p className="bs-kick">Questions</p><h2 className="bs-reveal bs-h2 mt-6">Asked,<br /><span className="vz-serif">answered.</span></h2></div>
          <Accordion type="single" collapsible className="bs-panel bs-reveal bs-stagger px-6">
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
      <section className="bs-reveal relative z-[1] mx-auto flex w-[91.6%] flex-col items-center border-t border-[var(--vz-hair)] py-24 text-center" data-testid="section-cta">
        <Disc size={120} />
        <h2 className="bs-h2 mt-10">Shielded today.<br /><span className="vz-serif">Quantum-safe for tomorrow.</span></h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="/app" className="bs-btn" data-testid="cta-launch"><span className="bs-btn-lens" />Enter BlindSpot</a>
          <a href="/docs" className="bs-btn-ghost" data-testid="cta-docs">Read the docs</a>
        </div>
      </section>

      <footer className="relative z-[1] mx-auto flex w-[91.6%] flex-col items-center justify-between gap-4 border-t border-[var(--vz-hair)] py-8 text-[11px] text-[var(--vz-faint)] sm:flex-row" data-testid="site-footer">
        <Logo size={20} />
        <nav className="flex flex-wrap justify-center gap-5">
          <a className="vz-link" href="/app">App</a><a className="vz-link" href="/vault">Vault</a><a className="vz-link" href="/docs">Docs</a>
          <a className="vz-link" href="#quantum">Quantum</a><a className="vz-link" href="#fees">Fees</a><a className="vz-link" href="#faq">FAQ</a>
        </nav>
        <span>&copy; {new Date().getFullYear()} BlindSpot</span>
      </footer>

      {why && <WhyDialog onClose={() => setWhy(false)} />}
    </div>
  );
}
