import type {
  DailyFocus,
  DailyFocusReasonCode,
  GoalType,
  Guideline,
  GuidelineContext,
  Observation,
  PlayerGoal,
  PlayerProfile,
  Skill,
  SkillState
} from '../../domain';

type RecommendationProfile = Pick<
  PlayerProfile,
  'competitiveLevel' | 'experienceYears' | 'primaryPosition' | 'secondaryPosition'
>;

export interface RecommendationEngineInput {
  activeGoals: PlayerGoal[];
  availableTranslationKeys?: readonly string[];
  context?: GuidelineContext;
  guidelines: Guideline[];
  localDate: string;
  medicalRestrictedGuidelineIds?: readonly string[];
  observations: Observation[];
  playerProfile?: RecommendationProfile | null;
  recentFocuses: DailyFocus[];
  skillStates: SkillState[];
  skills: Skill[];
  userId: string;
}

export interface RecommendationScoreBreakdown {
  baseScore: number;
  finalScore: number;
  modifiers: {
    coachFeedbackBoost: number;
    consecutiveSkillPenalty: number;
    positiveEvidencePenalty: number;
  };
  signals: {
    goalMatch: number;
    observationSignal: number;
    positionFit: number;
    recentDifficulty: number;
    recencyNeed: number;
  };
}

export interface RankedRecommendationCandidate {
  breakdown: RecommendationScoreBreakdown;
  guideline: Guideline;
  reasonCode: DailyFocusReasonCode;
  score: number;
  tieBreak: number;
}

interface RecommendationConfig {
  coachFeedbackBoost: number;
  coachFeedbackWindowDays: number;
  consecutiveSkillPenalty: number;
  consecutiveSkillPenaltyLength: number;
  observationWindowDays: number;
  positiveEvidencePenalty: number;
  positiveEvidenceWindowDays: number;
  recentNegativeWindowDays: number;
  repeatCooldownDays: number;
  weights: {
    goalMatch: number;
    observationSignal: number;
    positionFit: number;
    recentDifficulty: number;
    recencyNeed: number;
  };
}

interface CandidateContext {
  guideline: Guideline;
  linkedSkills: Skill[];
  skillIds: string[];
}

const defaultConfig: RecommendationConfig = {
  coachFeedbackBoost: 0.18,
  coachFeedbackWindowDays: 14,
  consecutiveSkillPenalty: 0.35,
  consecutiveSkillPenaltyLength: 3,
  observationWindowDays: 14,
  positiveEvidencePenalty: 0.12,
  positiveEvidenceWindowDays: 21,
  recentNegativeWindowDays: 7,
  repeatCooldownDays: 5,
  weights: {
    goalMatch: 0.3,
    recentDifficulty: 0.25,
    observationSignal: 0.2,
    recencyNeed: 0.15,
    positionFit: 0.1
  }
};

export function rankRecommendationCandidates(
  input: RecommendationEngineInput,
): RankedRecommendationCandidate[] {
  const config = defaultConfig;
  const skillsById = new Map(input.skills.map((skill) => [skill.id, skill]));
  const historyByGuidelineId = new Map(input.guidelines.map((guideline) => [guideline.id, guideline]));
  const eligibleCandidates = input.guidelines
    .map((guideline) => createCandidateContext(guideline, skillsById))
    .filter((candidate) => isEligibleCandidate(candidate, input, config));

  return eligibleCandidates
    .map((candidate) => scoreCandidate(candidate, input, historyByGuidelineId, config))
    .sort(compareRankedCandidates);
}

export function selectRecommendedGuideline(
  input: RecommendationEngineInput,
): RankedRecommendationCandidate | null {
  return rankRecommendationCandidates(input)[0] ?? null;
}

function createCandidateContext(
  guideline: Guideline,
  skillsById: Map<string, Skill>,
): CandidateContext {
  return {
    guideline,
    linkedSkills: guideline.skillIds.flatMap((skillId) => {
      const skill = skillsById.get(skillId);

      return skill ? [skill] : [];
    }),
    skillIds: guideline.skillIds
  };
}

