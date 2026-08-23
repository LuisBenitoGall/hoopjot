# HOOPJOT — REMODEL PLAN FOR CODEX

## 0. Authority and execution mode

This document is normative for the Hoopjot product remodel.

It redefines the visible UX without replacing the existing technical architecture.

When this document conflicts with previous UX/product documentation, this document wins.
`AGENTS.md` remains authoritative for architecture, security, testing and repository conventions unless this document explicitly overrides a product behavior.

Codex is an executor, not a designer.

Codex MUST:
- implement exactly what is written;
- preserve existing architecture unless explicitly ordered;
- make no product decision;
- add no feature not written here;
- stop and report if an instruction requires an undocumented decision;
- execute one phase at a time;
- never continue automatically to the next phase.

Codex MUST NOT:
- propose alternative UX;
- “improve” copy;
- add dashboards, metrics, gamification, claims, badges, streaks or extra controls;
- add animation libraries;
- redesign the brand;
- generate basketball coaching content;
- infer coaching from age, height, gender or position;
- change the data model unless a phase explicitly requires it.

---

# 1. Product reset

Hoopjot is a **guided basketball development journal**.

Its visible loop is:

```text
PLAN
I understand the whole path
        ↓
TODAY
I work on one idea
        ↓
JOURNAL
I record briefly what happened
        ↓
the system uses that history
to choose the next idea better
```

Hoopjot must NOT feel like:
- a dashboard;
- an activity tracker;
- a performance-management app;
- a task manager;
- a recurring questionnaire;
- a medical app;
- a social network.

Core rule:

> Complexity may exist underneath, but it must not become work for the player.

Mandatory UX constraints:
- A daily screen may show only one obvious primary action.
- Do not show technical states the system can infer.
- Do not ask for a data point unless it clearly improves future recommendations.
- Do not ask for administrative confirmations.
- Do not show false precision.
- Do not use streaks, points, achievement badges or completion percentages.
- Do not use generic motivational claims.
- The product must be understandable without a tutorial.

---

# 2. Navigation

Bottom navigation must contain EXACTLY three items:

1. `Hoy` / `Today` → `/app`
2. `Plan` / `Plan` → `/plan`
3. `Diario` / `Journal` → `/journal`

Remove from bottom navigation:
- Game
- Progress
- Profile

Profile remains at `/profile`, accessible only from the authenticated header user icon.

Legacy routes:
- `/game` → redirect `/plan`
- `/game/:guidelineId` → redirect `/plan/:guidelineId`
- `/progress` → redirect `/journal`

Do not delete existing Progress services/data during this remodel.

---

# 3. Authenticated header

Header must be:

Left:
- compact Hoopjot BrandLogo.

Right:
- connection indicator ONLY when status is:
  - offline;
  - syncing;
  - reconnecting;
  - needs_attention.
- user/profile icon linking to `/profile`.

Do NOT show:
- `Online` badge;
- logout button in header.

Language and logout stay in Profile.

---

# 4. TODAY

## 4.1 Purpose

Today answers only:

> What should I pay attention to today?

## 4.2 Exact visual order

1. small eyebrow:
   - ES `FOCO DE HOY`
   - EN `TODAY'S FOCUS`
2. local date, small and quiet
3. DailyFocusCard
4. one primary CTA:
   - ES `Registrar cómo ha ido`
   - EN `Log how it went`
5. if today already has a reflection:
   replace CTA with a compact confirmation:
   - ES `Guardado. Lo tendremos en cuenta para los próximos focos.`
   - EN `Saved. We will take it into account for the next focuses.`

No other modules on Today.

## 4.3 DailyFocusCard

Show only:
- category;
- title;
- instruction;
- cue;
- section `Por qué hoy` / `Why today`.

Remove:
- planned/viewed/completed/skipped chip;
- date chip inside the card;
- Mark viewed;
- Complete;
- Skip;
- any focus-state control.

## 4.4 Internal focus state

No user interaction:

- when a `planned` focus is successfully shown for the first time, update it internally to `viewed`;
- when the user saves that day's reflection, update it internally to `completed`;
- `skipped` remains in the domain for compatibility but has no UI.

---

# 5. QUICK DAILY FEEDBACK

## 5.1 Remove the current pre-session workflow

The new UX does NOT show:
- Start session;
- Energy rating;
- Confidence rating;
- Physical feeling rating;
- check-in;
- Learning session choice;
- Recovery session choice.

