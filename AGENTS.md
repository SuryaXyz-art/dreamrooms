# DreamRooms project constraints

## Scope

DreamRooms is one mobile-first Next.js App Router application for shareable DreamDEX BTC/ETH Event Contract rooms on Somnia Shannon testnet. Keep required MVP work separate from optional polish. Do not start a later phase without an explicit prompt.

## Source of truth

- Protocol behavior: [DreamDEX Event Contracts documentation](https://docs.dreamdex.io/developers/event-contracts.md), including its recipes, market-structure and gotchas pages.
- SDK types and behavior: the published `@somnia-chain/markets-sdk` package. Pin and inspect the version before using it; the Phase 0 audit found `0.29.0` as latest.
- Reference lifecycle: [official hackathon template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template).
- Current bot operational guidance: [official DreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit).
- Hackathon rules: [DoraHacks detail page](https://dorahacks.io/hackathon/event-contracts/detail). The page was protected by AWS WAF during the Phase 0 audit; do not infer unavailable rules.

## Permanent engineering rules

1. Use strict TypeScript. Do not use `any` unless an external boundary requires it and the reason is documented.
2. Prefer official SDK methods, types and chain definitions. Never invent SDK methods, addresses, venue IDs, transaction hashes or test results.
3. Treat on-chain state as authoritative for anything actionable: market status, transaction receipt, outcome balances and claims. The indexer is for discovery, history and display and may lag.
4. Never key a market only by pool address. Pools are recycled; use `marketId` and retain `(pool, nonce)` when a pool slice is needed.
5. Do not hardcode a market, pool or moving venue ID. Discover live market rows and scope by the inspected row's `venueId`/`operatorId`.
6. User wallets sign browser transactions. Private keys and service-role credentials are server-only, never requested in chat, logged, committed or exposed as `NEXT_PUBLIC_*` values.
7. Do not claim that a trade, settlement or claim worked without a mined successful receipt and an independently verified state read.
8. Use accessible semantic HTML, keyboard-visible focus, readable contrast, responsive layouts and reduced-motion support. Preserve English/Hindi copy boundaries.
9. Keep Supabase limited to rooms, presence and verified social records. It is not protocol truth and must not be used to fabricate positions or fills.
10. Do not commit or push Git changes unless explicitly requested.

## Verification expectations

Run the smallest relevant checks during each phase and the full quality gate at the end. Record commands and results in `docs/BUILD_STATUS.md`. If a required check cannot run because the app or credentials do not exist yet, record that as a real blocker rather than guessing.

## Phase 0 boundary

Phase 0 is audit and architecture only. Documentation files may be created or updated. Do not generate application code, install product dependencies into the workspace, create contracts, send transactions or deploy anything in this phase.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
