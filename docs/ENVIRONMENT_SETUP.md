# Environment setup

DreamRooms uses browser wallets for all approval and DreamDEX order signatures. No wallet private key, mnemonic or backend trading signer is required.

## Current local setup

`.env.local` is present locally with only non-secret Shannon configuration. Endpoint overrides are blank so the pinned SDK defaults remain authoritative. It is ignored by Git.

## Supabase checkpoint

Supabase values are not present because the Phase 4 room/social layer is not implemented yet. When that phase is authorized:

1. Create or select the Supabase project.
2. Open the project Connect dialog and copy the Project URL.
3. Copy the publishable key.
4. Open Project Settings → API Keys and copy/create the server secret.
5. Put the values only in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

6. Never share the completed file or put the secret in a `NEXT_PUBLIC_*` variable.
7. Restart the development server.
8. Add the same values later through encrypted deployment settings.

The Supabase secret is a database server credential, not a wallet private key. MetaMask or another injected browser wallet remains responsible for manually signing approval and DreamDEX order transactions.

The application continues to run its live read-only DreamDEX path when Supabase is absent. Room APIs must fail clearly until Supabase configuration and RLS migrations exist.