function isEligibleCandidate(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  config: RecommendationConfig,
): boolean {
  if (!candidate.guideline.active) {
    return false;
  }

  if (input.context && !candidate.guideline.contexts.includes(input.context)) {
    return false;
  }

  if (
    input.availableTranslationKeys &&
    !input.availableTranslationKeys.includes(candidate.guideline.translationKey)
  ) {
    return false;
  }

  if (input.medicalRestrictedGuidelineIds?.includes(candidate.guideline.id)) {
    return false;
  }

  if (wasGuidelineShownWithinCooldown(candidate.guideline, input, config.repeatCooldownDays)) {
    return false;
  }

  return isLevelEligible(candidate, input);
}

function scoreCandidate(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  guidelinesById: Map<string, Guideline>,
  config: RecommendationConfig,
): RankedRecommendationCandidate {
  const signals = {
    goalMatch: getGoalMatchSignal(candidate, input.activeGoals),
    observationSignal: getObservationSignal(candidate, input, config),
    positionFit: getPositionFitSignal(candidate, input.playerProfile),
    recentDifficulty: getRecentDifficultySignal(candidate, input),
    recencyNeed: getRecencyNeedSignal(candidate, input, guidelinesById)
  };
  const modifiers = {
    coachFeedbackBoost: getCoachFeedbackBoost(candidate, input, config),
    consecutiveSkillPenalty: getConsecutiveSkillPenalty(candidate, input, guidelinesById, config),
    positiveEvidencePenalty: getPositiveEvidencePenalty(candidate, input, config)
  };
  const baseScore =
    signals.goalMatch * config.weights.goalMatch +
    signals.recentDifficulty * config.weights.recentDifficulty +
    signals.observationSignal * config.weights.observationSignal +
    signals.recencyNeed * config.weights.recencyNeed +
    signals.positionFit * config.weights.positionFit;
  const finalScore = clamp01(
    baseScore +
      modifiers.coachFeedbackBoost -
      modifiers.consecutiveSkillPenalty -
      modifiers.positiveEvidencePenalty,
  );
  const breakdown = {
    baseScore: roundScore(baseScore),
    finalScore: roundScore(finalScore),
    modifiers,
    signals
  };

  return {
    breakdown,
    guideline: candidate.guideline,
    reasonCode: getReasonCode(candidate, breakdown),
    score: breakdown.finalScore,
    tieBreak: stableHash(`${input.userId}:${input.localDate}:${input.context ?? 'open'}:${candidate.guideline.id}`)
  };
}

function getGoalMatchSignal(candidate: CandidateContext, activeGoals: PlayerGoal[]): number {
  const activeGoalMatches = activeGoals
    .filter((goal) => goal.active)
    .map((goal) => getGoalMatchForType(candidate, goal.goalType) * getGoalPriorityWeight(goal));

  return roundScore(Math.max(0, ...activeGoalMatches));
}

