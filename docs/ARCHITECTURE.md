# DreamRooms architecture

Status: locked in Phase 0 and implemented through the Phase 3 wallet/order/settlement lifecycle. Room persistence and social features remain intentionally deferred to their later phases.

## Decision

Use one clean Next.js App Router + strict TypeScript application. Use Tailwind CSS and a small local accessible component layer. Use `wagmi`/`viem` for browser wallet UX and the official `@somnia-chain/markets-sdk` for DreamDEX Event Contract reads and writes. Use Supabase only for rooms, presence and verified social records. Deploy as a Vercel-compatible application.

The official hackathon template is not extended directly: it is a minimal TypeScript/Solidity lifecycle sample, not a web application, and its TypeScript example pins SDK `^0.28.1`. The current official Event Contracts page says to use SDK `0.29.0` or newer. DreamRooms pins the inspected compatible `@somnia-chain/markets-sdk@0.29.0` release and ports only the verified read-only lifecycle concepts into the app.

## Runtime boundaries

### Browser

- Render the room, market, odds, order and claim states.
- wagmi owns injected-wallet connection, account display, disconnect and the explicit Shannon network switch. The official SDK is bound to the connected viem `WalletClient` only after the account and chain match.
- The browser builds unsigned approval/order calls with the official SDK, sends them through the wallet, waits for a Shannon receipt, decodes fills from the official order-book event ABI and re-reads ERC-6909 balances from chain.
- `/portfolio` performs a separate finalized-market scan and uses the official `getClaimable`/`redeemMany` path. No claimable position is fabricated when the live list is empty.
- Never hold a private key or Supabase service-role credential in browser code.

### Next.js server

- Route Handlers validate room mutations and write only room/presence/social records.
- If a wallet proof is needed for a mutation, verify a wallet-signed intent before using the service-role Supabase client.
- No server-side trading key is required for the MVP. Trades and claims are explicitly signed by the participant's wallet.
- The Phase 2 `LiveMarketProvider` owns the official SDK, Shannon chain and public indexer reads. It performs bounded retries/timeouts, resolves every listed `marketId` on chain and normalizes order books before pages render.
- Server reads use the public indexer endpoint. Any privileged indexer headers, if later required, stay server-only.

### Supabase

Suggested tables, all protected by RLS:

- `rooms`: public room slug, `market_id`, `market_address`, `pool_address`, `pool_nonce`, discovered `venue_id`/`operator_id`, host wallet, locale, timestamps and lifecycle status.
- `room_members`: room, wallet address, join timestamp and optional display metadata.
- `room_presence`: ephemeral presence keyed by room and wallet using Supabase Realtime.
- `verified_activity`: room, wallet, market ID, action kind, side/outcome, amount, tx hash, chain ID, receipt status and verification timestamp. Insert only after successful chain receipt and state verification.

Supabase records are social coordination and presentation data. The chain/SDK remains authoritative for order, fill, balance, market status and redemption state.

## Integration path (inspected APIs)

