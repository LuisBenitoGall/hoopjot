# Hoopnote repository instructions

Hoopnote is an offline-first basketball development PWA.

## Before coding

1. Read this file.
2. Read `docs/PRODUCT.md`.
3. Read the documents referenced by the current spec.
4. Read the current file under `specs/`.
5. Inspect existing code before introducing abstractions.

## Mandatory technology choices

- React + TypeScript + Vite.
- React Router.
- pnpm.
- Tailwind CSS.
- Zod for runtime validation.
- Dexie / IndexedDB for local persistence.
- Supabase for Auth, PostgreSQL, RLS, Storage and server-side/Edge functionality.
- Vercel for frontend deployment.
- Vitest + React Testing Library + Playwright.
- `vite-plugin-pwa` / Workbox for PWA behavior.

Do not replace these technologies without an explicit user request.

## Architecture rules

- The application is local-first.
- User-facing writes succeed locally first.
- React components MUST NOT call Supabase directly.
- Domain code MUST NOT depend on React, Dexie, Supabase or browser APIs.
- Persistence is accessed through repository interfaces.
- Remote synchronization is separate from local persistence.
- Avoid global mutable state.
- Do not add Redux unless explicitly requested.
- Avoid `any`. If unavoidable, document why.
- Prefer boring, explicit code over speculative abstractions.
- Do not create generic abstractions until at least two real callers need them.

## Product rules

- UI supports English and Spanish from the first release.
- Never hardcode translatable user-facing strings in components.
- Product must remain gender-neutral.
- Minimum supported user age is 16.
- Email registration is required for the MVP.
- Medical/rehabilitation advice is out of scope.
- AI is not required for MVP functionality.
- Video is not part of the MVP.
- Do not invent basketball guidance. Use the content model and curated content files.

## Offline rules

- Core flows must work without network access after first successful load.
- Profile, daily focus, sessions, check-ins, reflections, journal and content must be locally available.
- Do not use `localStorage` for domain data.
- `localStorage` may only hold trivial UI preferences when justified.

## Security rules

- Never expose service-role secrets in the browser.
- Enforce user ownership in PostgreSQL with RLS.
- Treat injury/physical-context fields as sensitive optional data.
- Keep data collection minimal.

## Verification required before completing a task

Run all commands relevant to the change, including:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- relevant Playwright tests

If a command does not yet exist because the current bootstrap phase has not created it, state that clearly.

## Scope discipline

Implement only the current spec.
Do not silently continue into the next milestone.
Do not add "nice to have" product features outside scope.

## Completion report

At the end of each task report:

1. What was implemented.
2. Files materially changed.
3. Tests added/updated.
4. Commands run and outcomes.
5. Any deviations, assumptions or unresolved risks.