function getGoalMatchForType(candidate: CandidateContext, goalType: GoalType): number {
  switch (goalType) {
    case 'confidence':
      return getConfidenceMatch(candidate);
    case 'decision_making':
      return getDecisionMakingMatch(candidate);
    case 'defense':
      return getCategoryMatch(candidate, 'defense');
    case 'finishing':
      return getKeywordMatch(candidate, ['finishing', 'finish']);
    case 'fundamentals':
      return Math.max(
        candidate.guideline.level === 'foundation' ? 0.55 : 0,
        getKeywordMatch(candidate, ['balance', 'dribble', 'footwork', 'fundamentals', 'passing']),
      );
    case 'game_understanding':
      return Math.max(
        getCategoryMatch(candidate, 'communication') * 0.85,
        getCategoryMatch(candidate, 'decision_making'),
        getCategoryMatch(candidate, 'transition') * 0.8,
        getKeywordMatch(candidate, ['reads', 'advantage', 'positioning']) * 0.75,
      );
    case 'inside_game':
      return Math.max(
        getKeywordMatch(candidate, ['finishing', 'rebounding', 'contact']),
        candidate.guideline.subcategory === 'rebounding' ? 1 : 0,
      );
    case 'more_minutes':
      return Math.max(
        getCategoryMatch(candidate, 'defense') * 0.65,
        getCategoryMatch(candidate, 'habits') * 0.75,
        getCategoryMatch(candidate, 'communication') * 0.7,
      );
    case 'rebounding':
      return Math.max(
        candidate.guideline.subcategory === 'rebounding' ? 1 : 0,
        getKeywordMatch(candidate, ['rebounding', 'rebound']),
      );
    case 'rebuild_game_confidence':
      return Math.max(
        getConfidenceMatch(candidate),
        getCategoryMatch(candidate, 'habits') * 0.9,
        getKeywordMatch(candidate, ['balance', 'dribble', 'footwork', 'fundamentals', 'passing']) * 0.75,
        candidate.guideline.contexts.includes('learning') ? 0.55 : 0,
      );
    case 'custom':
      return 0;
  }
}

function getGoalPriorityWeight(goal: PlayerGoal): number {
  switch (goal.priority) {
    case 1:
      return 1;
    case 2:
      return 0.75;
    case 3:
      return 0.5;
  }
}

function getRecentDifficultySignal(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
): number {
  const linkedStateScores = candidate.skillIds.flatMap((skillId) => {
    const state = input.skillStates.find(
      (skillState) => skillState.userId === input.userId && skillState.skillId === skillId,
    );

    if (!state) {
      return [];
    }

    const scoreNeed = 1 - clamp01(state.score);
    const trendModifier =
      state.trend === 'down' ? 0.25 : state.trend === 'flat' ? 0.05 : state.trend === 'up' ? -0.1 : 0;
    const confidenceWeight = 0.5 + state.confidence / 2;

    return [clamp01((scoreNeed + trendModifier) * confidenceWeight)];
  });

  return roundScore(Math.max(0, ...linkedStateScores));
}

function getObservationSignal(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  config: RecommendationConfig,
): number {
  const recentObservations = getLinkedObservations(candidate, input).filter(
    (observation) => getDaysSinceIso(observation.observedAt, input.localDate) <= config.observationWindowDays,
  );
  const negativeSignal = recentObservations
    .filter((observation) => observation.polarity === 'negative')
    .reduce(
      (total, observation) =>
        total +
        observation.weight *
          observation.confidence *
          getLinearDecay(getDaysSinceIso(observation.observedAt, input.localDate), config.observationWindowDays),
      0,
    );
  const repeatedNegativeCount = recentObservations.filter(
    (observation) =>
      observation.polarity === 'negative' &&
      getDaysSinceIso(observation.observedAt, input.localDate) <= config.recentNegativeWindowDays,
  ).length;
  const repeatedNegativeBoost = repeatedNegativeCount >= 2 ? 0.25 : 0;

  return roundScore(clamp01(negativeSignal + repeatedNegativeBoost));
}

function getRecencyNeedSignal(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  guidelinesById: Map<string, Guideline>,
): number {
  const previousFocuses = getPreviousFocuses(input.recentFocuses, input.localDate);
  const exactGuidelineDays = previousFocuses
    .filter((focus) => focus.guidelineId === candidate.guideline.id)
    .map((focus) => getDaysBetweenLocalDates(focus.localDate, input.localDate));
  const linkedSkillDays = previousFocuses.flatMap((focus) => {
    const focusGuideline = guidelinesById.get(focus.guidelineId);

    if (!focusGuideline || !hasSharedSkill(candidate.skillIds, focusGuideline.skillIds)) {
      return [];
    }

    return [getDaysBetweenLocalDates(focus.localDate, input.localDate)];
  });
  const daysSinceLast = Math.min(...exactGuidelineDays, ...linkedSkillDays);

  if (!Number.isFinite(daysSinceLast)) {
    return 1;
  }

  return roundScore(clamp01(daysSinceLast / 21));
}

