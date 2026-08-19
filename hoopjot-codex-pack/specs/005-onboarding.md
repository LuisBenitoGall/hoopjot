# 005 — Onboarding

## Goal

Implement the complete bilingual onboarding flow and persist it locally.

## Read first

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/I18N.md`
- `docs/DESIGN_SYSTEM.md`

## Deliverables

- Steps: locale, player profile, experience/positions, goals, initial self-assessment, optional physical context, completion.
- Alias optional.
- Birth year required and age-gated at 16+.
- Primary position required.
- Maximum three goals.
- Physical context optional.
- Progress survives refresh.
- Completion creates/updates PlayerProfile and goals locally.
- Main app routing unlocks after completion.

## Acceptance criteria

- Can complete onboarding with no alias, no height and no physical note.
- Under-16 cannot complete.
- Switching locale updates flow immediately.
- Data remains after reload.
- No network required after authenticated app bootstrap/local DB availability.

## Tests / verification

Component and E2E tests for happy path, age gate, goals limit and language switch.

## Out of scope

- No daily recommendation yet.
- No Supabase profile sync.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
