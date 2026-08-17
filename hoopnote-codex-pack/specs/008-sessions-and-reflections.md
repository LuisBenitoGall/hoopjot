# 008 — Sessions and reflections

## Goal

Implement session creation, pre-session check-in and fast post-session reflection.

## Read first

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN_SYSTEM.md`

## Deliverables

- Create practice/game/learning/recovery session.
- Pre-session check-in with optional energy/confidence/physical feeling.
- Associate current daily focus.
- Complete session.
- Reflection: 1–5 focus rating plus optional note, coach feedback and remember-next-time.
- Target UX remains fast and mobile-first.
- Persist locally and enqueue sync operations.

## Acceptance criteria

- Session can be completed without optional check-in fields.
- Reflection requires only focus rating.
- All entries survive reload/offline state.
- Physical feeling wording is non-diagnostic.

## Tests / verification

Component + repository integration + E2E session/reflection flow.

## Out of scope

- No free-text AI parsing.
- No load prescription.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
