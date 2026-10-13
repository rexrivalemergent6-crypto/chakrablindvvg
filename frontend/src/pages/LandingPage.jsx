import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Shuffle, Sparkles, Lock, Eye, EyeOff, Cpu, Network, KeyRound,
  ArrowDownUp, BookOpen, Zap, Layers, Radio,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { PILLARS, FLOW, DOC_TABS, FEES, VISIBILITY, FAQ } from './landingContent';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const BF = `${BACKEND}/api/bifrost/v1`;
const HERO_IMG =
  'https://static.prod-images.emergentagent.com/jobs/2df7d644-6e1d-42af-b815-caf7533916bd/images/e79734c770365930b63201cff945b58b8aa011b1d87fc064e81134df2d5173b0.jpeg';
const APP = '/app';

const PILLAR_ICON = { shield: ShieldCheck, houdini: Shuffle, near: Network };

function useLiveStats() {
  const [s, setS] = useState({ leaves: null, nullifiers: null, assets: null, chains: null, relayer: null, root: null });
  useEffect(() => {
    let dead = false;
    const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    j(`${BF}/indexer/v1/stats`).then((d) => !dead && setS((p) => ({ ...p, leaves: d.leaves, nullifiers: d.nullifiers, root: d.root }))).catch(() => {});
    j(`${BF}/indexer/v1/assets`).then((d) => !dead && setS((p) => ({ ...p, assets: (d.assets || []).length }))).catch(() => {});
    j(`${BACKEND}/api/ds/chains`).then((d) => !dead && setS((p) => ({ ...p, chains: (d.chains || []).length }))).catch(() => {});
    j(`${BF}/relayer/v1/health`).then(() => !dead && setS((p) => ({ ...p, relayer: true }))).catch(() => !dead && setS((p) => ({ ...p, relayer: false })));
    return () => { dead = true; };
  }, []);
  return s;
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

function Nav() {
  const links = [
    ['Features', '#features'],
    ['How it works', '#how'],
    ['Technology', '#tech'],
    ['Fees', '#fees'],
    ['FAQ', '#faq'],
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-3 flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-[#07060c]/70 px-3 sm:px-4 backdrop-blur-xl">
          <a href="#top" data-testid="landing-logo"><Logo size={30} /></a>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(([l, h]) => (
              <a key={l} href={h} className="rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors" data-testid={`landing-nav-${h.slice(1)}`}>
                {l}
              </a>
            ))}
          </nav>
          <a href={APP} data-testid="landing-launch-nav" className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#07060c] hover:bg-white/90 transition-colors">
            Launch app <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ stats }) {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-40 pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute top-40 right-[-200px] h-[420px] w-[520px] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/70">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
            Live on Solana mainnet · Groth16 · NEAR Intents · Houdini
          </div>
          <h1 className="mt-6 font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px] font-extrabold tracking-[-0.03em]">
            The all-in-one<br />
            <span className="text-gradient">private DeFi</span> app.
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/60">
            Shield tokens into a zero-knowledge private balance, then send, trade and earn unseen. Swap across 120+ chains through
            <span className="text-white"> Houdini private routes</span> and <span className="text-white">NEAR Intents confidential swaps</span>, all from one app.
            Your keys never leave your browser.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href={APP} data-testid="landing-launch-hero" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,.8)] hover:brightness-110 transition">
              Launch app <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#tech" data-testid="landing-docs-hero" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[.03] px-6 py-3.5 text-[15px] font-medium text-white/90 hover:bg-white/[.07] transition">
              <BookOpen className="h-4 w-4" /> Technical docs
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10" data-testid="landing-live-stats">
            {[
              ['Notes in the pool', fmt(stats.leaves)],
              ['Spent nullifiers', fmt(stats.nullifiers)],
              ['Shieldable tokens', fmt(stats.assets)],
              ['Swap chains', fmt(stats.chains)],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#0a0910] px-4 py-4">
                <dt className="text-[11px] uppercase tracking-[.14em] text-white/40">{k}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-violet-500/20 via-transparent to-cyan-400/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black">
            <img src={HERO_IMG} alt="Zero-knowledge shield" className="h-[360px] sm:h-[460px] w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07060c] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
              {[['ZK Shield', ShieldCheck], ['Private route', Shuffle], ['Privacy swap', Network]].map(([t, I]) => (
                <div key={t} className="rounded-xl border border-white/10 bg-[#0b0a12]/80 px-3 py-2.5 backdrop-blur-md">
                  <I className="h-4 w-4 text-violet-300" />
                  <div className="mt-1 text-[12px] font-semibold">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -left-6 top-10 hidden sm:block rounded-2xl border border-white/10 bg-[#0b0a12]/90 px-4 py-3 backdrop-blur-md animate-floaty">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">Merkle root</div>
            <div className="mt-1 font-mono text-xs text-cyan-200">{stats.root ? `${stats.root.slice(0, 10)}…${stats.root.slice(-6)}` : 'syncing…'}</div>
          </div>
          <div className="absolute -right-4 -bottom-5 hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0a12]/90 px-4 py-3 backdrop-blur-md">
            <Radio className={`h-4 w-4 ${stats.relayer === false ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-xs text-white/70">Relayer {stats.relayer === false ? 'offline' : stats.relayer ? 'online' : '…'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead kicker="One app, three privacy engines" title="Everything private, in one place." sub="A shielded pool for your balance, plus two independent cross-chain routes. Pick the right tool for each move without leaving the app." />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const I = PILLAR_ICON[p.key];
            return (
              <article key={p.key} data-testid={`pillar-${p.key}`} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.05] to-transparent p-7 hover:border-violet-400/40 transition-colors">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04]"><I className="h-5 w-5 text-violet-300" /></span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[.14em] text-white/50">{p.tag}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/60">{p.body}</p>
                  <ul className="mt-5 space-y-2">
                    {p.points.map((x) => (
                      <li key={x} className="flex items-center gap-2 text-sm text-white/75"><Sparkles className="h-3.5 w-3.5 text-cyan-300" />{x}</li>
                    ))}
                  </ul>
                  <a href={p.href} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-violet-200" data-testid={`pillar-${p.key}-cta`}>
                    {p.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ kicker, title, sub, center = true }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <div className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300/90">{kicker}</div>
      <h2 className="mt-3 font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.02em]">{title}</h2>
      {sub && <p className="mt-4 text-base sm:text-lg text-white/55 leading-relaxed">{sub}</p>}
    </div>
  );
}

function AppPreview() {
  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative rounded-[32px] border border-white/10 bg-[#0a0910] p-3 sm:p-4 shadow-[0_40px_120px_-40px_rgba(124,58,237,.6)]">
          <div className="flex items-center gap-1.5 px-2 pb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-3 rounded-md bg-white/5 px-3 py-1 font-mono text-[11px] text-white/40">darkinator · /app</span>
          </div>
          <div className="grid lg:grid-cols-[210px_1fr_300px] gap-3">
            <div className="hidden lg:block rounded-2xl border border-white/5 bg-white/[.02] p-3 text-sm">
              {['Home', 'Shield', 'Trade', 'DarkinatorSwap', 'Private route', 'Privacy swap', 'Track order', 'Send', 'Receive', 'Withdraw', 'Earn'].map((x, i) => (
                <div key={x} className={`rounded-lg px-3 py-2 ${i === 4 ? 'bg-violet-500/15 text-white' : 'text-white/50'}`}>{x}</div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[.02] p-4 sm:p-8 flex justify-center">
              <div className="w-full max-w-[420px]" style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}>
                <div className="mb-4 flex justify-center">
                  {['Private route', 'Privacy swap', 'Track'].map((t, i) => (
                    <span key={t} className={`border border-[#404040] px-3 py-1.5 text-[13px] ${i ? 'border-l-0 text-[#8c8c8c]' : 'bg-[#3a3a41] text-white'}`}>{t}</span>
                  ))}
                </div>
                <div className="border border-[#404040] bg-[#1c1c21] p-4">
                  {[['From', 'SOL', 'Solana', '2', '≈ $335.20'], ['To', 'USDC', 'Ethereum', '334.18', 'Best of 3 routes']].map(([l, s, c, a, u], i) => (
                    <div key={l}>
                      <div className="mb-2 ml-2 text-[14px] text-[#8c8c8c]">{l}</div>
                      <div className="flex gap-1.5">
                        <div className="flex w-[130px] items-center gap-2.5 border border-[#404040] bg-[#25252b] px-3 py-3.5">
                          <span className={`h-7 w-7 rounded-full ${i ? 'bg-[#2775ca]' : 'bg-gradient-to-br from-[#9945ff] to-[#14f195]'}`} />
                          <div><div className="text-[15px] font-medium leading-5">{s}</div><div className="text-[11px] text-[#8c8c8c]">{c}</div></div>
                        </div>
                        <div className="flex flex-1 flex-col justify-center border border-[#404040] bg-[#25252b] px-4">
                          <div className="font-mono text-lg">{a}</div><div className="font-mono text-[11px] text-[#8c8c8c]">{u}</div>
                        </div>
                      </div>
                      {!i && <div className="mx-auto my-3 flex h-7 w-7 items-center justify-center border border-[#404040] bg-[#25252b]"><ArrowDownUp className="h-3.5 w-3.5 text-[#8c8c8c]" /></div>}
                    </div>
                  ))}
                  <div className="mt-5 flex h-11 items-center justify-center rounded-full text-[16px] text-[#0d0d0d]" style={{ background: 'linear-gradient(0deg,rgba(255,255,255,.45),rgba(255,255,255,.45)),linear-gradient(91.31deg,#fff -11.98%,#83f4ff 21.23%,#cfb1f8 50.19%,#faedff 100%)' }}>Review swap</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/[.02] p-4">
                <div className="text-[11px] uppercase tracking-[.16em] text-white/40">Private balance</div>
                <div className="mt-2 flex items-center gap-2 font-display text-3xl font-bold"><EyeOff className="h-5 w-5 text-white/40" /> ••••••</div>
                <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[11px] text-white/60">{['Shield', 'Send', 'Withdraw'].map((x) => <div key={x} className="rounded-lg border border-white/10 py-2">{x}</div>)}</div>
              </div>
              <div className="flex-1 rounded-2xl border border-white/5 bg-white/[.02] p-4">
                <div className="text-[11px] uppercase tracking-[.16em] text-white/40">What Solana sees</div>
                {['Private transfer · 2 notes', 'Shield · SOL', 'Private trade', 'Withdraw · one-time addr'].map((x) => (
                  <div key={x} className="mt-3 flex items-center justify-between text-[12px]"><span className="text-white/70">{x}</span><span className="font-mono text-white/30">sealed</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead kicker="How it works" title="Public in. Sealed inside. Private out." sub="Value enters through a public shield, lives as sealed notes, and leaves through a public exit or a confidential cross-chain swap. Everything in between is proven, not revealed." />
        <ol className="mt-14 grid gap-3 md:grid-cols-5">
          {FLOW.map((f, i) => (
            <li key={f.k} className="relative rounded-2xl border border-white/10 bg-white/[.03] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/35">0{i + 1}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[.14em] ${f.s === 'Sealed' ? 'bg-violet-500/15 text-violet-200' : 'bg-white/5 text-white/50'}`}>{f.s}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.k}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            [Lock, 'Notes', 'Each note commits to a token, an amount and its owner. Only your viewing key can open it, and only your spending key can spend it.'],
            [Cpu, 'Proofs', 'Groth16 proofs built in your browser show the program that balances add up and that you own what you spend.'],
            [Zap, 'Relayers', 'A relayer submits your proof and pays the network fee. It cannot redirect funds, because the recipient and fee are bound into the proof.'],
          ].map(([I, t, d]) => (
            <div key={t} className="flex gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.04] to-transparent p-5">
              <I className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <div><div className="font-display font-bold">{t}</div><p className="mt-1 text-sm text-white/55 leading-relaxed">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tech() {
  const [tab, setTab] = useState(DOC_TABS[0].key);
  const d = DOC_TABS.find((x) => x.key === tab);
  return (
    <section id="tech" className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead kicker="Technical documentation" title="How the engines work." sub="The protocol details behind ZK Shield, Houdini private routes and NEAR Intents confidential swaps." />
        <div className="mt-12 flex flex-wrap justify-center gap-2" role="tablist">
          {DOC_TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} data-testid={`tech-tab-${t.key}`}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${tab === t.key ? 'border-violet-400/60 bg-violet-500/15 text-white' : 'border-white/10 text-white/55 hover:text-white hover:bg-white/5'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0a0910] p-6 sm:p-10" data-testid={`tech-panel-${d.key}`}>
          <p className="max-w-4xl text-[17px] leading-relaxed text-white/75">{d.intro}</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {d.blocks.map((b) => (
              <div key={b.h} className="rounded-2xl border border-white/10 bg-white/[.02] p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Layers className="h-4 w-4 text-violet-300" />{b.h}</h3>
                <div className="mt-3 space-y-3">{b.p.map((x) => <p key={x.slice(0, 24)} className="text-sm leading-relaxed text-white/60">{x}</p>)}</div>
                {b.code && <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[12px] leading-relaxed text-cyan-100/90">{b.code}</pre>}
              </div>
            ))}
          </div>
          {d.table && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[.04] text-white/50"><tr>{d.table.cols.map((c) => <th key={c} className="px-5 py-3 font-medium">{c}</th>)}</tr></thead>
                <tbody>{d.table.rows.map((r) => (
                  <tr key={r[0]} className="border-t border-white/5"><td className="px-5 py-3 font-mono text-[12.5px] text-violet-200 whitespace-nowrap">{r[0]}</td><td className="px-5 py-3 text-white/65">{r[1]}</td></tr>
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
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead kicker="Privacy model" title="What the chain sees, and what it doesn’t." />
        <div className="mt-12 overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/[.04]"><tr>
              <th className="px-6 py-4 font-medium text-white/50">Action</th>
              <th className="px-6 py-4 font-medium text-white/50"><span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" />Public</span></th>
              <th className="px-6 py-4 font-medium text-white/50"><span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4 text-violet-300" />Stays private</span></th>
            </tr></thead>
            <tbody>{VISIBILITY.map((v) => (
              <tr key={v.a} className="border-t border-white/5">
                <td className="px-6 py-4 font-display font-semibold">{v.a}</td>
                <td className="px-6 py-4 text-white/55">{v.pub}</td>
                <td className="px-6 py-4 text-white/85">{v.priv}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['Don’t withdraw the exact amount you shielded to the same wallet right away.', 'Keep a little private SOL so transfers can hide their token.', 'Prefer tokens with a big crowd, and wait between shielding and withdrawing.', 'Cross-chain deposits are public on Solana; amounts and timing can link them.'].map((t) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-sm text-white/60"><KeyRound className="mb-2 h-4 w-4 text-cyan-300" />{t}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fees() {
  return (
    <section id="fees" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHead kicker="Fees" title="Simple, enforced on-chain." sub="Fees apply when value crosses the privacy wall. Private sends have no protocol fee." />
        <div className="mt-12 overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-white/[.04] text-white/50"><tr><th className="px-6 py-4 font-medium">Action</th><th className="px-6 py-4 font-medium">Protocol fee</th><th className="px-6 py-4 font-medium">Network / relayer</th></tr></thead>
            <tbody>{FEES.map((f) => (
              <tr key={f[0]} className="border-t border-white/5"><td className="px-6 py-4 font-display font-semibold">{f[0]}</td><td className="px-6 py-4 text-violet-200">{f[1]}</td><td className="px-6 py-4 text-white/55">{f[2]}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead kicker="FAQ" title="Questions, answered." />
        <Accordion type="single" collapsible className="mt-10 rounded-3xl border border-white/10 bg-white/[.02] px-6">
          {FAQ.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`} className="border-white/10">
              <AccordionTrigger className="text-left font-display text-base hover:no-underline" data-testid={`faq-q-${i}`}>{q}</AccordionTrigger>
              <AccordionContent className="text-white/60 leading-relaxed">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-violet-600/30 via-[#0d0b18] to-cyan-500/10 px-6 py-16 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-violet-500/30 blur-[100px]" />
          <div className="relative">
            <Logo size={52} withWord={false} />
          </div>
          <h2 className="relative mt-6 font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.02em]">Go private in under a minute.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/60">Create a wallet in your browser, shield a token, or start a cross-chain private swap. No sign-up.</p>
          <a href={APP} data-testid="landing-launch-final" className="relative mt-9 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-[15px] font-semibold text-[#07060c] hover:bg-white/90 transition">
            Launch app <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Logo size={26} />
        <div className="flex flex-wrap items-center gap-5 text-sm text-white/45">
          <a href="/app" className="hover:text-white">App</a>
          <a href="/app#private-route" className="hover:text-white">Private route</a>
          <a href="/app#privacy-swap" className="hover:text-white">Privacy swap</a>
          <a href="/app/docs" className="hover:text-white">Docs</a>
          <a href="/app/security" className="hover:text-white">Security</a>
          <a href="#tech" className="hover:text-white">Protocol</a>
        </div>
        <div className="text-xs text-white/30">© {new Date().getFullYear()} Darkinator · Non-custodial</div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const stats = useLiveStats();
  useEffect(() => { document.title = 'Darkinator · All-in-one private DeFi'; }, []);
  return (
    <div className="min-h-screen bg-[#07060c] text-white selection:bg-violet-500/40" data-testid="landing-page">
      <Nav />
      <main>
        <Hero stats={stats} />
        <AppPreview />
        <Pillars />
        <HowItWorks />
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
