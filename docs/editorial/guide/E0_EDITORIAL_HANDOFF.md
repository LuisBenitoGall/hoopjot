# Hoopjot — E0 Editorial Handoff

## Purpose

This document is the handoff point for continuing Hoopjot editorial phase E0 in a new chat without reopening decisions already made.

It is NOT an implementation prompt for Codex.

Human editorial decisions are made by the user and ChatGPT.
Codex executes only after the editorial system is frozen and explicitly specified.

---

# 1. Product status before E0

The main Hoopjot remodel R00–R07 is complete and reviewed.

Final product structure currently implemented:
- Today
- Plan
- Journal
- Profile from the authenticated header

R07 final review: PASSED.

The remodel achieved the intended simplification:
- Today reduced to one focus and one meaningful CTA.
- Quick Reflection reduced to Practice/Game + rating + optional note + optional coach feedback.
- Plan contains the curated development map.
- Journal is a simple chronological memory.
- Profile remains secondary.
- Onboarding remains unchanged.
- Offline/local-first, Supabase sync, auth, i18n, recommendation infrastructure and tests remain intact.

No remodel-specific DB migration was created.

---

# 2. Post-R07 visual decisions already approved

The following visual/product polish decisions are approved for a later V1 phase:

1. Move legal/privacy links out of Today/Plan/Journal and into Profile.
2. Remove redundant Profile eyebrow/title treatment.
3. Replace technical Profile copy with plain player-facing copy.
4. Compact bottom navigation on desktop.
5. Improve Plan with sober basketball micro-diagrams and stronger editorial rhythm without changing its approved basketball copy.
6. Add explicit PWA installation support from Profile.
7. Future bottom navigation will contain four primary items:
   - Today / Hoy
   - Plan
   - Guide / Guía
   - Journal / Diario
8. Profile remains accessible from the header, not bottom navigation.

These are NOT yet implementation instructions.

---

# 3. PWA installation decision

Hoopjot should expose installation as an app, not pretend to universally create a desktop shortcut.

Future Profile section:

- Install Hoopjot / Instalar Hoopjot

Expected states:
- installable
- installed
- manual_install_required
- unsupported

Implementation later:
- `beforeinstallprompt` when available
- standalone/display-mode detection
- iOS/Safari manual instructions
- manifest/icon audit
- 192x192 and 512x512 icons
- maskable variants

This belongs to V1.4, not E0.

---

# 4. Guide source documents

Canonical original Spanish guide:

`docs/editorial/guide/GUIDE_SOURCE_IRIA_ES.md`

Rule:
- immutable canonical source
- preserve exactly
- never overwrite
- never let Codex rewrite it

It contains:
- 30 numbered work/habit points
- 12 rules
- final closing idea

Original source was written specifically for Iria and includes:
- age 20
- height 191 cm
- interior/pivot-oriented basketball development
- Kennedy-King context
- knee injury/recovery context
- academic/student context

First generalized draft:

`docs/editorial/guide/GUIDE_APP_EDITION_ES.md`

Status:
- useful editorial draft
- superseded as the final architecture
- DO NOT treat as approved final Guide content

Recommended eventual rename:
`GUIDE_APP_EDITION_ES_DRAFT_SUPERSEDED.md`

---

# 5. Core editorial decision

A single universal guide is NOT sufficient.

Different basketball positions require materially different emphasis.

Runtime AI must NOT generate player guides.

Instead Hoopjot will use a deterministic, pre-written editorial composition system:

```text
CORE GUIDE
+
PRIMARY POSITION ROLE PACK
+
OPTIONAL HYBRID POSITION BRIDGE
```

The user's existing profile selects the content deterministically.

No manual Guide selector is required.

No generated coaching.

No LLM call at runtime.

No copy is stored as a user-specific generated guide.

---

# 6. Five primary positions

Canonical position packs:

- PG — Point Guard / Base
- SG — Shooting Guard / Escolta
- SF — Small Forward / Alero
- PF — Power Forward / Ala-pívot
- C — Center / Pívot

