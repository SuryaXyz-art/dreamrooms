# Mock feature test report

Run on 2026-09-11 with `DREAMROOMS_DATA_MODE=demo` in the test process. No wallet private key was read or
used, and no blockchain or database write was attempted.

## Automated results

- Vitest: 28 passed, 1 skipped across 10 files.
- TypeScript typecheck: PASS.
- ESLint: PASS.
- Prettier format check: PASS.
- Production build: PASS.
- Git diff check: PASS.

## Rendered feature review

| Feature               | Result       | Notes                                                                                                                 |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Landing/discovery     | PASS         | Navigation, live/demo source labeling, UP/DOWN treatment, market discovery and empty-room state render.               |
| Create-room shell     | PASS         | Room fields, market selection, language selection, wallet gate and safety messaging render.                           |
| Live-room shell       | PASS         | Route and room-state boundaries are covered by the application build and tests; no fabricated room is claimed.        |
| Portfolio             | PASS         | Wallet-gated open/finalized/claim states render without inventing positions.                                          |
| Status                | PASS         | Integration health cards and safe unavailable states render.                                                          |
| Wallet/trade safety   | PASS         | Unit coverage exercises network, freshness, expiry, tick/lot, balance and receipt gates; no signature was requested.  |
| Supabase room journey | NOT VERIFIED | Requires reachable remote Supabase and manual wallet authentication; no mock result is presented as real persistence. |
| Real order/claim      | NOT RUN      | Requires manual wallet confirmation and mined chain evidence.                                                         |
| Screenshot export     | PARTIAL      | Four surfaces were visually reviewed in-browser; the current capture API did not expose repository PNG files.         |

## Evidence policy

Demo fixtures are permitted only for deterministic tests and development review. They are never labeled
live and are not evidence of a real room, transaction, position, settlement or claim.
