import {
  assertActiveGoalLimit,
  assertCanCompleteOnboarding,
  MAX_ACTIVE_GOALS,
  parsePlayerGoal,
  parsePlayerProfile,
  type CompetitiveLevel,
  type DominantHand,
  type GoalPriority,
  type GoalType,
  type OnboardingDraft,
  type OnboardingDraftRepository,
  type OnboardingStep,
  type PhysicalContext,
  type PlayerGoal,
  type PlayerGoalRepository,
  type PlayerPosition,
  type PlayerProfile,
  type PlayerProfileRepository,
  type SelfAssessment
} from '../../domain';
import { createClientId } from '../../lib/createClientId';

export const onboardingSteps = [
  'locale',
  'profile',
  'experience',
  'goals',
  'assessment',
  'physical',
  'completion'
] as const satisfies readonly OnboardingStep[];

export const defaultSelfAssessment: SelfAssessment = {
  ballHandling: 3,
  shooting: 3,
  defense: 3,
  decisionMaking: 3,
  confidence: 3
};

export type OnboardingCompletionErrorCode =
  | 'birth_year_required'
  | 'competitive_level_required'
  | 'goal_required'
  | 'invalid_age'
  | 'primary_position_required'
  | 'too_many_goals';

export class OnboardingCompletionError extends Error {
  readonly code: OnboardingCompletionErrorCode;

  constructor(code: OnboardingCompletionErrorCode, message: string) {
    super(message);
    this.name = 'OnboardingCompletionError';
    this.code = code;
  }
}

interface OnboardingServiceDependencies {
  createId?: () => string;
  draftRepository: OnboardingDraftRepository;
  getNow?: () => Date;
  getReferenceYear?: () => number;
  goalRepository: PlayerGoalRepository;
  profileRepository: PlayerProfileRepository;
}

export interface CompleteOnboardingResult {
  goals: PlayerGoal[];
  profile: PlayerProfile;
}

export class OnboardingService {
  private readonly createId: () => string;
  private readonly getNow: () => Date;
  private readonly getReferenceYear: () => number;

  constructor(private readonly dependencies: OnboardingServiceDependencies) {
    this.createId = dependencies.createId ?? createClientId;
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getReferenceYear = dependencies.getReferenceYear ?? (() => this.getNow().getFullYear());
  }

  async complete(userId: string): Promise<CompleteOnboardingResult> {
    const draft = await this.loadDraft(userId, 'en');

    return this.completeDraft(draft);
  }

  async completeDraft(draft: OnboardingDraft): Promise<CompleteOnboardingResult> {
    const now = this.getNow().toISOString();
    const existingProfile = await this.dependencies.profileRepository.getByUserId(draft.userId);
    const existingGoals = await this.dependencies.goalRepository.listByUserId(draft.userId);
    const selectedGoalTypes = uniqueGoalTypes(draft.goalTypes);
    const birthYear = requireValue(draft.birthYear, 'birth_year_required');
    const primaryPosition = requireValue(draft.primaryPosition, 'primary_position_required');
    const competitiveLevel = requireValue(draft.competitiveLevel, 'competitive_level_required');

    if (selectedGoalTypes.length === 0) {
      throw new OnboardingCompletionError('goal_required', 'At least one onboarding goal is required.');
    }

    if (selectedGoalTypes.length > MAX_ACTIVE_GOALS) {
      throw new OnboardingCompletionError(
        'too_many_goals',
        `A player can have at most ${MAX_ACTIVE_GOALS} onboarding goals.`,
      );
    }

    try {
      assertCanCompleteOnboarding({ birthYear }, this.getReferenceYear());
    } catch {
      throw new OnboardingCompletionError('invalid_age', 'Player is below the minimum age.');
    }

    const profile = parsePlayerProfile({
      id: existingProfile?.id ?? this.createId(),
      userId: draft.userId,
      alias: draft.alias,
      birthYear,
      heightCm: draft.heightCm,
      dominantHand: draft.dominantHand,
      primaryPosition,
      secondaryPosition:
        draft.secondaryPosition && draft.secondaryPosition !== primaryPosition
          ? draft.secondaryPosition
          : undefined,
      experienceYears: draft.experienceYears,
      competitiveLevel,
      weeklyPractices: draft.weeklyPractices,
      weeklyGames: draft.weeklyGames,
      locale: draft.locale,
      physicalContext: draft.physicalContext,
      onboardingCompletedAt: existingProfile?.onboardingCompletedAt ?? now,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now
    });

    const goals = selectedGoalTypes.map((goalType, index) =>
      makeGoal({
        createId: this.createId,
        existingGoals,
        goalType,
        now,
        priority: (index + 1) as GoalPriority,
        userId: draft.userId
      }),
    );

    assertActiveGoalLimit(goals);

    await this.dependencies.profileRepository.save(profile);

    const selectedGoalIds = new Set(goals.map((goal) => goal.id));

    await Promise.all(
      existingGoals
        .filter((goal) => goal.active && !selectedGoalIds.has(goal.id))
        .map((goal) => this.dependencies.goalRepository.delete(goal.id)),
    );

    for (const goal of goals) {
      await this.dependencies.goalRepository.save(goal);
    }

    await this.dependencies.draftRepository.save({
      userId: draft.userId,
      currentStep: 'completion',
      locale: draft.locale,
      goalTypes: selectedGoalTypes,
      selfAssessment: draft.selfAssessment,
      completedAt: now,
      updatedAt: now
    });

    return { goals, profile };
  }

