# CODEX TASK — IMPLEMENT HOOPJOT GUIDE V1

Read these files before changing application code:

1. `docs/editorial/guide/E0_12_CODEX_IMPLEMENTATION_CONTRACT.md`
2. `docs/editorial/guide/E0_12_GUIDE_CONTENT_REGISTRY.json`
3. `docs/editorial/guide/GUIDE_ROLE_MATRIX_ES.md`
4. `docs/editorial/guide/GUIDE_CORE_ES.md`
5. `docs/editorial/guide/GUIDE_CORE_EN.md`
6. the 30 bilingual files in `docs/editorial/guide/roles/`

Then implement Guide V1 in the existing PWA.

## Goal

Render one deterministic bilingual Guide from:

```text
locale
primaryPosition
secondaryPosition
```

using:

```text
Core + primary role pack + optional order-independent hybrid bridge
```

## Required behavior

- no LLM/runtime prose generation;
- no 25 duplicated authored Guides;
- no Guide personalization from height, dominant hand, age, experience, level, activity, physical context or medical data;
- no changes to canonical editorial Markdown;
- ES and EN supported;
- bridge key order-independent;
- primary role remains dominant;
- INSERT / delimited OVERRIDE / BRIDGE behavior follows the contract;
- player-facing output hides editorial metadata;
- static content should be ingested into a structured representation before/client-build rather than spliced from free-form Markdown in the browser;
- implement validation and the full 50-case locale/position resolution test matrix.

## Repository integration

First inspect the existing app architecture, routing, profile model, i18n system, test setup and styling conventions.

Reuse existing patterns instead of introducing a parallel architecture.

Do not create a new profile field if `primaryPosition` or `secondaryPosition` already exists under another established model name; adapt through a narrow mapping layer when needed.

Do not alter unrelated product behavior.

## Completion

Run the repository's normal tests, lint/typecheck/build commands that are relevant to the changed code.

Return a concise implementation report matching section 22 of the E0.12 contract.

If the repository contradicts a required editorial behavior, stop and report the conflict rather than silently changing the Guide content.
