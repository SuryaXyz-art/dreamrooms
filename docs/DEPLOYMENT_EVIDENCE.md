# Deployment evidence

Status: BLOCKED — no deployment was attempted.

Date: 2026-09-07

## Target audit

- Application: Next.js App Router, compatible with Vercel's standard Next.js runtime.
- Deployment metadata: no `.vercel/project.json`, `vercel.json`, `.openai/hosting.json` or equivalent target configuration exists.
- Public URL: none configured.
- Authentication: no Vercel CLI/session or deployment credentials available in the workspace.
- Production environment: `.env.example` contains names only; no production values were inspected or printed.

## Local evidence

- `npm run build` — PASS.
- Routes generated: `/`, `/rooms/new`, `/rooms/[roomId]`, `/portfolio`, `/status`, `/icon.svg`.
- No public smoke checks, clean-browser checks, production RPC check, cross-session room check or production wallet transaction were possible without a deployed URL.
- No transaction hash is recorded because no wallet signature was requested or executed.

## Required deployment handoff

1. The user creates or selects the authorized Vercel project and authenticates the Vercel CLI, or provides an already authenticated deployment session.
2. The user enters production variables from `.env.example` into the deployment secret store. Keep service credentials server-only; do not paste them into chat or source.
3. Deploy from the intended public repository/worktree and provide the resulting HTTPS URL.
4. Retest every route from a clean browser session, then perform the manual Shannon wallet gate from `docs/TESTNET_RUNBOOK.md`.
5. Record the deployment URL, UTC timestamp, route results, live-read result and verified transaction evidence here.
