# HOOPJOT — E0.12 CODEX IMPLEMENTATION CONTRACT

**Status:** FINAL — directly actionable by Codex  
**Contract version:** E0.12  
**Editorial source:** E0.11 bilingual equivalent Guide  
**Product target:** Hoopjot PWA  
**Normative companion:** `E0_12_GUIDE_CONTENT_REGISTRY.json`

---

# 1. PURPOSE

This contract defines how Codex must implement the **Guide** feature in the Hoopjot PWA from the frozen bilingual editorial sources.

The Markdown files are not the final product.

They are modular editorial sources that the application must resolve deterministically according to the player's basketball position.

Guide V1 must produce position-aware content without generating prose at runtime.

The implementation model is:

```text
CORE
+
PRIMARY POSITION ROLE PACK
+
OPTIONAL ORDER-INDEPENDENT HYBRID BRIDGE
```

For example:

```text
primaryPosition = PG
secondaryPosition = SG
locale = es

→ GUIDE_CORE_ES
+ PG_ES
+ PG_SG_ES
```

```text
primaryPosition = SG
secondaryPosition = PG
locale = en

→ GUIDE_CORE_EN
+ SG_EN
+ PG_SG_EN
```

The same bridge is used in both position orders.

The primary role pack always supplies the dominant positional perspective.

---

# 2. NON-NEGOTIABLE PRODUCT RULES

Codex MUST preserve all of the following.

1. There is **no LLM generation** of Guide content at runtime.
2. Guide V1 selects editorial content only from:
   - `primaryPosition`
   - `secondaryPosition`
3. No other profile value may select, alter, remove or interpolate editorial Guide content.
4. The alias may be used by the UI outside canonical Guide copy, for example in a page heading.
5. `dominantHand` never selects a Guide variant.
6. Height, body type, experience, competitive level or physical context never select Guide variants.
7. Medical or injury information never selects Guide variants.
8. A secondary position adds only the prewritten hybrid bridge.
9. The bridge key is order-independent.
10. The primary role pack remains dominant.
11. Do not create or store 25 authored Guides per language.
12. Do not flatten the editorial architecture into position-specific duplicated documents.
13. The 17 Core-only points remain identical for every position combination within a locale.
14. The P09 universal screening principle remains Core and appears once.
15. Bridge P26 never creates another complete development progression.
16. The 12 Rules remain Core-only.
17. Guide must not introduce mandatory journaling, checklists, streaks, badges, XP or medical tracking.

---

# 3. CANONICAL SOURCES

Codex may read the following editorial sources.

## Spanish

```text
GUIDE_CORE_ES.md
GUIDE_ROLE_MATRIX_ES.md
roles/PG_ES.md
roles/SG_ES.md
roles/SF_ES.md
roles/PF_ES.md
roles/C_ES.md
roles/PG_SG_ES.md
roles/PG_SF_ES.md
roles/PG_PF_ES.md
roles/PG_C_ES.md
roles/SG_SF_ES.md
roles/SG_PF_ES.md
roles/SG_C_ES.md
roles/SF_PF_ES.md
roles/SF_C_ES.md
roles/PF_C_ES.md
```

## English

The same mapping exists with `_EN`.

The Spanish edition is the semantic source of truth.

The English edition passed E0.11 equivalence and should be consumed directly rather than translated in the application.

## Normative composition rules

`GUIDE_ROLE_MATRIX_ES.md` is authoritative if implementation questions arise.

`GUIDE_ROLE_MATRIX_EN.md` is its equivalent English version.

`E0_12_GUIDE_CONTENT_REGISTRY.json` converts the decisions needed by code into a machine-readable registry.

---

# 4. TYPES

Use equivalent types in the project's language/runtime. If the PWA is TypeScript, the expected model is:

