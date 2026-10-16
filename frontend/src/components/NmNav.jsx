import React, { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { TOOLS, VzIcon } from './vzTools';

const MAIN = ['shield', 'send', 'swap', 'bridge', 'private-route', 'privacy-swap'];
const MORE = ['track', 'receive', 'withdraw', 'history', 'addresses', 'keys', 'chain'];
const byId = (id) => TOOLS.find((t) => t.id === id);

// BlindSpot top bar: wordmark, tool links with icons, More, Vault, Docs, Why privacy, Launch.
export default function NmNav({ active = '', onWhy }) {
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { setMore(false); setMenu(false); } };
    const c = (e) => { if (ref.current && !ref.current.contains(e.target)) setMore(false); };
    window.addEventListener('keydown', k); document.addEventListener('mousedown', c);
    return () => { window.removeEventListener('keydown', k); document.removeEventListener('mousedown', c); };
  }, []);
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menu]);

  return (
    <header className="vz fixed inset-x-0 top-0 z-50" data-testid="site-header"
      style={{ background: 'linear-gradient(180deg,rgba(9,13,16,.9) 0%,rgba(9,13,16,.5) 70%,rgba(9,13,16,0) 100%)' }}>
      <div className="mx-auto flex h-[76px] w-[91.6%] items-center gap-6">
        <a href="/" className="shrink-0" data-testid="nav-logo"><Logo size={27} /></a>
        <nav className="ml-6 hidden min-w-0 flex-1 items-center gap-1 xl:flex" data-testid="nav-tools">
          {MAIN.map((id) => { const t = byId(id); return (
            <a key={id} href={t.href} className={`vz-navlink ${active === id ? 'on' : ''}`} data-testid={`nav-${id}`}><VzIcon name={t.ico} />{t.label}</a>
          ); })}
          <div className="relative" ref={ref}>
            <button type="button" className={`vz-navlink ${more ? 'on' : ''}`} onClick={() => setMore((v) => !v)} aria-expanded={more} data-testid="nav-more">
              More <span aria-hidden="true" className={`text-[8px] transition-transform ${more ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>
            {more && (
              <div className="vz-glass absolute left-0 top-[42px] w-[250px] p-1.5" style={{ background: 'var(--vz-glass)' }} data-testid="nav-more-menu">
                {MORE.map((id) => { const t = byId(id); return (
                  <a key={id} href={t.href} className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-[13px] text-[var(--vz-fg)] transition hover:bg-white/[.06]" data-testid={`nav-more-${id}`}>
                    <span className="grid h-7 w-7 place-items-center rounded-[6px] border border-[var(--vz-line)] text-[var(--vz-dim)]"><VzIcon name={t.ico} size={14} /></span>
                    <span><span className="block">{t.label}</span><span className="block text-[11px] text-[var(--vz-faint)]">{t.d}</span></span>
                  </a>
                ); })}
              </div>
            )}
          </div>
          <a href="/vault" className={`vz-navlink ${active === 'vault' ? 'on' : ''}`} data-testid="nav-vault"><VzIcon name="lock" />Vault
            <span className="ml-1 rounded-[4px] bg-[#d9a85a] px-1.5 py-[1px] text-[8px] font-semibold tracking-[.08em] text-[#090d10]">NEW</span></a>
          <a href="/docs" className={`vz-navlink ${active === 'docs' ? 'on' : ''}`} data-testid="nav-docs">Docs</a>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          {onWhy && (
            <span className="hidden md:block"><button type="button" onClick={onWhy} className="vz-navlink" data-testid="nav-why">Why privacy <span aria-hidden="true">&#8599;</span></button></span>
          )}
          <a href="/app" className="vz-pill whitespace-nowrap" data-testid="nav-launch">Launch app</a>
          <span className="xl:hidden"><button type="button" className="vz-pill w-[38px] !px-0" onClick={() => setMenu(true)} aria-label="Open menu" data-testid="nav-menu-open">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 8h16M4 16h16" /></svg>
          </button></span>
        </div>
      </div>

      {menu && (
        <div className="vz fixed inset-0 z-[60] overflow-y-auto bg-[#090d10]/[.97] backdrop-blur-xl" data-testid="nav-menu">
          <div className="mx-auto flex h-[76px] w-[91.6%] items-center justify-between">
            <Logo size={27} />
            <button type="button" className="vz-pill w-[38px] !px-0" onClick={() => setMenu(false)} aria-label="Close menu" data-testid="nav-menu-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="mx-auto w-[91.6%] pb-10">
            <p className="vz-eyebrow mb-4 mt-4">Your private toolkit</p>
            <ul className="vz-glass vz-launcher" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
              {TOOLS.map((t, i) => (
                <li key={t.id}><a href={t.href} data-testid={`menu-${t.id}`} onClick={() => setMenu(false)}>
                  <VzIcon name={t.ico} size={20} className="mt-0.5 shrink-0 text-[var(--vz-dim)]" />
                  <div><b>{t.label}</b></div>
                  <span className="vz-num">{String(i + 1).padStart(2, '0')}</span>
                </a></li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/docs" className="vz-pill" onClick={() => setMenu(false)}>Docs</a>
              <a href="/#flow" className="vz-pill" onClick={() => setMenu(false)}>How it works</a>
              <a href="/#fees" className="vz-pill" onClick={() => setMenu(false)}>Fees</a>
              <a href="/#faq" className="vz-pill" onClick={() => setMenu(false)}>FAQ</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
