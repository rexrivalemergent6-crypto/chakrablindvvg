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
