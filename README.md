# DreamRooms

DreamRooms turns live DreamDEX BTC/ETH Event Contracts into shareable prediction rooms where people can compare conviction with market odds and verify wallet activity on Somnia Shannon.

## Status

This is a local release candidate, not a completed public hackathon submission. The workspace contains the polished Next.js shell, live read-only DreamDEX integration, Shannon wallet-signed BUY UP/BUY DOWN flow, and Supabase-backed room/social implementation. Public deployment, remote Supabase verification and a recorded real wallet transaction remain external evidence gates.

## Why it matters

Prediction markets are powerful but solitary and difficult to explain in the moment. DreamRooms adds a focused social layer around a specific event window: a host shares context, participants show a side, and protocol facts remain grounded in DreamDEX and the Shannon chain.

DreamRooms is different because it treats the room as an explanation and verification surface, not as a replacement market. Market identity, strike, timing, status, odds, order-book depth and actionable state come from structured Event Contract data; mock fixtures are explicitly labelled `DEMO`.

## Architecture

```mermaid
flowchart LR
  Browser[Next.js App Router + React]
  Wallet[Injected wallet / wagmi]
  Adapter[Typed DreamDEX adapter]
  SDK[@somnia-chain/markets-sdk 0.29.0]
  Shannon[Somnia Shannon 50312]
  Indexer[DreamDEX indexer]
  Browser --> Adapter
  Browser --> Wallet
  Adapter --> SDK
  SDK --> Indexer
  SDK --> Shannon
  Wallet --> Shannon
```

## Exact integration path

- Chain: `somniaShannon`, chain ID `50312`, native gas token `STT`.
- Discovery: `listLiveBinaryMarkets` for BTC and ETH, dynamically paginated.
- Truth boundary: each discovered `marketId` is re-read with `getMarketOnchain`; pools are retained with their market nonce because pools recycle.
- Books: `getBinaryOrderBook` is normalized to UP/DOWN probability levels and human quantities.
- Writes: the official SDK builds raw calls; the browser wallet signs them through viem. Prices, quantities and expiry are bigint values bounded by on-chain tick/lot/grid data and market expiry.
- Verification: receipt status must be successful, fills are decoded from official order-book events, and the selected ERC-6909 position balance is read again.

Primary references: [DreamDEX Event Contracts docs](https://docs.dreamdex.io/developers/event-contracts), [official bot kit](https://github.com/somnia-chain/dreamdex-bot-kit), [hackathon template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template).

## Screenshots and demo media

The current repository intentionally does not embed fabricated media. A real local browser capture was
reviewed during release-candidate work, but the available browser capture surface did not export a stable
PNG into this repository. Add only captures made from the executable app and caption local versus public
data clearly.

## Run locally

Requirements: Node.js 22+, npm and an injected EVM wallet only when testing wallet UI.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The default data mode uses live Shannon reads. To inspect the clearly labelled local fixture:

```powershell
$env:DREAMROOMS_DATA_MODE = "demo"
npm run dev
```

Never place a private key in `.env.local`. Copy `.env.example` only if endpoint overrides are needed. Browser wallets sign actions; `SUPABASE_SECRET_KEY` is server-only and is required only for the room API.

## Testing

```powershell
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
```

The external read-only smoke test is opt-in:

```powershell
$env:RUN_DREAMDEX_SMOKE = "1"
npm test -- src/lib/dreamdex/integration.smoke.test.ts --reporter=verbose
```

## Evidence and limitations

See [deployment preparation](docs/DEPLOYMENT.md), [deployment evidence](docs/DEPLOYMENT_EVIDENCE.md), [known limitations](docs/KNOWN_LIMITATIONS.md), [release checklist](docs/RELEASE_CHECKLIST.md), [winning audit](docs/WINNING_AUDIT.md) and [testnet runbook](docs/TESTNET_RUNBOOK.md). No public application URL or transaction hash is claimed in this repository yet.

## Roadmap

1. Restore Supabase reachability and complete the two-session room-sharing evidence run.
2. Complete one low-value Shannon testnet trade and claim with user-reviewed wallet signatures.
3. Deploy to an authorized Vercel project and record clean-browser evidence.
4. Supply real screenshots/video and complete the DoraHacks form manually.

## License

License selection remains a release decision; no license is claimed until the project owner selects one.
