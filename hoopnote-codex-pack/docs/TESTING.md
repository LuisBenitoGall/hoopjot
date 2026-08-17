# Testing strategy

## Goal

Protect domain behavior and offline flows without testing implementation trivia.

## Unit tests

Use Vitest.

Priority:
- recommendation engine;
- domain validation;
- age rules;
- content validation;
- sync conflict helpers;
- date/local-day behavior.

## Component tests

Use React Testing Library.

Test:
- user-observable behavior;
- validation messages;
- language rendering;
- keyboard/accessibility behavior where relevant.

Avoid snapshot-heavy test suites.

## Integration tests

Test repository contracts against local Dexie implementation.

Sync integration tests should use a controlled adapter/mock unless a dedicated Supabase test environment exists.

## E2E

Use Playwright.

Critical MVP scenarios:
1. sign up/sign in;
2. onboarding;
3. first daily focus;
4. create practice session;
5. pre-session check-in;
6. post-session reflection;
7. journal history;
8. reload preserving local data;
9. offline core flow after initial load;
10. reconnect and sync;
11. switch locale.

## Quality commands

Expected scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Accessibility

Include automated checks where practical, but also manually inspect:
- focus order;
- tap sizes;
- screen reader labels;
- contrast;
- reduced motion.

## Definition of done

A spec is not complete when it merely renders.
Its acceptance criteria and relevant tests must pass.
