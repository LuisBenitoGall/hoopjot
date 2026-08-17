# 013 — PWA hardening

## Goal

Make Hoopnote reliably installable and useful offline.

## Read first

- `docs/OFFLINE_SYNC.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md`

## Deliverables

- Production manifest with Hoopnote metadata/icons.
- Service worker caching strategy.
- App shell and curated content available offline.
- Clear app update strategy.
- Offline/reconnecting UI.
- Installability verified.
- No accidental caching of sensitive authenticated API responses as domain persistence.

## Acceptance criteria

- Lighthouse/installability checks are reasonable.
- After one successful load, core local flows work with network disabled.
- New unauthenticated sign-in correctly requires network.
- Updates do not leave app in broken mixed-version state.

## Tests / verification

Playwright offline tests and production build verification.

## Out of scope

- No push notifications yet.
- No background sync assumption beyond supported implementation.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
