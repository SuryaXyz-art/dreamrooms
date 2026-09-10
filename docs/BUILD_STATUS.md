# Build status

## Phase 0 — audit, verify sources and lock the plan

Status: PARTIAL  
Date: 2026-09-07  
Scope: audit and architecture only; no application code, dependency installation in the workspace, transaction, contract deployment or product feature was started.

### Repository finding

The workspace was empty: no Git metadata, `AGENTS.md`, README, package manifest, lockfile, environment example, source tree or existing changes were present. DreamRooms will therefore start from a clean Next.js TypeScript application in Phase 1.

### Source audit

- DreamDEX Event Contracts Markdown was fetched successfully. It specifies SDK `0.29.0` or newer, browser-compatible unified methods, live market discovery, on-chain status gating, IOC order examples, wallet-client configuration and finalized-market redemption guidance.
- SDK `0.29.0` was fetched from npm and its published declaration/source files were inspected. Confirmed surfaces include `SomniaMarkets`, `setSigner`, `listLiveBinaryMarkets`, `getMarketOnchain`, `fetchOrderBook`, `createOrder`, `getOutcomeBalance`, `listBinaryMarkets({ status: "Finalized" })`, `getPortfolio`, and raw trader `redeem`/`mintSet` types.
- The official template was cloned and inspected. It demonstrates the mint → order → receipt → balance → redeem lifecycle, but its dependency floor is `^0.28.1` and it is not a UI app.
- The official bot kit was cloned and inspected. Its event-contract docs reinforce on-chain status gating, venue scoping, recycled pools, expiry/IOC handling, outcome-token balances and finalized-market claims. Its published operational defaults are treated as guidance, not hardcoded app data.
- DoraHacks returned an AWS WAF human-verification page to direct HTTP access and the web fetch returned `405 Method Not Allowed`; no hackathon rules, dates, judging criteria or submission requirements were inferred. Manual review is required before release.

### Exit criteria

- [x] Workspace classification recorded.
- [x] Existing instructions/manifests/source changes checked; none existed.
- [x] Official template, bot kit, SDK package types and current protocol Markdown inspected.
- [x] Somnia chain, market, order, receipt, position and claim integration path documented.
- [x] Clean Next.js architecture chosen with reasons.
- [x] Permanent constraints and secret boundaries documented.
- [x] Manual prerequisites and time-critical MVP path documented.
- [x] No product phase started.
- [ ] Current DoraHacks requirements manually confirmed after WAF verification.

### Partial blocker

DoraHacks' authoritative detail page returned AWS WAF human verification to HTTP access, and the web fetch returned `405 Method Not Allowed`. The architecture does not guess those rules. Before release, manually review the page and update the submission checklist with its current dates, judging criteria, required links and any license/demo requirements.

### Time-critical MVP path for later phases

1. Scaffold the single Next.js app and strict quality gate.
2. Add Somnia Shannon wallet connect/network guard and public DreamDEX SDK client.
3. Discover live BTC/ETH markets, show odds/order book and create/join a room.
4. Add one wallet-signed IOC trade path with receipt and on-chain outcome-balance verification.
5. Add finalized-market status and explicit claim guidance/action.
6. Add Supabase presence/verified activity, English/Hindi copy and responsive/accessibility QA.
7. Deploy, run the manual testnet walkthrough, then complete the public repository and DoraHacks submission requirements after they are manually confirmed.

Optional polish (advanced analytics, bots, notifications, resolver automation and native room contracts) must not delay steps 1–5.

## Phase 1 — application foundation

Status: DONE  
Date: 2026-09-07  
Scope: single Next.js App Router shell, typed domain/provider boundaries, accessible design system, localization infrastructure and explicit data-source states. No real protocol writes, room persistence or deployment were started.

### Delivered