| Need                      | Planned path                                                                                                                                                                                                                                           | Truth boundary                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Shannon network           | `somniaShannon` from `@somnia-chain/markets-sdk/chains`; chain ID `50312`, native `STT`, official RPC/WS defaults                                                                                                                                      | RPC chain ID and SDK chain                                          |
| Protocol addresses        | `SOMNIA_TESTNET_ADDRESSES` from the SDK; no application contract-address constants                                                                                                                                                                     | On-chain code and SDK deployment map                                |
| Live BTC/ETH discovery    | Paginated `exchange.client.listLiveBinaryMarkets({ asset, limit, offset })` for `BTC` and `ETH`; inspect each row's structured `marketId`, `venueId`, `operatorId`, `expiry`, `strike`, `mode` and `intervalSec`                                       | Indexer for discovery; `getMarketOnchain(marketId)` for chain truth |
| Venue scope               | Use the live row's `venueId` and `operatorId`; do not ship a copied venue constant because the bot kit says venue IDs move                                                                                                                             | Row attribution + on-chain status                                   |
| Order book                | `client.getBinaryOrderBook(onchain.pool, { depth, decimals })`; normalize YES/NO raw levels to UP/DOWN probabilities and human quantities                                                                                                              | Chain-backed snapshot; no fake fallback                             |
| Wallet connection         | wagmi account/connect/switch hooks and viem `walletClient`; call SDK `setSigner` only after account and chain match                                                                                                                                    | Wallet provider state                                               |
| Place MVP trade           | `client.getBinaryBookParams` + `quoteBinaryStakeOverBook` produce raw tick/lot-safe values; `trader.buildPlaceOrder` returns unsigned approval/order calls; browser viem `WalletClient.sendTransaction` sends an IOC order bounded by `onchain.expiry` | Wallet hash, mined receipt and decoded fills                        |
| Mint inventory if selling | Deferred: Phase 3 supports the smallest complete BUY UP/BUY DOWN lifecycle. The inspected SDK `mintSet` path remains available for a later sell flow only after explicit preparation UI.                                                               | Not used by the current buy path                                    |
| Confirm write             | The raw browser path waits with the Shannon public client and treats `receipt.status === "reverted"` as failure; SDK error/rejection messages map to explicit lifecycle states.                                                                        | Receipt status must be successful                                   |
| Read position             | Display-grade: `client.getPortfolio(account)` or `getOutcomeBalances`; verification-grade: `getMarketOnchain` then `getOutcomeBalance({ outcomeToken, account, id: yesId/noId })`                                                                      | Chain read after receipt; indexer may lag                           |
| Find claimable markets    | Separate `client.listBinaryMarkets({ status: "Finalized" })` discovery intersected with official `client.getClaimable(account)` output; settled markets are absent from the live registry                                                              | Finalized market + on-chain outcome balance                         |
| Claim                     | `trader.redeemMany({ entries, autoApprove: true })` with explicit outcome indices from `getClaimable`; post-claim ERC-6909 balance is checked again                                                                                                    | Successful redemption receipt and post-claim balance                |

## Market and order invariants

- Only on-chain market status `Trading` (`1`) accepts orders. An indexer row with a future expiry is not sufficient.
- Prices are probabilities in `(0, 1)` in the unified surface. The Phase 3 raw path uses viem decimal-to-bigint parsing and the official raw quote kernel; `tickSize`, `lotSize` and `minQuantity` come from the on-chain pool. No floating-point price is passed to a contract call.
- `marketId` is the stable binary-market identity. A pool is a recycled, time-varying binding.
- The shared ERC-6909 outcome-token singleton uses per-market YES/NO IDs; do not model YES and NO as separate ERC-20 contracts.
- Winning redemptions on dreamDEX have zero settlement fee according to the current docs; voided markets pay both sides per the frozen void policy. The UI must show the actual on-chain state, not assume a winner.
- Auto-resolution is protocol-driven. The MVP does not operate a resolver or keeper.

## Application shape

The application keeps protocol code isolated from UI:

```text
src/app/                       App Router pages and Route Handlers
src/components/                accessible room, market, order and status UI
src/lib/dreamdex/              Shannon config, SDK adapter, discovery, books, reliability and gates
src/lib/wallet/                reserved for Phase 3 wagmi config and chain guard
src/lib/rooms/                 reserved for later Supabase client, validation and verified writes
src/lib/i18n/                  English/Hindi message catalogs
src/types/                     strict domain types and API schemas
```

Optional analytics, bots, notifications, native room contracts and background claim workers are explicitly post-MVP.

Phase 1 implements the route shell, local accessible UI primitives, English/Hindi message catalogs, strict domain models/adapters and provider interfaces. Phase 2 adds the live provider and uses live Shannon reads by default; `DREAMROOMS_DATA_MODE=demo` is an explicit local-only fixture switch. Phase 3 adds the Shannon-only browser wallet boundary, exact raw BUY UP/DOWN IOC preparation, explicit approval/order receipt verification, authoritative position readback and finalized claim path. Live discovery failures return `UNAVAILABLE` or per-row `STALE` data and never fall back to a demo market. Room persistence, social records and deployment remain later-phase work.
