import {
  parseDailyFocus,
  type BasketballContentRepository,
  type DailyFocus,
  type DailyFocusRepository,
  type DailyFocusStatus,
  type Guideline,
  type GuidelineContext,
  type ObservationRepository,
  type PlayerGoalRepository,
  type PlayerProfileRepository,
  type Session,
  type SessionRepository,
  type SessionType,
  type SkillStateRepository
} from '../../domain';
import { createClientId } from '../../lib/createClientId';
import { selectRecommendedGuideline } from '../recommendations';

export type TodayFocusUnavailableReason =
  | 'missing_guideline'
  | 'no_eligible_content'
  | 'recovery_session';

export interface TodayFocusResult {
  dailyFocus: DailyFocus | null;
  guideline: Guideline | null;
  localDate: string;
  selectionContext?: GuidelineContext;
  unavailableReason?: TodayFocusUnavailableReason;
}

interface TodayServiceDependencies {
  contentRepository: BasketballContentRepository;
  createId?: () => string;
  dailyFocusRepository: DailyFocusRepository;
  getLocalDate?: () => string;
  getNow?: () => Date;
  goalRepository?: PlayerGoalRepository;
  observationRepository?: ObservationRepository;
  profileRepository?: PlayerProfileRepository;
  sessionRepository: SessionRepository;
  skillStateRepository?: SkillStateRepository;
}

interface SessionContextSelection {
  context?: GuidelineContext;
  recoveryOnly: boolean;
}

const recommendationSessionTypes: readonly GuidelineContext[] = [
  'practice',
  'game',
  'learning'
];

export class TodayService {
  private readonly createId: () => string;
  private readonly getLocalDate: () => string;
  private readonly getNow: () => Date;

  constructor(private readonly dependencies: TodayServiceDependencies) {
    this.createId = dependencies.createId ?? createClientId;
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getLocalDate =
      dependencies.getLocalDate ?? (() => formatLocalDate(this.getNow()));
  }

  async getOrCreateTodayFocus(userId: string): Promise<TodayFocusResult> {
    const localDate = this.getLocalDate();
    const sessionSelection = await this.selectTodaySessionContext(userId, localDate);
    const existingFocus = await this.dependencies.dailyFocusRepository.getByLocalDate(
      userId,
      localDate,
    );

    if (existingFocus) {
      return this.hydrateFocus(existingFocus, localDate, sessionSelection.context);
    }

    if (sessionSelection.recoveryOnly) {
      return {
        dailyFocus: null,
        guideline: null,
        localDate,
        unavailableReason: 'recovery_session'
      };
    }

    const recommendation = await this.selectRecommendation(userId, localDate, sessionSelection.context);

    if (!recommendation) {
      return {
        dailyFocus: null,
        guideline: null,
        localDate,
        selectionContext: sessionSelection.context,
        unavailableReason: 'no_eligible_content'
      };
    }

    const now = this.getNow().toISOString();
    const dailyFocus = parseDailyFocus({
      id: this.createId(),
      userId,
      localDate,
      guidelineId: recommendation.guideline.id,
      reasonCode: recommendation.reasonCode,
      status: 'planned',
      createdAt: now,
      updatedAt: now
    });

    try {
      await this.dependencies.dailyFocusRepository.save(dailyFocus);
    } catch (error) {
      const concurrentlyCreatedFocus =
        await this.dependencies.dailyFocusRepository.getByLocalDate(userId, localDate);

      if (concurrentlyCreatedFocus) {
        return this.hydrateFocus(concurrentlyCreatedFocus, localDate, sessionSelection.context);
      }

      throw error;
    }

    return {
      dailyFocus,
      guideline: recommendation.guideline,
      localDate,
      selectionContext: sessionSelection.context
    };
  }

  async updateTodayFocusStatus(
    userId: string,
    status: DailyFocusStatus,
  ): Promise<TodayFocusResult> {
    const localDate = this.getLocalDate();
    const existingFocus = await this.dependencies.dailyFocusRepository.getByLocalDate(
      userId,
      localDate,
    );

    if (!existingFocus) {
      return this.getOrCreateTodayFocus(userId);
    }

    const nextFocus = parseDailyFocus({
      ...existingFocus,
      status,
      updatedAt: this.getNow().toISOString()
    });

    await this.dependencies.dailyFocusRepository.save(nextFocus);

    const sessionSelection = await this.selectTodaySessionContext(userId, localDate);

    return this.hydrateFocus(nextFocus, localDate, sessionSelection.context);
  }

  private async hydrateFocus(
    dailyFocus: DailyFocus,
    localDate: string,
    selectionContext?: GuidelineContext,
  ): Promise<TodayFocusResult> {
    const guideline = await this.dependencies.contentRepository.getGuidelineById(
      dailyFocus.guidelineId,
    );

    return {
      dailyFocus,
      guideline,
      localDate,
      selectionContext,
      unavailableReason: guideline ? undefined : 'missing_guideline'
    };
  }

  private async selectTodaySessionContext(
    userId: string,
    localDate: string,
  ): Promise<SessionContextSelection> {
    const todaySessions = (await this.dependencies.sessionRepository.listByUserId(userId))
      .filter((session) => getSessionLocalDate(session) === localDate)
      .sort((left, right) => getSessionTimestamp(left) - getSessionTimestamp(right));
    const recommendationSession = todaySessions.find((session) =>
      isGuidelineRecommendationContext(session.type),
    );

    if (recommendationSession && isGuidelineRecommendationContext(recommendationSession.type)) {
      return { context: recommendationSession.type, recoveryOnly: false };
    }

    return {
      recoveryOnly:
        todaySessions.length > 0 && todaySessions.every((session) => session.type === 'recovery')
    };
  }

  private async selectRecommendation(
    userId: string,
    localDate: string,
    context?: GuidelineContext,
  ) {
    const [
      activeGoals,
      guidelines,
      observations,
      playerProfile,
      recentFocuses,
      skillStates,
      skills
    ] = await Promise.all([
      this.dependencies.goalRepository?.listByUserId(userId).then((goals) =>
        goals.filter((goal) => goal.active),
      ) ?? [],
      this.dependencies.contentRepository.listGuidelines(),
      this.dependencies.observationRepository?.listByUserId(userId) ?? [],
      this.dependencies.profileRepository?.getByUserId(userId) ?? null,
      this.dependencies.dailyFocusRepository.listByUserId(userId),
      this.dependencies.skillStateRepository?.listByUserId(userId) ?? [],
      this.dependencies.contentRepository.listSkills()
    ]);

    return selectRecommendedGuideline({
      activeGoals,
      context,
      guidelines,
      localDate,
      observations,
      playerProfile,
      recentFocuses,
      skillStates,
      skills,
      userId
    });
  }
}

function isGuidelineRecommendationContext(
  sessionType: SessionType,
): sessionType is GuidelineContext {
  return recommendationSessionTypes.includes(sessionType as GuidelineContext);
}

function getSessionLocalDate(session: Session): string {
  return formatLocalDate(new Date(getSessionTimestamp(session)));
}

function getSessionTimestamp(session: Session): number {
  return Date.parse(
    session.scheduledAt ?? session.startedAt ?? session.completedAt ?? session.createdAt,
  );
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
