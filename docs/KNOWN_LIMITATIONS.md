# Known limitations

- No actual wallet-signed Shannon order, receipt, verified position or claim was executed in this workspace. Existing Phase 3 logs explicitly state that evidence is absent.
- The Phase 4 room persistence, signed membership, presence, sentiment, reactions, verified activity and leaderboard APIs are not implemented. The development room remains an explicitly labelled fixture; production has no fake room fallback.
- No Supabase schema, migrations or RLS policies are present because the social layer was not delivered.
- There is no Playwright dependency or automated browser journey. Responsive and accessibility checks remain manual/code-level checks.
- The external DreamDEX smoke test is opt-in and can fail when the upstream indexer times out. Its failure must never be represented as a live-market success.
- Most pre-existing page copy remains outside the locale catalog; the room centerpiece and locale document language are translated English/Hindi.
- Speech synthesis depends on browser support and is optional. Trading and navigation do not depend on it.
- The current app has no public deployment URL or deployment configuration in this workspace.