`primaryPosition` determines the dominant role pack.

`secondaryPosition`, if present, adds one pre-written hybrid bridge.

The same hybrid bridge may serve both orderings, while the primary role pack keeps the dominant perspective distinct.

Example:

```text
primary=PG, secondary=SG
CORE + PG + PG_SG bridge

primary=SG, secondary=PG
CORE + SG + PG_SG bridge
```

---

# 7. Ten hybrid bridges

Pre-written hybrid modules:

- PG_SG
- PG_SF
- PG_PF
- PG_C
- SG_SF
- SG_PF
- SG_C
- SF_PF
- SF_C
- PF_C

A hybrid bridge is NOT a full guide.

It modifies/emphasizes only the points where the secondary position materially changes responsibilities, skills or development priorities.

---

# 8. 12 Rules decision

The 12 Rules are a common Hoopjot identity layer.

They remain shared across positions.

They should not be rewritten five different ways merely to create artificial personalization.

---

# 9. Positional emphasis

## PG
Primary themes:
- ball security
- tempo
- organization
- advantage recognition
- creation for teammates
- pick-and-roll reads
- passing
- drive-and-kick
- shooting after dribble/open shot
- point-of-attack defense
- communication

## SG
Primary themes:
- shooting threat
- foot preparation
- catch-and-shoot
- relocation
- off-ball movement
- closeout attack
- useful one/two-dribble creation
- secondary playmaking
- transition
- perimeter defense
- screen navigation

## SF
Primary themes:
- versatility
- spacing
- cutting
- transition
- open shooting
- closeout attack
- perimeter rebounding
- multi-position defense
- second actions
- simple passing
- off-ball activity

## PF
Primary themes:
- physical impact
- screening
- roll/pop
- short roll
- high post
- rebounding
- second chances
- closeout attack
- open shooting when appropriate
- help defense
- secondary rim protection
- interior passing

## C
Primary themes:
- rim running
- seals
- receiving
- finishing
- rebounding
- box-outs
- screening
- angles
- roll
- rim protection
- verticality
- outlet
- interior passing

The original Iria source is closest to the C/PF editorial perspective.

---

# 10. Treatment of rebound and shooting

Do not remove basketball fundamentals from positions where they are less central.

Change emphasis and responsibility instead.

Example:

For C:
- rebounding can be a central identity skill.

For PG:
- still box out the matchup
- help finish the possession
- collect long rebounds
- understand when to release into transition

Likewise:
- shooting exists across modern positions
- its priority, contexts and developmental progression differ by role

Avoid crude rules such as:
- guards do not rebound
- centers do not shoot

---

# 11. Preliminary 30-point matrix decision

The 30 original points will NOT all receive five rewritten versions.

Current classification to refine in E0.5:

| Point | Editorial treatment |
| --- | --- |
| 1. Starting point | Position-specific |
| 2. Availability | Core |
| 3. Reliability | Strongly position-specific |
| 4. Do not learn everything at once | Strongly position-specific |
| 5. Simple basketball | Core |
| 6. Use your body | Position-specific |
| 7. Rebounding | Position-specific emphasis |
| 8. Run | Position-specific responsibility |
| 9. Screening | Strongly position-specific |
| 10. Boring fundamentals | Strongly position-specific |
| 11. Learn basketball off court | Position-specific questions/examples |
| 12–20 | Mostly Core, with careful medical/general wording |
| 21. Easy to play with | Partly position-specific examples |
| 22. Talk | Partly position-specific communication |
| 23–25 | Mostly Core |
| 26. Development plan | Strongly position-specific |
| 27. Invisible stats | Strongly position-specific |
| 28–30 | Mostly Core |
| 12 Rules | Shared Core |

This table is NOT yet frozen. E0.5 must make it normative point by point.

---

# 12. Medical / health editorial boundary

The source contains knee-injury-specific material.

The general Guide must:
- never assume the user is injured
- never diagnose
- never prescribe rehab progression
- never tell a player to train through pain
- never infer medical status from profile
- refer injury-specific decisions to qualified professionals
- keep body awareness, recovery, sleep, nutrition and prevention as general athlete habits

