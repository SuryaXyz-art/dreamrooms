# DoraHacks submission copy

## Title

DreamRooms

## Tagline

Make the room before the market moves.

## Short description

DreamRooms turns live DreamDEX BTC/ETH Event Contracts on Somnia Shannon into shareable prediction rooms where people compare community conviction with transparent odds and verify wallet activity on-chain.

## Full project description

Event Contracts are easier to understand when people can gather around the exact event window. DreamRooms gives a host a focused place to share a thesis, lets participants compare UP/DOWN conviction with the DreamDEX order book, and keeps actionable state grounded in chain reads. It is mobile-first, bilingual-ready and explicit about testnet risk, binary outcomes and self-custody.

The current local release candidate contains the Next.js shell, typed domain/provider boundaries, dynamic BTC/ETH read-only discovery, structured market normalization, order-book display, Shannon wallet guard, official raw trade preparation, and Supabase room/social APIs with signed wallet sessions and verified-only activity filtering. Remote Supabase verification, public deployment and real transaction evidence remain pending and are not represented as completed here.

## Technology

- Next.js App Router and React
- Strict TypeScript
- Tailwind CSS 4
- wagmi and viem for injected-wallet UX
- `@somnia-chain/markets-sdk` `0.29.0`
- Vitest
- Somnia Shannon testnet, chain ID `50312`

## Innovation

DreamRooms focuses on the missing social explanation layer around Event Contracts. A room is tied to a stable market ID and the pool/nonce slice, so recycled pools cannot silently change the market being discussed. Community context complements protocol odds without replacing them.

## DreamDEX / Somnia integration

The adapter discovers live BTC and ETH rows from the official SDK, re-reads each market on chain, normalizes structured strike/interval/window fields and reads the binary order book. Orders use official quote and grid utilities, raw bigint values, explicit expiry bounds and browser wallet signatures. A receipt must be successful and the selected outcome balance must increase before the UI calls a position verified.

## Ecosystem impact

The project can make Somnia Event Contracts more legible to communities, streamers and small groups by turning an isolated market into a shareable live moment. Future room history and verified activity can provide reusable educational and discovery surfaces without custodial funds.

## Limitations and roadmap

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md). Next milestones are remote Supabase/schema verification, a two-session room proof, real Shannon evidence, public deployment and a recorded demo. Public application URL, repository URL and demo-video URL are intentionally not invented.
