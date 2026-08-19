# Setup

This document is for MVP pilot deployment. It intentionally avoids real secrets.

## Local Environment

Create `.env.local` from `.env.example` and fill:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only browser-safe values belong here. Do not add service-role keys, database passwords or provider secrets.

## Supabase Project

1. Create a Supabase project.
2. Enable email authentication.
3. Configure frontend URLs:
   - local development origin;
   - Vercel preview origins used for review;
   - production origin.
4. Apply the migration under `supabase/migrations/` with the Supabase CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref-from-your-supabase-url>
   npx supabase migration list --linked
   npx supabase db push --dry-run --linked
   npx supabase db push --linked
   ```

   The project ref is the subdomain in `https://<project-ref>.supabase.co`. The remote database will not contain `profiles`, `sessions`, `reflections` or the other app tables until `db push --linked` completes successfully.
5. Confirm user-owned tables are exposed to the Data API only through the `authenticated` role grants in the migration.
6. Verify RLS:
   - all user-owned tables have RLS enabled;
   - all user-owned tables force RLS;
   - select/insert/update/delete policies use `(select auth.uid()) = user_id`;
   - update policies include both `USING` and `WITH CHECK`.
7. Run a manual two-account isolation test:
   - account A creates profile/session/reflection data;
   - account B cannot read, update or delete account A rows;
   - account A can still read and update their own rows.

To run the executable RLS isolation check instead of doing only a manual spot check, create two confirmed Supabase Auth test accounts and run:

```bash
HOOPNOTE_RUN_SUPABASE_RLS_TESTS=true \
VITE_SUPABASE_URL=your-project-url \
VITE_SUPABASE_ANON_KEY=your-anon-key \
HOOPNOTE_RLS_TEST_EMAIL_A=player-a@example.com \
HOOPNOTE_RLS_TEST_PASSWORD_A=account-a-password \
HOOPNOTE_RLS_TEST_EMAIL_B=player-b@example.com \
HOOPNOTE_RLS_TEST_PASSWORD_B=account-b-password \
pnpm test -- src/sync/supabaseRlsIsolation.integration.test.ts
```

Keep these account passwords in a local shell or CI secret store. Do not put them in Vercel frontend environment variables.

## Vercel

Use these settings:

```text
Framework: Vite
Install command: pnpm install --frozen-lockfile
Build command: pnpm build
Output directory: dist
```

Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not configure service-role credentials in Vercel frontend environment variables.

## Local Production Preview

```bash
pnpm build
pnpm preview --host 127.0.0.1 --port 4173
```

Use the production preview for PWA/offline checks because service workers are disabled in the Vite dev server setup.