Do not remove these legacy types/fields from the domain/database.

## 5.2 Opening behavior

Tapping `Registrar cómo ha ido` expands a panel INLINE below the focus.

Do not:
- navigate to another route;
- use a wizard;
- use a full-screen modal;
- split feedback into steps.

## 5.3 Exact form

Order:

### Field 1
Label:
- ES `¿Qué ha sido hoy?`
- EN `What was it today?`

Two-option segmented control:
- `Entrenamiento` / `Practice`
- `Partido` / `Game`

Initial value: `practice`.

### Field 2
Label:
- ES `¿Cómo te ha salido el foco?`
- EN `How did the focus go?`

Existing rating control 1–5.
Required.

### Field 3
Single visible textarea:
- ES `¿Qué has notado o quieres recordar?`
- EN `What did you notice or want to remember?`

Optional.
maxLength 1000.

### Field 4
Quiet/link control:
- ES `Añadir comentario del entrenador`
- EN `Add coach feedback`

Initially collapsed.
When opened, show one optional textarea.
maxLength 1000.

### Field 5
Only primary button:
- ES `Guardar`
- EN `Save`

Do not display three simultaneous fields for:
- note;
- coachFeedback;
- rememberNextTime.

## 5.4 Exact persistence mapping

```text
selected Practice/Game → Session.type
rating → Reflection.focusRating
main textarea → Reflection.note
coach textarea → Reflection.coachFeedback
Reflection.rememberNextTime → ""
```

On Save:

1. Find today's incomplete session.
2. If one exists, reuse it.
3. Otherwise create Session:
   - type = selected practice/game;
   - startedAt = now;
   - no CheckIn.
4. Create/update Reflection.
5. completedAt = now.
6. mark DailyFocus completed.
7. preserve local-first behavior.
8. preserve existing sync queue behavior.

There must be no intermediate user step.

---

# 6. PLAN

## 6.1 Purpose

Plan is the always-accessible complete basketball development manual.

It must:
- work offline;
- explain the overall process;
- show the full map of work;
- allow technical reading;
- connect today's focus to the larger plan.

It must NOT:
- look like a list of blog articles;
- look like a dashboard;
- show progress percentages;
- gamify reading;
- use urgency, claims or clickbait.

## 6.2 Exact route structure

- `/plan`
- `/plan/:guidelineId`

## 6.3 Exact Plan layout

Order:

1. `PlanHero`
2. `ProfileSnapshot`
3. `HowHoopjotWorks`
4. `DevelopmentMap`
5. `PlanClosingNote`

## 6.4 PlanHero

Title ES:
`Tu plan de juego`

Title EN:
`Your game plan`

ES text:

> Este es tu plan de trabajo{{aliasSuffix}}. No está pensado para que lo hagas todo a la vez. Reúne decisiones y hábitos que queremos convertir en parte natural de tu juego. Hoopjot irá tomando una idea cada vez y la llevará a tus entrenamientos y partidos. Después, lo que registres servirá para decidir qué conviene mantener, reforzar o volver a mirar.

`aliasSuffix`:
- if alias exists: `, {alias}`
- otherwise empty.

EN text:

> This is your development plan{{aliasSuffix}}. It is not meant to be worked on all at once. It brings together decisions and habits that should become a natural part of your game. Hoopjot will take one idea at a time into practices and games. What you record afterwards will help decide what to keep, reinforce or revisit.

## 6.5 ProfileSnapshot

Title:
- ES `Tu punto de partida`
- EN `Your starting point`

Show only present onboarding/profile facts:
- primary position;
- secondary position, if present;
- heightCm, if present;
- competitiveLevel;
- up to three active goals.

Do not generate conclusions from these facts.
Do not create dynamic coaching sentences.
Present facts only.

## 6.6 HowHoopjotWorks

Render a four-step infographic.

Exact steps:

1. `Mira el mapa` / `See the whole map`
   - ES `El plan completo siempre está aquí.`
   - EN `The full plan is always here.`

2. `Trabaja una idea` / `Work on one idea`
   - ES `Hoy solo necesitas recordar un foco.`
   - EN `Today you only need to remember one focus.`

3. `Juega y observa` / `Play and notice`
   - ES `No intentes evaluar todo mientras juegas.`
   - EN `Do not try to evaluate everything while you play.`