```ts
export type GuideLocale = 'es' | 'en';

export type Position =
  | 'PG'
  | 'SG'
  | 'SF'
  | 'PF'
  | 'C';

export type BridgeKey =
  | 'PG_SG'
  | 'PG_SF'
  | 'PG_PF'
  | 'PG_C'
  | 'SG_SF'
  | 'SG_PF'
  | 'SG_C'
  | 'SF_PF'
  | 'SF_C'
  | 'PF_C';

export type GuidePointId =
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05'
  | 'P06' | 'P07' | 'P08' | 'P09' | 'P10'
  | 'P11' | 'P12' | 'P13' | 'P14' | 'P15'
  | 'P16' | 'P17' | 'P18' | 'P19' | 'P20'
  | 'P21' | 'P22' | 'P23' | 'P24' | 'P25'
  | 'P26' | 'P27' | 'P28' | 'P29' | 'P30';

export interface GuideSelection {
  locale: GuideLocale;
  primaryPosition: Position;
  secondaryPosition?: Position | null;
}
```

Do not add new editorial selectors to `GuideSelection`.

---

# 5. BRIDGE NORMALIZATION

Bridge lookup must be deterministic.

Use the canonical position order:

```ts
const POSITION_RANK: Record<Position, number> = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
};
```

Expected behavior:

```ts
export function getBridgeKey(
  primary: Position,
  secondary?: Position | null,
): BridgeKey | null {
  if (!secondary || secondary === primary) return null;

  const [a, b] = [primary, secondary].sort(
    (x, y) => POSITION_RANK[x] - POSITION_RANK[y],
  );

  return `${a}_${b}` as BridgeKey;
}
```

Examples:

```text
PG + SG → PG_SG
SG + PG → PG_SG

C + SF → SF_C
SF + C → SF_C

PF + C → PF_C
C + PF → PF_C
```

Never infer a different bridge if a key is missing.

A missing canonical bridge is an implementation/content validation failure.

---

# 6. CONTENT INGESTION ARCHITECTURE

## Required principle

**Do not parse and splice free-form Markdown strings in the browser/client at runtime.**

The source Markdown is editorial infrastructure, not a runtime composition protocol.

Codex must introduce a deterministic content-ingestion layer that converts the canonical Markdown into structured Guide data before or during the application build.

Recommended architecture:

```text
docs/editorial/guide/            ← canonical editorial source
scripts/build-guide-content.*    ← deterministic compiler / importer
src/features/guide/generated/    ← generated structured content
src/features/guide/              ← resolver + UI
```

Equivalent project paths are acceptable.

The behavior is normative; exact folders are not.

## Build-time output

The generated content should represent:

- Guide introduction/about content;
- six chapters;
- 30 ordered points;
- stable point IDs;
- Core content fragments;
- position intervention slots;
- Rules;
- final closing content.

A suitable conceptual shape is:

```ts
interface GuidePointTemplate {
  id: GuidePointId;
  chapterId: string;
  title: string;

  coreBefore: RenderableGuideContent;

  intervention?: {
    slotId: string;
    roleMode: 'insert' | 'override';
    coreReplaceable?: RenderableGuideContent;
  };

  coreAfter: RenderableGuideContent;
}

interface GuideIntervention {
  pointId: GuidePointId;
  type: 'INSERT' | 'OVERRIDE' | 'BRIDGE';
  content: RenderableGuideContent;
}
```

`RenderableGuideContent` may be a safe Markdown AST, a project-native rich-text block array or another deterministic structured representation.

Do not use raw unsanitized HTML.

Do not make the UI understand editorial metadata such as:

```text
Estado editorial
Editorial status
Depende de
Depends on
Tipo
Type
PROPÓSITO DEL ROL
ROLE PURPOSE
PROPÓSITO DEL BRIDGE
BRIDGE PURPOSE
```

Those are source metadata, not player-facing content.

---

# 7. INTERVENTION MODEL

The machine-readable slot map lives in:

`E0_12_GUIDE_CONTENT_REGISTRY.json`

## Primary INSERT points

```text
P01
P03
P06
P07
P08
P21
P22
```

