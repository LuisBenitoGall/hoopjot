# Codex execution prompts

Use these prompts **one at a time and in order**.

The repository documentation is the durable source of truth. Do not paste all documentation into the prompt.

---

## 0. Repository orientation (optional but recommended)

```text
Read AGENTS.md and all files under docs/. Do not modify code or documentation yet.

Summarize:
1. the product goal;
2. the architectural boundaries;
3. the MVP milestones;
4. the five highest-risk implementation areas;
5. any contradictions you find in the documentation.

Do not implement anything.
```

Resolve genuine documentation contradictions before implementation.

---

## 1. Bootstrap

```text
Implement `specs/000-bootstrap.md`.

Follow AGENTS.md.
Read every document referenced by the spec before coding.
Implement only this spec.

Run the required verification commands.

At completion report:
1. what you implemented;
2. files materially changed;
3. tests added;
4. commands run and outcomes;
5. deviations, assumptions or unresolved risks.

Do not start the next spec.
```

---

## 2. Design system

```text
Implement `specs/001-design-system.md`.

Follow AGENTS.md and the referenced documentation.
Use `assets/hoopnote-brand-board.png` as visual direction, not as a pixel-perfect screen mockup.

Keep the implementation mobile-first, accessible and reusable.
Implement only this spec.
Run all relevant verification.
Do not start another spec.
```

---

## 3. Domain model

```text
Implement `specs/002-domain-model.md`.

Treat the domain layer as pure TypeScript.
It must not depend on React, Dexie, Supabase or browser APIs.

Implement only the current spec and run all relevant tests/checks.
Do not continue into persistence.
```

---

## 4. Local persistence

```text
Implement `specs/003-local-database.md`.

Use Dexie/IndexedDB behind the repository contracts already defined.
Do not use localStorage for domain data.
Do not introduce Supabase syncing yet.

Run repository integration tests and all standard verification.
Stop after this spec.
```

---

## 5. Authentication

```text
Implement `specs/004-authentication.md`.

Use Supabase email authentication.
Keep Supabase calls outside React presentation components.
Do not add social login or remote product-data tables.

Run all relevant verification and document any Supabase console configuration required.
Stop after this spec.
```

---

## 6. Onboarding

```text
Implement `specs/005-onboarding.md`.

Preserve all bilingual, age, optional-data and offline/local-persistence requirements.
Do not add product features outside onboarding.

Run unit/component/E2E checks required by the spec.
Stop when its acceptance criteria pass.
```

---

## 7. Knowledge base

```text
Implement `specs/006-knowledge-base.md`.

Treat basketball content as curated editorial data.
Do not fabricate a large content catalog: implement only the starter content required by the spec and clearly isolate it for later editorial work.

Validate English and Spanish content.
Stop after this spec.
```

---

## 8. Today

```text
Implement `specs/007-today.md`.

Use the temporary deterministic starter-focus logic described in the spec.
Do not prematurely build the full recommendation engine.

The page must work from local data and remain useful offline.
Run all relevant checks and stop after this spec.
```

---

## 9. Sessions and reflections

```text
Implement `specs/008-sessions-and-reflections.md`.

Optimize the UX for a very short pre-session check-in and 30–90 second post-session reflection.
Do not implement AI or medical interpretation.

Persist locally first and enqueue sync operations as designed.
Stop after verification passes.
```

---

## 10. Journal

```text
Implement `specs/009-journal.md`.

Build the chronological local-first journal and session detail experience.
Keep dates locale-aware and hide tombstoned records.

Do not add search or advanced analytics.
Run verification and stop.
```

---

## 11. Recommendation engine

```text
Implement `specs/010-recommendation-engine.md`.

Read `docs/RECOMMENDATION_ENGINE.md` carefully.
Keep the engine pure, deterministic, explainable and independent of React/Dexie.
Add comprehensive unit tests before integrating it into Today.

Do not introduce AI.
Stop after this spec.
```

---

## 12. Progress

```text
Implement `specs/011-progress-and-weekly-review.md`.

Show qualitative progress without fake precision or competitive gamification.
Implement weekly review from structured data only.

Run the required tests and stop.
```

---

## 13. Supabase data + sync

```text
Implement `specs/012-supabase-data-model-and-sync.md`.

This is a high-risk phase.
Before editing, inspect the current repository and produce a concise execution plan covering:
- SQL migrations;
- RLS;
- local bootstrap;
- sync queue;
- retry;
- conflict handling;
- tombstones;
- tests.

Then implement the approved scope from the spec.
Never expose service-role credentials.
Components must not call Supabase directly.

Run all relevant verification and document manual Supabase setup.
Stop after this spec.
```

---

## 14. PWA hardening

```text
Implement `specs/013-pwa-hardening.md`.

Verify real offline behavior rather than only checking that a manifest exists.
Core local flows must remain usable after connectivity is disabled.

Do not add push notifications.
Run offline E2E tests and production build.
Stop after this spec.
```

---

## 15. QA / MVP release

```text
Implement `specs/014-qa-and-release-hardening.md`.

Treat this as an MVP release gate.
Prioritize bugs, regressions, accessibility, offline failures, security mistakes and missing tests over cosmetic additions.

Run the complete verification suite and production build.
Update README/setup documentation where required.
Do not add post-MVP features.
```

---

# Useful Codex review prompt after each milestone

```text
Review the changes made for the current milestone against:
- AGENTS.md;
- the implemented spec;
- all referenced docs.

Focus on:
1. acceptance criteria not actually satisfied;
2. architectural boundary violations;
3. offline regressions;
4. security/privacy issues;
5. missing or weak tests;
6. unnecessary scope additions.

Report findings by severity with file/line references.
Do not modify files.
```

# Useful correction prompt

```text
Fix only the confirmed findings from the previous review.

Do not refactor unrelated code.
Preserve the current spec scope.
Run the relevant verification commands and report the results.
```