4. `Registra lo importante` / `Record what matters`
   - ES `Después, una valoración y una nota breve bastan.`
   - EN `Afterwards, one rating and a short note are enough.`

## 6.7 DevelopmentMap

Visual style:
- editorial infographic;
- vertical on mobile;
- centered readable column on desktop;
- use existing Hoopjot brand;
- use restrained court-line geometry;
- no dashboard layout.

Five blocks in EXACT order:

1. Attack
2. Defense
3. Transition
4. Communication & decisions
5. Habits & attention

Attack must visibly contain:
- On ball
- Off ball

Defense must visibly contain:
- On ball
- Off ball
- Rebounding

Each main block:
- number `01` to `05`;
- title;
- short intro;
- sub-blocks;
- principles;
- linked existing guideline(s).

If today's guideline belongs to a sub-block:
- show a small `HOY` / `TODAY` chip beside that sub-block.
- no pulse, glow or loop.

---

# 7. PLAN ANIMATION

The animation exists only to encourage reading.

Allowed:

### Development line
- once only;
- `scaleY(0 → 1)`;
- 450ms;
- ease-out;
- starts first time map enters viewport.

### Section reveal
- once only;
- opacity `0 → 1`;
- translateY `10px → 0`;
- 220ms;
- maximum 60ms stagger.

### Accordion
- maximum 180ms.

Forbidden:
- loops;
- bounce;
- pulse;
- parallax;
- scroll-jacking;
- carousel;
- confetti;
- animated counters;
- progress rings;
- particles;
- sound;
- animations >500ms;
- continuous decorative movement.

No animation library.
Use CSS and IntersectionObserver only if required.

`prefers-reduced-motion: reduce`:
- no translate;
- no line drawing;
- content immediately visible;
- accordion changes without animation.

---

# 8. EXACT PLAN EDITORIAL CONTENT

Codex must use this text verbatim. It may structure it in i18n/content objects but must not rewrite it.

## ES — 01 ATAQUE

### Intro

Atacar bien no significa hacer muchas cosas. Significa reconocer lo que tienes delante, ocupar un espacio útil y tomar una decisión a tiempo. El objetivo es que tus acciones sean cada vez más simples, claras y difíciles de defender.

### Con balón

**Idea central:** protege, observa y decide antes de que la defensa decida por ti.

Principios:
- Recibe preparada para jugar, no solo para sujetar el balón.
- Protege el bote con tu cuerpo y mantén una base equilibrada.
- Levanta la mirada antes de añadir un bote innecesario.
- Si aparece una ventaja clara, atácala; si no, mueve el balón y vuelve a participar.
- Cerca del aro, prioriza equilibrio, control y finalizaciones que puedas repetir.

Link existing guidelines:
- `att.onball.protect-outside-hip`
- `att.finish.two-foot-balance`

### Sin balón

**Idea central:** no desaparezcas de la jugada después de pasar el balón.

Principios:
- Mantén un espacio que ayude a quien tiene el balón.
- Muéstrate en una línea de pase clara y útil.
- Después de pasar, cortar o bloquear, realiza una segunda acción.
- Evita quedarte mirando la jugada desde el mismo sitio.
- Aprende a moverte cuando la defensa mira el balón, no cuando ya te ha visto.

Link:
- `att.offball.show-target-window`

## ES — 02 DEFENSA

### Intro

Defender bien empieza antes del contacto. Posición, distancia, visión y comunicación te permiten llegar antes y depender menos de una reacción tardía.

### Con balón

**Idea central:** contiene primero; roba solo cuando la situación lo permite.

Principios:
- Colócate para proteger la primera penetración.
- Usa los pies antes que las manos.
- Mantén una distancia que te permita reaccionar sin regalar el tiro.
- Orienta a la atacante hacia el espacio que vuestra defensa quiere conceder.
- Termina la posesión: una buena defensa no acaba hasta controlar el rebote.

Link:
- `def.onball.contain-first-step`

### Sin balón

**Idea central:** ve a tu jugadora y al balón el mayor tiempo posible.

Principios:
- Ajusta tu posición cada vez que se mueve el balón.
- No pierdas a tu jugadora por mirar únicamente la pelota.
- Ayuda con intención y recupera con urgencia.
- Habla antes de que llegue el problema: cortes, bloqueos, ayudas y cambios.
- Cuanto más lejos estés del balón, más importante es entender qué puede ocurrir después.

