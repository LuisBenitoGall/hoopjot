# Architecture

## Architectural goals

- Offline-first.
- Fast mobile UX.
- Strong separation between domain, persistence and UI.
- Backend optional for immediate interaction, required for durability and account ownership.
- Easily testable recommendation engine.
- Internationalized from day one.

## High-level architecture

```text
React UI
  ↓
Application use cases
  ↓
Domain
  ↓
Repository interfaces
  ├── Local repositories → Dexie / IndexedDB
  └── Sync service → Supabase
```

## Frontend stack

- React
- TypeScript strict
- Vite
- React Router
- Tailwind CSS
- Zod
- vite-plugin-pwa / Workbox
- Dexie
- Supabase JS
- TanStack Query only where remote server state benefits from it
- Vitest
- React Testing Library
- Playwright

## Package management

- pnpm
- Commit `pnpm-lock.yaml`.
- Use compatible stable package versions at bootstrap and keep them locked.

## Suggested source structure

```text
src/
  app/
    router/
    providers/
  domain/
    player/
    skills/
    sessions/
    recommendations/
  application/
    onboarding/
    daily-focus/
    sessions/
    journal/
    progress/
  features/
    auth/
    onboarding/
    today/
    game/
    journal/
    progress/
    profile/
  content/
    skills/
    guidelines/
  persistence/
    local/
    repositories/
    sync/
  services/
    recommendations/
    auth/
  components/
    ui/
    basketball/
  i18n/
    en/
    es/
  lib/
  styles/
```

## Dependency rules

### domain
May import:
- domain modules;
- pure utilities.

Must not import:
- React;
- Dexie;
- Supabase;
- DOM/browser APIs.

### application
Coordinates use cases and repository interfaces.
Must not render UI.

### persistence
Implements repository interfaces.
May depend on Dexie/Supabase.

### features/components
May call application services/hooks.
Must not call Supabase directly.

## IDs

Use UUIDs generated client-side for user-owned entities so objects can be created offline.

## Time

Store timestamps as UTC ISO values.
Display in user locale/timezone.

## State

Prefer:
- local component state for UI;
- application hooks for use cases;
- IndexedDB for durable domain state;
- TanStack Query for remote-state concerns only.

Do not mirror all IndexedDB state into a global client store.

## Error handling

Errors should be classified:
- validation;
- local persistence;
- authentication;
- network/sync;
- remote rejection;
- unknown.

Offline state is not an error.

## Environment variables

Browser-safe variables only in Vite client environment:
- Supabase URL
- Supabase anonymous/publishable key

Never expose:
- service role key;
- LLM API secret;
- administrative credentials.

## Deployment

Frontend: Vercel.
Backend/data: Supabase.
Repository: GitHub.

Preview deployments should be used for feature review.
