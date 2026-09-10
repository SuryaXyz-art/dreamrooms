# Known limitations

- No actual wallet-signed Shannon order, receipt, verified position or claim was executed in this workspace. Existing Phase 3 logs explicitly state that evidence is absent.
- Supabase room persistence, signed sessions, presence, sentiment, reactions and verified activity
  are implemented with an additive migration and server-only credentials. The configured project
  hostname failed DNS resolution in the last verification run, so remote schema/RLS/realtime and
  end-to-end room persistence remain unverified.
- There is no Playwright dependency or automated browser journey. Responsive and accessibility checks remain manual/code-level checks.
- The external DreamDEX smoke test is opt-in and can fail when the upstream indexer times out. Its failure must never be represented as a live-market success.
- Most pre-existing server-rendered page copy remains outside the locale catalog; shared client surfaces,
  navigation, project education and the room centerpiece have English/Hindi coverage.
- Speech synthesis depends on browser support and is optional. Trading and navigation do not depend on it.
- The current app has no public deployment URL or deployment configuration in this workspace.