Link:
- `def.offball.see-player-ball`

### Rebote

**Idea central:** el rebote empieza localizando a una rival, no mirando la trayectoria del balón.

Principios:
- Cuando sale el tiro: localiza.
- Crea contacto y gana una posición.
- Después busca el balón.
- Ataca el rebote con decisión y dos manos siempre que sea posible.
- Tras asegurar el balón, la siguiente acción es salir de la presión y dar continuidad.

Cue:
`TIRO → RIVAL → CONTACTO → BALÓN`

Link:
- `def.rebound.find-player-first`

## ES — 03 TRANSICIÓN

### Intro

Los primeros segundos después de un cambio de posesión ofrecen ventajas enormes. La transición se juega antes de que todo el mundo esté colocado.

### Cuando atacamos

Principios:
- Reacciona al cambio de posesión inmediatamente.
- Corre hacia tu responsabilidad antes de mirar dónde está el balón.
- Abre el campo o corre al aro según tu función.
- Si no recibes, sigue formando parte de la jugada: ocupa espacio, bloquea, corta o genera una segunda acción.

Link:
- `transition.run-immediately`

### Cuando defendemos

Principios:
- Primero protege el aro y frena el balón.
- Después identifica emparejamientos y amenazas.
- Comunica mientras corres.
- No conviertas una protesta, un error o un tiro fallado en dos segundos de ventaja para el rival.

Link:
- `transition.stop-ball-early`

## ES — 04 COMUNICACIÓN Y DECISIONES

### Intro

El juego se vuelve más sencillo cuando ves pronto, decides pronto y ayudas a tus compañeras a ver lo mismo.

### Comunicación

Principios:
- Habla antes de un bloqueo, no cuando ya ha ocurrido.
- Usa mensajes cortos y reconocibles.
- Comunica ayudas, cambios y cortes.
- La comunicación útil debe dar información, no ruido.

Link:
- `comm.screen.call-early`

### Decisiones

Principios:
- No confundas participar con botar el balón.
- Antes de atacar, identifica si existe una ventaja.
- Si una compañera tiene una ventaja mejor, mueve el balón.
- Una buena posesión puede necesitar que recibas, pases y vuelvas a moverte sin lanzar.
- Aprende a reconocer la segunda ventaja, no solo la primera.

Link:
- `decision.extra-pass-window`

## ES — 05 HÁBITOS Y ATENCIÓN

### Intro

La mejora no depende de recordar veinte instrucciones durante un partido. Depende de convertir unas pocas decisiones correctas en hábitos que aparezcan sin tener que buscarlos.

### Preparación

Principios:
- Llega a cada sesión con un solo foco claro.
- Antes de empezar, recuerda el cue de ese día.
- Durante el juego, vuelve al cue cuando te distraigas.
- No intentes corregir cinco cosas a la vez.

Link:
- `habits.prep.one-cue`

### Siguiente jugada

Principios:
- Un error pertenece a la jugada anterior.
- Reconócelo sin quedarte dentro de él.
- Recupera tu posición y tu responsabilidad.
- La respuesta más útil a un error suele ser jugar bien la siguiente acción.

Link:
- `habits.confidence.next-play-reset`

## ES — CIERRE

Title:
`Cómo vamos a trabajar este plan`

Text:

> No necesitas memorizarlo todo. El plan está aquí para que puedas volver a él cuando quieras entender el conjunto. En el día a día, Hoopjot elegirá una sola idea. Llévala contigo al entrenamiento o al partido. Después registra brevemente qué ocurrió, qué sentiste que funcionó y qué merece volver a aparecer. La mejora no vendrá de marcar casillas, sino de repetir buenas decisiones hasta que dejen de parecer nuevas.

---

## EN — 01 ATTACK

### Intro

Good offense does not mean doing many things. It means recognizing what is in front of you, occupying useful space and making a decision on time. The goal is for your actions to become simpler, clearer and harder to defend.

### On ball

**Core idea:** protect, see and decide before the defense decides for you.

Principles:
- Catch ready to play, not just to hold the ball.
- Protect your dribble with your body and keep a balanced base.
- Get your eyes up before adding an unnecessary dribble.
- If a clear advantage appears, attack it; if not, move the ball and stay involved.
- Near the rim, prioritize balance, control and finishes you can repeat.

