import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Shuffle, Network, Lock, Eye, EyeOff, Layers, KeyRound, Check, X as XIcon, ArrowUpRight,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { PILLARS, FLOW, DOC_TABS, FEES, VISIBILITY, FAQ, ZK_SYSTEMS, ZK_PIPELINE, ZK_PROVEN } from './landingContent';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const BF = `${BACKEND}/api/bifrost/v1`;
const APP = '/app';
const X_URL = 'https://x.com/cadabrazk';
const PILLAR_ICON = { shield: ShieldCheck, houdini: Shuffle, near: Network };

function useLiveStats() {
  const [s, setS] = useState({ leaves: null, nullifiers: null, assets: null, chains: null, relayer: null });
  useEffect(() => {
    let dead = false;
    const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    j(`${BF}/indexer/v1/stats`).then((d) => !dead && setS((p) => ({ ...p, leaves: d.leaves, nullifiers: d.nullifiers }))).catch(() => {});
    j(`${BF}/indexer/v1/assets`).then((d) => !dead && setS((p) => ({ ...p, assets: (d.assets || []).length }))).catch(() => {});
    j(`${BACKEND}/api/ds/chains`).then((d) => !dead && setS((p) => ({ ...p, chains: (d.chains || []).length }))).catch(() => {});
    j(`${BF}/relayer/v1/health`).then(() => !dead && setS((p) => ({ ...p, relayer: true }))).catch(() => !dead && setS((p) => ({ ...p, relayer: false })));
    return () => { dead = true; };
  }, []);
  return s;
}
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString());

// reveal-on-scroll
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(.2,.9,.25,1)] ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

