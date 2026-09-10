# Architecture decisions

## ADR-0001 — Start a clean Next.js app

Decision: initialize one Next.js App Router + TypeScript application in Phase 1.

Reason: the official hackathon template is intentionally a non-UI lifecycle primitive with separate TypeScript and Solidity examples. It is valuable reference material but not a compatible web starter. A clean app avoids carrying unused scripts and makes the public room UX, wallet lifecycle and Vercel deployment straightforward.

## ADR-0002 — Pin the current Event Contracts SDK floor

Decision: use the inspected `@somnia-chain/markets-sdk` `0.29.0` floor or a later inspected release, never the template's unexamined `^0.28.1` dependency.

Reason: the current official Event Contracts page states `0.29.0` or newer. The package types expose the browser `walletClient`, `setSigner`, live binary-market list, finalized-market list, on-chain market reads and typed receipt/claim paths needed by DreamRooms.

## ADR-0003 — Participant wallets sign trades and claims

Decision: no private key or server trading signer in the MVP.

Reason: the product's primary success condition explicitly requires real wallet-signed testnet trades. Browser wagmi/viem state is bound into the SDK after the user connects. This removes a custodial secret from the deployment and keeps every action attributable to the participant.

## ADR-0004 — Chain truth wins over indexer convenience

Decision: use indexer data for discovery/history and use on-chain reads for action gates and verification.

Reason: the official docs and bot kit both warn that the indexer lags. Before every write, require `getMarketOnchain(marketId).status === 1`; after a write, require a successful receipt and verify outcome-token balances from chain state.

## ADR-0005 — Discover venue scope at runtime

Decision: do not ship a copied DreamDEX venue ID as a constant.

Reason: the bot kit explicitly says venue IDs differ and can move. Read the venue/operator attribution from a live market row, show the scope in the room's verified market metadata and allow a configured override only after it has been checked against a live row.

## ADR-0006 — Off-chain rooms for the MVP

Decision: keep room membership, presence and verified social activity in Supabase; do not deploy a room contract in the MVP.

Reason: the room coordinates and explains an existing DreamDEX market. Adding a second contract would introduce deployment, auditing and funding dependencies without improving the required trade lifecycle. Every financial/protocol fact still comes from DreamDEX and the wallet receipt.

## ADR-0007 — IOC for the first trade path

Decision: the initial participant action uses an IOC order and clearly reports partial/no fill.

Reason: a resting remainder escrows funds and remains easy to miss. The official docs recommend deliberate IOC versus resting behavior; IOC gives the evaluator a bounded, understandable demo flow. Resting orders can be added later with explicit cancel tracking.

## ADR-0008 — User-triggered claim, no keeper

Decision: show finalized markets and let the connected wallet claim; do not run a background claim worker.

Reason: DreamDEX resolution is protocol-driven, while redemption is a user-signed action. A background key would add a secret and nonce coordination problem. The UI will explain resolved versus voided payout behavior and use explicit outcome indices when necessary.

## ADR-0009 — Current compatible foundation toolchain

Decision: use the current Next.js 16 App Router stack with React 19, Tailwind CSS 4, TypeScript 6.0.3, ESLint 9, Vitest 5 and Prettier 3, pinned in the package manifest and lockfile.

Reason: the workspace was empty and the current Next release is compatible with this stack when TypeScript is kept below 6.1 and the flat ESLint configuration is used. The DreamDEX SDK is intentionally not installed until Phase 2, when its read-only adapter is implemented against inspected package types.

## ADR-0010 — Provider-first UI boundaries

Decision: App Router pages consume typed provider interfaces instead of importing SDKs, wallet clients or database clients directly.

Reason: Phase 1 needs a usable shell without implying live protocol state. Development providers can expose clearly labelled `DEMO` fixtures, while production providers return `UNAVAILABLE` until the verified integrations exist. This keeps the UI contract stable and prevents mock data from becoming a silent production fallback.

## ADR-0011 — Pin the official SDK and use server-owned read adapters

Decision: pin `@somnia-chain/markets-sdk@0.29.0` with `viem@2.56.3` and keep the SDK client behind `src/lib/dreamdex` and the typed `MarketProvider` interface.

Reason: the current Event Contract documentation requires SDK `0.29.0` or newer, and the installed declarations verify the Shannon chain, testnet deployment map, paginated live binary-market discovery, chain market reads and binary order-book reads. Server-owned reads keep endpoint configuration out of page components and leave browser wallet signing for the later write phase.

## ADR-0012 — Live data is the default; fixtures require explicit opt-in

Decision: local and deployed runs use the Shannon read-only provider by default. The prior development fixture provider is available only when `DREAMROOMS_DATA_MODE=demo` is set explicitly.

Reason: Phase 2's evaluator path must demonstrate real Event Contract discovery. An implicit development fixture would make a successful-looking local page easy to mistake for live data. Every fixture remains visibly `DEMO`, and failed live reads surface `STALE` or `UNAVAILABLE`.

## ADR-0013 — Normalize chain truth and freshness before rendering