Behavior:

```text
CORE BEFORE SLOT
→ PRIMARY INSERT
→ OPTIONAL BRIDGE, if allowed in this point
→ CORE AFTER SLOT
```

P01 never receives a bridge.

## Primary OVERRIDE points

```text
P04
P09
P10
P11
P26
P27
```

Behavior:

```text
CORE BEFORE REPLACEABLE ZONE
→ PRIMARY OVERRIDE
→ OPTIONAL BRIDGE
→ CORE AFTER REPLACEABLE ZONE
```

The replaceable zone only is removed.

Never replace the whole point.

## Bridge points

```text
P03
P04
P06
P07
P08
P09
P10
P11
P21
P22
P26
P27
```

A bridge:

- always uses `BRIDGE`;
- never overrides Core;
- never overrides the primary role;
- is inserted after the primary intervention, if any;
- remains before the Core closing section of that point.

---

# 8. EXACT POINT-SLOT CONTRACT

The implementation must use stable semantic slot identifiers instead of runtime language-specific text matching.

The slot IDs are defined in the registry.

Summary:

| Point | Primary behavior | Stable slot |
| --- | --- | --- |
| P01 | INSERT | `after_role_influence_before_common_principle` |
| P03 | INSERT | `after_role_variation_before_become_useful` |
| P04 | OVERRIDE | `replace_level_specific_content` |
| P06 | INSERT | `after_body_and_laterality_before_body_as_tool` |
| P07 | INSERT | `after_rebound_role_variation_before_never_do` |
| P08 | INSERT | `after_transition_state_blocks_before_arrive_early_close` |
| P09 | OVERRIDE | `replace_positional_screen_responsibility` |
| P10 | OVERRIDE | `replace_generic_fundamentals_priority` |
| P11 | OVERRIDE | `replace_generic_video_questions` |
| P21 | INSERT | `after_common_team_examples_before_invisible_work` |
| P22 | INSERT | `after_information_from_your_place_before_speaking_close` |
| P26 | OVERRIDE | `replace_phase_specific_content` |
| P27 | OVERRIDE | `replace_invisible_actions_and_questions` |

The compiler/importer may use point-specific parsing logic once at build time.

The client must not locate these slots by searching for Spanish or English sentences during runtime.

---

# 9. CORE-ONLY POINTS

The following points are immutable across positions:

```text
P02
P05
P12
P13
P14
P15
P16
P17
P18
P19
P20
P23
P24
P25
P28
P29
P30
```

The resolved result for these points must be identical for all 25 position selections within a locale.

---

# 10. COMPOSITION ALGORITHM

The application-facing resolver should behave conceptually as follows:

```ts
export function resolveGuide(
  selection: GuideSelection,
  content: GuideContentRegistry,
): ResolvedGuide {
  const locale = selection.locale;
  const primary = selection.primaryPosition;
  const bridgeKey = getBridgeKey(primary, selection.secondaryPosition);

  const core = content.core[locale];
  const role = content.roles[locale][primary];
  const bridge = bridgeKey
    ? content.bridges[locale][bridgeKey]
    : null;

  return composeGuide({
    core,
    role,
    bridge,
    locale,
    primaryPosition: primary,
    secondaryPosition: selection.secondaryPosition ?? null,
  });
}
```

For every point:

```text
1. Start from its Core template.
2. Find the primary intervention for that Pxx, if one exists.
3. Apply INSERT or delimited OVERRIDE according to the registry.
4. Find the bridge intervention for that Pxx, if one exists.
5. Append the bridge in the authorized position.
6. Preserve the remaining Core content.
```

The resolver returns one Guide document model for rendering.

It must not persist a newly authored Guide.

---

# 11. LOCALE BEHAVIOR

Supported Guide locales in V1:

```text
es
en
```

The application i18n layer may select a locale before calling Guide.

Guide itself must not translate content.

Expected resolver behavior:

