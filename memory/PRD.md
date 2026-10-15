# Darkinator (DarkSwap clone) — PRD

## Problem statement
Clone DarkSwap /swap with sleek frontend and both live swap methods (Private route via HoudiniSwap, Privacy swap via NEAR Intents) using DarkSwap's backend via a server-side proxy. Source repo: https://github.com/rexrivalinsta-art/new-dark

## Architecture
- Backend: FastAPI `/api/ds/{path}` httpx proxy -> https://darkswap.app/api/swap/<path> (allowlist: tokens, chains, quotes, orders, near), pooled client, retries, TTL cache for token/chain lists.
- Frontend: React pages Home (/), Swap (/swap), Docs (/docs), Track (/track); orders saved to localStorage.

## Status (Oct 2026)
- Imported repo restored: created missing backend/frontend .env, added httpx to requirements, installed deps, services running.
- Verified: token list + NEAR quote live through proxy; Home & Swap pages render.

## Backlog
- Order history with re-swap, address validation per chain, route detail hovers, share order link.

## Iteration 2 — ZK Shield (Veil clone via Bifrost v1)
- backend/bifrost.py: /api/bifrost/v1/{site|app|indexer|relayer|rpc}/{path} full mirror proxy (+WS), URL rewriting + injected browser shim so Veil's own client code (wallet creation, proofs, RPC, relayer) runs in-browser while every request goes through our backend. /_health, /_meta.
- frontend: /shield page (iframe + view tabs + health pills + full screen), navbar "ZK Shield", swap card 3rd tab.
- Tested: 100% backend + frontend (iteration_1.json), wallet creation end-to-end.

## Iteration 3 — No iframe, Darkinator rebrand (verified iteration_2.json, 100%)
- /shield/* React route hands browser to Bifrost mirror full-page; shim keeps address bar on /shield, /shield/about, /shield/docs...
- backend/bifrost_brand.py: text Veil->Darkinator, veilit.xyz->our host, Darkinator lockup/mark/favicon (/api/bifrost/v1/_brand/*), purple palette + Sora headings, dark default. $VEIL ticker + veilsk key prefix kept (functional/real token).
- Fixed freeze: never re-set attributes when rewritten value unchanged; never touch head LINK/META (React 19 hoistables).

## Iteration 4 — One single site (verified iteration_3.json: backend 100%, frontend 95% -> minor fixes applied)
- Whole site = mirror: / app, /about landing, /docs..., legacy /swap /track /shield redirect.
- backend/brand/dk-swap.js: injected sidebar items Private route / Privacy swap / Track order with Mayan-style swap UI (live /api/ds DarkSwap + NEAR Intents, order creation, tracking, recent orders).
- /api/bifrost/v1/_img?u= same-origin token icon relay (allowlisted hosts) — upstream CDNs were ORB-blocked.
- VEIL project token stripped (JSON + JS mint stub), extension/audit/social surfaces hidden, all Veil/veil text -> Darkinator.
- Backlog: per-chain address validation, wallet-signed deposit (pay order directly from connected wallet), pinned favourite tokens.

## Iteration 5 — Launch page (iteration_6.json 95% -> mobile overflow fixed)
- New React landing at "/" (LandingPage.jsx + landingContent.js): hero "The all-in-one private DeFi app", live Bifrost stats, app preview, pillars (ZK Shield / Houdini Private route / NEAR Intents Privacy swap), flow, technical docs tabs (ZK protocol, Houdini, NEAR Intents, Relayer & indexer API), privacy model, fees, FAQ, CTA.
- App moved to /app (pretty URLs /app, /app#private-route, /app/docs...). /about = rebranded landing mirror. Legacy /swap /track /shield redirect into /app.

## Iteration 6 — Rebrand to Cadabra (iteration_7.json; mobile overflow fixed after)
- Name Cadabra, tagline "Make your transactions vanish", "The privacy layer for Solana · multiple routes". User logo -> cadabra-mark.png + favicons + app lockup (backend/brand/mark-256.png).
- Landing: new "Real ZK" section (Encryption vs Relayer vs ZK, proof pipeline, what's proven, nullifiers, no-magic caveat). Third-party brand names removed from landing (generic "multi-hop private routes", "intent-based confidential swaps").

## Iteration 7 — Perf + premium flat landing + paraphrase (iteration_8.json: backend 100%, frontend ~95%)
- Proxy: rendered-body cache for immutable assets, 4s micro-cache + singleflight for indexer/relayer live JSON, negative cache for missing token icons, immutable cache headers (preview ingress forces no-store; prod should honour).
- Client: branding observer batched per animation frame; landing has no gradients/blur/animations; hero = live "What the chain sees" ledger. Landing /app TTI ~1.8s, landing load ~0.4s, 0 long tasks idle.
- In-app wording paraphrased (backend/brand/paraphrase.json), nav renamed + reordered (CSS order), Cadabra mark for wallet tile, upstream docs/security/about pages redirect to our landing (#tech/#zk).

## Iteration 8 — Order creation fix + wallet sheet (iteration_11.json: backend 100%, frontend 100%)
- Root cause of swap 400/409s: recipient address didn't match destination chain, and retrying reused an expired/already-claimed quote. Fix in dk-swap.js: per-chain address validation (EVM, Solana, BTC, Tron, LTC, NEAR, ZEC, XLM, XRP, XMR) blocks the button with a clear message; refund must be a valid Solana address; auto re-quote + retry once on a stale/claimed quote; one quiet retry after a connection-check interruption; friendly error text.
- Wallet creation sheet: centred card, dimmed + 14px blur backdrop, closes with X, Esc or a click outside.
- Backlog: pay order directly from connected wallet, pinned favourite tokens, order share link.

## Iteration 9 — Re-imported into new workspace (Oct 2026)
- Source: https://github.com/rexrivalemergent6-crypto/swapcreate---darkpricnow-
- Created backend/.env + frontend/.env, installed deps, services running. Verified landing (/), app (/app#private-route), Bifrost health, live NEAR quote via proxy.
- Iter 9 audit (iteration_12.json, 100%): every veilit.xyz indexer/relayer endpoint matches upstream via proxy. Fixed: ingress replaced 502/504 bodies with HTML (GatewayStatusMiddleware -> 503 JSON + x-upstream-status); relayer quote/fee retries w/ backoff on shared Jupiter 429 + 3s micro cache; POSTs not re-sent on 502 unless rate-limited/busy.
