# Environment setup

DreamRooms uses browser wallets for all approval and DreamDEX order signatures. No wallet private key, mnemonic or backend trading signer is required.

## Current local setup

`.env.local` is present locally and is ignored by Git. The Phase 4 implementation uses the
variable names below; values are intentionally never printed or committed. Endpoint overrides
may remain blank so the pinned SDK defaults remain authoritative.

## Supabase checkpoint

The room/social layer expects:

1. Create or select the Supabase project.
2. Open the project Connect dialog and copy the Project URL.
3. Copy the publishable key.
4. Open Project Settings → API Keys and copy/create the server secret.
5. Put the values only in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DREAMROOMS_SESSION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. Never share the completed file or put the secret in a `NEXT_PUBLIC_*` variable.
7. Restart the development server.
8. Apply `supabase/migrations/20260909000100_create_dreamrooms_social.sql` from the Supabase SQL
   Editor or a linked Supabase CLI. The migration is additive and has an explicit RLS policy set.
9. Generate a random session secret of at least 32 characters locally and set
   `DREAMROOMS_SESSION_SECRET`; never paste it into chat.
10. Add the same values later through encrypted deployment settings.

The Supabase secret is a database server credential, not a wallet private key. MetaMask or another injected browser wallet remains responsible for manually signing approval and DreamDEX order transactions.

The application continues to run its live read-only DreamDEX path when Supabase is absent. Room
APIs fail clearly until the public configuration, server session secret and RLS migration exist.
