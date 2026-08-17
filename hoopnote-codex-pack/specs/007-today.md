# 007 — Today

## Goal

Implement the Today experience using deterministic placeholder selection before the recommendation engine exists.

## Read first

- `docs/PRODUCT.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_MODEL.md`

## Deliverables

- Today route.
- DailyFocusCard backed by local DailyFocus record.
- Generate one deterministic starter focus from eligible foundation content when none exists.
- Store status viewed/completed/skipped.
- Show short 'why this focus' reason.
- Support practice/game/learning guideline context selection if a session exists.
- Recovery sessions remain valid session records but do not request MVP guideline recommendations.
- Offline rendering from local data.

## Acceptance criteria

- Same date does not create duplicate focus.
- Reload preserves focus.
- Focus uses localized content.
- User can mark focus viewed/completed/skipped.

## Tests / verification

Unit tests for daily focus creation and E2E Today flow.

## Out of scope

- No adaptive scoring yet.
- No notifications.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