function LimeBtn({ href, children, testid, big = false }) {
  return (
    <a href={href} data-testid={testid}
      className={`nc-lime-btn group inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[#1a2200] ${big ? 'h-14 px-8 text-[16px]' : 'h-11 px-5 text-[14px]'}`}>
      {children}<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const links = [['Features', '#features'], ['How it works', '#flow'], ['Real ZK', '#zk'], ['Docs', '#tech'], ['Fees', '#fees'], ['FAQ', '#faq']];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/[.06]' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <a href="/" data-testid="nav-logo"><Logo /></a>
        <nav className="hidden lg:flex items-center gap-1 rounded-full bg-black/[.04] p-1">
          {links.map(([l, h]) => (
            <a key={h} href={h} data-testid={`nav-${h.slice(1)}`}
              className="rounded-full px-4 py-2 text-[14px] font-medium text-black/60 transition-all duration-300 hover:bg-white hover:text-black hover:shadow-sm">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="NullCash on X" data-testid="nav-x"
            className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white text-black transition hover:-translate-y-0.5 active:scale-95">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          </a>
          <LimeBtn href={APP} testid="nav-launch">Launch app</LimeBtn>
        </div>
      </div>
    </header>
  );
}

function Orbit() {
  // animated rings around the mark (original artwork, CSS only)
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(200,241,53,.45),rgba(200,241,53,0)_62%)]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="nc-ring absolute rounded-full border-[1.5px] border-dashed border-black/25"
          style={{ inset: `${i * 9 + 4}%`, animationDuration: `${26 - i * 5}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }} />
      ))}
      <img src="/brand/nullcash-mark-black.png?v=1" alt="" className="nc-float absolute inset-[30%] h-[40%] w-[40%] object-contain" />
      <div className="nc-chip absolute left-[2%] top-[18%]"><Lock className="h-3.5 w-3.5" /> Amount hidden</div>
      <div className="nc-chip absolute right-[0%] top-[44%]" style={{ animationDelay: '1.2s' }}><EyeOff className="h-3.5 w-3.5" /> Sender hidden</div>
      <div className="nc-chip absolute bottom-[12%] left-[10%]" style={{ animationDelay: '2.4s' }}><ShieldCheck className="h-3.5 w-3.5" /> Proof verified</div>
    </div>
  );
}

function Hero({ stats }) {
  const items = [['Notes in the pool', fmt(stats.leaves)], ['Spent nullifiers', fmt(stats.nullifiers)], ['Shieldable tokens', fmt(stats.assets)], ['Swap networks', fmt(stats.chains)]];
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12.5px] font-medium text-black/70">
              <span className={`h-2 w-2 rounded-full ${stats.relayer === false ? 'bg-amber-500' : 'bg-[#9ac50c] nc-pulse'}`} />
              {stats.relayer === false ? 'Relayer reconnecting' : 'Live on Solana mainnet'}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="nc-display mt-6 text-[46px] font-bold leading-[0.98] tracking-[-0.045em] text-[#14160f] sm:text-[76px]" data-testid="hero-title">
              Private money,<br /><span className="nc-hl">zero trace.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-black/60">
              NullCash turns your Solana tokens into private notes. Pay, swap and earn inside a zero-knowledge pool, or route
              out to 120+ networks with one deposit and no wallet connection. Keys stay in your browser.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LimeBtn href={APP} testid="hero-launch" big>Open NullCash</LimeBtn>
              <a href="/app#private-route" data-testid="hero-swap"
                className="inline-flex h-14 items-center gap-2 rounded-full border border-black/10 bg-white px-7 text-[15px] font-semibold text-[#14160f] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,.4)] active:scale-[.98]">
                Swap without a wallet
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4" data-testid="hero-stats">
              {items.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-black/[.07] bg-white p-4">
                  <dt className="text-[11.5px] font-medium text-black/45">{k}</dt>
                  <dd className="nc-display mt-1 text-[22px] font-bold tracking-tight text-[#14160f]">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
        <Reveal delay={200}><Orbit /></Reveal>
      </div>
    </section>
  );
}

function Head({ kicker, title, sub }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="inline-block rounded-full bg-[#14160f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[.1em] text-[#c8f135]">{kicker}</span>
      <h2 className="nc-display mt-5 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-[#14160f] sm:text-[48px]">{title}</h2>
      {sub && <p className="mt-4 text-[16px] leading-relaxed text-black/55">{sub}</p>}
    </Reveal>
  );
}

function Pillars() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Head kicker="Three ways to go private" title="One app. Every private move." sub="A shielded pool for everyday activity, plus two wallet-free routes for leaving Solana." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p, i) => {
            const Ico = PILLAR_ICON[p.key] || ShieldCheck;
            return (
              <Reveal key={p.key} delay={i * 90}>
                <a href={p.href} data-testid={`pillar-${p.key}`}
                  className={`group flex h-full flex-col rounded-[28px] border p-7 transition-all duration-500 hover:-translate-y-1.5 ${i === 0 ? 'border-[#14160f] bg-[#14160f] text-white hover:shadow-[0_30px_60px_-30px_rgba(20,22,15,.8)]' : 'border-black/[.07] bg-white hover:shadow-[0_30px_60px_-34px_rgba(20,22,15,.45)]'}`}>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${i === 0 ? 'bg-[#c8f135] text-[#1a2200]' : 'bg-[#eef6c8] text-[#4d6600]'}`}><Ico className="h-5 w-5" /></div>
                  <span className={`mt-6 text-[12px] font-semibold uppercase tracking-[.08em] ${i === 0 ? 'text-[#c8f135]' : 'text-[#5e7d00]'}`}>{p.tag}</span>
                  <h3 className="nc-display mt-2 text-[24px] font-bold leading-tight tracking-[-0.025em]">{p.title}</h3>
                  <p className={`mt-3 text-[14.5px] leading-relaxed ${i === 0 ? 'text-white/65' : 'text-black/55'}`}>{p.body}</p>
                  <ul className="mt-5 space-y-2">
                    {p.points.map((x) => (
                      <li key={x} className={`flex items-center gap-2 text-[13.5px] ${i === 0 ? 'text-white/80' : 'text-black/70'}`}>
                        <Check className={`h-4 w-4 ${i === 0 ? 'text-[#c8f135]' : 'text-[#6f9400]'}`} />{x}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-7 text-[14px] font-semibold">{p.cta}<ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Flow() {
  return (
    <section id="flow" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Head kicker="How it works" title="In public. Out of sight. Out again." sub="Your wallet is only the door. Everything between entering and leaving is sealed." />
        <div className="relative mt-14 grid gap-4 md:grid-cols-5">
          <div className="pointer-events-none absolute left-0 right-0 top-[38px] hidden h-px bg-[repeating-linear-gradient(90deg,rgba(20,22,15,.18)_0_6px,transparent_6px_12px)] md:block" />
          {FLOW.map((f, i) => (
            <Reveal key={f.k} delay={i * 80}>
              <div className="relative rounded-[24px] border border-black/[.07] bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-32px_rgba(20,22,15,.5)]">
                <div className={`nc-display grid h-11 w-11 place-items-center rounded-full text-[15px] font-bold ${f.s === 'Sealed' ? 'bg-[#14160f] text-[#c8f135]' : 'bg-[#c8f135] text-[#1a2200]'}`}>{i + 1}</div>
                <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-black/[.04] px-2.5 py-1 text-[11px] font-semibold text-black/55">
                  {f.s === 'Sealed' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{f.s}
                </span>
                <h3 className="nc-display mt-3 text-[18px] font-bold tracking-tight text-[#14160f]">{f.k}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-black/55">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RealZk() {
  return (
    <section id="zk" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[36px] bg-[#14160f] px-6 py-16 text-white sm:px-14">
          <Reveal className="max-w-2xl">
            <span className="inline-block rounded-full bg-[#c8f135] px-3 py-1 text-[11px] font-semibold uppercase tracking-[.1em] text-[#1a2200]">Real zero-knowledge</span>
            <h2 className="nc-display mt-5 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[48px]">Hidden is not the same as proven.</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/60">Privacy tools often just hide or reroute. NullCash also proves every spend is valid, so the chain can check it without seeing it.</p>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {ZK_SYSTEMS.map((z, i) => (
              <Reveal key={z.k} delay={i * 90}>
                <div className={`h-full rounded-[24px] border p-6 ${z.zk ? 'border-[#c8f135]/60 bg-[#c8f135]/[.08]' : 'border-white/10 bg-white/[.03]'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="nc-display text-[19px] font-bold">{z.k}</h3>
                    {z.zk ? <span className="grid h-7 w-7 place-items-center rounded-full bg-[#c8f135] text-[#1a2200]"><Check className="h-4 w-4" /></span>
                      : <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/50"><XIcon className="h-4 w-4" /></span>}
                  </div>
                  <p className="mt-4 text-[14px] italic leading-relaxed text-white/75">{z.q}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-white/50">{z.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={100}>
            <div className="mt-10 flex flex-wrap items-center gap-2">
              {ZK_PIPELINE.map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`rounded-full px-4 py-2 text-[13px] font-medium ${i === ZK_PIPELINE.length - 1 ? 'bg-[#c8f135] text-[#1a2200]' : 'bg-white/[.07] text-white/80'}`}>{s}</span>
                  {i < ZK_PIPELINE.length - 1 && <ArrowRight className="h-4 w-4 text-white/30" />}
                </React.Fragment>
              ))}
            </div>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {ZK_PROVEN.map((p, i) => (
              <Reveal key={p} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-[14px] text-white/75">
                  <KeyRound className="mt-0.5 h-4 w-4 flex-none text-[#c8f135]" />{p}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Tech() {
  const [tab, setTab] = useState(DOC_TABS[0].key);
  const d = DOC_TABS.find((x) => x.key === tab);
  return (
    <section id="tech" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Head kicker="Docs" title="Under the hood." sub="Protocol details for the shielded pool, multi-hop private routes and intent-based confidential swaps." />
        <div className="mx-auto mt-10 flex w-max max-w-full flex-wrap justify-center gap-1 rounded-full bg-black/[.05] p-1" role="tablist">
          {DOC_TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} data-testid={`tech-tab-${t.key}`}
              className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition-all duration-300 ${tab === t.key ? 'bg-white text-black shadow-sm' : 'text-black/55 hover:text-black'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div key={tab} className="nc-rise mt-8 min-w-0 rounded-[30px] border border-black/[.07] bg-white p-5 sm:p-10" data-testid={`tech-panel-${d.key}`}>
          <p className="max-w-4xl text-[16px] leading-relaxed text-black/65">{d.intro}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {d.blocks.map((b) => (
              <div key={b.h} className="min-w-0 rounded-[22px] bg-[#f6f7f1] p-6">
                <h3 className="nc-display flex items-center gap-2 text-[17px] font-bold text-[#14160f]"><Layers className="h-4 w-4 text-[#6f9400]" />{b.h}</h3>
                <div className="mt-3 space-y-3">{b.p.map((x) => <p key={x.slice(0, 24)} className="text-[14px] leading-relaxed text-black/60">{x}</p>)}</div>
                {b.code && <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#14160f] p-4 font-mono text-[12px] leading-relaxed text-[#dfff7a]">{b.code}</pre>}
              </div>
            ))}
          </div>
          {d.table && (
            <div className="mt-6 overflow-x-auto rounded-[22px] border border-black/[.07]">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-[#f6f7f1] text-black/50"><tr>{d.table.cols.map((c) => <th key={c} className="px-5 py-3 font-medium">{c}</th>)}</tr></thead>
                <tbody>{d.table.rows.map((r) => (
                  <tr key={r[0]} className="border-t border-black/[.06]"><td className="whitespace-nowrap px-5 py-3 font-mono text-[12.5px] text-[#4d6600]">{r[0]}</td><td className="px-5 py-3 text-black/65">{r[1]}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Visibility() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Head kicker="Privacy model" title="What the world sees. What it doesn't." />
        <div className="mt-12 space-y-3">
          {VISIBILITY.map((v, i) => (
            <Reveal key={v.a} delay={i * 60}>
              <div className="grid gap-3 rounded-[24px] border border-black/[.07] bg-white p-5 md:grid-cols-[200px_1fr_1fr] md:items-center">
                <div className="nc-display text-[17px] font-bold text-[#14160f]">{v.a}</div>
                <div className="flex items-start gap-2 text-[14px] text-black/55"><Eye className="mt-0.5 h-4 w-4 flex-none text-amber-600" />{v.pub}</div>
                <div className="flex items-start gap-2 rounded-2xl bg-[#eef6c8] px-3 py-2 text-[14px] text-[#2f3d00]"><EyeOff className="mt-0.5 h-4 w-4 flex-none" />{v.priv}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fees() {
  return (
    <section id="fees" className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Head kicker="Fees" title="Simple, shown upfront." />
        <Reveal>
          <div className="mt-12 overflow-x-auto rounded-[28px] border border-black/[.07] bg-white">
            <table className="w-full text-left text-[14.5px]" data-testid="fees-table">
              <thead className="bg-[#f6f7f1] text-black/50"><tr><th className="px-6 py-4 font-medium">Action</th><th className="px-6 py-4 font-medium">NullCash fee</th><th className="px-6 py-4 font-medium">Network</th></tr></thead>
              <tbody>{FEES.map((f) => (
                <tr key={f[0]} className="border-t border-black/[.06] transition hover:bg-[#fafbf6]"><td className="px-6 py-4 font-semibold text-[#14160f]">{f[0]}</td><td className="px-6 py-4 text-black/70">{f[1]}</td><td className="px-6 py-4 text-black/50">{f[2]}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Head kicker="FAQ" title="Good questions." />
        <Reveal>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={`f${i}`} className="rounded-[22px] border border-black/[.07] bg-white px-6 data-[state=open]:shadow-[0_20px_40px_-30px_rgba(20,22,15,.5)]" data-testid={`faq-${i}`}>
                <AccordionTrigger className="py-5 text-left text-[15.5px] font-semibold text-[#14160f] hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[14.5px] leading-relaxed text-black/60">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[#c8f135] px-6 py-16 text-center sm:py-20">
          <img src="/brand/nullcash-mark-black.png?v=1" alt="" className="nc-spin-slow pointer-events-none absolute -right-20 -top-20 h-72 w-72 opacity-[.12]" />
          <img src="/brand/nullcash-mark-black.png?v=1" alt="" className="nc-spin-slow pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 opacity-[.1]" />
          <h2 className="nc-display relative text-[36px] font-bold leading-[1.02] tracking-[-0.04em] text-[#14160f] sm:text-[58px]">Go private in one tap.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-[16px] text-[#2f3d00]/80">No sign-up. No new seed phrase to memorise. Just open NullCash and start.</p>
          <a href={APP} data-testid="cta-launch" className="group relative mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#14160f] px-8 text-[16px] font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-18px_rgba(20,22,15,.8)] active:scale-[.98]">
            Launch NullCash<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/[.07] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-4"><Logo size={24} /><span className="text-[13px] text-black/45">© {new Date().getFullYear()} NullCash</span></div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-black/55">
          <a href="#flow" className="transition hover:text-black">How it works</a>
          <a href="#zk" className="transition hover:text-black">Privacy</a>
          <a href="#tech" className="transition hover:text-black">Docs</a>
          <a href="#fees" className="transition hover:text-black">Fees</a>
          <a href={APP} className="transition hover:text-black">App</a>
          <a href={X_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-black">X</a>
        </nav>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const stats = useLiveStats();
  useEffect(() => {
    document.title = 'NullCash | Private money on Solana';
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  }, []);
  return (
    <div className="nc-landing min-h-screen overflow-x-hidden bg-[#f6f7f1] text-[#14160f]" data-testid="landing-page">
      <Nav />
      <main>
        <Hero stats={stats} />
        <Pillars />
        <Flow />
        <RealZk />
        <Tech />
        <Visibility />
        <Fees />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
