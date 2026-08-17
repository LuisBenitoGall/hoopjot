# Recommendation engine V1

## Goal

Select a relevant daily focus without AI.

The engine must be deterministic, testable and explainable.

## Inputs

- active player goals;
- player position;
- skill state;
- recent observations;
- coach-feedback-derived structured selections, when available;
- recent focus history;
- session context;
- guideline catalog.

## Candidate filtering

A guideline is eligible when:
- active;
- translated for current locale or fallback;
- relevant to current context;
- player level can reasonably use it;
- not medically restricted content;
- not shown within the strict repeat cooldown.

## Suggested scoring

Normalize signals to a comparable range.

```text
score =
  goalMatch          * 0.30
+ recentDifficulty   * 0.25
+ observationSignal  * 0.20
+ recencyNeed        * 0.15
+ positionFit        * 0.10
```

These weights are initial configuration, not eternal truth.

## Rule modifiers

- Exact same guideline shown in previous 5 days: exclude.
- Same skill used for 3 consecutive focuses: strong penalty.
- Explicit recent coach correction on linked skill: priority boost.
- Recent repeated negative observation: boost for 7 days.
- Strong repeated positive evidence: gradually reduce remediation priority.
- Player goal match remains a stable positive signal.

## Development path

Foundation guidelines may be prerequisites for intermediate/advanced guidelines.

Do not recommend an advanced variation when prerequisite skill evidence is very weak.

## Reason code

Each generated DailyFocus must store a reason code:
- goal;
- recent_difficulty;
- coach_feedback;
- development_path;
- rotation.

UI may translate this into a short "Why this focus?" explanation.

## Determinism

Given the same:
- player state;
- catalog;
- date/context;
- configuration;

the engine should return the same ordered candidates.

If tie-breaking requires randomness, seed it deterministically by user/date.

## Tests

Must include:
- goal matching;
- position matching;
- repeat cooldown;
- repeated difficulty boost;
- coach feedback boost;
- consecutive-skill penalty;
- no eligible candidate fallback;
- deterministic tie-breaking.

## Future AI integration

AI may convert free text into structured observations.
AI does NOT choose the daily focus directly in the MVP architecture.
