# 011 — Progress and weekly review

## Goal

Implement simple qualitative progress and weekly review without fake precision.

## Read first

- `docs/PRODUCT.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN_SYSTEM.md`

## Deliverables

- Progress overview: recent sessions, common focus areas, improving/stable/needs-attention signals.
- Weekly review generation from structured data.
- User answers: what improved, what to improve next.
- Persist WeeklyReview locally.
- Avoid prominent arbitrary numeric player grades.

## Acceptance criteria

- Works with sparse data and shows appropriate empty/learning states.
- Weekly review does not duplicate for same week.
- User-entered weekly notes survive reload.

## Tests / verification

Unit tests for aggregation and E2E weekly review smoke test.

## Out of scope

- No AI-written summaries.
- No public comparison.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