Decision: every indexed market row is keyed by `marketId`, re-read with `getMarketOnchain(marketId)`, and only marked `LIVE` when the chain read succeeds. Books are read from the resolved on-chain pool and normalized from raw SDK units. Bounded retries and timeouts classify failures as stale/unavailable.

Reason: indexed lifecycle status can lag and pools are recycled. The normalized domain model therefore carries the structured resolution mode, interval, token IDs, chain-derived lifecycle status, freshness and book depth needed by the UI without parsing question text or copying a pool/venue constant.

## ADR-0014 — Build unsigned calls, then send with the browser wallet

Decision: the first real trade uses the official raw `buildPlaceOrder` path plus a viem `WalletClient`, with a separate ERC-20 approval only when the on-chain allowance is short. The submitted order is an IOC and expires at the authoritative market expiry.

Reason: the application must expose the approval and order boundaries to a participant and model wallet rejection, submitted hash, mined receipt and revert explicitly. The SDK's convenience `placeOrder` path is still the source of the raw encoding, but manual call sending lets the UI record the transaction hash before waiting and independently verify the receipt. All price/quantity inputs are bigint values from the official quote kernel and on-chain book grid.

## Automated preflight and public evidence — 2026-09-09

Decision: keep the wallet gate explicit and fail closed. A visible typed preflight checklist must pass before the manual approval/order prompts can open, and the UI offers evidence JSON only after receipt success plus authoritative position verification.

Reason: the market quote, allowance and expiry can change between render and signature. The preflight makes those conditions observable, preserves manual user decisions, prevents duplicate submission, and keeps public evidence separate from faucet funding or unverified client claims.

## Monochrome visual system — 2026-09-09

Decision: use a strict black/white/neutral token system and distinguish UP/DOWN with inverted surfaces, arrows and a diagonal DOWN pattern rather than semantic color.

Reason: a restrained terminal/editorial system improves contrast, preserves meaning without color dependence and keeps the social prediction product visually distinct while leaving protocol semantics unchanged.

## ADR-0018 — Supabase owns social state; DreamDEX owns financial truth

Decision: persist rooms, membership, presence, sentiment, reactions and verified activity in
Supabase behind server-only privileged writes. A verified trade record is created only after the
server independently checks the Shannon receipt, sender, selected market pool, fill event and
authoritative outcome-token balance.

Reason: the room layer needs shareable low-latency state, while market status, fills, positions and
claims must remain protocol facts. RLS exposes only safe reads, wallet nonce signatures bind writes
to a wallet, and the migration contains no destructive statements.

## Environment naming and optional Supabase — 2026-09-09

Decision: use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser-safe configuration and reserve `SUPABASE_SECRET_KEY` for future server-only room writes. Keep Supabase optional until Phase 4 is implemented.

Reason: the current repository has no Supabase client, migrations or Route Handlers. Renaming the contract now prevents the legacy terminology from becoming an implementation dependency, while optional validation keeps the verified live DreamDEX read path operational.

## ADR-0017 — Recovery keeps external and scope blockers explicit

Decision: do not create a remote, deploy, add mock evidence or begin the missing social-room phase during submission-package recovery. Deployment, repository publication and wallet evidence require owner authorization and credentials; room persistence requires a separate product phase.

Evidence: on 2026-09-08 there was no Git remote, no Vercel project metadata, and `vercel whoami` failed with `fetch failed`. The repository contains no room Route Handlers, Supabase migration, leaderboard implementation or transaction hash. The DreamDEX documentation HEAD request also failed at the upstream/network boundary.

## ADR-0015 — Finalized claims are discovered independently

Decision: claim UI scans `listBinaryMarkets({ status: "Finalized" })`, intersects those IDs with `client.getClaimable(account)`, then calls `trader.redeemMany` with explicit outcome indices and verifies post-claim balances.

Reason: finalized markets are not guaranteed to remain in the live-market feed. The SDK's claimable helper supplies the correct resolved/voided outcome amounts, while the chain read remains authoritative for finalization and the post-claim state.

## ADR-0016 — Progressive enhancement for presentation polish

Decision: the room centerpiece uses a client countdown, chain-derived order-book probabilities, and optional browser-native speech synthesis. Speech is never required for navigation or trading and no microphone, AI service, or protocol call is introduced.

Reason: these additions improve evaluator comprehension on small screens while preserving the existing provider and wallet boundaries. Risk copy remains explicit: testnet, binary outcome, maximum stake loss and user custody.

## ADR-0019 — Invalidate wallet sessions on account changes

Decision: treat a change in the wagmi-connected address as a session boundary. Clear the
client/server wallet session and require a fresh wallet-authentication signature before the
next social mutation; server requests also clear a stale session when the wallet header differs.

Reason: the authenticated wallet is stored in the signed HTTP-only `dreamrooms_session` cookie,
while later browser mutations identify the active wallet through wagmi and the
`x-dreamrooms-wallet` header. These values can diverge after an extension account switch or a
persisted prior session. Both addresses are normalized before comparison, and no address is
silently trusted when they differ.
