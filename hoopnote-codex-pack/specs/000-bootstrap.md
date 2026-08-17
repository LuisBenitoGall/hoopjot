# 000 — Bootstrap

## Goal

Create the production-ready frontend foundation without implementing product features.

## Read first

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/I18N.md`

## Deliverables

- Vite React TypeScript project using pnpm.
- TypeScript strict mode.
- React Router configured.
- Tailwind configured.
- ESLint/formatting configured.
- Vitest + React Testing Library configured.
- Playwright configured.
- Basic i18n infrastructure with `en` and `es`.
- `vite-plugin-pwa` installed with minimal safe configuration.
- App shell renders.
- `.env.example` exists.
- Scripts exist for lint, typecheck, test, test:e2e and build.
- No domain features yet.

## Acceptance criteria

- `pnpm install` succeeds.
- `pnpm lint` succeeds.
- `pnpm typecheck` succeeds.
- `pnpm test` succeeds.
- `pnpm build` succeeds.
- App starts locally.
- A trivial smoke E2E test passes.

## Tests / verification

Run all bootstrap scripts and verify production build.

## Out of scope

- No Supabase project setup.
- No onboarding.
- No product pages beyond app shell/smoke route.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
