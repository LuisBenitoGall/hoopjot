import Dexie, { type Table } from 'dexie';

import type {
  CheckIn,
  DailyFocus,
  Observation,
  OnboardingDraft,
  PlayerGoal,
  PlayerProfile,
  Reflection,
  Session,
  SkillState,
  WeeklyReview
} from '../../domain';
import type { SyncOperation } from './syncQueue';

export class HoopjotLocalDb extends Dexie {
  checkIns!: Table<CheckIn, string>;
  dailyFocus!: Table<DailyFocus, string>;
  observations!: Table<Observation, string>;
  onboardingDrafts!: Table<OnboardingDraft, string>;
  playerGoals!: Table<PlayerGoal, string>;
  profiles!: Table<PlayerProfile, string>;
  reflections!: Table<Reflection, string>;
  sessions!: Table<Session, string>;
  skillState!: Table<SkillState, [string, string]>;
  syncQueue!: Table<SyncOperation, string>;
  weeklyReviews!: Table<WeeklyReview, string>;

  constructor(name = 'hoopjot-local') {
    super(name);

    this.version(1).stores({
      profiles: '&id, &userId, updatedAt',
      playerGoals: '&id, userId, active, updatedAt',
      sessions: '&id, userId, deletedAt, updatedAt',
      checkIns: '&id, sessionId, userId, updatedAt',
      reflections: '&id, sessionId, userId, updatedAt',
      observations: '&id, userId, sessionId, reflectionId, skillId, observedAt',
      skillState: '&[userId+skillId], userId, skillId, updatedAt',
      dailyFocus: '&id, &[userId+localDate], userId, localDate, updatedAt',
      weeklyReviews: '&id, &[userId+weekStart], userId, weekStart, updatedAt',
      syncQueue: '&id, userId, entityType, entityId, operation, createdAt, attemptCount'
    });

    this.version(2).stores({
      onboardingDrafts: '&userId, updatedAt'
    });
  }
}

export function createHoopjotLocalDb(name?: string): HoopjotLocalDb {
  return new HoopjotLocalDb(name);
}

export async function resetLocalDatabase(db: HoopjotLocalDb): Promise<void> {
  await db.transaction(
    'rw',
    db.tables,
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.playerGoals.clear(),
        db.sessions.clear(),
        db.checkIns.clear(),
        db.reflections.clear(),
        db.observations.clear(),
        db.onboardingDrafts.clear(),
        db.skillState.clear(),
        db.dailyFocus.clear(),
        db.weeklyReviews.clear(),
        db.syncQueue.clear()
      ]);
    },
  );
}
