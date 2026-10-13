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
