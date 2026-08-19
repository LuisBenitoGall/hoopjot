# 010 — Recommendation engine

## Goal

Replace placeholder focus selection with the deterministic V1 recommendation engine.

## Read first

- `docs/RECOMMENDATION_ENGINE.md`
- `docs/DATA_MODEL.md`
- `docs/CONTENT_MODEL.md`

## Deliverables

- Pure scoring module.
- Candidate filtering.
- Goal, difficulty, observation, recency and position signals.
- Repeat cooldown.
- Consecutive-skill penalty.
- Deterministic tie-break.
- Reason code.
- Integrate generation into Today without coupling engine to React/Dexie.

## Acceptance criteria

- Same inputs produce same ranking.
- Exact guideline repeat cooldown enforced.
- Goal match affects ranking.
- Recent negative observation affects ranking.
- Position fit affects ranking.
- Fallback works with sparse user history.

## Tests / verification

Comprehensive unit tests described in recommendation docs plus existing suite.

## Out of scope

- No AI.
- No automatic NLP from reflections.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
