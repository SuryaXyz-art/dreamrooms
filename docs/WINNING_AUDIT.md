# DreamRooms skeptical judge and release audit

Audit date: 2026-09-09. This document separates what is implemented locally from what is independently verified in a public deployment or on-chain transaction.

## Evidence classes

- **VERIFIED** — independently observed against Shannon, the configured service, or a public URL.
- **LOCALLY VERIFIED** — reproduced by local tests/builds or code inspection, without external production evidence.
- **IMPLEMENTED BUT UNVERIFIED** — code exists, but the required external service, wallet action or second session was unavailable.
- **PLANNED** — documentation or UI intention only.
- **BLOCKED** — the check cannot proceed because of a genuine external/manual gate.

## Skeptical judge view

### Pros

1. The product has a clear wedge: a room is a social explanation and verification surface around one stable Event Contract market ID, not a replacement exchange.
2. The read path is grounded in the official SDK, dynamic BTC/ETH discovery, on-chain market reads and normalized order-book data. The opt-in live smoke test has passed locally.
3. The wallet path has explicit safety boundaries: Shannon-only chain gating, raw bigint tick/lot conversion, bounded spend, stale/expiry checks, duplicate-submit protection, mined receipt inspection and authoritative position readback.
4. The monochrome system gives the product a recognizable, restrained visual language and keeps UP/DOWN labels visible instead of relying on color alone.
5. Room APIs, signed wallet sessions, RLS migration, heartbeat/polling fallback and verified-trade filtering are present in the working tree and covered by local safety/state tests.

### Cons and top judge objections

1. **Critical — no public URL.** Clean-browser evaluator flow, production environment behavior and public room sharing cannot be scored. This is a release/manual deployment gate.
2. **Critical — no independently verified DreamDEX order.** There is no real order hash, successful receipt, fill or position evidence in the workspace. Faucet funding is not trade evidence.
3. **High — Supabase reachability is unresolved.** All five required variables are structurally present, but the configured Supabase hostname failed DNS resolution; remote tables, RLS and realtime cannot be independently verified.
4. **High — no two-session room proof.** The room/social code is implemented but the create/share/join/presence/sentiment/reaction journey has not run against the remote database.
5. **Medium — presentation evidence is missing.** No real screenshots, demo video or public repository evidence is available in this workspace.
6. **Medium — localization is incomplete outside the shared client surfaces.** English/Hindi catalogs and locale persistence exist, but some server-rendered route copy remains English.

## Differentiation test

**Test:** remove the social room and ask whether the remaining app is a normal market terminal. **Result:** the live-market and wallet surfaces would still work, but the intended differentiator is the verified, shareable room layer. Its code exists; external Supabase and second-session proof are the missing evidence.

## Score before local fixes

| Criterion                   | Earned | Maximum | Evidence-based rationale                                                                   |
| --------------------------- | -----: | ------: | ------------------------------------------------------------------------------------------ |
| Innovation & Originality    |     13 |      20 | Strong room-around-a-market concept; no public/social proof.                               |
| Technical Implementation    |     18 |      25 | Live read and typed safety path locally verified; external DB and real write unverified.   |
| User Experience & Design    |     15 |      20 | Strong shell and responsive monochrome direction; route copy and localization gaps remain. |
| Business & Ecosystem Impact |      9 |      20 | Clear Somnia/DreamDEX education value; no live adoption or public access evidence.         |
| Presentation & Demo         |      5 |      15 | Demo script exists, but no public URL, screenshots, video or real transaction.             |
| **Total**                   | **60** | **100** | Provisional score under a strict evidence standard.                                        |

## Fixes applied in this audit

- Replaced stale empty-state and portfolio wording with truthful current behavior.
- Added a live-quote signal trace that renders only from discovered live order-book values and has a non-live fallback.
- Added a localized project-information/FAQ section covering the product boundary, testnet, self-custody and binary-loss risk.
- Persisted the English/Hindi choice locally without moving secrets or protocol work into the browser.
- Added visible room heartbeat state, five-second polling fallback messaging, and add/remove reaction controls.
- Added strict room-slug validation to room snapshot and trade-verification routes.
- Updated release, judging, README, submission and limitation documents to distinguish implemented code from external evidence.

## Score after local fixes

| Criterion                   | Earned | Maximum | Evidence-based rationale                                                                |  Delta |
| --------------------------- | -----: | ------: | --------------------------------------------------------------------------------------- | -----: |
| Innovation & Originality    |     14 |      20 | Differentiation is easier to understand; still lacks public proof.                      |     +1 |
| Technical Implementation    |     19 |      25 | Social boundaries and validation are clearer and locally tested; external gates remain. |     +1 |
| User Experience & Design    |     17 |      20 | Better education, locale persistence, live signal context and social affordances.       |     +2 |
| Business & Ecosystem Impact |      9 |      20 | No change to adoption/deployment evidence.                                              |      0 |
| Presentation & Demo         |      5 |      15 | No public URL, screenshots, video or transaction evidence.                              |      0 |
| **Total**                   | **64** | **100** | Still a conditional local score, not a submission-ready score.                          | **+4** |

## Required continuation order

1. Restore DNS/reachability for the configured Supabase project and independently verify schema, grants, RLS and Realtime.
2. Run the two-session room journey with manual wallet authentication signatures.
3. Complete one low-value Shannon trade with manual approval/order signatures and record the mined receipt plus position readback.
4. Deploy only after explicit release authorization; run clean-browser smoke checks and create real screenshots/video.
5. Re-score all claims against public URLs and evidence before DoraHacks submission.

The official reference targets remain the [DoraHacks Event Contracts page](https://dorahacks.io/hackathon/event-contracts/detail), [DreamDEX Event Contract documentation](https://docs.dreamdex.io/developers/event-contracts), [DreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit) and [official hackathon template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template). The DoraHacks detail page returned HTTP 405 in this environment and direct DreamDEX documentation retrieval was unavailable during this audit, so no inaccessible rule or criterion is presented as verified.