- supported locale → use that locale directly;
- unsupported/missing locale → use the application's normalized fallback locale;
- if Guide needs its own final fallback, use `es`;
- never mix ES and EN fragments within the same resolved Guide;
- a missing canonical EN file is a build/test error, not a reason to translate at runtime.

UI strings such as navigation labels belong to the normal app i18n system and are separate from canonical Guide content.

---

# 12. PROFILE INTEGRATION

Guide may read:

```ts
profile.primaryPosition
profile.secondaryPosition
```

Only those fields affect canonical Guide content.

The following fields MUST NOT influence Guide copy selection:

```text
alias
birthYear
heightCm
dominantHand
experienceYears
competitiveLevel
weeklyPractices
weeklyGames
physicalContext
medical data
injury data
```

The UI may use `alias` outside the canonical content, for example:

```text
Iria's Guide
```

if that pattern fits the product design.

That must not alter the canonical 30-point text.

If `primaryPosition` is absent or invalid, do not guess a position from height, experience or other profile data.

Use the product's normal incomplete-profile flow.

---

# 13. MEDICAL AND SAFETY BOUNDARY

Codex must preserve the editorial boundary already present in Core.

The application must not add runtime logic that:

- assumes an injury;
- diagnoses a condition;
- recommends rehabilitation;
- prescribes an individual training load;
- tells the player to train through pain;
- modifies Guide from medical or health data.

Guide can display the frozen general safety language already present in Core.

Individual medical decisions remain with qualified professionals.

---

# 14. PLAYER-FACING RENDERING

Guide should feel like one coherent document.

Do not visually expose whether a paragraph originated in:

- Core;
- role pack;
- bridge.

Do not label sections with `INSERT`, `OVERRIDE` or `BRIDGE`.

Do not display source filenames.

Player-facing structure should preserve:

- About this Guide;
- six chapters;
- 30 numbered points;
- point subheadings;
- bullets;
- quotations/callouts where present;
- 12 Rules;
- final closing section.

Navigation may use chapters and point IDs.

The application may provide reading/navigation affordances, but the Guide editorial layer does not require progress tracking.

Do not turn optional reflections into required forms.

---

# 15. DATA STORAGE

Canonical Guide content is static application content.

Unless the existing repository architecture has a compelling reason otherwise:

- do not store canonical Guide copy in Supabase rows;
- do not duplicate canonical content per user;
- do not persist the 25 position combinations;
- do not make network access necessary to assemble Guide.

Profile position fields may of course live in the normal user profile data model.

A resolved Guide should be derivable locally from:

```text
locale
primaryPosition
secondaryPosition
bundled/generated content registry
```

---

# 16. BUILD VALIDATION

The Guide content compiler/importer must fail the build or test suite when canonical structure is invalid.

At minimum validate:

1. all 5 role packs exist for ES and EN;
2. all 10 bridges exist for ES and EN;
3. both Core files exist;
4. every role/bridge intervention uses a valid Pxx;
5. every primary intervention is in an authorized point;
6. every bridge intervention is in an authorized bridge point;
7. bridge files contain only `BRIDGE` interventions;
8. P01 never receives a bridge;
9. Core has exactly P01–P30 in order;
10. the 17 Core-only points have no role or bridge intervention;
11. all ten canonical bridge keys resolve in both orders;
12. ES and EN intervention maps remain structurally equivalent.

Do not silently ignore malformed editorial content.

---

# 17. COMPOSITION TEST MATRIX

Tests must resolve all 25 Guide selections in both languages.

That is:

```text
5 single-position Guides
+
20 ordered primary + secondary combinations
=
25 per locale
=
50 resolution cases
```

The exact cases are listed in `E0_12_GUIDE_CONTENT_REGISTRY.json`.

For each resolved Guide assert:

