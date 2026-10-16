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

## Iteration 10 — NullCash (Oct 2026)
- Rebrand Cadabra -> NullCash (logo rings, favicons, lockup). Original light-only theme: backend/brand/nc-theme.css (injected via bifrost_brand.head_inject).
- dk-swap.js additions: desktop top tabs + More menu, mobile dock (Wallet/Hide/Pay/Trade/Menu) + Menu sheet, welcome tour, footer, Connect wallet button, explain-first pitch cards -> compact connect box, Earn/Invite hidden, referral promo + long explainers hidden, particle splash (Solana palette "SOL", "Getting ready").
- Left cypherpunk terminal rail (live stats + tx feed, polls every ~12s) on >=1381px.
- Key/address prefixes nullsk2/nullvk1/null2 via bifrost.null_prefix_js (parsers accept veil*/null*).
- 502/504 -> 503 JSON middleware; relayer quote retries + 3s micro cache.
- Landing page rewritten (LandingPage.jsx) in NullCash light style.
- Tests: iteration_13/14 100%, backend pytest 98/98.

## Iteration 11 — Swap verification (iteration_16.json: backend 105/105, frontend 100%)
- Re-imported new-nullsmsn repo; deps installed, services running.
- Verified live: Private route (quote -> order -> status), Privacy swap (near quote -> order -> status, 6/6 consecutive OK), Track (valid + bogus id), token picker, address validation, mobile layout.
- Fix: missing token logos (/indexer/v1/logo/*, /_img) now return a neutral SVG placeholder (200) instead of 404 -> zero console errors on swap pages.
- Known upstream behaviour: swap provider occasionally shows a Cloudflare "Quick security check" on submit (user taps Verify; client retries).

## Iteration 12 — Portal-style token picker (iteration_17.json: frontend 100%)
- dk-swap.js picker restyled after portalbridge.com: centred "Select token" + round close, "Choose network" 5-col grid (9 tiles + More/Less, or + All tile when <=9 chains), pill search "Search for a token or paste an address", "All tokens" list (42px icon + chain badge, symbol, name · short contract ↗ explorer link), selected row highlight, bottom sheet w/ grab handle on mobile. NullCash light theme kept.
- Paste contract address -> exact token match (Privacy swap tokens carry contractAddress). Explorer links never select the row.
- Fixed: chain icons for Base/Arbitrum/Optimism/TON/NEAR (coingecko via _img relay); icon URLs with spaces were cut by opaque_image_urls regex (400) -> encoded %20; placeholder SVG is 1x1 so client falls back to spothq icon / letter avatar.

## Iteration 13 — nullmask-style landing, /docs, collapsible fees (iteration_18.json: frontend 100%)
- Landing (LandingPage.jsx) redesigned in a nullmask-inspired style: #D9D9D9 / #202221 / #CDEF33, Poppins, own generated isometric art in /frontend/public/landing/*.webp, dot-matrix live notes counter (canvas), alternating light/dark sections, one-liner copy only (landingCopy.js: PRODUCTS, JOURNEY, METHODS, PIPE, CLAIMS, PRICES, QA, TECH). Old landingContent.js no longer used by landing/docs.
- NmNav.jsx: top bar = logo + X (https://x.com/usenullcash) + hamburger on all sizes; menu = bordered icon rows (Now live, Docs, Community, How it works, Swap w/o wallet, Fees, Privacy model, FAQ, Open app).
- /docs (NcDocsPage.jsx + docsContent.js): new structure, sidebar groups Start here / Concepts / Cross-chain / Reference / Staying safe, scroll-spy, mobile select.
- Fees collapsible everywhere, closed by default: landing Fees, docs Fees box, and in-app `.sum` fee boxes behind a "Fees & details" toggle (dk-swap.js ensureFees, resets closed on tab change).
- X link everywhere -> https://x.com/usenullcash. In-app Docs links -> /docs.

## Iteration 14 — Lime accent removed (iteration_19.json: frontend 100%, 0 lime hits)
- Landing/docs/nav: graphite buttons (#2B2F33, white text) on light sections, light-steel buttons (#E3E7EC) on dark sections, steel accent #B9C1CC; illustrations recoloured to steel.
- App theme (nc-theme.css, dk-swap.js): lime vars -> steel (#c5ccd6), primary buttons graphite gradient, --veil/--veil-rgb greens -> graphite, Chain terminal neutral. NOTE: theme CSS is lru_cached in bifrost_brand.py -> restart backend after editing nc-theme.css.

## Iteration 15 — Launch check + speed (iteration_20/21.json: 100%)
- "120+ networks" copy replaced with "any chain" everywhere (landing, docs, in-app). Hero stat tile = "Swap to: Any chain".
- Speed: DS proxy stale-while-revalidate + startup/background warm loop (server.py _ds_warm_loop); token logos persisted to backend/.cache/logos + pre-warmed at startup (bifrost.warm_logos); GZipMiddleware. /app all resources ~2.5s (was ~5.9s); DS lists ~0.1s cold.
- Privacy swap: friendly provider-outage message + "Use Private route" switch (dk-err-switch). Tests skip on NEAR provider outage.
- Known external limits: NEAR Intents had a provider-wide quoting outage (recovered); upstream swap API rate-limits order creation per server IP (429) — for scale, get an official partner/API key.
- Declined: scrubbing all upstream (Veil/DarkSwap) traces from proxies/network so inspectors can't see who operates the pool/swaps.

## Session (Oct 2026) — favicons, header, CA, fees, live relay, API page removed
- Favicons everywhere (incl. /app mirror icons/manifest) = user's NullCash logo (white bg, black ring mark). Upstream icon/manifest paths intercepted in bifrost.proxy via brand_icon_for().
- CA chip 31GYUbJW5vjF1o7VM5SGP9Emj5WDBHb1cdcR8BM6pump with copy: landing/docs (CaChip.jsx in NmNav) + app header (dk-swap.js ensureCA).
- App header self-fits (fitNav + ResizeObserver): overflow tabs move into More; wallet button capped/ellipsis; upstream .side-foot hidden.
- No-wallet swaps show real fees: Private route all-in cost from USD in/out; Privacy swap NullCash fee 0.40%, network withdraw fee, min received, refund fee; fees also in order modal. Friendly 503 fallback keeps asset (canonChain) when switching to Private route.
- Live: backend live_relay() refreshes indexer stats/feed every 3s (/api/bifrost/v1/_live), landing polls stats every 5s ("synced Ns ago"), Chain 4s, Track 5s, quotes 30s.
- Branding: extra text rewrites (NEAR Intents, @veilzk, DarkSwap, Houdini…), houdiniId→orderId, opaque _img?o= keys, #veilswap shown as #nullswap, legacy unused React pages deleted.
- /app/api removed (302/redirect to /docs, links hidden). No hardcoded domains -> custom domain nullcash.fun works via request host.

## Session — Re-imported new-chakra repo (Oct 2026)
- Source: https://github.com/rexrivalemergent6-crypto/new-chakra (code already at latest commit 0c16a3d).
- Created missing backend/.env (MONGO_URL, DB_NAME, CORS_ORIGINS) + frontend/.env (REACT_APP_BACKEND_URL), installed pip + yarn deps, all services running.
- Verified: landing (/), app (/app#private-route), Bifrost _live relay, live token list + Private route quote via /api/ds proxy.

## Iteration 16 — Vaulz zk rebrand + Omni (omnizec.com) dark stage UI (Oct 2026)
- Name NullCash -> Vaulz zk everywhere (backend BRAND_NAME/BRAND_SLUG, paraphrase/_strings, manifests, vault mirror, React). X account + CA chip removed everywhere (ensureX/ensureCA no-op, x.com links hidden).
- Dark only: shim forces data-theme=dark; nc-theme.css rewritten (tokens #090d10/#e3e8e8, frost glass, DM Sans + Instrument Serif, misty background /api/bifrost/v1/_brand/mist.webp). No guardian figure (user choice).
- App (/app): dk-swap.js ensureStage() -> #vz-head (All tools, "YOUR PRIVATE TOOLKIT / NN", big "Title.", serif tagline) fixed left on >=1180px + #vz-tabs tool tabs; content in right column. ?do=<tool> deep links (runDo) e.g. /app?do=send.
- Landing (/): Omni stage — NEW callout, "Hit send. / Leave no trace.", Enter Vaulz, live "What the chain sees" card with Go unseen toggle, 14-tool numbered launcher, How it works (#flow), Privacy model (#zk), Fees (#fees), FAQ (#faq), Why privacy dialog. Header NmNav.jsx (tools + More + Vault + Docs + Launch app; mobile menu grid).
- /docs + /vault restyled dark. Brand assets via scripts/make_vaulz_brand.py (lockup PNG-in-SVG, favicons).

## Iteration 17 — BlindSpot rebrand + Umbra-style app (Oct 2026)
- Name -> BlindSpot (BRAND_NAME/BRAND_SLUG in bifrost_brand.py, all JSON/JS/CSS/React). User logo (split-lens mark) = scripts/blindspot-mark-src.png -> favicons, lockup (mark + "BlindSpot"), in-app marks, /brand/blindspot-mark.png; old NullCash/Cadabra marks deleted. ?v=7 icon cache bust.
- App (/app) restyled after v2.umbraprivacy.com (dark): centred hero "The privacy layer / for your money.", Deposit(=Shield)/Send/Swap/Withdraw tabs with sliding indicator, rounded 22px transaction frame; gated state = Umbra-style form ("You're depositing", amount, Select Token, quick tokens, fee rows) + "Create an account". Header: Vault button (=Home/balance), Create account, ••• menu (all other tools). Top nav + mobile dock hidden. /app defaults to Deposit.
- Landing (/) kept in Omni style (rebranded). Visible-text scan of 12 pages: zero third-party brand names.
- Declined (again): hiding upstream providers at network/proxy level.

## Iteration 18 — Blind key prefixes + Vault tab (Oct 2026)
- Key/address prefixes now blindsk2… (recovery key), blindvk1… (viewing key), blind2… (receive address) via bifrost.py null_prefix_js; parsers accept blind/null/veil (case-insensitive) so old keys still import. CHUNK_VER nc3 busts cached chunks. Verified: new vault shows blindsk2… recovery key; patched chunks pass node --check.
- Welcome intro tour removed (showTour no-op, footer link removed, menu item -> /#flow).
- Tabs: Vault (=home balance) · Deposit · Send · Swap · Withdraw; header Vault button removed; /app opens on Vault.
- X Follow button (https://x.com/tryblind): square 8px-radius "Follow" button in app header (#vz-x-btn, button+window.open so the x.com hide rules don't apply) and React NmNav (nav-x-follow) on landing/docs/vault. Icon-only under 520px/640px.
- Create-account modal: BlindSpot vault first, Phantom second, rest (Solflare, Backpack…) behind "More wallets (n)" toggle (dk-swap.js ensureWallets, #vz-wmore, .vz-whide). "BlindSpot wallet" -> "BlindSpot vault" everywhere (paraphrase values + rt() catch-all regex).

## Iteration 19 — Original "lens" design + research docs + rolling-numbers loader
- Original BlindSpot design language (nc-theme.css tail + index.css tail): viewfinder corner ticks on cards/glass, split-lens dot on primary buttons (rotates on hover), 10-16px geometry, mono micro labels, squared tabs with lens dot + underline bar. Background unchanged.
- App hero now "SOLANA-FIRST · SHIELDED · QUANTUM-SAFE VAULT / Out of sight. Never out of reach."
- Loader: in-app #nc-splash = full-screen canvas of rolling digits; cells under "BlindSpot" lock in and settle (dk-swap.js ensureSplash). Site boot (#nc-boot) has a lighter rolling-digit canvas.
- Docs: overview repositioned (Solana-first shielded pool + quantum-safe vault); new "Protocol research" group: Why Solana first, The quantum question (honest: pool Groth16 not post-quantum), Quantum-safe vault, Research directions.