- Current compatible Next.js 16.3.4, React 19.2.8, TypeScript 6.0.3, ESLint 9.39.5, Tailwind CSS 4.3.3, Vitest 5.0.0 and Prettier 3.9.6 toolchain, pinned in `package.json` and `package-lock.json`.
- Required routes: `/`, `/rooms/new`, `/rooms/[roomId]`, `/portfolio` and `/status`.
- Strict domain models and normalization adapters for Market, OrderBook, TradePreview, VerifiedTrade, Position, Settlement, Room, Participant and LeaderboardEntry.
- Provider interfaces isolate market, room and portfolio data sources from route/UI code.
- Accessible dark prediction-room visual system with semantic outcome/status tokens, responsive layout, focus-visible states and reduced-motion handling.
- English/Hindi navigation and core-action messages with a locale toggle; no AI translation.
- Loading, error, empty and unavailable/network-mismatch presentation states.
- `DEMO` development fixtures and `UNAVAILABLE` production provider states are visibly labelled; no fixture is presented as live.

### Exit criteria

- [x] Application builds locally.
- [x] All required route entries compile and render through the App Router.
- [x] Responsive mobile/desktop shell and accessible UI primitives exist.
- [x] Domain/provider boundaries are strict and typed.
- [x] Mock data is visibly `DEMO` and production has no fake live fallback.
- [x] No real order placement, room persistence or deployment was implemented.

### Quality gate

- `npm install` — PASS (audited 455 packages; npm reported one high-severity advisory, not auto-fixed because force-upgrading dependencies is outside this phase).
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (2 files, 6 tests)
- `npm run format:check` — PASS
- `npm run build` — PASS (Next.js production build; required routes listed in build output)
- `npm audit --omit=dev --audit-level=high` — PASS (no production dependency vulnerabilities)
- `npm run start` + HTTP smoke request for `/`, `/rooms/new`, `/rooms/demo-room`, `/portfolio`, `/status` — PASS (all returned HTTP 200)

The next phase may begin only with an explicit request to implement the read-only DreamDEX integration.

## Phase 2 — live read-only DreamDEX integration

Status: DONE  
Date: 2026-09-07  
Scope: Somnia Shannon configuration, official SDK/indexer discovery, chain status verification, binary order-book normalization, bounded read reliability, live market UI and integration health. No order, claim, wallet signature, room mutation or deployment was performed.

### Verified source and runtime configuration

- `@somnia-chain/markets-sdk@0.29.0` and `viem@2.56.3` are pinned in `package.json` and `package-lock.json`.
- `somniaShannon` and `SOMNIA_TESTNET_ADDRESSES` are imported from the official SDK package; no application contract or venue address is hardcoded.
- The verified public testnet indexer default is `https://dev.smk.somnia.host/v1/graphql`; the verified Shannon WebSocket/RPC defaults come from the SDK chain definition. Endpoint overrides reject obvious mainnet values and the RPC health check requires chain ID `50312`.
- Live discovery is paginated for both BTC and ETH, with optional runtime venue/operator filters. Each row is keyed by `marketId`, re-read through `getMarketOnchain(marketId)`, and its order book is read from the resolved on-chain pool.
- `DREAMROOMS_DATA_MODE=demo` is the only fixture opt-in. Unset/default runs use live Shannon reads; failures are visibly `STALE` or `UNAVAILABLE`.

### Delivered

- Typed DreamDEX adapter for structured asset, strike, resolution mode, interval, open/expiry, venue/operator, token IDs and chain-derived lifecycle status.
- Raw binary YES/NO book levels normalized to UP/DOWN probability prices and human quantities, with best bid/ask and bid/ask depth.
- Bounded three-attempt reads with eight-second timeouts and backoff; user-safe unavailable messages do not expose internal errors.
- `/` and `/rooms/new` now display dynamically discovered live BTC/ETH markets; `/rooms/new` includes selected market ID, venue scope, open/expiry window, structured strike mode, status gate and order-book depth.
- `/status` now checks Shannon RPC/chain ID, SDK/indexer, dynamic venue discovery and chain-verified live BTC/ETH markets.
- Unit tests cover normalization, exact window boundaries, stale freshness, status gating and retry/timeout behavior. The external smoke test is skipped unless `RUN_DREAMDEX_SMOKE=1` because normal quality checks must not depend on an external service.
- Timestamped observed market IDs/statuses: [phase-2-2026-09-07T15-58-42Z.md](test-logs/phase-2-2026-09-07T15-58-42Z.md).

### Exit criteria

