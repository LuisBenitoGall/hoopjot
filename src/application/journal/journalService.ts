import type {
  BasketballContentRepository,
  CheckIn,
  CheckInRepository,
  DailyFocus,
  DailyFocusRepository,
  Guideline,
  Reflection,
  ReflectionRepository,
  Session,
  SessionRepository,
  SessionType
} from '../../domain';

export type JournalFilter = 'all' | SessionType;

export interface JournalEntry {
  checkIn: CheckIn | null;
  dailyFocus: DailyFocus | null;
  guideline: Guideline | null;
  localDate: string;
  occurredAt: string;
  reflection: Reflection | null;
  session: Session;
}

export interface JournalDateGroup {
  entries: JournalEntry[];
  localDate: string;
}

export interface JournalTimeline {
  filter: JournalFilter;
  groups: JournalDateGroup[];
  totalCount: number;
}

export interface JournalServicePort {
  getSessionDetail(userId: string, sessionId: string): Promise<JournalEntry | null>;
  listTimeline(userId: string, filter?: JournalFilter): Promise<JournalTimeline>;
}

interface JournalServiceDependencies {
  checkInRepository: CheckInRepository;
  contentRepository: BasketballContentRepository;
  dailyFocusRepository: DailyFocusRepository;
  reflectionRepository: ReflectionRepository;
  sessionRepository: SessionRepository;
}

export class JournalService implements JournalServicePort {
  constructor(private readonly dependencies: JournalServiceDependencies) {}

  async listTimeline(userId: string, filter: JournalFilter = 'all'): Promise<JournalTimeline> {
    const sessions = (await this.dependencies.sessionRepository.listByUserId(userId))
      .filter((session) => session.userId === userId && !session.deletedAt)
      .filter((session) => filter === 'all' || session.type === filter)
      .sort(compareSessionsNewestFirst);
    const entries = await Promise.all(
      sessions.map((session) => this.createJournalEntry(userId, session)),
    );

    return {
      filter,
      groups: groupEntriesByLocalDate(entries),
      totalCount: entries.length
    };
  }

  async getSessionDetail(userId: string, sessionId: string): Promise<JournalEntry | null> {
    const session = await this.dependencies.sessionRepository.getById(sessionId);

    if (!session || session.userId !== userId || session.deletedAt) {
      return null;
    }

    return this.createJournalEntry(userId, session);
  }

  private async createJournalEntry(userId: string, session: Session): Promise<JournalEntry> {
    const localDate = getSessionLocalDate(session);
    const [checkIn, reflection] = await Promise.all([
      this.dependencies.checkInRepository.getBySessionId(session.id),
      this.dependencies.reflectionRepository.getBySessionId(session.id)
    ]);
    const ownedCheckIn = checkIn?.userId === userId ? checkIn : null;
    const ownedReflection = reflection?.userId === userId ? reflection : null;
    const dailyFocus = await this.getAssociatedDailyFocus(userId, localDate, ownedReflection);
    const guideline = dailyFocus
      ? await this.dependencies.contentRepository.getGuidelineById(dailyFocus.guidelineId)
      : null;

    return {
      checkIn: ownedCheckIn,
      dailyFocus,
      guideline,
      localDate,
      occurredAt: getSessionOccurrenceIso(session),
      reflection: ownedReflection,
      session
    };
  }

  private async getAssociatedDailyFocus(
    userId: string,
    localDate: string,
    reflection: Reflection | null,
  ): Promise<DailyFocus | null> {
    if (reflection?.dailyFocusId) {
      const reflectedFocus = await this.dependencies.dailyFocusRepository.getById(
        reflection.dailyFocusId,
      );

      if (reflectedFocus?.userId === userId) {
        return reflectedFocus;
      }
    }

    return this.dependencies.dailyFocusRepository.getByLocalDate(userId, localDate);
  }
}

function groupEntriesByLocalDate(entries: JournalEntry[]): JournalDateGroup[] {
  const groups = new Map<string, JournalEntry[]>();

  for (const entry of entries) {
    groups.set(entry.localDate, [...(groups.get(entry.localDate) ?? []), entry]);
  }

  return Array.from(groups.entries()).map(([localDate, groupEntries]) => ({
    entries: groupEntries,
    localDate
  }));
}

function compareSessionsNewestFirst(left: Session, right: Session): number {
  return getSessionOccurrenceTime(right) - getSessionOccurrenceTime(left);
}

function getSessionLocalDate(session: Session): string {
  const date = new Date(getSessionOccurrenceTime(session));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getSessionOccurrenceIso(session: Session): string {
  return session.startedAt ?? session.scheduledAt ?? session.completedAt ?? session.createdAt;
}

function getSessionOccurrenceTime(session: Session): number {
  return Date.parse(getSessionOccurrenceIso(session));
}
