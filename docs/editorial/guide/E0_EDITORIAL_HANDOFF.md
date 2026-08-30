# Hoopjot — E0 Editorial Handoff

## Current status

The Guide editorial system is complete in Spanish and English through **E0.11**.

- Spanish edition: frozen at E0.9.
- English translation: completed at E0.10.
- ES ↔ EN equivalence audit: passed at E0.11.
- Next phase: **E0.12 — Codex implementation contract**.

The frozen editorial content should not be reopened during E0.12 unless an objective error is found.

---

# 1. Product objective

These files are not intended to become 25 separate static manuals.

They are modular editorial sources for the Hoopjot PWA.

Guide is composed deterministically at runtime from:

```text
CORE
+
PRIMARY POSITION ROLE PACK
+
OPTIONAL HYBRID POSITION BRIDGE
```

There is no LLM content generation at runtime.

Guide V1 uses only:

- `primaryPosition`
- `secondaryPosition`

as editorial selectors.

---

# 2. Canonical bilingual sources

## Spanish

- `GUIDE_CORE_ES.md`
- `GUIDE_ROLE_MATRIX_ES.md`
- 5 `roles/*_ES.md` primary role packs
- 10 `roles/*_ES.md` hybrid bridges

Spanish is the semantic source of truth and remains frozen at E0.9.

## English

- `GUIDE_CORE_EN.md`
- `GUIDE_ROLE_MATRIX_EN.md`
- 5 `roles/*_EN.md` primary role packs
- 10 `roles/*_EN.md` hybrid bridges

English passed ES ↔ EN equivalence at E0.11.

---

# 3. Runtime selection model

For `locale = es`:

```text
GUIDE_CORE_ES
+ ROLE_ES(primaryPosition)
+ BRIDGE_ES(primaryPosition, secondaryPosition) if secondaryPosition exists
```

For `locale = en`:

```text
GUIDE_CORE_EN
+ ROLE_EN(primaryPosition)
+ BRIDGE_EN(primaryPosition, secondaryPosition) if secondaryPosition exists
```

The bridge key is order-independent.

Examples:

```text
PG + SG → PG role + PG_SG bridge
SG + PG → SG role + PG_SG bridge
```

The primary role pack always supplies the dominant perspective.

---

# 4. Position keys

Primary positions:

- `PG`
- `SG`
- `SF`
- `PF`
- `C`

Order-independent bridge keys:

- `PG_SG`
- `PG_SF`
- `PG_PF`
- `PG_C`
- `SG_SF`
- `SG_PF`
- `SG_C`
- `SF_PF`
- `SF_C`
- `PF_C`

---

# 5. Normative source

`GUIDE_ROLE_MATRIX_ES.md` is the authoritative composition specification.

`GUIDE_ROLE_MATRIX_EN.md` is its equivalent English edition.

The Matrix defines:

- allowed intervention points;
- `INSERT`;
- `OVERRIDE`;
- `BRIDGE`;
- exact Core anchors;
- Core-only points;
- the P09 screen invariant;
- selector boundaries;
- medical and product boundaries;
- final composition order.

---

# 6. E0.11 result

All 17 ES/EN canonical content pairs preserve:

- structure;
- point IDs;
- intervention types;
- role priorities;
- bridge neutrality;
- technical basketball meaning;
- medical and product boundaries.

Small English terminology/fluency corrections were made during E0.11.

No frozen Spanish content was changed.

See:

- `E0_11_EQUIVALENCE_AUDIT.md`
- `E0_11_EQUIVALENCE_MANIFEST.json`

---

# 7. E0.12 objective

E0.12 must convert the editorial architecture into an explicit implementation contract for Codex.

The contract must define at minimum:

- file/resource mapping;
- TypeScript position and locale types;
- bridge-key normalization;
- deterministic composition algorithm;
- representation of Core points and intervention anchors;
- behavior of `INSERT`, `OVERRIDE` and `BRIDGE`;
- locale fallback behavior;
- profile selector boundaries;
- rendering expectations;
- validation/tests;
- what must never be inferred from profile data;
- what editorial files Codex may and may not modify.

E0.12 is the first phase intended to be directly actionable by Codex.

---

# 8. Phase status

- E0.4 Core ES: closed
- E0.5 Role Matrix ES: closed
- E0.6 Role packs ES: closed
- E0.7 Hybrid bridges ES: closed
- E0.8 Compilation and audit ES: closed
- E0.9 Spanish freeze: closed
- E0.10 English translation: closed
- **E0.11 ES/EN equivalence: closed**
- E0.12 Codex implementation contract: next
