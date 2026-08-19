import {
  parseCheckIn,
  parseReflection,
  parseSession,
  type CheckIn,
  type CheckInRepository,
  type DailyFocus,
  type DailyFocusRepository,
  type Reflection,
  type ReflectionRepository,
  type Session,
  type SessionRepository,
  type SessionType
} from '../../domain';
import { createClientId } from '../../lib/createClientId';

export interface SessionReflectionState {
  checkIn: CheckIn | null;
  dailyFocus: DailyFocus | null;
  latestSession: Session | null;
  localDate: string;
  reflection: Reflection | null;
}

export interface StartSessionInput {
  checkIn?: {
    confidence?: CheckIn['confidence'];
    energy?: CheckIn['energy'];
    physicalFeeling?: CheckIn['physicalFeeling'];
  };
  type: SessionType;
  userId: string;
}

export interface CompleteSessionInput {
  coachFeedback?: string;
  focusRating: Reflection['focusRating'];
  note?: string;
  rememberNextTime?: string;
  sessionId: string;
  userId: string;
}

export interface SessionReflectionServicePort {
  completeSession(input: CompleteSessionInput): Promise<SessionReflectionState>;
  getTodaySessionState(userId: string): Promise<SessionReflectionState>;
  startSession(input: StartSessionInput): Promise<SessionReflectionState>;
}

interface SessionReflectionServiceDependencies {
  checkInRepository: CheckInRepository;
  createId?: () => string;
  dailyFocusRepository: DailyFocusRepository;
  getLocalDate?: () => string;
  getNow?: () => Date;
  reflectionRepository: ReflectionRepository;
  sessionRepository: SessionRepository;
}

export class SessionReflectionService implements SessionReflectionServicePort {
  private readonly createId: () => string;
  private readonly getLocalDate: () => string;
  private readonly getNow: () => Date;

  constructor(private readonly dependencies: SessionReflectionServiceDependencies) {
    this.createId = dependencies.createId ?? createClientId;
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getLocalDate =
      dependencies.getLocalDate ?? (() => formatLocalDate(this.getNow()));
  }

  async getTodaySessionState(userId: string): Promise<SessionReflectionState> {
    const localDate = this.getLocalDate();
    const latestSession = await this.getLatestSessionForDate(userId, localDate);
    const [dailyFocus, checkIn, reflection] = await Promise.all([
      this.dependencies.dailyFocusRepository.getByLocalDate(userId, localDate),
      latestSession ? this.dependencies.checkInRepository.getBySessionId(latestSession.id) : null,
      latestSession ? this.dependencies.reflectionRepository.getBySessionId(latestSession.id) : null
    ]);

    return {
      checkIn,
      dailyFocus,
      latestSession,
      localDate,
      reflection
    };
  }

  async startSession(input: StartSessionInput): Promise<SessionReflectionState> {
    const now = this.getNow().toISOString();
    const session = parseSession({
      id: this.createId(),
      userId: input.userId,
      type: input.type,
      startedAt: now,
      createdAt: now,
      updatedAt: now
    });

    await this.dependencies.sessionRepository.save(session);

    if (hasCheckInValues(input.checkIn)) {
      await this.dependencies.checkInRepository.save(
        parseCheckIn({
          id: this.createId(),
          userId: input.userId,
          sessionId: session.id,
          energy: input.checkIn.energy,
          confidence: input.checkIn.confidence,
          physicalFeeling: input.checkIn.physicalFeeling,
          createdAt: now,
          updatedAt: now
        }),
      );
    }

    return this.getTodaySessionState(input.userId);
  }

  async completeSession(input: CompleteSessionInput): Promise<SessionReflectionState> {
    const session = await this.dependencies.sessionRepository.getById(input.sessionId);

    if (!session || session.userId !== input.userId) {
      throw new Error('Session not found.');
    }

    const now = this.getNow().toISOString();
    const localDate = this.getLocalDate();
    const existingReflection = await this.dependencies.reflectionRepository.getBySessionId(
      session.id,
    );
    const dailyFocus = await this.dependencies.dailyFocusRepository.getByLocalDate(
      input.userId,
      localDate,
    );
    const completedSession = parseSession({
      ...session,
      completedAt: session.completedAt ?? now,
      updatedAt: now
    });

    await this.dependencies.sessionRepository.save(completedSession);
    await this.dependencies.reflectionRepository.save(
      parseReflection({
        id: existingReflection?.id ?? this.createId(),
        userId: input.userId,
        sessionId: session.id,
        dailyFocusId: dailyFocus?.id,
        focusRating: input.focusRating,
        note: normalizeOptionalText(input.note),
        coachFeedback: normalizeOptionalText(input.coachFeedback),
        rememberNextTime: normalizeOptionalText(input.rememberNextTime),
        createdAt: existingReflection?.createdAt ?? now,
        updatedAt: now
      }),
    );

    return this.getTodaySessionState(input.userId);
  }

  private async getLatestSessionForDate(
    userId: string,
    localDate: string,
  ): Promise<Session | null> {
    const sessions = await this.dependencies.sessionRepository.listByUserId(userId);

    return (
      sessions
        .filter((session) => getSessionLocalDate(session) === localDate)
        .sort((left, right) => getSessionTimestamp(right) - getSessionTimestamp(left))[0] ?? null
    );
  }
}

function hasCheckInValues(checkIn: StartSessionInput['checkIn']): checkIn is Required<StartSessionInput>['checkIn'] {
  return Boolean(
    checkIn &&
      (checkIn.energy !== undefined ||
        checkIn.confidence !== undefined ||
        checkIn.physicalFeeling !== undefined),
  );
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