- [x] At least one real BTC/ETH market fetched from the configured Shannon testnet and chain-verified.
- [x] Strike and interval are sourced from structured SDK fields; no question-text parsing.
- [x] Actions are gated on normalized chain status and fresh live data. Write buttons remain disabled because writes are outside Phase 2.
- [x] Dynamic venue discovery, stale/unavailable handling and user-safe status reporting are implemented.
- [x] Build, lint, typecheck, focused tests and read-only integration smoke pass.

### Quality gate

- `npm install` / `npm install --package-lock-only` — PASS (lockfile aligned; npm reported one development-tooling advisory; production-only audit remained clean).
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (6 files, 12 passed, 1 intentionally skipped external smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- `npm audit --omit=dev --audit-level=high` — PASS (no production dependency vulnerabilities)
- `RUN_DREAMDEX_SMOKE=1 npm test -- src/lib/dreamdex/integration.smoke.test.ts --reporter=verbose` — PASS (1 read-only test; 6 real live markets observed and chain-verified)
- `npm run start` + HTTP smoke request for `/`, `/rooms/new`, `/rooms/demo-room`, `/portfolio`, `/status` — PASS (all returned HTTP 200)

The next phase may begin only with an explicit request to implement the wallet-signed write lifecycle.

## Phase 3 — wallet-signed testnet trading lifecycle

Status: PARTIAL
Date: 2026-09-07
Scope: Shannon-only injected-wallet connection, exact raw BUY UP/BUY DOWN IOC preparation, live collateral/allowance reads, explicit approval/order transaction boundaries, receipt/fill decoding, ERC-6909 position verification and finalized-market claim flow. Rooms, persistence, leaderboards and social records were not started.

### Delivered

- Added wagmi `3.7.7` and TanStack Query `5.102.8`, pinned in the manifest and lockfile, with a single `somniaShannon` chain transport and injected connector.
- Added account display, disconnect and explicit wrong-network switch UI. Signing and chain-backed reads are unavailable until the wallet is on Shannon chain `50312`.
- Added a typed trade kernel around the inspected SDK `0.29.0` APIs. It reads the authoritative market, raw binary book, `tickSize`/`lotSize`/`minQuantity`, ERC-20 collateral metadata/balance/allowance and both ERC-6909 position balances.
- Added official `quoteBinaryStakeOverBook` / `quoteBinaryOrderOverBook` sizing and quote logic. Contract calls receive raw bigint YES-term price, lot-aligned quantity, explicit market-bounded expiry and IOC order type; no floating-point price is sent to a contract.
- Added separate approval and order unsigned-call preparation. Wallet hashes are recorded before Shannon receipt confirmation; receipt status, official order-book events and post-receipt ERC-6909 balance increase are checked independently.
- Added explicit lifecycle state types for `review`, `awaiting_signature`, `submitted`, `confirmed`, `reverted`, `expired` and `cancelled`, plus user-safe rejection, wrong-network, insufficient-balance, invalid-grid, stale/rollover and already-claimed handling.
- Added a separate finalized-market scan using `listBinaryMarkets({ status: "Finalized" })` intersected with `getClaimable`, and an official `redeemMany` claim path with post-claim balance verification.
- Added the reproducible manual order/claim procedure and evidence fields to `docs/TESTNET_RUNBOOK.md`.

### Exit gate status

- [x] Shannon-only wallet connection, account display, disconnect and network switch are implemented.
- [x] Real balance, allowance, lot/tick grid, live-book and on-chain status reads gate the write path.
- [x] Raw order preparation, receipt verification, fill decoding and authoritative position readback are implemented.
- [x] Finalized-market discovery and tested claim logic are implemented; no finalized position was available to claim during this source-only run.
- [ ] One actual wallet-signed Shannon order with a successful receipt and verified position was executed. The required manual wallet gate was intentionally not crossed in this run.

### Quality gate

- `npm install --package-lock-only --ignore-scripts` — PASS (lockfile aligned; npm reports one high-severity development-tooling advisory).
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (7 files, 15 passed, 1 intentionally skipped external smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- `npm audit --omit=dev --audit-level=high` — PASS (no production dependency vulnerabilities)
- `RUN_DREAMDEX_SMOKE=1 npm test -- src/lib/dreamdex/integration.smoke.test.ts --reporter=verbose` — FAIL (the DreamDEX indexer timed out; exact evidence in `docs/test-logs/phase-3-2026-09-07T16-44-30Z.md`)
- `npm run start` + HTTP smoke request for `/`, `/rooms/new`, `/rooms/demo-room`, `/portfolio`, `/status` — PASS (all returned HTTP 200; the dynamic reads completed within the bounded route requests)

### Manual gate / evidence status

No approval, order or claim signature was requested or executed by this agent. No transaction hash, receipt, fill or verified position is claimed. To complete the exit gate, follow the Phase 3 live order procedure in `docs/TESTNET_RUNBOOK.md` with a funded low-value browser wallet, stop at the wallet confirmation prompt, then resume with the receipt and position evidence. The repeat external read smoke is also currently blocked by an upstream indexer timeout; the earlier Phase 2 smoke had already observed six live markets successfully.

## Phase 5 — UX, accessibility and demo polish

Status: PARTIAL
Date: 2026-09-07

### Delivered

- Added a mobile-first room market centerpiece with a one-second countdown, explicit source/status badges, structured market identity, book-derived UP/DOWN probability comparison and risk language.
- Added optional browser-native English/Hindi speech synthesis for the market summary; it is progressive enhancement and does not request microphone access.
- Added touch-action safeguards, mobile overflow protection, selection styling, preserved reduced-motion rules, richer metadata and a favicon.
- Updated the locale context to synchronize the document language and translated all newly added centerpiece copy in English and Hindi.
- Removed the private-key-shaped value from `.env.example`; no wallet secret is required by the browser flow.

### Quality gate

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (6 files, 15 passed, 1 intentionally skipped external smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS

### Limitations

- Existing Phase 1–4 static copy outside the new centerpiece is not yet fully routed through the locale catalog.
- No automated screen-reader, axe, or browser viewport run was available in this workspace; responsive review was code-level only.
- Phase 3 still has no actual wallet-signed receipt evidence, and Phase 4 room persistence/social verification remains unimplemented in this working tree; no fake live activity was added.

## Phase 6 — release-candidate hardening

Status: PARTIAL
Date: 2026-09-07

### Audit evidence

- Client/server review found no room Route Handlers, database client usage, service-role imports, private-key code, console logging or automatic signing in the workspace. `.env.example` contains names and guidance only.
- The client wallet path is Shannon-only (`50312`), explicit about testnet, gated on fresh `LIVE` data and on-chain `TRADING`, uses bigint SDK tick/lot conversion, bounds order expiry and treats reverted receipts as failures.
- Added an in-flight submission lock in `TradePanel`; signing remains user-triggered.
- Removed unused `@supabase/supabase-js` and `server-only` packages because no social API exists in this working tree.
- Added [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

### Pipeline evidence

- `npm ci` — PASS (475 packages installed from lockfile; npm reports one high-severity development-tooling advisory).
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (6 files, 15 passed, 1 intentionally skipped external smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- `npm audit --omit=dev --audit-level=high` — PASS (0 production vulnerabilities)
- `npm run start` + HTTP smoke for `/`, `/rooms/new`, `/rooms/demo-room`, `/portfolio` — PASS (HTTP 200)
- `npm run start` + `/status` manual smoke — FAIL/TIMEOUT (live health route exceeded the 20-second request window while checking upstream DreamDEX services; no success claim made)

### Exit-gate status

- [ ] No critical/high issue remains: not sign-off eligible because the social API/database, Playwright journey and real transaction evidence are absent.
- [x] Automated local pipeline passes.
- [ ] Live read path currently re-verified: prior documented read succeeded, but the current `/status` smoke timed out upstream.
- [ ] Previously verified real transaction evidence: none exists; Phase 3 explicitly records no signature, receipt, fill or verified position.
- [x] Unverified claims are explicitly labeled in `docs/KNOWN_LIMITATIONS.md`.

## Phase 7 — public deployment and post-deploy verification

Status: BLOCKED
Date: 2026-09-07

- Deployment target audit: no Vercel metadata, hosting configuration, public URL or authenticated deployment session exists.
- `npm run build` — PASS.
- Public URL route smoke — NOT RUN: no deployed URL.
- Clean-browser/mobile verification — NOT RUN: no deployed URL.
- Production RPC/SDK health — NOT RUN: no deployed URL; local `/status` previously timed out during upstream checks.
- Production room-sharing verification — NOT RUN: no deployed URL and room persistence is not implemented.
- Production wallet-signed trade — NOT RUN: no deployed URL, funded wallet gate or user signature.
- Browser bundle/source-map secret scan — NOT RUN against a deployment; local source contains no private-key value or privileged client import found by audit.
- Exact manual handoff and evidence fields are recorded in `docs/DEPLOYMENT_EVIDENCE.md`.

## Phase 8 — public repository and submission package

Status: PARTIAL/BLOCKED
Date: 2026-09-08

### Delivered

- Added a professional README covering pitch, problem, differentiation, architecture, exact SDK path, setup, testing, limitations and roadmap.
- Added `docs/JUDGING_MAP.md`, `docs/DEMO_SCRIPT.md`, `docs/SUBMISSION_COPY.md`, `docs/SDK_FEEDBACK.md` and `docs/SUBMISSION_CHECKLIST.md`.
- Added a Mermaid architecture diagram and honest placeholders for screenshots, public URL, repository URL and demo video.
- Initialized Git locally on `main`; no commit, remote, push or DoraHacks submission was performed.
- Added credential-file exclusions for `.vercel`, PEM/key/certificate files, dumps and compressed SQL backups.

### Secret and link verification

- High-risk secret-pattern scan — PASS (no private-key assignment, service-role value, PEM key or AWS-style key found; market IDs in historical logs are public test evidence, not credentials).
- `.env*`, `.vercel`, wallet key and database dump ignore checks — PASS.
- Official source links in README — PASS (DreamDEX docs, bot kit and hackathon template URLs are present).
- Local README commands — PASS by prior Phase 6 pipeline; no new application code was added in Phase 8.

### Exit-gate status

- [ ] Public source repository accessible: blocked; no remote selected or authorized for publication.
- [ ] Public application accessible: blocked; no deployment URL exists.
- [x] README and submission copy prepared without fabricated evidence.
- [x] Demo script prepared with pending steps clearly marked.
- [ ] Final DoraHacks fields complete: blocked pending URL, repository, video and owner decisions.

### Manual gate

The authenticated Vercel CLI account is available, but no Vercel project is linked. The owner must select/create the authorized remote repository and deployment project, approve publication, provide the production URL and real transaction evidence, then request the next execution step.

## Phase 8 recovery — 2026-09-08

- Reproduced DreamDEX documentation URL check: FAIL — PowerShell HEAD request returned `An error occurred while sending the request`; no local documentation change can fix that upstream/network failure.
- Reproduced repository/deployment audit: no Git remote, `.vercel/project.json`, `vercel.json` or `.openai/hosting.json`.
- Reproduced Vercel session check: `vercel whoami` — FAIL with `fetch failed` in the current network session; no deployment was attempted.
- Reproduced social-scope audit: no room Route Handlers, Supabase migration/RLS policy, membership, presence, verified activity or leaderboard code exists under `src`.
- Reproduced evidence audit: no transaction hash, receipt, fill or verified position exists; historical market IDs are read-only test-log identifiers.
- Classification: blockers are missing authorization/external access, missing manual wallet evidence and an unimplemented prior product phase, not a release-package code defect.

## Final hackathon audit — 2026-09-08

- Claim audit: README and submission copy clearly label the project as an incomplete release-candidate foundation and do not claim a public URL, room backend or real transaction hash.
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS (6 files, 15 passed, 1 intentionally skipped external smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- `npm audit --omit=dev --audit-level=high` — PASS (0 production vulnerabilities)
- `RUN_DREAMDEX_SMOKE=1 npm test -- src/lib/dreamdex/integration.smoke.test.ts --reporter=verbose` — PASS (1 live BTC/ETH market discovered and chain-verified in 5.47s)
- Secret scan — PASS (no high-risk private-key, service-role, PEM or AWS-style patterns)
- Repository/deployment state — FAIL for release: no Git remote, public repository, deployment metadata or public URL.
- Public smoke checks — NOT RUN: no public URL.
- Real wallet transaction evidence — NOT RUN: no user-funded wallet signature or verified position evidence.

### Final audit decision

NO-GO. Estimated score: 48/100. The read-only integration and local foundation are credible, but the primary evaluator path cannot be completed because the social-room layer, public deployment and real transaction evidence are missing.

## Phase 3 automated preflight recovery — 2026-09-09

- Added a typed 20-check preflight gate to the wallet trade panel. Critical checks cover wallet/account, Shannon chain, RPC reads, native gas, collateral balance, token/pool addresses, allowance, on-chain status, freshness, expiry headroom, quote/liquidity, tick/lot grid, one-tUSDC cap, slippage, wallet readiness and duplicate submission.
- Added accessible check-by-check status output. Signing remains disabled until every check passes; no market is substituted automatically.
- Added copy/download of public evidence JSON only after a mined successful receipt and authoritative position readback. It contains no secrets.
- `npm run typecheck` — PASS
- `npm run lint` — PASS (existing Next.js workspace-root warning only)
- `npm test -- --run src/lib/dreamdex/trading.test.ts` — PASS (4 tests)
- `npm run build` — PASS
- No wallet signature, approval, order, receipt or position evidence was created by this change.

## Phase 5A monochrome UI recovery — 2026-09-09

- Reworked the shared visual system to the requested black/white/neutral palette, removing colored backgrounds and decorative gradients from the application shell.
- Updated navigation, page headings, cards, market probability treatments, status badges, trade panel and room/market surfaces with stronger hierarchy, visible UP/DOWN labels, tabular data, reduced-motion support and a mobile sticky trade surface.
- Added an accessible automated preflight presentation to the trade panel; protocol, wallet and verification behavior remains unchanged.
- Responsive browser review passed at 360px, 768px and 1440px without horizontal overflow after constraining the document viewport.
- Localization catalogs remain available for English/Hindi; some legacy server-rendered explanatory copy remains English and is a known Phase 5 follow-up.

## Environment contract setup — 2026-09-09

- Renamed the reserved Supabase variables to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`; no legacy names remain in application configuration.
- Created local `.env.local` with only `NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312`; RPC, indexer, venue, operator and Supabase values remain blank so verified SDK defaults and optional Phase 4 configuration are preserved. The file is Git-ignored.
- Added typed environment validation for Shannon-only chain IDs, HTTPS/WSS endpoints, explicit demo mode, optional/all-or-none Supabase public configuration and missing-Supabase behavior.
- Added `docs/ENVIRONMENT_SETUP.md` with the manual Supabase Dashboard checkpoint. No Supabase account, key or client dependency was invented.
- `npm test -- --run` — PASS (22 passed, 1 intentionally skipped external smoke test)
- `npm run build` — PASS
- Secret assignment scan — PASS; no private-key assignments or legacy Supabase names found.

## Phase 4 — Supabase room and social layer — 2026-09-09

Status: PARTIAL / AWAITING SUPABASE CONNECTIVITY VERIFICATION
Scope: server-owned Supabase room persistence, signed wallet session boundary, participant
presence, sentiment, reactions, verified trade association and room activity UI. No deployment,
Git publication or new protocol behavior was started.

### Delivered

- Added typed browser/server Supabase clients. The server client is guarded with `server-only` and
  uses `SUPABASE_SECRET_KEY` only on the server; the browser receives only the publishable key.
- Added additive migration `supabase/migrations/20260909000100_create_dreamrooms_social.sql` for
  rooms, participants, sentiments, verified trades, reactions and wallet nonces, including indexes,
  constraints, timestamps, RLS and public-write revokes.
- Added nonce-bound EIP-191 wallet authentication with an HttpOnly signed session cookie. No
  private key or automatic transaction signature is used.
- Added room create/read/join/heartbeat/sentiment/reaction/leaderboard and verified-trade routes.
  Room creation re-discovers and validates the selected live Trading market server-side.
- Added room creation and live social UI with five-second refresh plus Supabase Realtime listeners.
  Sentiment and reactions are not displayed as market trades; verified activity is empty until the
  server checks a real receipt and outcome-token position.
- Added migration safety, environment validation and deterministic 100-iteration social-state tests.

### Verification

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test -- --run` — PASS (27 passed, 1 intentionally skipped external read smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- `git check-ignore -q .env.local` — PASS
- Secret-name scan excluding ignored local environment files — PASS; no values printed.
- `supabase --version` — NOT RUN: Supabase CLI is not installed in this workspace.
- Remote Supabase connectivity/migration verification — BLOCKED: required variables are present and
  structurally accepted, but the configured Supabase host failed DNS resolution; no remote schema
  request was completed.
- Live DreamDEX read path remains the Phase 2 verified adapter; the opt-in read-only smoke was
  rerun on 2026-09-09 and passed, while no Phase 4 code changes protocol reads or claims.

### Manual gate

Before room creation can work locally, set the three required values by variable name only:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`; set a
`DREAMROOMS_SESSION_SECRET` and all required public variables are present with one declaration each.
Verify the Supabase project URL/DNS access, restart the dev server, independently confirm the
reported Dashboard migration, then test `/rooms/new` and a second browser session. No remote schema
request was completed by this run.

## Skeptical judge and release audit — 2026-09-09

- Created `docs/WINNING_AUDIT.md` with evidence classes, judge objections, provisional score and ranked continuation order.
- Replaced stale product claims in the README, submission copy, demo script, release checklist, judging map and known-limitations document.
- Added only local, protocol-neutral improvements: live quote trace, localized project information/FAQ, locale persistence, room heartbeat/fallback messaging, reaction removal and strict room-slug validation.
- Public URL, clean-browser production smoke, remote Supabase schema/RLS verification, two-session proof, real DreamDEX transaction evidence, screenshots and demo video remain unverified or blocked.

## Release-candidate completion work — 2026-09-10

- Corrected bounded approval preparation and exact transaction simulation. Readiness now compares
  estimated gas plus a documented 20% buffer against native STT and blocks until the exact next
  transaction is simulated.
- Historical DreamDEX room-trade verification no longer rejects a genuine fill solely because its
  market later expired/finalized or its outcome balance later decreased. The receipt/fill event is
  retained as the historical authority and the current outcome balance is still read back.
- Added a server-backed `/api/portfolio` read using the pinned SDK `getPortfolio` method and a live
  open-position/recent-fill UI. Provider failures remain unavailable rather than zero-value success.
- Added a reusable neutral live grid backdrop with reduced-motion CSS behavior, hidden-tab pause and
  a persistent local motion preference. The layer is decorative and pointer-inert.
- Added `docs/DEPLOYMENT.md` with Vercel-compatible runtime, environment names and release checks.
- Authentication nonce issuance now distinguishes malformed client input (`400`) from unavailable
  Supabase/configuration transport (`503`) and exposes only a safe remediation message.
- Wallet connection and Shannon network-switch errors are now visible and actionable; missing
  injected providers no longer render as an unresponsive connection control.
- Mutating room APIs now require an `x-dreamrooms-wallet` header matching the signed session wallet,
  preventing stale-session writes after an account change. Nonce consumption now uses an atomic
  conditional update with a returned row, preventing concurrent replay acceptance.
- Room creation now blocks wallet authentication until the active chain is Somnia Shannon `50312`.

### Deep bug check — 2026-09-11

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test -- --run` — PASS (28 passed, 1 intentionally skipped external read smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- Opt-in live DreamDEX read-only smoke — PASS
- `.env.local` ignore and client secret-name scans — PASS

### Verification after release-candidate fixes

- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test -- --run` — PASS (28 passed, 1 intentionally skipped external read smoke test)
- `npm run format:check` — PASS
- `npm run build` — PASS
- Opt-in live DreamDEX read-only smoke — PASS (one dynamically discovered chain-verified BTC/ETH market)
- `git diff --check` — PASS (newline normalization warnings only)
- `npm audit --omit=dev --audit-level=high` — PASS (0 vulnerabilities)
- `.env.local` ignore check — PASS; client bundle secret-name scan — PASS; no secret values printed.
- Local browser capture — PASS for rendered mobile landing/live discovery and accessibility-visible
  states. Stable screenshot files were not written because the available browser capture API only
  returns/displayed bytes; no screenshot asset is claimed in the README.

### Still blocked / not run

- Supabase remote schema, RLS, Realtime and two-session journey: NOT RUN because the configured host
  remains DNS-unreachable in the native Node runtime.
- Real wallet-signed DreamDEX order, receipt, position, claim and production deployment: NOT RUN;
  each requires the owner's manual wallet/deployment action.
