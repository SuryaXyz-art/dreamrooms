# DreamRooms release checklist

Status: local release candidate audit updated 2026-09-09. This workspace is not ready to claim the full hackathon MVP because remote Supabase verification, real wallet evidence, public deployment and presentation evidence remain incomplete.

## Automated gates

- [x] `npm ci` completes from the committed lockfile.
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run format:check`
- [x] `npm run build`
- [x] Production dependency audit has no high-severity production finding.
- [ ] Playwright critical journey: not configured in this repository.
- [ ] Live read-only smoke: opt-in only and dependent on DreamDEX upstream availability.

## Security gates

- [x] No private key is present in source or `.env.example`.
- [x] No server credential is imported by client components.
- [x] Browser writes require an injected wallet and Shannon chain `50312`.
- [x] Market status, freshness, raw tick/lot values and bounded expiry gate orders.
- [x] Reverted receipts are rejected; no automatic signature or transaction exists.
- [x] In-flight trade submission is locked in the client.
- [x] Room API/RLS code and additive migration reviewed locally; remote application and realtime remain unverified because the configured Supabase host did not resolve.

## Manual release gates

- [ ] Inspect `.env.local` and deployment variables; keep credentials server-only.
- [ ] Run the wallet-signed testnet procedure in `docs/TESTNET_RUNBOOK.md` with a low-value wallet.
- [ ] Record a successful Shannon receipt and independently verified position.
- [ ] Test all routes from a production server at mobile and desktop widths.
- [ ] Confirm the DoraHacks page's current deadline, judging rules and required submission links.
