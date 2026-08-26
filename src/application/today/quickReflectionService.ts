import {
  parseDailyFocus,
  parseReflection,
  parseSession,
  type DailyFocus,
  type DailyFocusRepository,
  type Reflection,
  type ReflectionRepository,
  type Session,
  type SessionRepository,
  type SessionType
} from '../../domain';
import { createClientId } from '../../lib/createClientId';

export type QuickReflectionSessionType = Extract<SessionType, 'practice' | 'game'>;

export interface QuickReflectionState {
  dailyFocus: DailyFocus | null;
  incompleteSession: Session | null;
  localDate: string;
  reflection: Reflection | null;
  session: Session | null;
}

export interface SaveQuickReflectionInput {
  coachFeedback?: string;
  focusRating: Reflection['focusRating'];
  note?: string;
  sessionType: QuickReflectionSessionType;
  userId: string;
}

export interface QuickReflectionServicePort {
  getTodayState(userId: string): Promise<QuickReflectionState>;
  saveQuickReflection(input: SaveQuickReflectionInput): Promise<QuickReflectionState>;
}

interface QuickReflectionServiceDependencies {
  createId?: () => string;
  dailyFocusRepository: DailyFocusRepository;
  getLocalDate?: () => string;
  getNow?: () => Date;
  reflectionRepository: ReflectionRepository;
  sessionRepository: SessionRepository;
}

export class QuickReflectionService implements QuickReflectionServicePort {
  private readonly createId: () => string;
  private readonly getLocalDate: () => string;
  private readonly getNow: () => Date;

  constructor(private readonly dependencies: QuickReflectionServiceDependencies) {
    this.createId = dependencies.createId ?? createClientId;
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getLocalDate =
      dependencies.getLocalDate ?? (() => formatLocalDate(this.getNow()));
  }

  async getTodayState(userId: string): Promise<QuickReflectionState> {
    const localDate = this.getLocalDate();
    const dailyFocus = await this.dependencies.dailyFocusRepository.getByLocalDate(
      userId,
      localDate,
    );
    const todaySessions = await this.listTodaySessions(userId, localDate);
    const sessionPairs = await Promise.all(
      todaySessions.map(async (session) => ({
        session,
        reflection: await this.dependencies.reflectionRepository.getBySessionId(session.id)
      })),
    );
    const reflectedPair = sessionPairs.find((pair) => pair.reflection);
    const incompleteSession = todaySessions.find((session) => !session.completedAt) ?? null;

    return {
      dailyFocus,
      incompleteSession,
      localDate,
      reflection: reflectedPair?.reflection ?? null,
      session: reflectedPair?.session ?? incompleteSession ?? todaySessions[0] ?? null
    };
  }

  async saveQuickReflection(input: SaveQuickReflectionInput): Promise<QuickReflectionState> {
    const currentState = await this.getTodayState(input.userId);

    if (currentState.reflection) {
      return currentState;
    }

    const now = this.getNow().toISOString();
    const session = currentState.incompleteSession
      ? parseSession({
          ...currentState.incompleteSession,
          type: input.sessionType
        })
      : this.createSession(input, now);
    const completedSession = parseSession({
      ...session,
      completedAt: session.completedAt ?? now,
      updatedAt: now
    });

    await this.dependencies.sessionRepository.save(completedSession);
    await this.dependencies.reflectionRepository.save(
      parseReflection({
        id: this.createId(),
        userId: input.userId,
        sessionId: completedSession.id,
        dailyFocusId: currentState.dailyFocus?.id,
        focusRating: input.focusRating,
        note: normalizeOptionalText(input.note),
        coachFeedback: normalizeOptionalText(input.coachFeedback),
        createdAt: now,
        updatedAt: now
      }),
    );

    if (currentState.dailyFocus && currentState.dailyFocus.status !== 'completed') {
      await this.dependencies.dailyFocusRepository.save(
        parseDailyFocus({
          ...currentState.dailyFocus,
          status: 'completed',
          updatedAt: now
        }),
      );
    }

    return this.getTodayState(input.userId);
  }

  private createSession(input: SaveQuickReflectionInput, now: string): Session {
    return parseSession({
      id: this.createId(),
      userId: input.userId,
      type: input.sessionType,
      startedAt: now,
      createdAt: now,
      updatedAt: now
    });
  }

  private async listTodaySessions(userId: string, localDate: string): Promise<Session[]> {
    return (await this.dependencies.sessionRepository.listByUserId(userId))
      .filter((session) => getSessionLocalDate(session) === localDate)
      .sort((left, right) => getSessionTimestamp(right) - getSessionTimestamp(left));
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function getSessionLocalDate(session: Session): string {
  return formatLocalDate(new Date(getSessionTimestamp(session)));
}

function getSessionTimestamp(session: Session): number {
  return Date.parse(
    session.startedAt ?? session.scheduledAt ?? session.completedAt ?? session.createdAt,
  );
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
