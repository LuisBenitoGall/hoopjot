# Basketball content model

Basketball knowledge is editorial content, not application logic.

## Goals

- small, curated catalog;
- highly actionable;
- translatable;
- position/context aware;
- machine-readable for recommendation ranking.

## Guideline content shape

```ts
interface GuidelineTranslation {
  title: string;
  instruction: string;
  cue: string;
  explanation?: string;
  commonMistakes?: string[];
  reflectionPrompt?: string;
}
```

Core metadata:

```ts
interface GuidelineDefinition {
  id: string;
  skillIds: string[];
  category: string;
  subcategory: string;
  level: "foundation" | "intermediate" | "advanced";
  positions: string[] | ["all"];
  contexts: ("practice" | "game" | "learning")[];
  priorityForPositions?: Record<string, number>;
  translationKey: string;
}
```

## Editorial rules

A guideline should:
- express one main behavior;
- be observable;
- fit in a court-side memory cue;
- avoid jargon unless useful to the target level;
- never prescribe medical/rehab activity;
- avoid claiming that one technique is universal if team schemes vary.

## Initial catalog target

Start development with 30–40 high-quality guidelines.

Longer-term editorial target:
- Attack on ball: ~20
- Attack off ball: ~20
- Defense: ~20
- Rebounding/rim protection: ~10
- Transition: ~10
- Communication/tactical: ~10
- Habits/preparation: ~10

## Seed examples

### Defense / rebounding

**ID:** `def.rebound.find-player-first`

EN:
- Title: Find your player first
- Instruction: When the shot goes up, locate your opponent before tracking the ball.
- Cue: SHOT → PLAYER → CONTACT → BALL

ES:
- Title: Localiza primero a tu rival
- Instruction: Cuando salga el tiro, localiza a tu rival antes de seguir el balón.
- Cue: TIRO → RIVAL → CONTACTO → BALÓN

### Attack / screening

**ID:** `att.offball.second-action-after-screen`

EN:
- Title: Make a second action
- Instruction: After screening, do not watch the play. Roll, relocate, re-screen or create space.
- Cue: SCREEN → MOVE AGAIN

ES:
- Title: Haz una segunda acción
- Instruction: Después de bloquear, no observes la jugada. Continúa, reubícate, vuelve a bloquear o genera espacio.
- Cue: BLOQUEO → MUÉVETE OTRA VEZ

### Transition

**ID:** `transition.run-immediately`

EN:
- Title: Run first
- Instruction: When possession changes, react immediately. Sprint into your transition responsibility before becoming a spectator.
- Cue: CHANGE → RUN

ES:
- Title: Corre primero
- Instruction: Cuando cambie la posesión, reacciona inmediatamente. Corre hacia tu responsabilidad de transición antes de convertirte en espectador.
- Cue: CAMBIO → CORRE

## Content storage

MVP:
- versioned TypeScript/JSON content bundled with the app;
- translations in locale resources;
- validated with Zod during build/tests.

Later:
- optional content CMS/admin workflow.

## Content versioning

Include a catalog version.
Migrations are only required when metadata semantics change.
Historical DailyFocus records reference stable guideline IDs.
