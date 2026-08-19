# Data model

This document defines the MVP domain model. Concrete database migrations and TypeScript/Zod implementations must remain aligned with it.

## Common user-owned fields

Most mutable user-owned records include:

```ts
type SyncStatus = "local" | "pending" | "synced" | "error";

interface SyncFields {
  id: string;              // client-generated UUID
  userId: string;
  createdAt: string;       // UTC ISO
  updatedAt: string;       // UTC ISO
  deletedAt?: string;
  syncStatus: SyncStatus;  // local-only field where appropriate
}
```

`syncStatus` does not need to be stored remotely.

## PlayerProfile

```ts
type PlayerPosition =
  | "point_guard"
  | "shooting_guard"
  | "small_forward"
  | "power_forward"
  | "center";

type DominantHand = "right" | "left" | "both" | "prefer_not_to_say";

type CompetitiveLevel =
  | "recreational"
  | "club"
  | "academy"
  | "high_school"
  | "college"
  | "semi_pro"
  | "professional"
  | "other";

interface PlayerProfile {
  id: string;
  userId: string;
  alias?: string;
  birthYear: number;
  heightCm?: number;
  dominantHand?: DominantHand;
  primaryPosition: PlayerPosition;
  secondaryPosition?: PlayerPosition;
  experienceYears?: number;
  competitiveLevel: CompetitiveLevel;
  weeklyPractices?: number;
  weeklyGames?: number;
  locale: string;
  physicalContext?: {
    status: "none" | "recovering" | "limited" | "prefer_not_to_say";
    note?: string;
  };
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

The app must reject onboarding completion when calculated age is below 16.

## PlayerGoal

```ts
type GoalType =
  | "more_minutes"
  | "fundamentals"
  | "game_understanding"
  | "defense"
  | "rebounding"
  | "inside_game"
  | "finishing"
  | "decision_making"
  | "confidence"
  | "rebuild_game_confidence"
  | "custom";

interface PlayerGoal {
  id: string;
  userId: string;
  goalType: GoalType;
  customLabel?: string;
  priority: 1 | 2 | 3;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Maximum three active goals.

`rebuild_game_confidence` is explicitly non-medical. It may influence basketball fundamentals, confidence, habits and learning recommendations. It must never influence rehabilitation progression, physical load, pain interpretation, medical clearance or decisions about whether the user should play.

## Skill

Global curated catalog.

```ts
interface Skill {
  id: string;        // stable semantic identifier
  code: string;
  category: "attack" | "defense" | "transition" | "communication" | "decision_making" | "habits";
  subcategory: string;
  level: "foundation" | "intermediate" | "advanced";
  positionAffinity: PlayerPosition[] | ["all"];
  tags: string[];
  active: boolean;
}
```

## Guideline

Global curated content linked to one or more skills.

```ts
type GuidelineContext = "practice" | "game" | "learning";

interface Guideline {
  id: string;
  skillIds: string[];
  category: string;
  subcategory: string;
  level: "foundation" | "intermediate" | "advanced";
  positions: PlayerPosition[] | ["all"];
  contexts: GuidelineContext[];
  translationKey: string;
  active: boolean;
}
```

Translated content is kept separately from domain identity.

Guideline contexts intentionally exclude `recovery`. Recovery remains a valid session type, but is not an MVP guideline recommendation context.

## Session

```ts
type SessionType = "practice" | "game" | "learning" | "recovery";

interface Session {
  id: string;
  userId: string;
  type: SessionType;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  perceivedLoad?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

## CheckIn

```ts
interface CheckIn {
  id: string;
  userId: string;
  sessionId: string;
  energy?: 1 | 2 | 3 | 4 | 5;
  confidence?: 1 | 2 | 3 | 4 | 5;
  physicalFeeling?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Reflection

```ts
interface Reflection {
  id: string;
  userId: string;
  sessionId: string;
  dailyFocusId?: string;
  focusRating: 1 | 2 | 3 | 4 | 5;
  note?: string;
  coachFeedback?: string;
  rememberNextTime?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Observation

Initially created by deterministic structured UI actions. AI may create observations later.

```ts
type ObservationPolarity = "positive" | "negative" | "neutral";

interface Observation {
  id: string;
  userId: string;
  sessionId?: string;
  reflectionId?: string;
  skillId: string;
  pattern?: string;
  polarity: ObservationPolarity;
  weight: number;
  source: "self_assessment" | "reflection" | "coach_feedback" | "system" | "ai";
  confidence: number; // 0..1
  observedAt: string;
}
```

## SkillState

Derived/cacheable state.

```ts
interface SkillState {
  userId: string;
  skillId: string;
  score: number;       // internal ranking signal, not necessarily shown as a grade
  confidence: number;
  sampleCount: number;
  trend: "up" | "flat" | "down" | "unknown";
  lastObservedAt?: string;
  updatedAt: string;
}
```

## DailyFocus

```ts
interface DailyFocus {
  id: string;
  userId: string;
  localDate: string; // YYYY-MM-DD in user's local zone when generated
  guidelineId: string;
  reasonCode:
    | "goal"
    | "recent_difficulty"
    | "coach_feedback"
    | "development_path"
    | "rotation";
  status: "planned" | "viewed" | "completed" | "skipped";
  createdAt: string;
  updatedAt: string;
}
```

## WeeklyReview

```ts
interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  highlightedSkillIds: string[];
  improvingSkillIds: string[];
  recurringSkillIds: string[];
  nextPrioritySkillIds: string[];
  userImprovementNote?: string;
  userNextWeekNote?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Remote tables

Expected MVP tables:
- profiles
- player_goals
- sessions
- check_ins
- reflections
- observations
- skill_state
- daily_focus
- weekly_reviews

Global content may be:
- shipped with the application as versioned JSON for MVP; or
- mirrored to read-only remote tables later.

For MVP, prefer versioned local content to maximize offline reliability.
