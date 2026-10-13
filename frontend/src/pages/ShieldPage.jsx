import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../components/Logo';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const BIFROST = `${BACKEND}/api/bifrost/v1`;

// Map a pretty /shield URL to the Bifrost v1 upstream mirror.
//   /shield            -> app  /
//   /shield/docs       -> app  /docs
//   /shield/about[...] -> site /...
export function shieldUpstream(pathname, search = '', hash = '') {
  let rest = pathname.replace(/^\/shield/, '') || '/';
  let target = 'app';
  if (rest === '/about' || rest.startsWith('/about/')) {
    target = 'site';
    rest = rest.slice(6) || '/';
  }
  return `${BIFROST}/${target}${rest}${search}${hash}`;
}

// ZK Shield: full-page Darkinator-branded Veil experience served by Bifrost v1
// (no iframe). This route just hands the browser over to the mirror, which
// rewrites the address bar back to /shield.
export default function ShieldPage() {
  const loc = useLocation();
  useEffect(() => {
    window.location.replace(shieldUpstream(loc.pathname, loc.search, loc.hash));
  }, [loc.pathname, loc.search, loc.hash]);

  return (
    <div
      data-testid="shield-loading"
      className="min-h-screen bg-[#07060c] flex flex-col items-center justify-center gap-5 text-white"
    >
      <div className="animate-pulse">
        <Logo size={44} />
      </div>
      <p className="text-sm text-white/50 tracking-wide">Opening ZK Shield…</p>
    </div>
  );
}
