import {
  parseWeeklyReview,
  type BasketballContentRepository,
  type DailyFocusRepository,
  type ObservationRepository,
  type Reflection,
  type ReflectionRepository,
  type Session,
  type SessionRepository,
  type SkillStateRepository,
  type WeeklyReview,
  type WeeklyReviewRepository
} from '../../domain';
import { createClientId } from '../../lib/createClientId';
import {
  aggregateProgress,
  type ProgressOverview,
  type ProgressSignalTrend
} from './progressAggregator';

export interface ProgressDashboard {
  overview: ProgressOverview;
  weeklyReview: WeeklyReview | null;
}

export interface WeeklyReviewResult {
  created: boolean;
  overview: ProgressOverview;
  weeklyReview: WeeklyReview;
}

export interface SaveWeeklyReviewNotesInput {
  userId: string;
  userImprovementNote?: string;
  userNextWeekNote?: string;
}

export interface ProgressServicePort {
  getOrCreateWeeklyReview(userId: string): Promise<WeeklyReviewResult>;
  getProgressDashboard(userId: string): Promise<ProgressDashboard>;
  saveWeeklyReviewNotes(input: SaveWeeklyReviewNotesInput): Promise<WeeklyReviewResult>;
}

interface ProgressServiceDependencies {
  contentRepository: BasketballContentRepository;
  createId?: () => string;
  dailyFocusRepository: DailyFocusRepository;
  getLocalDate?: () => string;
  getNow?: () => Date;
  observationRepository: ObservationRepository;
  reflectionRepository: ReflectionRepository;
  sessionRepository: SessionRepository;
  skillStateRepository: SkillStateRepository;
  weeklyReviewRepository: WeeklyReviewRepository;
}

export class ProgressService implements ProgressServicePort {
  private readonly createId: () => string;
  private readonly getLocalDate: () => string;
  private readonly getNow: () => Date;

  constructor(private readonly dependencies: ProgressServiceDependencies) {
    this.createId = dependencies.createId ?? createClientId;
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getLocalDate =
      dependencies.getLocalDate ?? (() => formatLocalDate(this.getNow()));
  }

  async getProgressDashboard(userId: string): Promise<ProgressDashboard> {
    const overview = await this.buildOverview(userId);
    const weeklyReview = await this.dependencies.weeklyReviewRepository.getByWeekStart(
      userId,
      overview.weekStart,
    );

    return {
      overview,
      weeklyReview
    };
  }

  async getOrCreateWeeklyReview(userId: string): Promise<WeeklyReviewResult> {
    const overview = await this.buildOverview(userId);
    const existingReview = await this.dependencies.weeklyReviewRepository.getByWeekStart(
      userId,
      overview.weekStart,
    );

    if (existingReview) {
      return {
        created: false,
        overview,
        weeklyReview: existingReview
      };
    }

    const weeklyReview = createWeeklyReview({
      createId: this.createId,
      now: this.getNow().toISOString(),
      overview,
      userId
    });

    await this.dependencies.weeklyReviewRepository.save(weeklyReview);

    return {
      created: true,
      overview,
      weeklyReview
    };
  }

  async saveWeeklyReviewNotes(
    input: SaveWeeklyReviewNotesInput,
  ): Promise<WeeklyReviewResult> {
    const result = await this.getOrCreateWeeklyReview(input.userId);
    const now = this.getNow().toISOString();
    const weeklyReview = parseWeeklyReview({
      ...result.weeklyReview,
      userImprovementNote: normalizeOptionalText(input.userImprovementNote),
      userNextWeekNote: normalizeOptionalText(input.userNextWeekNote),
      updatedAt: now
    });

    await this.dependencies.weeklyReviewRepository.save(weeklyReview);

    return {
      ...result,
      created: false,
      weeklyReview
    };
  }

  private async buildOverview(userId: string): Promise<ProgressOverview> {
    const [
      dailyFocuses,
      guidelines,
      observations,
      sessions,
      skillStates,
      skills
    ] = await Promise.all([
      this.dependencies.dailyFocusRepository.listByUserId(userId),
      this.dependencies.contentRepository.listGuidelines(),
      this.dependencies.observationRepository.listByUserId(userId),
      this.dependencies.sessionRepository.listByUserId(userId),
      this.dependencies.skillStateRepository.listByUserId(userId),
      this.dependencies.contentRepository.listSkills()
    ]);
    const reflections = await listSessionReflections(
      userId,
      sessions,
      this.dependencies.reflectionRepository,
    );

    return aggregateProgress({
      dailyFocuses,
      guidelines,
      localDate: this.getLocalDate(),
      observations,
      reflections,
      sessions,
      skillStates,
      skills,
      userId
    });
  }
}

function createWeeklyReview({
  createId,
  now,
  overview,
  userId
}: {
  createId: () => string;
  now: string;
  overview: ProgressOverview;
  userId: string;
}): WeeklyReview {
  return parseWeeklyReview({
    id: createId(),
    userId,
    weekStart: overview.weekStart,
    highlightedSkillIds: getHighlightedSkillIds(overview),
    improvingSkillIds: getSkillIdsByTrend(overview, 'improving'),
    recurringSkillIds: getRecurringSkillIds(overview),
    nextPrioritySkillIds: getNextPrioritySkillIds(overview),
    createdAt: now,
    updatedAt: now
  });
}

function getHighlightedSkillIds(overview: ProgressOverview): string[] {
  return uniqueSkillIds([
    ...getSkillIdsByTrend(overview, 'improving'),
    ...overview.focusAreas.map((focusArea) => focusArea.skillId),
    ...overview.signals.map((signal) => signal.skillId)
  ]).slice(0, 4);
}

function getSkillIdsByTrend(
  overview: ProgressOverview,
  trend: ProgressSignalTrend,
): string[] {
  return overview.signals
    .filter((signal) => signal.trend === trend)
    .map((signal) => signal.skillId)
    .slice(0, 4);
}

function getRecurringSkillIds(overview: ProgressOverview): string[] {
  return overview.focusAreas
    .filter((focusArea) => focusArea.trend === 'stable' || focusArea.trend === 'learning')
    .map((focusArea) => focusArea.skillId)
    .slice(0, 4);
}

function getNextPrioritySkillIds(overview: ProgressOverview): string[] {
  const needsAttention = getSkillIdsByTrend(overview, 'needs_attention');

  return uniqueSkillIds([
    ...needsAttention,
    ...overview.focusAreas
      .filter((focusArea) => focusArea.trend !== 'improving')
      .map((focusArea) => focusArea.skillId),
    ...overview.signals
      .filter((signal) => signal.trend !== 'improving')
      .map((signal) => signal.skillId)
  ]).slice(0, 3);
}

function uniqueSkillIds(skillIds: string[]): string[] {
  return Array.from(new Set(skillIds));
}

async function listSessionReflections(
  userId: string,
  sessions: Session[],
  reflectionRepository: ReflectionRepository,
): Promise<Reflection[]> {
  const reflections = await Promise.all(
    sessions.map((session) => reflectionRepository.getBySessionId(session.id)),
  );

  return reflections.filter(
    (reflection): reflection is Reflection => Boolean(reflection && reflection.userId === userId),
  );
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
