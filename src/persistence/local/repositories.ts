import type { Table } from 'dexie';

import {
  assertCanSaveGoal,
  parseCheckIn,
  parseDailyFocus,
  parseObservation,
  parseOnboardingDraft,
  parsePlayerGoal,
  parsePlayerProfile,
  parseReflection,
  parseSession,
  parseSkillState,
  parseWeeklyReview,
  type CheckIn,
  type CheckInRepository,
  type DailyFocus,
  type DailyFocusRepository,
  type Observation,
  type ObservationRepository,
  type OnboardingDraft,
  type OnboardingDraftRepository,
  type PlayerGoal,
  type PlayerGoalRepository,
  type PlayerProfile,
  type PlayerProfileRepository,
  type Reflection,
  type ReflectionRepository,
  type Session,
  type SessionRepository,
  type SkillState,
  type SkillStateRepository,
  type WeeklyReview,
  type WeeklyReviewRepository
} from '../../domain';
import type { HoopnoteLocalDb } from './db';
import { createSyncOperation, type SyncEntityType, type SyncOperation } from './syncQueue';

interface SyncableEntity {
  id: string;
  userId: string;
}

export class LocalPlayerProfileRepository implements PlayerProfileRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async deleteByUserId(userId: string): Promise<void> {
    const profile = await this.getByUserId(userId);

    if (!profile) {
      return;
    }

    await deleteById(this.db, this.db.profiles, profile, 'profiles');
  }

  async getByUserId(userId: string): Promise<PlayerProfile | null> {
    return (await this.db.profiles.where('userId').equals(userId).first()) ?? null;
  }

  async save(profile: PlayerProfile): Promise<void> {
    await saveById(this.db, this.db.profiles, parsePlayerProfile(profile), 'profiles');
  }
}

export class LocalPlayerGoalRepository implements PlayerGoalRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const goal = await this.db.playerGoals.get(id);

    if (!goal) {
      return;
    }

    await deleteById(this.db, this.db.playerGoals, goal, 'player_goals');
  }

  async listByUserId(userId: string): Promise<PlayerGoal[]> {
    return this.db.playerGoals.where('userId').equals(userId).toArray();
  }

  async save(goal: PlayerGoal): Promise<void> {
    const parsedGoal = parsePlayerGoal(goal);

    await this.db.transaction('rw', this.db.playerGoals, this.db.syncQueue, async () => {
      const existingGoals = await this.db.playerGoals.where('userId').equals(parsedGoal.userId).toArray();
      assertCanSaveGoal(existingGoals, parsedGoal);
      await this.db.playerGoals.put(parsedGoal);
      await enqueueSyncOperation(this.db, 'player_goals', parsedGoal, 'upsert', parsedGoal);
    });
  }
}

export class LocalOnboardingDraftRepository implements OnboardingDraftRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.onboardingDrafts.delete(userId);
  }

  async getByUserId(userId: string): Promise<OnboardingDraft | null> {
    return (await this.db.onboardingDrafts.get(userId)) ?? null;
  }

  async save(draft: OnboardingDraft): Promise<void> {
    await this.db.onboardingDrafts.put(parseOnboardingDraft(draft));
  }
}

export class LocalSessionRepository implements SessionRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string, deletedAt: string): Promise<void> {
    const session = await this.db.sessions.get(id);

    if (!session) {
      return;
    }

    const tombstone = parseSession({
      ...session,
      deletedAt,
      updatedAt: deletedAt
    });

    await this.db.transaction('rw', this.db.sessions, this.db.syncQueue, async () => {
      await this.db.sessions.put(tombstone);
      await enqueueSyncOperation(this.db, 'sessions', tombstone, 'delete', tombstone);
    });
  }

  async getById(id: string): Promise<Session | null> {
    const session = await this.db.sessions.get(id);

    return session && !session.deletedAt ? session : null;
  }

  async listByUserId(userId: string): Promise<Session[]> {
    return this.db.sessions
      .where('userId')
      .equals(userId)
      .filter((session) => !session.deletedAt)
      .toArray();
  }

  async save(session: Session): Promise<void> {
    await saveById(this.db, this.db.sessions, parseSession(session), 'sessions');
  }
}

export class LocalCheckInRepository implements CheckInRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const checkIn = await this.db.checkIns.get(id);

    if (!checkIn) {
      return;
    }

    await deleteById(this.db, this.db.checkIns, checkIn, 'check_ins');
  }

  async getBySessionId(sessionId: string): Promise<CheckIn | null> {
    return (await this.db.checkIns.where('sessionId').equals(sessionId).first()) ?? null;
  }

  async save(checkIn: CheckIn): Promise<void> {
    await saveById(this.db, this.db.checkIns, parseCheckIn(checkIn), 'check_ins');
  }
}

export class LocalReflectionRepository implements ReflectionRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const reflection = await this.db.reflections.get(id);

    if (!reflection) {
      return;
    }

    await deleteById(this.db, this.db.reflections, reflection, 'reflections');
  }

  async getBySessionId(sessionId: string): Promise<Reflection | null> {
    return (await this.db.reflections.where('sessionId').equals(sessionId).first()) ?? null;
  }

  async save(reflection: Reflection): Promise<void> {
    await saveById(this.db, this.db.reflections, parseReflection(reflection), 'reflections');
  }
}

export class LocalObservationRepository implements ObservationRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const observation = await this.db.observations.get(id);

    if (!observation) {
      return;
    }

    await deleteById(this.db, this.db.observations, observation, 'observations');
  }

  async listByUserId(userId: string): Promise<Observation[]> {
    return this.db.observations.where('userId').equals(userId).toArray();
  }

  async save(observation: Observation): Promise<void> {
    await saveById(this.db, this.db.observations, parseObservation(observation), 'observations');
  }
}

