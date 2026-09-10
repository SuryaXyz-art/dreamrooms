# DreamRooms deployment

DreamRooms is a Next.js App Router application and must be deployed as a
server-capable Next.js target. It is not a static export: room APIs, wallet
authentication, verification and the Supabase server client require runtime
route handlers.

## Vercel preparation

Use the repository root as the project root. The supported commands are:

```text
Install: npm ci
Build:   npm run build
Start:   npm run start
```

The pinned Node/Next versions are recorded in `package.json`. Choose a Vercel
Node runtime compatible with that package lockfile. Do not add a private-key
environment variable.

Configure these variables in the Vercel project before every production build:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase API project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe Supabase publishable key.
- `SUPABASE_SECRET_KEY` — server-only Supabase secret key; never expose it to client code.
- `DREAMROOMS_SESSION_SECRET` — at least 32 random bytes encoded for the session signer.
- `NEXT_PUBLIC_APP_URL` — the exact HTTPS application origin used in signed wallet-auth domains and share links.

Optional public DreamDEX overrides are documented in `.env.example`. Leave them
blank when the pinned SDK defaults are intended. The application only supports
Somnia Shannon (`50312`) and rejects mainnet-looking endpoint overrides.

Public `NEXT_PUBLIC_*` values are build-time inputs. Changing them requires a
new deployment. Server secrets must be entered through the deployment
provider's protected environment configuration and must not appear in logs,
bundles, source maps or screenshots.

## Release verification

Before publication, run the full local gate:

```text
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run format:check
npm run build
git diff --check
```

After an authorized deployment, verify the exact public URL from a clean
browser session: `/`, `/rooms/new`, `/portfolio`, `/status`, a shared room,
live DreamDEX discovery and the server health states. A wallet-auth signature,
approval, order or claim always remains a manual browser-wallet action.

Current state: deployment is prepared locally but no Vercel target or public
URL has been authorized or independently verified.
