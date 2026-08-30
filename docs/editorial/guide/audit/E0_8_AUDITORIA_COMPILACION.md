# HOOPJOT — E0.8 · Auditoría de compilación

## Resultado

**E0.8 pasa la auditoría estructural y editorial de compilación.**

Se han compilado y revisado:

- 5 perfiles de posición única;
- 20 combinaciones ordenadas `primaryPosition + secondaryPosition`;
- total: **25 Guides compiladas**.

## Correcciones detectadas durante la compilación

La primera compilación reveló dos ajustes de fuente adicionales:

1. `PG_SG_ES.md`
   - P11: corrección ortotipográfica de tres preguntas consecutivas.

2. `PF_C_ES.md`
   - Era el bridge más largo pese a representar la intersección de las dos posiciones más próximas.
   - Se eliminaron las intervenciones redundantes de P06, P07, P08 y P22.
   - Se compactaron P03, P04, P10 y P21 para conservar únicamente el matiz híbrido.
   - Se mantienen P09, P11, P26 y P27.

No se ha modificado `GUIDE_CORE_ES.md` ni `GUIDE_ROLE_MATRIX_ES.md`.

## Validaciones realizadas

- Los 30 puntos aparecen una vez y en orden exacto.
- Los 17 puntos exclusivamente Core son idénticos al Core canónico.
- P09 conserva una sola vez el bloque `PASA CERCA DEL BLOQUEO`.
- El principio **hombro con hombro** aparece una sola vez en cada Guide compilada.
- Los overrides solo sustituyen las zonas delimitadas por la Matrix.
- Los inserts y bridges aparecen antes del cierre Core correspondiente.
- Ningún bridge ejecuta override.
- P26 mantiene una sola progresión `Fiabilidad → Impacto → Ampliar el juego`.
- Las 12 Rules y el cierre final proceden exclusivamente del Core.
- No aparecen selectores editoriales prohibidos como `heightCm`, `dominantHand`, `physicalContext`, `birthYear`, `experienceYears`, `competitiveLevel`, `weeklyPractices` o `weeklyGames`.
- Las Guides compiladas no contienen metadatos internos `Tipo`, `PROPÓSITO DEL ROL` o `PROPÓSITO DEL BRIDGE`.
- El mismo hybrid bridge se utiliza en ambos órdenes de una pareja; el role pack primario sigue determinando la perspectiva dominante.

## Integridad de archivos normativos

- `GUIDE_CORE_ES.md`: **sin cambios**
- `GUIDE_ROLE_MATRIX_ES.md`: **sin cambios**

## Compilaciones auditadas

| Primary | Secondary | Archivo de auditoría | Palabras | Estado |
| --- | --- | --- | ---: | --- |
| C | — | `C_GUIDE_ES.md` | 5378 | PASS |
| C | PF | `C_PF_GUIDE_ES.md` | 5746 | PASS |
| C | PG | `C_PG_GUIDE_ES.md` | 6112 | PASS |
| C | SF | `C_SF_GUIDE_ES.md` | 6069 | PASS |
| C | SG | `C_SG_GUIDE_ES.md` | 6003 | PASS |
| PF | C | `PF_C_GUIDE_ES.md` | 5516 | PASS |
| PF | — | `PF_GUIDE_ES.md` | 5148 | PASS |
| PF | PG | `PF_PG_GUIDE_ES.md` | 5895 | PASS |
| PF | SF | `PF_SF_GUIDE_ES.md` | 5784 | PASS |
| PF | SG | `PF_SG_GUIDE_ES.md` | 5762 | PASS |
| PG | C | `PG_C_GUIDE_ES.md` | 6007 | PASS |
| PG | — | `PG_GUIDE_ES.md` | 5273 | PASS |
| PG | PF | `PG_PF_GUIDE_ES.md` | 6020 | PASS |
| PG | SF | `PG_SF_GUIDE_ES.md` | 5940 | PASS |
| PG | SG | `PG_SG_GUIDE_ES.md` | 5863 | PASS |
| SF | C | `SF_C_GUIDE_ES.md` | 5827 | PASS |
| SF | — | `SF_GUIDE_ES.md` | 5136 | PASS |
| SF | PF | `SF_PF_GUIDE_ES.md` | 5772 | PASS |
| SF | PG | `SF_PG_GUIDE_ES.md` | 5803 | PASS |
| SF | SG | `SF_SG_GUIDE_ES.md` | 5667 | PASS |
| SG | C | `SG_C_GUIDE_ES.md` | 5913 | PASS |
| SG | — | `SG_GUIDE_ES.md` | 5288 | PASS |
| SG | PF | `SG_PF_GUIDE_ES.md` | 5902 | PASS |
| SG | PG | `SG_PG_GUIDE_ES.md` | 5878 | PASS |
| SG | SF | `SG_SF_GUIDE_ES.md` | 5819 | PASS |

## Observación sobre los archivos compilados

Las 25 Guides compiladas son **artefactos de auditoría de E0.8**.

No sustituyen al sistema canónico:

`Core + role pack primario + optional hybrid bridge`.

Su función es demostrar que todas las combinaciones producen un documento coherente y reproducible antes del freeze editorial.

## Estado de fase

Con las dos correcciones de fuente aplicadas y las 25 compilaciones en PASS, **E0.8 queda técnicamente completado**.

El siguiente hito es **E0.9 — freeze de la edición española**.
