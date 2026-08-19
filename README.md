# Hoopjot

Hoopjot is an offline-first basketball development PWA. It helps players complete a small daily learning loop:

```text
focus -> play -> reflect -> learn -> adapt
```

The MVP is a private player journal and attention system. It is not a virtual coach, medical product, social network, video tool or AI interpreter.

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.14.0`
- Supabase project for Auth, Postgres and RLS
- Vercel project for frontend deployment

## Local Setup

1. Install dependencies.

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Copy browser-safe environment placeholders.

   ```bash
   cp .env.example .env.local
   ```

3. Fill only browser-safe Supabase values in `.env.local`.

   ```text
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

   Never place a service-role key in Vite environment variables.

4. Start development.

   ```bash
   pnpm dev
   ```

## Supabase Setup

The SQL migration already lives in `supabase/migrations/`, but the remote database will not have app tables until the migration is pushed to the Supabase project.

```bash
npx supabase login
npx supabase link --project-ref <project-ref-from-your-supabase-url>
npx supabase migration list --linked
npx supabase db push --dry-run --linked
npx supabase db push --linked
```

Use the project ref from `https://<project-ref>.supabase.co`. `db push --dry-run` should show the pending migration before `db push --linked` applies it and creates the tables/RLS policies. Do not use service-role keys for the frontend app.

Release checks:

- Email auth is enabled.
- Allowed redirect URLs include local development, Vercel previews and production.
- Every user-owned table has RLS enabled and forced.
- Policies restrict rows with `(select auth.uid()) = user_id`.
- `authenticated` has the required Data API grants.
- Cross-user isolation has been tested manually with two accounts.
- No service-role key is used by browser code.

See [docs/SETUP.md](docs/SETUP.md) for the full setup checklist.

## Quality Commands

Run the full MVP release gate before deploying:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The E2E suite runs against a production preview build and includes offline/PWA checks.

## Deployment

Vercel settings:

- Framework: Vite
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist`

Configure only browser-safe environment variables in Vercel.

## Release Docs

- [Setup](docs/SETUP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)