Links:
- `att.onball.protect-outside-hip`
- `att.finish.two-foot-balance`

### Off ball

**Core idea:** do not disappear from the possession after passing the ball.

Principles:
- Keep spacing that helps the player with the ball.
- Show a clear and useful passing window.
- After passing, cutting or screening, make a second action.
- Avoid watching the play from the same spot.
- Learn to move when the defense is watching the ball, not after it has already seen you.

Link:
- `att.offball.show-target-window`

## EN — 02 DEFENSE

### Intro

Good defense starts before contact. Position, distance, vision and communication let you arrive earlier and depend less on late reactions.

### On ball

**Core idea:** contain first; steal only when the situation allows it.

Principles:
- Position yourself to protect the first drive.
- Use your feet before your hands.
- Keep a distance that lets you react without giving away the shot.
- Influence the attacker toward the space your defense wants to allow.
- Finish the possession: good defense is not complete until the rebound is controlled.

Link:
- `def.onball.contain-first-step`

### Off ball

**Core idea:** see your player and the ball for as much of the possession as possible.

Principles:
- Adjust your position every time the ball moves.
- Do not lose your player by watching only the ball.
- Help with purpose and recover with urgency.
- Talk before the problem arrives: cuts, screens, help and switches.
- The farther you are from the ball, the more important it is to understand what may happen next.

Link:
- `def.offball.see-player-ball`

### Rebounding

**Core idea:** rebounding starts by finding an opponent, not by watching the flight of the ball.

Principles:
- When the shot goes up: locate.
- Make contact and win position.
- Then find the ball.
- Pursue the rebound decisively and with two hands whenever possible.
- After securing it, get out of pressure and continue the possession.

Cue:
`SHOT → PLAYER → CONTACT → BALL`

Link:
- `def.rebound.find-player-first`

## EN — 03 TRANSITION

### Intro

The first seconds after possession changes create enormous advantages. Transition is played before everyone is set.

### When we attack

Principles:
- React to the change of possession immediately.
- Run to your responsibility before watching where the ball is.
- Space the floor or run to the rim according to your role.
- If you do not receive the ball, stay part of the play: space, screen, cut or make a second action.

Link:
- `transition.run-immediately`

### When we defend

Principles:
- Protect the rim and stop the ball first.
- Then identify matchups and threats.
- Communicate while you run.
- Do not turn a complaint, mistake or missed shot into two seconds of advantage for the opponent.

Link:
- `transition.stop-ball-early`

## EN — 04 COMMUNICATION & DECISIONS

### Intro

The game becomes simpler when you see early, decide early and help teammates see the same thing.

### Communication

Principles:
- Talk before a screen, not after it happens.
- Use short, recognizable messages.
- Communicate help, switches and cuts.
- Useful communication provides information, not noise.

Link:
- `comm.screen.call-early`

### Decisions

Principles:
- Do not confuse being involved with dribbling the ball.
- Before attacking, identify whether an advantage exists.
- If a teammate has a better advantage, move the ball.
- A good possession may require you to catch, pass and move again without taking a shot.
- Learn to recognize the second advantage, not only the first.

Link:
- `decision.extra-pass-window`

## EN — 05 HABITS & ATTENTION

### Intro

Improvement does not depend on remembering twenty instructions during a game. It depends on turning a few good decisions into habits that appear without having to search for them.

### Preparation

Principles:
- Arrive at each session with one clear focus.
- Before starting, remember that day's cue.
- During play, return to the cue when your attention drifts.
- Do not try to correct five things at once.

Link:
- `habits.prep.one-cue`

### Next play

Principles:
- A mistake belongs to the previous play.
- Acknowledge it without staying inside it.
- Recover your position and responsibility.
- The most useful response to a mistake is usually to play the next action well.

Link:
- `habits.confidence.next-play-reset`

## EN — CLOSING

Title:
`How we will work this plan`

Text:

> You do not need to memorize all of it. The plan is here so you can return whenever you want to understand the whole picture. Day to day, Hoopjot will choose one idea. Take it into practice or a game. Afterwards, record briefly what happened, what felt useful and what deserves to appear again. Improvement will not come from checking boxes. It will come from repeating good decisions until they stop feeling new.

---

# 9. JOURNAL

Purpose:

> What happened, and what am I learning?