Medical/injury data must NOT be used to dynamically personalize the Guide.

---

# 13. Product interaction boundary

Guide is editorial, not administrative.

Some source sections contain reflection frameworks, for example:
- five post-training questions
- twelve weekly 1–5 ratings

These may remain as optional reflection tools in the Guide.

They must NOT automatically become required Hoopjot forms.

Current Quick Reflection remains intentionally minimal:
- Practice/Game
- 1–5 focus rating
- optional note
- optional collapsed coach feedback

Do not reintroduce bureaucracy through Guide implementation.

No:
- Guide completion tracking
- reading percentages
- checkboxes
- streaks
- badges
- XP
- mandatory weekly rating form

---

# 14. Future Guide UX

Future bottom nav:

```text
Today | Plan | Guide | Journal
```

Profile remains in the header.

Guide answers:
> How do I want to learn, train and compete?

Plan answers:
> What basketball areas are we developing?

Guide should feel like a digital basketball book, not a dashboard.

Possible Guide structure after editorial freeze:
- GuideHero
- chapter index
- six editorial chapters
- 30 numbered points
- 12 Rules
- final idea

Possible six-chapter reading architecture:

1. Build reliability — points 1–5
2. Build your game — points 6–10
3. Learn every day — points 11–15
4. Sustain the process — points 16–20
5. Be part of a team — points 21–24
6. Grow with perspective — points 25–30

This chapter grouping preserves original point order.

It may be refined editorially before implementation.

---

# 15. E0 phase status

Completed:

- E0.1 Freeze original source — COMPLETE
- E0.2 First generalized Spanish draft — COMPLETE, but superseded as final architecture
- E0.3 Positional editorial architecture — COMPLETE

Next:

- E0.4 Write `GUIDE_CORE_ES.md`
- E0.5 Write/freeze `GUIDE_ROLE_MATRIX_ES.md`
- E0.6 Write five position role packs
- E0.7 Write ten hybrid bridges
- E0.8 Compile/review all position combinations
- E0.9 Freeze Spanish editorial edition
- E0.10 Translate approved system to English
- E0.11 Review ES/EN equivalence
- E0.12 Produce deterministic editorial contract for Codex

Codex must remain out of E0.4–E0.11.

---

# 16. Planned Spanish editorial file structure

```text
docs/editorial/guide/
│
├─ E0_EDITORIAL_HANDOFF.md
├─ GUIDE_SOURCE_IRIA_ES.md
├─ GUIDE_APP_EDITION_ES_DRAFT_SUPERSEDED.md
├─ GUIDE_CORE_ES.md
├─ GUIDE_ROLE_MATRIX_ES.md
├─ GUIDE_COMPOSITION_RULES.md
│
├─ roles/
│  ├─ PG_ES.md
│  ├─ SG_ES.md
│  ├─ SF_ES.md
│  ├─ PF_ES.md
│  └─ C_ES.md
│
└─ hybrids/
   ├─ PG_SG_ES.md
   ├─ PG_SF_ES.md
   ├─ PG_PF_ES.md
   ├─ PG_C_ES.md
   ├─ SG_SF_ES.md
   ├─ SG_PF_ES.md
   ├─ SG_C_ES.md
   ├─ SF_PF_ES.md
   ├─ SF_C_ES.md
   └─ PF_C_ES.md
```

Do not create EN files until Spanish editorial content is frozen.

---

# 17. Immediate task in the next chat

Start with E0.4 and E0.5.

Do NOT involve Codex.

Task:

1. Derive `GUIDE_CORE_ES.md` from the canonical source and approved generalization principles.
2. Create `GUIDE_ROLE_MATRIX_ES.md` as a normative 30-row matrix specifying for every point:
   - core text retained
   - primary role override
   - primary role insert
   - hybrid bridge allowed/not allowed
   - medical/generalization note where relevant
   - whether the point may use factual profile values
3. Review both editorial documents with the user before writing the five role packs.

No role pack should be drafted until the matrix is approved.