  async loadDraft(userId: string, fallbackLocale: string): Promise<OnboardingDraft> {
    const existingDraft = await this.dependencies.draftRepository.getByUserId(userId);

    if (existingDraft) {
      return existingDraft;
    }

    const draft = await this.createDraftFromExistingData(userId, fallbackLocale);
    await this.dependencies.draftRepository.save(draft);

    return draft;
  }

  async saveDraft(draft: OnboardingDraft): Promise<OnboardingDraft> {
    const nextDraft = {
      ...draft,
      goalTypes: uniqueGoalTypes(draft.goalTypes),
      updatedAt: this.getNow().toISOString()
    };

    await this.dependencies.draftRepository.save(nextDraft);

    return nextDraft;
  }

  private async createDraftFromExistingData(
    userId: string,
    fallbackLocale: string,
  ): Promise<OnboardingDraft> {
    const [profile, goals] = await Promise.all([
      this.dependencies.profileRepository.getByUserId(userId),
      this.dependencies.goalRepository.listByUserId(userId)
    ]);

    return {
      userId,
      currentStep: 'locale',
      locale: profile?.locale ?? fallbackLocale,
      alias: profile?.alias,
      birthYear: profile?.birthYear,
      heightCm: profile?.heightCm,
      dominantHand: profile?.dominantHand,
      primaryPosition: profile?.primaryPosition,
      secondaryPosition: profile?.secondaryPosition,
      experienceYears: profile?.experienceYears,
      competitiveLevel: profile?.competitiveLevel,
      weeklyPractices: profile?.weeklyPractices,
      weeklyGames: profile?.weeklyGames,
      goalTypes: goals
        .filter((goal) => goal.active)
        .sort((a, b) => a.priority - b.priority)
        .map((goal) => goal.goalType),
      selfAssessment: defaultSelfAssessment,
      physicalContext: profile?.physicalContext,
      updatedAt: this.getNow().toISOString()
    };
  }
}

function makeGoal({
  createId,
  existingGoals,
  goalType,
  now,
  priority,
  userId
}: {
  createId: () => string;
  existingGoals: PlayerGoal[];
  goalType: GoalType;
  now: string;
  priority: GoalPriority;
  userId: string;
}): PlayerGoal {
  const existingGoal = existingGoals.find((goal) => goal.active && goal.goalType === goalType);

  return parsePlayerGoal({
    id: existingGoal?.id ?? createId(),
    userId,
    goalType,
    priority,
    active: true,
    createdAt: existingGoal?.createdAt ?? now,
    updatedAt: now
  });
}

function requireValue<T>(
  value: T | undefined,
  code: OnboardingCompletionErrorCode,
): T {
  if (value === undefined) {
    throw new OnboardingCompletionError(code, `${code} is required.`);
  }

  return value;
}

function uniqueGoalTypes(goalTypes: GoalType[]): GoalType[] {
  return [...new Set(goalTypes)];
}

export type OnboardingOptionValue =
  | CompetitiveLevel
  | DominantHand
  | GoalType
  | PhysicalContext['status']
  | PlayerPosition;
