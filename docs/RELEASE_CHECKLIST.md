# Release Checklist

Run this checklist before calling the MVP ready for pilot use.

## Automated Gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

All commands must pass. Investigate warnings that affect release risk, especially service worker, security, accessibility and chunk/runtime warnings.

For deployed-environment validation, run the separate remote smoke after setting local/CI secrets:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://hoopjot.vercel.app"
$env:E2E_EMAIL="..."
$env:E2E_PASSWORD="..."
pnpm test:e2e:remote
```

## Manual QA

- Installability prompt or browser install path is available after production load.
- App reloads into the shell after the service worker is active.
- With network disabled after first load, Today, Game, Sessions, Journal and Progress remain usable from local data.
- New unauthenticated sign-in requires network.
- Primary screens have no horizontal overflow at common mobile widths around 360-430px.
- Keyboard focus reaches auth forms, onboarding controls, primary navigation and session/reflection controls.
- Visible focus indicators remain clear.
- English and Spanish primary flows are complete.
- Error, empty, loading, offline and sync states are understandable.

## Security

- `.env` and `.env.local` are not committed.
- No service-role or database password is present in frontend code or Vercel frontend env.
- Supabase RLS and grants have been applied from the migration.
- Cross-user RLS isolation has passed with `src/sync/supabaseRlsIsolation.integration.test.ts`, or a manual two-account test result has been recorded for the target Supabase project.
- Reflection text, physical context, email addresses and tokens are not logged intentionally.

## Deployment

- Vercel preview has been reviewed on mobile.
- Supabase Auth redirect URLs include the deployed origin.
- Production build is deployed only after the automated gate passes.