function getPositionFitSignal(
  candidate: CandidateContext,
  playerProfile: RecommendationProfile | null | undefined,
): number {
  if (!playerProfile) {
    return 0.5;
  }

  const guidelineFit = getPositionAffinity(candidate.guideline.positions, playerProfile);
  const skillFit = Math.max(
    0,
    ...candidate.linkedSkills.map((skill) =>
      getPositionAffinity(skill.positionAffinity, playerProfile),
    ),
  );

  return roundScore(Math.max(guidelineFit, skillFit));
}

function getCoachFeedbackBoost(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  config: RecommendationConfig,
): number {
  const hasCoachCorrection = getLinkedObservations(candidate, input).some((observation) => {
    const daysSince = getDaysSinceIso(observation.observedAt, input.localDate);

    return (
      observation.source === 'coach_feedback' &&
      observation.polarity !== 'positive' &&
      daysSince <= config.coachFeedbackWindowDays
    );
  });

  return hasCoachCorrection ? config.coachFeedbackBoost : 0;
}

function getPositiveEvidencePenalty(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  config: RecommendationConfig,
): number {
  const positiveEvidenceCount = getLinkedObservations(candidate, input).filter((observation) => {
    const daysSince = getDaysSinceIso(observation.observedAt, input.localDate);

    return observation.polarity === 'positive' && daysSince <= config.positiveEvidenceWindowDays;
  }).length;

  return positiveEvidenceCount >= 2 ? config.positiveEvidencePenalty : 0;
}

function getConsecutiveSkillPenalty(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
  guidelinesById: Map<string, Guideline>,
  config: RecommendationConfig,
): number {
  const recentFocuses = getPreviousFocuses(input.recentFocuses, input.localDate)
    .sort((left, right) => getDaysBetweenLocalDates(left.localDate, input.localDate) - getDaysBetweenLocalDates(right.localDate, input.localDate))
    .slice(0, config.consecutiveSkillPenaltyLength);

  if (recentFocuses.length < config.consecutiveSkillPenaltyLength) {
    return 0;
  }

  const allRecentFocusesUseCandidateSkill = recentFocuses.every((focus) => {
    const guideline = guidelinesById.get(focus.guidelineId);

    return guideline ? hasSharedSkill(candidate.skillIds, guideline.skillIds) : false;
  });

  return allRecentFocusesUseCandidateSkill ? config.consecutiveSkillPenalty : 0;
}

function getReasonCode(
  candidate: CandidateContext,
  breakdown: RecommendationScoreBreakdown,
): DailyFocusReasonCode {
  if (breakdown.modifiers.coachFeedbackBoost > 0) {
    return 'coach_feedback';
  }

  if (
    breakdown.signals.goalMatch > 0 &&
    breakdown.signals.goalMatch >= breakdown.signals.recentDifficulty &&
    breakdown.signals.goalMatch >= breakdown.signals.observationSignal
  ) {
    return 'goal';
  }

  if (breakdown.signals.observationSignal >= 0.35 || breakdown.signals.recentDifficulty >= 0.55) {
    return 'recent_difficulty';
  }

  if (candidate.guideline.level !== 'foundation') {
    return 'development_path';
  }

  return 'rotation';
}

function wasGuidelineShownWithinCooldown(
  guideline: Guideline,
  input: RecommendationEngineInput,
  repeatCooldownDays: number,
): boolean {
  return input.recentFocuses.some((focus) => {
    const daysBetween = getDaysBetweenLocalDates(focus.localDate, input.localDate);

    return focus.guidelineId === guideline.id && daysBetween > 0 && daysBetween <= repeatCooldownDays;
  });
}

