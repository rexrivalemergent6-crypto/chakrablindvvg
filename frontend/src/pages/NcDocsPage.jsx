import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import NmNav from '../components/NmNav';
import Logo from '../components/Logo';
import { DOC_GROUPS } from './docsContent';
import { SEEN, PRICES } from './landingCopy';

function FeesBox() {
  const [open, setOpen] = useState(false);
  return (
    <div className="vz-glass">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="docs-fees-toggle"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-[14px] text-[var(--vz-strong)]">Fee breakdown <span className="text-[var(--vz-faint)]">· tap to {open ? 'hide' : 'show'}</span></span>
        <ChevronDown className={`h-4 w-4 text-[var(--vz-dim)] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-500 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto px-5 pb-4">
            <table className="vz-table w-full min-w-[520px] text-left text-[13px]" data-testid="docs-fees-table">
              <thead><tr className="border-b border-[var(--vz-hair)]"><th className="py-3 pr-3">Action</th><th className="py-3 pr-3">Protocol fee</th><th className="py-3">Network cost</th></tr></thead>
              <tbody>{PRICES.map((f) => (
                <tr key={f[0]} className="border-b border-[var(--vz-hair)] last:border-0"><td className="py-3 pr-3 text-[var(--vz-strong)]">{f[0]}</td><td className="py-3 pr-3">{f[1]}</td><td className="py-3 text-[var(--vz-dim)]">{f[2]}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ b }) {
  switch (b.k) {
    case 'p': return <p className="text-[14.5px] leading-[1.75] text-[var(--vz-dim)]">{b.t}</p>;
    case 'list': return (
      <ul className="space-y-2.5">{b.items.map((x) => (
        <li key={x} className="flex gap-3 text-[14px] leading-[1.6] text-[var(--vz-fg)]"><span className="mt-[11px] h-px w-3 shrink-0 bg-[var(--vz-dim)]" />{x}</li>
      ))}</ul>
    );
    case 'steps': return (
      <ol className="vz-glass divide-y divide-[var(--vz-hair)]">{b.items.map(([h, t], i) => (
        <li key={h} className="flex gap-5 p-5">
          <span className="vz-mono mt-1 shrink-0 text-[9px] text-[var(--vz-faint)]">{String(i + 1).padStart(2, '0')}</span>
          <span><span className="block text-[16px] tracking-[-.03em] text-[var(--vz-strong)]">{h}</span><span className="mt-1.5 block text-[13.5px] leading-[1.6] text-[var(--vz-dim)]">{t}</span></span>
        </li>
      ))}</ol>
    );
    case 'code': return <pre className="vz-glass vz-mono overflow-x-auto p-5 text-[12px] leading-[1.7] text-[var(--vz-accent)]">{b.t}</pre>;
    case 'note': return (
      <div className="vz-glass flex gap-3 border-l-2 !border-l-[var(--vz-edge-hi)] p-5 text-[13.5px] leading-[1.6] text-[var(--vz-fg)]"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vz-dim)]" />{b.t}</div>
    );
    case 'kv': return (
      <dl className="vz-glass divide-y divide-[var(--vz-hair)]">{b.rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr]"><dt className="vz-eyebrow !text-[9px] pt-1">{k}</dt><dd className="text-[14px] text-[var(--vz-fg)]">{v}</dd></div>
      ))}</dl>
    );
    case 'table': return (
      <div className="vz-glass overflow-x-auto">
        <table className="vz-table w-full min-w-[560px] text-left text-[13px]">
          <thead><tr className="border-b border-[var(--vz-hair)]">{b.cols.map((c) => <th key={c} className="px-5 py-3.5">{c}</th>)}</tr></thead>
          <tbody>{b.rows.map((r) => (
            <tr key={r[0]} className="border-b border-[var(--vz-hair)] last:border-0"><td className="vz-mono whitespace-nowrap px-5 py-3 text-[12px] text-[var(--vz-strong)]">{r[0]}</td><td className="px-5 py-3 text-[var(--vz-dim)]">{r[1]}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
    case 'fees': return <FeesBox />;
    case 'visibility': return (
      <div className="vz-glass overflow-x-auto" data-testid="docs-visibility">
        <table className="vz-table w-full min-w-[600px] text-left text-[13px]">
          <thead><tr className="border-b border-[var(--vz-hair)]"><th className="px-5 py-3.5">Action</th><th className="px-5 py-3.5">The chain sees</th><th className="px-5 py-3.5">Stays unseen</th></tr></thead>
          <tbody>{SEEN.map((v) => (
            <tr key={v.a} className="border-b border-[var(--vz-hair)] last:border-0"><td className="px-5 py-3 text-[var(--vz-strong)]">{v.a}</td><td className="px-5 py-3 text-[var(--vz-dim)]">{v.out}</td><td className="px-5 py-3">{v.inn}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
    default: return null;
  }
}

export default function NcDocsPage() {
  const pages = useMemo(() => DOC_GROUPS.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.title }))), []);
  const [active, setActive] = useState(pages[0].id);
  useEffect(() => {
    document.title = 'Docs · BlindSpot';
    const els = pages.map((p) => document.getElementById(p.id)).filter(Boolean);
    const io = new IntersectionObserver((ents) => {
      const vis = ents.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-110px 0px -60% 0px' });
    els.forEach((e) => io.observe(e));
    if (window.location.hash) {
      const t = document.getElementById(window.location.hash.slice(1));
      if (t) setTimeout(() => t.scrollIntoView(), 60);
    }
    return () => io.disconnect();
  }, [pages]);
  const go = (id) => { const t = document.getElementById(id); if (t) { t.scrollIntoView({ behavior: 'smooth' }); window.history.replaceState(null, '', `#${id}`); } };
  return (
    <div className="vz relative min-h-screen bg-[#090d10]" data-testid="docs-page">
      <div className="vz-world left" aria-hidden="true" />
      <NmNav active="docs" />
      <div className="relative z-[1] mx-auto w-[91.6%] pb-24 pt-32">
        <header className="border-b border-[var(--vz-hair)] pb-10">
          <a href="/" className="vz-link inline-flex items-center gap-2 text-[11px]" data-testid="docs-all-tools">&larr; All tools</a>
          <p className="vz-eyebrow mt-7">Your private toolkit / Docs</p>
          <h1 className="vz-h1 mt-5" data-testid="docs-title">Docs<span className="text-[var(--vz-muted)]">.</span></h1>
          <p className="vz-serif mt-5 max-w-[620px] text-[24px] leading-[1.2] text-[var(--vz-dim)]">How it works, and how to check it.</p>
          <div className="mt-7 md:hidden">
            <select value={active} onChange={(e) => go(e.target.value)} data-testid="docs-select"
              className="w-full rounded-[6px] border border-[var(--vz-edge)] bg-[#0e1419] px-3 py-3 text-[14px] text-[var(--vz-fg)]">
              {DOC_GROUPS.map((g) => <optgroup key={g.id} label={g.title}>{g.pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</optgroup>)}
            </select>
          </div>
        </header>
        <div className="mt-12 grid gap-14 md:grid-cols-[230px_1fr] lg:grid-cols-[260px_minmax(0,820px)]">
          <aside className="hidden md:block">
            <nav className="sticky top-28 space-y-7" data-testid="docs-sidebar">
              {DOC_GROUPS.map((g) => (
                <div key={g.id}>
                  <div className="vz-eyebrow">{g.title}</div>
                  <ul className="mt-3 space-y-0.5 border-l border-[var(--vz-hair)]">
                    {g.pages.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => go(p.id)} data-testid={`docs-link-${p.id}`}
                          className={`-ml-px block w-full border-l py-1.5 pl-4 text-left text-[13px] transition-colors ${active === p.id ? 'border-[var(--vz-fg)] text-[var(--vz-strong)]' : 'border-transparent text-[var(--vz-dim)] hover:text-[var(--vz-strong)]'}`}>{p.title}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <a href="/app" className="vz-enter" data-testid="docs-open-app">Open app <span aria-hidden="true">&#8599;</span></a>
            </nav>
          </aside>
          <main className="min-w-0 space-y-20">
            {pages.map((p) => (
              <section key={p.id} id={p.id} className="scroll-mt-28" data-testid={`docs-section-${p.id}`}>
                <div className="vz-eyebrow">{p.group}</div>
                <h2 className="mt-4 text-[34px] font-normal leading-[1.02] tracking-[-.06em] text-[var(--vz-strong)] sm:text-[44px]">{p.title}<span className="text-[var(--vz-muted)]">.</span></h2>
                <p className="vz-serif mt-4 text-[21px] leading-[1.3] text-[var(--vz-dim)]">{p.lead}</p>
                <div className="mt-7 space-y-5">{p.blocks.map((b, i) => <Block key={`${p.id}-${i}`} b={b} />)}</div>
              </section>
            ))}
          </main>
        </div>
      </div>
      <footer className="relative z-[1] mx-auto flex w-[91.6%] flex-col items-center justify-between gap-3 border-t border-[var(--vz-hair)] py-8 text-[11px] text-[var(--vz-faint)] sm:flex-row">
        <Logo size={20} />
        <span>&copy; {new Date().getFullYear()} BlindSpot</span>
      </footer>
    </div>
  );
}
