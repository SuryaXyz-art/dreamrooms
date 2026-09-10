# Public smoke test

Verified 2026-09-11 from a clean browser tab against [https://dreamrooms.vercel.app/](https://dreamrooms.vercel.app/).

## Route results

| Surface                                | Result | Evidence                                                                                                                       |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Landing `/`                            | PASS   | Loads live BTC/ETH discovery, structured strike/window data, LIVE/FRESH state, honest empty-room state and wallet entry point. |
| Create room `/rooms/new`               | PASS   | Loads live market selection, order-book preview, room fields and disabled wallet/preflight state until connection.             |
| Portfolio `/portfolio`                 | PASS   | Loads wallet-gated open/finalized position states without inventing positions.                                                 |
| Status `/status`                       | PASS   | Public page reported Shannon chain ID 50312, SDK/indexer read, dynamic venue discovery and live-market verification.           |
| Invalid room `/rooms/not-a-valid-slug` | PASS   | Renders a safe 404 room state.                                                                                                 |
| API `/api/rooms`                       | 503    | Safe unavailable response; Supabase transport remains unresolved.                                                              |
| API invalid room                       | 404    | Safe not-found response.                                                                                                       |
| API invalid portfolio address          | 400    | Input validation rejects malformed wallet input.                                                                               |

## Manual or blocked evidence

- Wallet connect and wallet-signed approval/order: NOT RUN; no signature was requested.
- Successful receipt, fill decode, position readback and claim: NOT RUN; no transaction hash is claimed.
- Supabase room creation, clean-second-browser join, presence, sentiment, reactions and realtime: NOT VERIFIED. As of 2026-09-10, `/api/rooms` returned HTTP 200 with `{"rooms":[]}` and `/api/auth/nonce` returned HTTP 200 with a valid nonce response, but the end-to-end room journey was not completed.
- Repository screenshots: NOT EMBEDDED. Browser visuals were reviewed, but this capture surface did not provide stable PNG files for a truthful README asset. Add only real exports from the deployed session.
- `DREAMROOMS_DATA_MODE` was not set to demo for this public check; the visible market data was live-read output.