export class LocalSkillStateRepository implements SkillStateRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(userId: string, skillId: string): Promise<void> {
    const skillState = await this.getBySkillId(userId, skillId);

    if (!skillState) {
      return;
    }

    await this.db.transaction('rw', this.db.skillState, this.db.syncQueue, async () => {
      await this.db.skillState.delete([userId, skillId]);
      await enqueueSyncOperation(this.db, 'skill_state', skillState, 'delete');
    });
  }

  async getBySkillId(userId: string, skillId: string): Promise<SkillState | null> {
    return (await this.db.skillState.get([userId, skillId])) ?? null;
  }

  async listByUserId(userId: string): Promise<SkillState[]> {
    return this.db.skillState.where('userId').equals(userId).toArray();
  }

  async save(skillState: SkillState): Promise<void> {
    const parsedSkillState = parseSkillState(skillState);

    await this.db.transaction('rw', this.db.skillState, this.db.syncQueue, async () => {
      await this.db.skillState.put(parsedSkillState);
      await enqueueSyncOperation(this.db, 'skill_state', parsedSkillState, 'upsert', parsedSkillState);
    });
  }
}

export class LocalDailyFocusRepository implements DailyFocusRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const dailyFocus = await this.db.dailyFocus.get(id);

    if (!dailyFocus) {
      return;
    }

    await deleteById(this.db, this.db.dailyFocus, dailyFocus, 'daily_focus');
  }

  async getById(id: string): Promise<DailyFocus | null> {
    return (await this.db.dailyFocus.get(id)) ?? null;
  }

  async getByLocalDate(userId: string, localDate: string): Promise<DailyFocus | null> {
    return (
      (await this.db.dailyFocus.where('[userId+localDate]').equals([userId, localDate]).first()) ??
      null
    );
  }

  async listByUserId(userId: string): Promise<DailyFocus[]> {
    return this.db.dailyFocus.where('userId').equals(userId).toArray();
  }

  async save(dailyFocus: DailyFocus): Promise<void> {
    await saveById(this.db, this.db.dailyFocus, parseDailyFocus(dailyFocus), 'daily_focus');
  }
}

export class LocalWeeklyReviewRepository implements WeeklyReviewRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async delete(id: string): Promise<void> {
    const weeklyReview = await this.db.weeklyReviews.get(id);

    if (!weeklyReview) {
      return;
    }

    await deleteById(this.db, this.db.weeklyReviews, weeklyReview, 'weekly_reviews');
  }

  async getByWeekStart(userId: string, weekStart: string): Promise<WeeklyReview | null> {
    return (
      (await this.db.weeklyReviews
        .where('[userId+weekStart]')
        .equals([userId, weekStart])
        .first()) ?? null
    );
  }

  async save(weeklyReview: WeeklyReview): Promise<void> {
    await saveById(this.db, this.db.weeklyReviews, parseWeeklyReview(weeklyReview), 'weekly_reviews');
  }
}

export class LocalSyncQueueRepository {
  constructor(private readonly db: HoopnoteLocalDb) {}

  async clear(operationId: string): Promise<void> {
    await this.db.syncQueue.delete(operationId);
  }

  async list(): Promise<SyncOperation[]> {
    return this.db.syncQueue.orderBy('createdAt').toArray();
  }
}

export function createLocalRepositories(db: HoopnoteLocalDb) {
  return {
    checkIns: new LocalCheckInRepository(db),
    dailyFocus: new LocalDailyFocusRepository(db),
    observations: new LocalObservationRepository(db),
    onboardingDrafts: new LocalOnboardingDraftRepository(db),
    playerGoals: new LocalPlayerGoalRepository(db),
    profiles: new LocalPlayerProfileRepository(db),
    reflections: new LocalReflectionRepository(db),
    sessions: new LocalSessionRepository(db),
    skillState: new LocalSkillStateRepository(db),
    syncQueue: new LocalSyncQueueRepository(db),
    weeklyReviews: new LocalWeeklyReviewRepository(db)
  };
}

export type LocalRepositories = ReturnType<typeof createLocalRepositories>;

async function saveById<T extends SyncableEntity>(
  db: HoopnoteLocalDb,
  table: Table<T, string>,
  entity: T,
  entityType: SyncEntityType,
): Promise<void> {
  await db.transaction('rw', table, db.syncQueue, async () => {
    await table.put(entity);
    await enqueueSyncOperation(db, entityType, entity, 'upsert', entity);
  });
}

async function deleteById<T extends SyncableEntity>(
  db: HoopnoteLocalDb,
  table: Table<T, string>,
  entity: T,
  entityType: SyncEntityType,
): Promise<void> {
  await db.transaction('rw', table, db.syncQueue, async () => {
    await table.delete(entity.id);
    await enqueueSyncOperation(db, entityType, entity, 'delete');
  });
}

async function enqueueSyncOperation(
  db: HoopnoteLocalDb,
  entityType: SyncEntityType,
  entity: SyncableEntity | SkillState,
  operation: 'upsert' | 'delete',
  payload?: unknown,
): Promise<void> {
  await db.syncQueue.add(
    createSyncOperation(
      {
        entityId: getSyncEntityId(entity),
        entityType,
        operation,
        payload,
        userId: entity.userId
      },
      new Date().toISOString(),
    ),
  );
}

function getSyncEntityId(entity: SyncableEntity | SkillState): string {
  if ('id' in entity) {
    return entity.id;
  }

  return `${entity.userId}:${entity.skillId}`;
}