Exact page order:
1. title `Diario` / `Journal`
2. short intro
3. chronological entries

ES intro:
`Tus notas de entrenamientos y partidos, sin convertirlas en un informe.`

EN intro:
`Your practice and game notes, without turning them into a report.`

Each list item shows only:
- localized date;
- session type;
- focus title;
- focus rating;
- up to two lines of Reflection.note if present.

Detail shows only:
- date/type;
- focus title;
- cue;
- rating;
- Reflection.note if present;
- coachFeedback if present.

Do not show empty fields.

Do not show:
- trend chips;
- sync state per entry;
- check-in values;
- skill score;
- progress analytics.

`/progress` redirects to `/journal`.

Do not embed the current Progress dashboard into Journal.

Keep ProgressService, weekly reviews and stored data for possible later use.

---

# 10. PROFILE

Profile is secondary configuration.

Keep:
- existing editable personal data;
- language;
- logout.

Do not add:
- new fields;
- metrics;
- progress;
- manual content.

Profile stays outside bottom navigation.

---

# 11. ONBOARDING

Do not redesign onboarding in this remodel.

Its existing data is used by Plan/Profile.

Only allowed onboarding-related change:
- read its existing values for ProfileSnapshot.
- never duplicate them into another store.

---

# 12. TECHNICAL NON-GOALS

Do not:
- replace React/Vite;
- replace Dexie;
- replace Supabase;
- replace repository architecture;
- remove offline-first;
- remove sync;
- change auth;
- remove Progress domain;
- remove legacy SessionType values;
- remove CheckIn schema;
- add AI;
- add video;
- add notifications.

---

# 13. IMPLEMENTATION PHASES

Execute exactly in order.

## R00 — Baseline and freeze

Do not change product behavior.

Run:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Create screenshots at 390x844:
- Today
- Today current session/check-in
- reflection
- Game
- Journal
- Progress
- Profile

Store:
`artifacts/remodel-baseline/`

Create:
`artifacts/remodel-baseline/BASELINE.md`

For each route list:
- route;
- visible primary actions;
- visible form control count;
- screenshot filename.

STOP.

## R01 — Shell and navigation

Implement sections 2 and 3 only.

Likely files:
- `src/app/shell/AppShell.tsx`
- `src/app/router/AppRouter.tsx`
- bottom nav tests
- i18n resources

Do not simplify Today yet.
Do not build Plan content yet beyond minimum route placeholder.

STOP.

## R02 — Plan manual + infographic

Implement sections 6, 7 and 8.

Create versioned content module under:
`src/content/plan/`

Required components:
- PlanRoute
- PlanHero
- ProfileSnapshot
- HowHoopjotWorks
- DevelopmentMap
- DevelopmentSection
- PlanClosingNote

Use editorial content in this document verbatim.

Do not add animation library.

Implement `/plan/:guidelineId` using current guideline catalog.

STOP.

## R03 — Today simplification

Implement sections 4 and 5.

Remove from Today:
- status chips;
- Mark viewed;
- Complete;
- Skip;
- SessionReflectionPanel;
- check-in;
- Start session.

Create compact quick reflection UI.

Add one application-level quick-reflection use case.

Preserve underlying domain compatibility.

No DB migration should be necessary. If Codex believes a migration is required, STOP and report before creating one.

STOP.

## R04 — Journal simplification

Implement section 9 only.

Do not add progress summary.

STOP.

## R05 — Profile secondary controls

Implement section 10 only.

STOP.

## R06 — Deterministic personalization/content linking

Verify:
- ProfileSnapshot reads existing profile/goals;
- only present facts render;
- enum labels translated;
- exact guideline links resolve;
- missing guideline omits link without crashing;
- no dynamic coaching inference.

STOP.

## R07 — Release gate

Run:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

Required E2E assertions:
1. exactly 3 bottom-nav items;
2. Today has no Mark viewed/Complete/Skip;
3. quick reflection opens;
4. rating-only reflection can save;
5. reflection survives reload;
6. Journal displays saved entry;
7. Plan renders all 5 sections offline;
8. Profile reachable from header;
9. `/game` redirects `/plan`;
10. `/progress` redirects `/journal`.

Final screenshots at 390x844:
- `01-today.png`
- `02-quick-reflection.png`
- `03-plan-top.png`
- `04-plan-map-attack.png`
- `05-plan-map-defense.png`
- `06-journal.png`
- `07-profile.png`

