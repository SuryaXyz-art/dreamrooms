# SDK and documentation feedback

This report includes only observations made during the local integration work.

## Observed

1. The current SDK package exposes the raw binary order-building and quote utilities needed for tick/lot-safe browser writes, but consumers must inspect the package types and source to understand the distinction between indexed discovery and `getMarketOnchain` truth.
2. Recycled binary pools make `(pool, nonce)` essential. The SDK comments and `MarketOnchain` type document this well; an explicit high-level helper that returns a stable market-slice key would reduce consumer mistakes.
3. The read-only integration depends on an external indexer. During the Phase 3 smoke run, the configured indexer timed out after the bounded retry policy; the app correctly surfaced the failure. A documented health endpoint or recommended fallback/diagnostic procedure would help hackathon teams distinguish transient indexer outage from adapter errors.

## Not claimed

No protocol bug, deployed-contract bug, incorrect address, transaction failure or undocumented API break is claimed by this report. These are integration ergonomics observations from the DreamRooms workspace only.
