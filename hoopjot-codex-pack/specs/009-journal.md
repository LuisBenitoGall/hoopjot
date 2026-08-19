# 009 — Journal

## Goal

Implement chronological personal history and session detail.

## Read first

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN_SYSTEM.md`

## Deliverables

- Journal timeline grouped by local date.
- Session cards show type, focus and reflection status.
- Session detail view.
- Filters: all/practice/game/learning/recovery if cleanly supported.
- Empty states.
- Offline support.

## Acceptance criteria

- Chronological order correct across dates.
- Deleted/tombstoned sessions hidden.
- Locale-aware dates.
- Detail shows associated focus/reflection when available.

## Tests / verification

Journal ordering unit test and E2E navigation.

## Out of scope

- No search.
- No analytics dashboard.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
