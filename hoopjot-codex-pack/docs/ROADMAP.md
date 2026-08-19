# Roadmap

## MVP execution order

### M0 — Bootstrap
Tooling, app shell, routing, CI-quality scripts.

### M1 — Design system
Brand tokens, layout, navigation primitives, key components.

### M2 — Domain model
Pure TypeScript domain types, schemas and repository contracts.

### M3 — Local persistence
Dexie database, repositories and migrations.

### M4 — Authentication
Supabase email auth, protected routing, session restoration.

### M5 — Onboarding
Profile, goals, self-assessment, locale and age gate.

### M6 — Knowledge base
Curated skill/guideline content and Game browsing experience.

### M7 — Today
Daily focus and pre-session experience.

### M8 — Sessions & reflections
Check-in, session completion, post-session reflection.

### M9 — Journal
Timeline/history and session detail.

### M10 — Recommendation engine
Deterministic adaptive daily focus.

### M11 — Progress & weekly review
Trends and weekly qualitative review.

### M12 — Supabase data sync
Remote tables, RLS, sync queue and conflict behavior.

### M13 — PWA hardening
Offline shell, installability, update handling, reconnection UX.

### M14 — QA & release hardening
E2E, accessibility, performance, error states, Vercel deployment docs.

## Post-MVP

### M15 — AI interpretation
Free-text → structured observations.
No direct AI medical advice or unconstrained coaching.

### M16 — Video
Upload/storage, clip tagging and personal examples.

### M17 — Coach/team context
Only after validating individual product value.

## Release gate

Do not call MVP complete until:
- core flows work offline after bootstrap;
- data survives reload;
- sync is reliable enough for normal single-device use;
- RLS tests/policies exist;
- English/Spanish work;
- no MVP flow requires AI.