- exactly 30 point IDs;
- IDs are P01 → P30 in order;
- no duplicate point ID;
- 17 Core-only points are unchanged within that locale;
- no editorial source metadata is visible;
- P09 contains the universal Core screen principle exactly once;
- the bridge is the same for A+B and B+A;
- the role pack differs according to primary position;
- bridge P26 does not create another full staged progression;
- the 12 Rules appear exactly once;
- no unsupported profile field changes the result.

Recommended property test:

```ts
resolveGuide({
  locale: 'es',
  primaryPosition: 'PG',
  secondaryPosition: 'SG',
})
```

and

```ts
resolveGuide({
  locale: 'es',
  primaryPosition: 'SG',
  secondaryPosition: 'PG',
})
```

must share the same `PG_SG` bridge content while using different primary role content.

---

# 18. DETERMINISM TEST

For a fixed triple:

```text
(locale, primaryPosition, secondaryPosition)
```

Guide output must be deterministic.

Repeated resolution must produce the same content model.

Changing unrelated profile fields must not change the canonical resolved content.

Conceptually:

```ts
resolveGuide({
  locale: 'es',
  primaryPosition: 'SF',
  secondaryPosition: 'PF',
})
```

must return the same canonical Guide regardless of:

```text
heightCm
dominantHand
birthYear
experienceYears
weeklyPractices
physicalContext
alias
```

except that alias may independently affect non-canonical UI chrome.

---

# 19. FILE OWNERSHIP

During Guide implementation Codex:

## MAY

- add application code;
- add a deterministic build/import script;
- add generated structured content;
- add tests;
- add Guide UI components;
- add integration with existing profile position fields;
- add normal app i18n UI labels.

## MUST NOT

- rewrite canonical editorial Markdown;
- add new role variants;
- add new bridge combinations;
- alter Spanish or English basketball advice;
- change authorized intervention points;
- use other profile data as Guide selectors;
- add LLM generation;
- create medical personalization;
- convert optional reflection prompts into mandatory product workflows.

If implementation reveals an objective contradiction in canonical content, stop and report it instead of silently editing editorial files.

---

# 20. RECOMMENDED MODULE BOUNDARIES

Adapt naming to the existing repository, but keep responsibilities separate.

```text
guide.types
  Position / BridgeKey / GuideSelection / resolved content types

guide.registry
  file/content maps and canonical position ordering

guide.bridge
  getBridgeKey()

guide.content
  generated structured bilingual content

guide.compose
  INSERT / OVERRIDE / BRIDGE composition

guide.validate
  build-time/source validation

Guide UI
  rendering and navigation only
```

The UI should not contain composition rules.

The profile layer should not contain editorial content.

The composer should not know about medical, height or experience fields.

---

# 21. ACCEPTANCE CRITERIA

The Guide implementation is complete only when:

- the PWA can render Guide in ES and EN;
- `primaryPosition` selects the correct role pack;
- `secondaryPosition` selects the correct order-independent bridge;
- single-position profiles work without a bridge;
- same-position primary/secondary behaves as no bridge;
- all 50 locale/position resolution test cases pass;
- the resolved Guide has 30 points in canonical order;
- player-facing output contains no editorial metadata;
- no LLM or runtime prose generation is involved;
- no unsupported profile value changes canonical Guide content;
- canonical Markdown remains unmodified;
- all tests pass in the repository's normal CI/test command.

---

# 22. IMPLEMENTATION REPORT EXPECTED FROM CODEX

When Codex finishes, it should report:

1. files created or changed;
2. where the canonical Markdown is ingested;
3. where generated/structured Guide content lives;
4. how bridge normalization works;
5. how Guide resolution is connected to profile fields;
6. how locale selection works;
7. tests added and their results;
8. confirmation that editorial Markdown was not modified;
9. any repository-specific deviation from the recommended module paths and why.

---

# 23. FINAL RULE

The implementation problem is not:

> “Write a Guide for this player.”

It is:

> “Resolve the correct prewritten Guide modules for this player's selected basketball positions and locale, then compose them deterministically according to the editorial contract.”

That distinction is the core of the feature.
