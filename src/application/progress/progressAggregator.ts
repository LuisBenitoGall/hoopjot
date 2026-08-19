import type {
  DailyFocus,
  Guideline,
  Observation,
  Reflection,
  Session,
  Skill,
  SkillState
} from '../../domain';

export type ProgressSignalTrend = 'improving' | 'stable' | 'needs_attention' | 'learning';
export type ProgressLearningState = 'empty' | 'building' | 'ready';

export interface ProgressSessionSummary {
  dailyFocus: DailyFocus | null;
  guideline: Guideline | null;
  localDate: string;
  occurredAt: string;
  reflection: Reflection | null;
  session: Session;
  trend: ProgressSignalTrend;
}

export interface FocusAreaSummary {
  lastFocusedAt: string;
  skill: Skill | null;
  skillId: string;
  trend: ProgressSignalTrend;
}

export interface ProgressSignal {
  evidenceCount: number;
  skill: Skill | null;
  skillId: string;
  trend: ProgressSignalTrend;
}

export interface ProgressOverview {
  focusAreas: FocusAreaSummary[];
  learningState: ProgressLearningState;
  localDate: string;
  recentSessions: ProgressSessionSummary[];
  signals: ProgressSignal[];
  weekStart: string;
}

export interface ProgressAggregationInput {
  dailyFocuses: DailyFocus[];
  guidelines: Guideline[];
  localDate: string;
  observations: Observation[];
  reflections: Reflection[];
  sessions: Session[];
  skillStates: SkillState[];
  skills: Skill[];
  userId: string;
}

interface SkillEvidence {
  focusDates: string[];
  negativeObservationCount: number;
  positiveObservationCount: number;
  ratingCount: number;
  ratingTotal: number;
  skillState?: SkillState;
}

const recentSessionLimit = 5;
const focusAreaLimit = 4;
const signalLimit = 6;
const lookbackDays = 28;

export function aggregateProgress(input: ProgressAggregationInput): ProgressOverview {
  const guidelinesById = new Map(input.guidelines.map((guideline) => [guideline.id, guideline]));
  const skillsById = new Map(input.skills.map((skill) => [skill.id, skill]));
  const dailyFocusesById = new Map(input.dailyFocuses.map((focus) => [focus.id, focus]));
  const dailyFocusesByLocalDate = new Map(
    input.dailyFocuses.map((focus) => [focus.localDate, focus]),
  );
  const reflectionsBySessionId = new Map(
    input.reflections.map((reflection) => [reflection.sessionId, reflection]),
  );
  const recentSessions = input.sessions
    .filter((session) => session.userId === input.userId && !session.deletedAt)
    .sort((left, right) => getSessionTime(right) - getSessionTime(left))
    .slice(0, recentSessionLimit)
    .map((session) =>
      summarizeSession({
        dailyFocusesById,
        dailyFocusesByLocalDate,
        guidelinesById,
        reflectionsBySessionId,
        session
      }),
    );
  const evidenceBySkillId = collectSkillEvidence({
    dailyFocusesById,
    dailyFocusesByLocalDate,
    guidelinesById,
    input,
    reflectionsBySessionId
  });
  const signals = buildProgressSignals(evidenceBySkillId, skillsById);
  const signalsBySkillId = new Map(signals.map((signal) => [signal.skillId, signal]));
  const focusAreas = buildFocusAreas(evidenceBySkillId, signalsBySkillId, skillsById);

  return {
    focusAreas,
    learningState: getLearningState(recentSessions.length, signals.length),
    localDate: input.localDate,
    recentSessions,
    signals,
    weekStart: getWeekStart(input.localDate)
  };
}

function summarizeSession({
  dailyFocusesById,
  dailyFocusesByLocalDate,
  guidelinesById,
  reflectionsBySessionId,
  session
}: {
  dailyFocusesById: Map<string, DailyFocus>;
  dailyFocusesByLocalDate: Map<string, DailyFocus>;
  guidelinesById: Map<string, Guideline>;
  reflectionsBySessionId: Map<string, Reflection>;
  session: Session;
}): ProgressSessionSummary {
  const localDate = getSessionLocalDate(session);
  const reflection = reflectionsBySessionId.get(session.id) ?? null;
  const dailyFocus =
    (reflection?.dailyFocusId ? dailyFocusesById.get(reflection.dailyFocusId) : null) ??
    dailyFocusesByLocalDate.get(localDate) ??
    null;
  const guideline = dailyFocus ? guidelinesById.get(dailyFocus.guidelineId) ?? null : null;

  return {
    dailyFocus,
    guideline,
    localDate,
    occurredAt: getSessionOccurrenceIso(session),
    reflection,
    session,
    trend: getReflectionTrend(reflection)
  };
}