Desktop 1440x900:
- `08-plan-desktop.png`

Store:
`artifacts/remodel-final/`

Visual failure conditions:
- >1 obvious primary CTA on Today before feedback;
- >3 bottom-nav items;
- Plan looks like a metrics dashboard;
- continuous animation;
- progress percentage;
- focus-status buttons still visible.

STOP.

---

# 14. CODEX PROMPTS

Use ONE prompt per turn.

## Audit prompt

```text
Read:
- AGENTS.md
- HOOPJOT_REMODEL_FOR_CODEX.md

Inspect the current repository.

Do not modify anything.

Report only:
1. conflicts between current implementation and the remodel specification;
2. files likely affected by R00–R07;
3. any instruction that is technically impossible as written.

Do not propose alternative product designs.
Do not suggest additional features.
Do not rewrite any editorial text.
```

## R00 prompt

```text
Implement phase R00 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

Do not modify product behavior.
Do not proceed to R01.

Report commands, results and generated baseline artifacts.
```

## R01 prompt

```text
Implement phase R01 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

Do not change Today content yet.
Do not implement Plan content beyond the minimum route required by R01.
Do not proceed to R02.

Run relevant tests and report deviations.
```

## R02 prompt

```text
Implement phase R02 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

Use the editorial text verbatim.
Do not rewrite, shorten, expand or improve it.
Do not add an animation library.
Do not add progress indicators, metrics or gamification.
Do not redesign the brand.

Do not proceed to R03.
Run relevant tests.
```

## R03 prompt

```text
Implement phase R03 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

The goal is removal of interaction, not addition.

Do not retain Mark viewed, Complete or Skip in Today.
Do not retain Energy, Confidence, Physical feeling or Start session in the daily UX.

Preserve the underlying data model and local-first/sync architecture.

If a database migration appears necessary, STOP and report before creating it.

Do not proceed to R04.
Run relevant tests.
```

## R04 prompt

```text
Implement phase R04 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

Do not add charts, trends, analytics or weekly review to Journal.
Do not delete Progress domain/services.

Do not proceed to R05.
Run relevant tests.
```

## R05 prompt

```text
Implement phase R05 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

No new profile fields.
No new settings.
No product changes outside the specified placement of secondary controls.

Do not proceed to R06.
Run relevant tests.
```

## R06 prompt

```text
Implement phase R06 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

Personalization must be factual and deterministic.
Do not infer coaching from height, age, position or gender.
Do not use AI.
Do not create basketball guidance.

Do not proceed to R07.
Run relevant tests.
```

## R07 prompt

```text
Implement phase R07 from HOOPJOT_REMODEL_FOR_CODEX.md exactly.

This is a verification phase.
Do not add unrelated features or refactors.

Produce all required screenshots.
Report:
- lint/typecheck/unit/E2E/build results;
- final routes;
- exact number of bottom-nav items;
- unmet acceptance criteria;
- unrelated issues discovered, without fixing them.

Stop after reporting.
```

## Review prompt after every phase

```text
Review the implementation of the current remodel phase against:
1. HOOPJOT_REMODEL_FOR_CODEX.md;
2. AGENTS.md.

Do not edit files.

Report only confirmed deviations.
For each deviation include:
- severity;
- file and area;
- violated requirement;
- minimal correction required.

Do not propose improvements outside scope.
```

## Correction prompt

```text
Fix only the confirmed deviations from the previous review.

Do not refactor unrelated code.
Do not add features.
Run the checks required by the correction plus normal mandatory checks.
Report results and stop.
```

---

# 15. Definition of Done

The remodel is complete only if:

- bottom navigation has exactly 3 entries;
- Profile is secondary;
- Today has exactly one primary action before feedback;
- focus status buttons are gone;
- pre-session check-in is gone from daily UX;
- feedback is rating + one optional note + optional collapsed coach note;
- the manual is always available in Plan offline;
- Plan is sober, readable and lightly animated;
- Plan shows onboarding facts without generated coaching;
- Journal is a readable history, not a dashboard;
- `/game*` and `/progress` redirect correctly;
- current local-first/sync behavior still works;
- ES/EN remain complete;
- all mandatory automated checks pass;
- final Playwright screenshots exist;
- no extra functionality has been introduced.
