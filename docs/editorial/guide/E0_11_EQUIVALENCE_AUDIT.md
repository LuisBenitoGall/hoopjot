# HOOPJOT — E0.11 ES ↔ EN EQUIVALENCE AUDIT

**Result:** PASS  
**Spanish source:** E0.9 frozen edition  
**English content files audited:** 17  
**Validation errors:** 0

## Purpose

E0.11 verifies that the English Guide is structurally, semantically and technically equivalent to the frozen Spanish Guide while preserving the deterministic runtime model:

```text
CORE
+ PRIMARY ROLE PACK
+ OPTIONAL ORDER-INDEPENDENT HYBRID BRIDGE
```

## What was checked

- exact 30-point Core order;
- exact 1–23 Matrix section order;
- identical Pxx intervention maps in every ES/EN role and bridge pair;
- identical `INSERT`, `OVERRIDE` and `BRIDGE` intervention sequences;
- matching Markdown structure and bullet counts;
- the P09 `shoulder to shoulder` invariant;
- the medical and health boundary;
- the product boundary;
- `primaryPosition` / `secondaryPosition` as the only Guide V1 editorial selectors;
- role identity and priority equivalence for PG, SG, SF, PF and C;
- order-neutrality of all ten bridges;
- no second development progression inside bridge P26;
- no unauthorized profile selector inside role or bridge content;
- natural basketball English for screens, closeouts, roll/pop, short roll, handoff, box out and transition concepts.

## English corrections made during E0.11

The Spanish frozen edition was not changed.

The audit made only small English corrections where meaning was already present but wording was less natural or less consistent:

- Core P08: `WE HAVE WON/LOST THE BALL` → basketball-specific `WE HAVE REGAINED/LOST POSSESSION`;
- PF role purpose: removed an awkward impersonal construction;
- five bridge purposes: normalized player-reference pronouns;
- SG: normalized terminology for coming off off-ball screens (`straight cut`, `reject the screen`, etc.);
- SG_SF: normalized the same screen-exit wording;
- SF: improved the natural English rendering of helping finish a possession on the boards.

No role priority, bridge behavior, selector, medical boundary or basketball instruction was changed.

## Pairwise result

All 17 ES ↔ EN canonical pairs: **PASS**.

## Composition-level equivalence

Because every ES/EN pair preserves the same point IDs and intervention types, the same deterministic composition rule produces the same editorial structure in both locales:

```text
ES:
CORE_ES + ROLE_ES(primaryPosition) + BRIDGE_ES(pair) if applicable

EN:
CORE_EN + ROLE_EN(primaryPosition) + BRIDGE_EN(pair) if applicable
```

The bridge key remains order-independent and the primary role pack remains the dominant perspective.

There is no need to store 25 precompiled Guides per language.

## Spanish integrity

All 17 frozen Spanish canonical content files are byte-identical to the E0.10 package: **YES**.

## Phase status

- E0.9 Spanish freeze: closed
- E0.10 English translation: closed
- **E0.11 ES/EN equivalence: closed**
- E0.12 Codex implementation contract: next
