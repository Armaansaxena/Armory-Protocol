# Armory Protocol

Single-page marketing website for Armory Protocol — a Solana blockchain project that links Web2 domain ownership to wallet addresses for cryptographic payment verification.

## Run & Operate

- `pnpm --filter @workspace/armory-protocol run dev` — run the marketing site (served at `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, path `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Marketing site: Vite serving plain HTML + CSS + vanilla JS (no framework, no npm in app code)
- API: Express 5 (scaffolded, unused by marketing site)
- DB: PostgreSQL + Drizzle ORM (scaffolded, unused by marketing site)

## Where things live

- `artifacts/armory-protocol/index.html` — full page HTML (8 sections)
- `artifacts/armory-protocol/public/styles.css` — all CSS (design system tokens, components)
- `artifacts/armory-protocol/public/app.js` — Solana devnet query logic + interactivity
- `lib/api-spec/openapi.yaml` — API contract (healthz only, no backend needed for this site)

## Architecture decisions

- Plain HTML/CSS/JS served via Vite's `public/` static folder — no React, no build step for app code, loads instantly
- `%BASE_URL%` template in index.html ensures assets resolve correctly under any Vite base path
- Solana devnet queries use raw `fetch()` JSON-RPC + `crypto.subtle` SHA-256 — zero npm imports in app.js
- PDA derivation implemented from scratch with BigInt Ed25519 curve check (no @solana/web3.js)
- Base58 encode/decode implemented with BigInt arithmetic

## Product

**Armory Protocol** is an on-chain identity registry for Solana. Merchants register their domain + wallet address. A DNS oracle verifies ownership. Anyone (users, dApps, AI agents) can query the registry before sending SOL to confirm they're sending to the right address.

**Program ID:** `G8ZmDRtcCyvWCGRj41xoenQVQ7uRDEe1hVZzzqUYsgpX` (Solana Devnet)

## User preferences

- No React/npm in the marketing page — plain HTML/CSS/JS only
- No external font imports — system fonts only
- No gradients, glassmorphism, or blur effects
- Teal (#00A896) is the only accent color
- Technical, confident copy voice — no hype language

## Gotchas

- `app.js` must remain vanilla JS with no imports — it's served directly as a static asset
- PDA derivation with BigInt is CPU-intensive for the first call; subsequent lookups are fast
- The Ed25519 `isOnCurve` check uses BigInt modular exponentiation — correct but not optimized for speed

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