function collectSkillEvidence({
  dailyFocusesById,
  dailyFocusesByLocalDate,
  guidelinesById,
  input,
  reflectionsBySessionId
}: {
  dailyFocusesById: Map<string, DailyFocus>;
  dailyFocusesByLocalDate: Map<string, DailyFocus>;
  guidelinesById: Map<string, Guideline>;
  input: ProgressAggregationInput;
  reflectionsBySessionId: Map<string, Reflection>;
}): Map<string, SkillEvidence> {
  const evidenceBySkillId = new Map<string, SkillEvidence>();

  for (const focus of input.dailyFocuses) {
    if (
      focus.userId !== input.userId ||
      !isWithinLookback(focus.localDate, input.localDate, lookbackDays)
    ) {
      continue;
    }

    const guideline = guidelinesById.get(focus.guidelineId);

    if (!guideline) {
      continue;
    }

    for (const skillId of guideline.skillIds) {
      getEvidence(evidenceBySkillId, skillId).focusDates.push(focus.localDate);
    }
  }

  for (const observation of input.observations) {
    if (
      observation.userId !== input.userId ||
      !isWithinLookback(formatLocalDate(new Date(observation.observedAt)), input.localDate, lookbackDays)
    ) {
      continue;
    }

    const evidence = getEvidence(evidenceBySkillId, observation.skillId);

    if (observation.polarity === 'positive') {
      evidence.positiveObservationCount += 1;
    }

    if (observation.polarity === 'negative') {
      evidence.negativeObservationCount += 1;
    }
  }

  for (const skillState of input.skillStates) {
    if (skillState.userId !== input.userId) {
      continue;
    }

    getEvidence(evidenceBySkillId, skillState.skillId).skillState = skillState;
  }

  for (const session of input.sessions) {
    if (session.userId !== input.userId || session.deletedAt) {
      continue;
    }

    const sessionLocalDate = getSessionLocalDate(session);

    if (!isWithinLookback(sessionLocalDate, input.localDate, lookbackDays)) {
      continue;
    }

    const reflection = reflectionsBySessionId.get(session.id);
    const focus =
      (reflection?.dailyFocusId ? dailyFocusesById.get(reflection.dailyFocusId) : null) ??
      dailyFocusesByLocalDate.get(sessionLocalDate);
    const guideline = focus ? guidelinesById.get(focus.guidelineId) : null;

    if (!reflection || !guideline) {
      continue;
    }

    for (const skillId of guideline.skillIds) {
      const evidence = getEvidence(evidenceBySkillId, skillId);
      evidence.ratingCount += 1;
      evidence.ratingTotal += reflection.focusRating;
    }
  }

  return evidenceBySkillId;
}

function buildProgressSignals(
  evidenceBySkillId: Map<string, SkillEvidence>,
  skillsById: Map<string, Skill>,
): ProgressSignal[] {
  return Array.from(evidenceBySkillId.entries())
    .map(([skillId, evidence]) => ({
      evidenceCount: getEvidenceCount(evidence),
      skill: skillsById.get(skillId) ?? null,
      skillId,
      trend: getSkillTrend(evidence)
    }))
    .filter((signal) => signal.evidenceCount > 0)
    .sort(compareSignals)
    .slice(0, signalLimit);
}

function buildFocusAreas(
  evidenceBySkillId: Map<string, SkillEvidence>,
  signalsBySkillId: Map<string, ProgressSignal>,
  skillsById: Map<string, Skill>,
): FocusAreaSummary[] {
  return Array.from(evidenceBySkillId.entries())
    .filter(([, evidence]) => evidence.focusDates.length > 0)
    .map(([skillId, evidence]) => ({
      lastFocusedAt: [...evidence.focusDates].sort().at(-1) ?? '',
      skill: skillsById.get(skillId) ?? null,
      skillId,
      trend: signalsBySkillId.get(skillId)?.trend ?? 'learning'
    }))
    .sort((left, right) => {
      const focusCountDifference =
        (evidenceBySkillId.get(right.skillId)?.focusDates.length ?? 0) -
        (evidenceBySkillId.get(left.skillId)?.focusDates.length ?? 0);

      if (focusCountDifference !== 0) {
        return focusCountDifference;
      }

      return right.lastFocusedAt.localeCompare(left.lastFocusedAt) || left.skillId.localeCompare(right.skillId);
    })
    .slice(0, focusAreaLimit);
}

