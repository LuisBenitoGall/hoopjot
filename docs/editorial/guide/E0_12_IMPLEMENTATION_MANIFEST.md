# HOOPJOT — E0.12 IMPLEMENTATION MANIFEST

**Status:** CODEX-READY  
**Canonical bilingual editorial files:** 34  
**Runtime-renderable editorial sources:** 32  
**Positions:** 5  
**Hybrid bridges:** 10  
**Locales:** 2  
**Resolution cases required in tests:** 50

## Codex entry point

`E0_12_CODEX_TASK.md`

## Normative implementation contract

`E0_12_CODEX_IMPLEMENTATION_CONTRACT.md`

## Machine-readable registry

`E0_12_GUIDE_CONTENT_REGISTRY.json`

## Editorial selectors

Only:

- `primaryPosition`
- `secondaryPosition`

## Runtime model

```text
CORE
+ PRIMARY ROLE PACK
+ OPTIONAL ORDER-INDEPENDENT HYBRID BRIDGE
```

No LLM generation and no 25 duplicated authored Guides.

## Editorial ownership

The existing ES/EN canonical Markdown is input to implementation and must not be edited by Codex.

## Next action

Place this `guide/` directory in the application repository under its existing editorial documentation path and give Codex `E0_12_CODEX_TASK.md` as the implementation task.
