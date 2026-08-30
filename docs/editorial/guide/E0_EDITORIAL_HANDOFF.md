# Hoopjot — E0 Editorial Handoff

## Current status

The Guide editorial and implementation-specification work is complete through **E0.12**.

- E0.9: Spanish edition frozen.
- E0.10: English translation completed.
- E0.11: ES ↔ EN equivalence passed.
- **E0.12: Codex implementation contract completed.**

Guide is now ready to be implemented in the Hoopjot PWA.

---

# Codex entry point

Give Codex:

`E0_12_CODEX_TASK.md`

Codex must then follow:

`E0_12_CODEX_IMPLEMENTATION_CONTRACT.md`

and consume:

`E0_12_GUIDE_CONTENT_REGISTRY.json`

together with the canonical bilingual Guide sources.

---

# Product model

Guide is not 25 authored manuals.

It is resolved deterministically from:

```text
locale
primaryPosition
secondaryPosition
```

using:

```text
CORE
+ PRIMARY ROLE PACK
+ OPTIONAL ORDER-INDEPENDENT HYBRID BRIDGE
```

No LLM is used at runtime.

Only `primaryPosition` and `secondaryPosition` select canonical Guide content.

---

# Canonical editorial sources

Spanish:

- `GUIDE_CORE_ES.md`
- `GUIDE_ROLE_MATRIX_ES.md`
- 5 primary role packs `_ES`
- 10 hybrid bridges `_ES`

English:

- `GUIDE_CORE_EN.md`
- `GUIDE_ROLE_MATRIX_EN.md`
- 5 primary role packs `_EN`
- 10 hybrid bridges `_EN`

Spanish remains the semantic source of truth.

English passed equivalence at E0.11.

---

# Implementation constraints

Codex must:

- ingest editorial Markdown into a deterministic structured representation;
- avoid free-form Markdown splicing in the client at runtime;
- normalize bridge keys independently of position order;
- preserve the primary role as the dominant perspective;
- apply only authorized INSERT / OVERRIDE / BRIDGE interventions;
- keep the 17 Core-only points invariant;
- support ES and EN without runtime translation;
- hide editorial metadata from players;
- validate all 25 position selections in both locales.

Codex must not:

- edit canonical Guide copy;
- infer position or content from height/body/experience/medical data;
- introduce LLM generation;
- create 25 duplicated static Guides per language;
- add mandatory tracking mechanics to Guide.

---

# Current files added by E0.12

- `E0_12_CODEX_IMPLEMENTATION_CONTRACT.md`
- `E0_12_CODEX_TASK.md`
- `E0_12_GUIDE_CONTENT_REGISTRY.json`
- `E0_12_IMPLEMENTATION_MANIFEST.md`
- `E0_12_IMPLEMENTATION_MANIFEST.json`

---

# Phase status

- E0.4 Core ES: closed
- E0.5 Role Matrix ES: closed
- E0.6 Role packs ES: closed
- E0.7 Hybrid bridges ES: closed
- E0.8 Compilation and audit ES: closed
- E0.9 Spanish freeze: closed
- E0.10 English translation: closed
- E0.11 ES/EN equivalence: closed
- **E0.12 Codex implementation contract: closed**

The next step is application implementation, not further Guide editorial drafting.