function getSkillTrend(evidence: SkillEvidence): ProgressSignalTrend {
  if (
    evidence.skillState?.trend === 'down' ||
    evidence.negativeObservationCount >= 2 ||
    hasLowReflectionPattern(evidence)
  ) {
    return 'needs_attention';
  }

  if (
    evidence.skillState?.trend === 'up' ||
    evidence.positiveObservationCount >= 2 ||
    hasStrongReflectionPattern(evidence)
  ) {
    return 'improving';
  }

  if (
    evidence.skillState?.trend === 'flat' ||
    evidence.ratingCount >= 2 ||
    evidence.focusDates.length >= 2
  ) {
    return 'stable';
  }

  return 'learning';
}

function getReflectionTrend(reflection: Reflection | null): ProgressSignalTrend {
  if (!reflection) {
    return 'learning';
  }

  if (reflection.focusRating >= 4) {
    return 'improving';
  }

  if (reflection.focusRating <= 2) {
    return 'needs_attention';
  }

  return 'stable';
}

function getEvidenceCount(evidence: SkillEvidence): number {
  return (
    evidence.focusDates.length +
    evidence.negativeObservationCount +
    evidence.positiveObservationCount +
    evidence.ratingCount +
    (evidence.skillState ? 1 : 0)
  );
}

function hasStrongReflectionPattern(evidence: SkillEvidence): boolean {
  return evidence.ratingCount >= 2 && evidence.ratingTotal / evidence.ratingCount >= 4;
}

function hasLowReflectionPattern(evidence: SkillEvidence): boolean {
  return evidence.ratingCount >= 2 && evidence.ratingTotal / evidence.ratingCount <= 2.5;
}

function compareSignals(left: ProgressSignal, right: ProgressSignal): number {
  const trendDifference = getTrendWeight(right.trend) - getTrendWeight(left.trend);

  if (trendDifference !== 0) {
    return trendDifference;
  }

  return right.evidenceCount - left.evidenceCount || left.skillId.localeCompare(right.skillId);
}

function getTrendWeight(trend: ProgressSignalTrend): number {
  switch (trend) {
    case 'needs_attention':
      return 4;
    case 'improving':
      return 3;
    case 'stable':
      return 2;
    case 'learning':
      return 1;
  }
}

function getLearningState(sessionCount: number, signalCount: number): ProgressLearningState {
  if (sessionCount === 0 && signalCount === 0) {
    return 'empty';
  }

  return sessionCount < 3 || signalCount < 2 ? 'building' : 'ready';
}

function getEvidence(
  evidenceBySkillId: Map<string, SkillEvidence>,
  skillId: string,
): SkillEvidence {
  const existingEvidence = evidenceBySkillId.get(skillId);

  if (existingEvidence) {
    return existingEvidence;
  }

  const nextEvidence: SkillEvidence = {
    focusDates: [],
    negativeObservationCount: 0,
    positiveObservationCount: 0,
    ratingCount: 0,
    ratingTotal: 0
  };

  evidenceBySkillId.set(skillId, nextEvidence);

  return nextEvidence;
}

export function getWeekStart(localDate: string): string {
  const date = parseLocalDate(localDate);
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - daysSinceMonday);

  return formatLocalDate(date);
}

function isWithinLookback(valueLocalDate: string, currentLocalDate: string, days: number): boolean {
  const dayDifference = getDaysBetweenLocalDates(valueLocalDate, currentLocalDate);

  return dayDifference >= 0 && dayDifference <= days;
}

function getSessionLocalDate(session: Session): string {
  return formatLocalDate(new Date(getSessionTime(session)));
}

function getSessionTime(session: Session): number {
  return Date.parse(getSessionOccurrenceIso(session));
}

function getSessionOccurrenceIso(session: Session): string {
  return session.startedAt ?? session.scheduledAt ?? session.completedAt ?? session.createdAt;
}

function getDaysBetweenLocalDates(fromLocalDate: string, toLocalDate: string): number {
  return Math.floor(
    (parseLocalDate(toLocalDate).getTime() - parseLocalDate(fromLocalDate).getTime()) /
      86_400_000,
  );
}

function parseLocalDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