function isLevelEligible(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
): boolean {
  if (candidate.guideline.level === 'foundation') {
    return true;
  }

  const linkedStates = candidate.skillIds.flatMap((skillId) => {
    const state = input.skillStates.find(
      (skillState) => skillState.userId === input.userId && skillState.skillId === skillId,
    );

    return state ? [state] : [];
  });

  if (candidate.guideline.level === 'intermediate') {
    return input.playerProfile?.competitiveLevel !== 'recreational' || linkedStates.length > 0;
  }

  return linkedStates.some(
    (state) => state.sampleCount >= 3 && state.confidence >= 0.5 && state.score >= 0.55,
  );
}

function getLinkedObservations(
  candidate: CandidateContext,
  input: RecommendationEngineInput,
): Observation[] {
  return input.observations.filter(
    (observation) =>
      observation.userId === input.userId && candidate.skillIds.includes(observation.skillId),
  );
}

function getPreviousFocuses(recentFocuses: DailyFocus[], localDate: string): DailyFocus[] {
  return recentFocuses.filter((focus) => getDaysBetweenLocalDates(focus.localDate, localDate) > 0);
}

function getCategoryMatch(candidate: CandidateContext, category: string): number {
  if (candidate.guideline.category === category) {
    return 1;
  }

  return candidate.linkedSkills.some((skill) => skill.category === category) ? 0.9 : 0;
}

function getKeywordMatch(candidate: CandidateContext, keywords: readonly string[]): number {
  const normalizedKeywords = keywords.map(normalizeToken);
  const candidateValues = [
    candidate.guideline.category,
    candidate.guideline.subcategory,
    ...candidate.linkedSkills.flatMap((skill) => [
      skill.category,
      skill.subcategory,
      ...skill.tags
    ])
  ].map(normalizeToken);

  return candidateValues.some((value) =>
    normalizedKeywords.some((keyword) => value.includes(keyword)),
  )
    ? 1
    : 0;
}

function getConfidenceMatch(candidate: CandidateContext): number {
  return Math.max(
    candidate.guideline.subcategory === 'confidence_attention' ? 1 : 0,
    getCategoryMatch(candidate, 'habits') * 0.75,
    getKeywordMatch(candidate, ['confidence', 'attention', 'reset']),
  );
}

function getDecisionMakingMatch(candidate: CandidateContext): number {
  return Math.max(
    getCategoryMatch(candidate, 'decision_making'),
    getKeywordMatch(candidate, ['advantage', 'passing', 'reads']) * 0.7,
  );
}

function getPositionAffinity(
  positions: Guideline['positions'] | Skill['positionAffinity'],
  playerProfile: RecommendationProfile,
): number {
  if (positions[0] === 'all') {
    return 0.65;
  }

  const positionValues = positions as readonly RecommendationProfile['primaryPosition'][];

  if (positionValues.includes(playerProfile.primaryPosition)) {
    return 1;
  }

  if (
    playerProfile.secondaryPosition &&
    positionValues.includes(playerProfile.secondaryPosition)
  ) {
    return 0.85;
  }

  return 0.25;
}

function hasSharedSkill(leftSkillIds: readonly string[], rightSkillIds: readonly string[]): boolean {
  return leftSkillIds.some((skillId) => rightSkillIds.includes(skillId));
}

function getDaysSinceIso(isoDate: string, localDate: string): number {
  return getDaysBetweenLocalDates(formatLocalDate(new Date(isoDate)), localDate);
}

function getDaysBetweenLocalDates(fromLocalDate: string, toLocalDate: string): number {
  return Math.floor((parseLocalDate(toLocalDate).getTime() - parseLocalDate(fromLocalDate).getTime()) / 86_400_000);
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

function getLinearDecay(daysSince: number, windowDays: number): number {
  if (daysSince < 0 || daysSince > windowDays) {
    return 0;
  }

  return 1 - daysSince / (windowDays + 1);
}

function compareRankedCandidates(
  left: RankedRecommendationCandidate,
  right: RankedRecommendationCandidate,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (left.tieBreak !== right.tieBreak) {
    return left.tieBreak - right.tieBreak;
  }

  return left.guideline.id.localeCompare(right.guideline.id);
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function stableHash(value: string): number {
  return [...value].reduce((hash, character) => {
    return (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  }, 0);
}
