# 002 — Domain model

## Goal

Create pure domain types, Zod schemas, domain rules and repository contracts.

## Read first

- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`

## Deliverables

- Domain modules for player, goals, skills, sessions, reflections, observations, focus and weekly review.
- Zod schemas for runtime validation.
- Repository interfaces.
- Age >=16 rule.
- Maximum three active goals rule.
- Stable domain errors.
- No React/Dexie/Supabase imports inside domain.

## Acceptance criteria

- Invalid age rejected.
- 4th active goal rejected.
- Entity parsers validate required fields.
- Dependency rule enforced by inspection/tests.

## Tests / verification

Unit tests for schemas and domain rules.

## Out of scope

- No IndexedDB implementation.
- No UI.
- No Supabase.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
