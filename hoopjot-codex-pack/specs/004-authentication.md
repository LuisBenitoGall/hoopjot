# 004 — Authentication

## Goal

Implement Supabase email authentication and protected routing.

## Read first

- `docs/AUTHENTICATION.md`
- `docs/SECURITY_PRIVACY.md`
- `docs/ARCHITECTURE.md`

## Deliverables

- Supabase client isolated in infrastructure/service layer.
- Sign up, sign in, sign out and recovery UI.
- Session restoration.
- Protected route behavior.
- Authenticated-but-not-onboarded routing state supported.
- English/Spanish copy.
- Clear offline error for auth actions requiring network.
- `.env.example` documents browser-safe Supabase variables.

## Acceptance criteria

- Components do not call Supabase directly.
- Unauthenticated users cannot reach app routes.
- Session persists according to Supabase client behavior.
- Auth screens are usable at mobile widths.

## Tests / verification

Unit/component tests plus an auth routing test. Document manual Supabase setup if required.

## Out of scope

- No database tables beyond what auth itself requires.
- No social login.
- No onboarding.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
