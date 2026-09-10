# Deployment evidence

Status: PARTIAL — public route checks completed; room/auth APIs, wallet, room persistence and transaction evidence remain unverified.

Date: 2026-09-11

## Target audit

- Application: Next.js App Router, compatible with Vercel's standard Next.js runtime.
- Deployment metadata: no `.vercel/project.json`, `vercel.json`, `.openai/hosting.json` or equivalent target configuration exists.
- Public URL: https://dreamrooms.vercel.app/
- Authentication: deployment ownership/session was not inspected; this document records only public verification.
- Production environment: `.env.example` contains names only; no production values were inspected or printed.

## Local evidence

- `npm run build` — PASS.
- Routes generated: `/`, `/rooms/new`, `/rooms/[roomId]`, `/portfolio`, `/status`, `/icon.svg`.
- Public route and clean-browser checks are recorded in `docs/PUBLIC_SMOKE_TEST.md`.
- Production route checks on 2026-09-11 returned HTTP 200 for `/`, `/rooms/new`, `/portfolio` and
  `/status`.
- Production `/api/rooms` returned HTTP 503 and production `/api/auth/nonce` returned HTTP 503.
- Cross-session room check, Supabase persistence, wallet authentication and production wallet
  transaction were not completed because those APIs were unavailable.
- No transaction hash is recorded because no wallet signature was requested or executed.

## Remaining release evidence

1. Verify the authorized Vercel project and production environment values in the Vercel dashboard without exposing secrets.
2. Restore Supabase DNS/reachability and rerun `/api/auth/nonce` and `/api/rooms`.
3. Run the two-session room flow and record its result.
4. Perform the manual Shannon wallet gate from `docs/TESTNET_RUNBOOK.md` and record only a mined, successful receipt plus position readback.
5. Capture the demo video and screenshots only after those production checks succeed.
