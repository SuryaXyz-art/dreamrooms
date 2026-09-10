# Deployment evidence

Status: PARTIAL — public route and live-read smoke checks completed; wallet, room persistence and transaction evidence remain unverified.

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
- Cross-session room check, Supabase persistence and production wallet transaction were not run.
- No transaction hash is recorded because no wallet signature was requested or executed.

## Remaining release evidence

1. Verify the authorized Vercel project and production environment values in the Vercel dashboard without exposing secrets.
2. Restore Supabase DNS/reachability and run the two-session room flow.
3. Perform the manual Shannon wallet gate from `docs/TESTNET_RUNBOOK.md` and record only a mined, successful receipt plus position readback.
