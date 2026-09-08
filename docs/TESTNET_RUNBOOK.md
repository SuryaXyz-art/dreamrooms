# Somnia Shannon testnet runbook

This runbook covers the verified Shannon read path and the Phase 3 wallet-signed order/settlement path. The application never accepts a private key: the browser wallet signs each approval, order or claim.

## Required prerequisites

1. A spare EVM wallet in a browser wallet extension. Do not use a production wallet. Never paste its seed phrase or private key into chat, source code, Supabase, Vercel or a screen recording.
2. Somnia Shannon testnet configured at chain ID `50312`, native gas token `STT`. Let the app/SDK provide the official chain definition and addresses.
3. Testnet gas and collateral: STT for gas and faucet tUSDC/TestUSDC for Event Contract collateral. The official template points to the SomniaHacks developer-group faucet topic: [testnet token instructions](https://t.me/+XHq0F0JXMyhmMzM0). Verify the token and amount in the wallet before trading.
4. Supabase project URL and anon key for the public client, plus a service-role key only if Route Handler writes require it. Keep the service-role key in local `.env.local`/deployment secret storage and out of `NEXT_PUBLIC_*` variables.
5. Vercel (or equivalent) project access for the final public URL, environment-variable configuration and deployment logs.
6. DoraHacks account/repository submission access. The detail page was WAF-protected during Phase 0, so manually confirm its current deadline, required links, judging criteria, license and demo expectations before release.

## Local secret handling

After the Phase 2 scaffold exists:

- copy `.env.example` to `.env.local`;
- leave the public Shannon/indexer values blank to use the verified SDK defaults, or set only Shannon endpoint overrides;
- optionally set `DREAMROOMS_DATA_MODE=demo` for an explicitly labelled local fixture run;
- fill only the public endpoint/project values and server-only Supabase credential locally;
- confirm `.env.local` is ignored by Git before entering any secret;
- do not add a private key variable to the web app; participant wallets sign through the browser;
- use a separate low-value test wallet if any future diagnostic script genuinely needs a private key, store it only in an ignored local file and never print it.

## Phase 3 live order procedure

1. Start the app with `npm run dev` and open `/rooms/new`.
2. Connect an injected browser wallet from the trade panel. Use the explicit network switch to select Somnia Shannon, chain ID `50312`; signing stays disabled on every other chain.
3. Confirm the selected market is labelled `LIVE`, its on-chain status is `TRADING`, and its book is fresh. Never continue with a stale/unavailable row.
4. Confirm the displayed wallet STT gas balance, collateral balance and pool allowance. If the allowance is short, the SDK returns a separate ERC-20 approval call; the app shows that prompt before the order prompt.
5. Enter a small max-spend amount. Review market ID, UP/DOWN side, lot-snapped quantity, expected execution price, protective limit, maximum loss, available liquidity, slippage cushion and market-bounded expiry.
6. At this point, pause for the manual signature gate. Approve only the wallet request whose destination, amount and Shannon network match the review. Never approve an unexpected request.
7. Record evidence below for each approval/order transaction. The UI advances `review → awaiting_signature → submitted → confirmed` only after the wallet returns a hash and Shannon returns a successful mined receipt. Wallet rejection is `cancelled`; a reverted receipt is `reverted`; a market rollover is `expired`.
8. The app decodes fills from the order receipt, then independently reads the selected ERC-6909 outcome-token balance. A `confirmed` receipt without a balance increase is shown as confirmed-but-unfilled, never as a verified position.

### Phase 3 order evidence

- Run date/time (UTC):
- App URL / commit or working-tree identifier:
- Wallet address (public address only):
- Chain ID observed:
- Market ID (bytes32):
- Pool + nonce observed for this market slice:
- Outcome and order side:
- Collateral symbol/decimals:
- Requested max spend:
- Lot-snapped quantity:
- Tick-aligned YES-term order price:
- Approval transaction hash, or `not required`:
- Order transaction hash:
- Mined receipt status (`success`/`reverted`):
- Fill quantity and execution price from receipt:
- Pre-trade selected outcome balance:
- Post-trade selected outcome balance:
- Position verification (`verified`/`not verified`):
- Explorer links:

## Phase 3 settlement and claim procedure

1. After a market closes, do not expect it in the live-market list. `/portfolio` separately scans `listBinaryMarkets({ status: "Finalized" })` and intersects that with the SDK's claimable positions.
2. Confirm the row's finalized status and live ERC-6909 balance. Resolved markets claim only the winning outcome; voided markets expose both redeemable sides according to the SDK result.
3. Click `Claim all finalized positions`, review any operator-approval and redemption wallet prompts, and record the transaction hash. The UI requires a successful receipt and a post-claim balance decrease before showing `Claim verified`.

### Phase 3 claim evidence

- Run date/time (UTC):
- Wallet address (public address only):
- Finalized market ID(s):
- Outcome index/side(s):
- Amount(s) claimed:
- Estimated payout(s):
- Claim transaction hash:
- Mined receipt status:
- Pre-claim balance(s):
- Post-claim balance(s):
- Claim verification (`verified`/`not verified`):
- Explorer links:

## Evaluator happy path

1. Open the public URL on a phone-sized viewport.
2. Confirm the app discovers a live BTC or ETH binary market and displays its `marketId`, expiry/cadence, structured strike mode, current Up/Down book probabilities and venue scope.
3. Open the status screen and confirm Shannon chain ID `50312`, SDK/indexer, dynamic venue discovery and at least one chain-verified live market are ready.
4. Connect the spare wallet and switch to Somnia Shannon from the wallet or trade panel.
5. Enter a small IOC order only after reviewing the exact approval/order prompts described above.
6. Wait for the mined receipt and inspect the decoded fill/partial-fill state plus explorer link.
7. Re-read the authoritative on-chain YES/NO outcome-token balances and show a verified position only when the selected balance increased by the filled amount.
8. After finalization, use the separate finalized-market claim list. Do not report a claim as complete until the claim receipt and post-claim balance are verified.

## Failure handling

- Wrong chain: block signing and offer the wallet network-switch action.
- Market status not `Trading`: disable order submission and refresh discovery.
- Empty book: explain that an IOC cannot fill without opposite liquidity; do not fabricate a fill.
- Revert/RPC timeout: show a user-safe failure and do not write a “verified” social record.
- Indexer delay: keep receipt and chain state visible; retry display reads with a bounded deadline.
- Expired market: move the user to the next discovered window; never reuse a stale pool without re-resolving its `marketId`/nonce binding.
