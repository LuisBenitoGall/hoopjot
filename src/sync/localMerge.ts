import type {
  CheckIn,
  DailyFocus,
  Observation,
  PlayerProfile,
  Reflection,
  SkillState,
  WeeklyReview
} from '../domain';
import type { HoopnoteLocalDb } from '../persistence/local';
import type { RemoteUserData } from './types';

export async function mergeRemoteUserData(
  db: HoopnoteLocalDb,
  remoteData: RemoteUserData,
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.playerGoals,
      db.sessions,
      db.checkIns,
      db.reflections,
      db.observations,
      db.skillState,
      db.dailyFocus,
      db.weeklyReviews
    ],
    async () => {
      for (const profile of remoteData.profiles) {
        await putProfileIfRemoteWins(db, profile);
      }

      for (const goal of remoteData.playerGoals) {
        await putEntityIfRemoteWins(db.playerGoals, goal);
      }

      for (const session of remoteData.sessions) {
        await putEntityIfRemoteWins(db.sessions, session);
      }

      for (const dailyFocus of remoteData.dailyFocuses) {
        await putDailyFocusIfRemoteWins(db, dailyFocus);
      }

      for (const checkIn of remoteData.checkIns) {
        await putCheckInIfRemoteWins(db, checkIn);
      }

      for (const reflection of remoteData.reflections) {
        await putReflectionIfRemoteWins(db, reflection);
      }

      for (const observation of remoteData.observations) {
        await putObservationIfMissing(db, observation);
      }

      for (const skillState of remoteData.skillStates) {
        await putSkillStateIfRemoteWins(db, skillState);
      }

      for (const weeklyReview of remoteData.weeklyReviews) {
        await putWeeklyReviewIfRemoteWins(db, weeklyReview);
      }
    },
  );
}

async function putProfileIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteProfile: PlayerProfile,
): Promise<void> {
  const localProfile = await db.profiles.where('userId').equals(remoteProfile.userId).first();

  if (!localProfile || isRemoteNewer(remoteProfile.updatedAt, localProfile.updatedAt)) {
    if (localProfile && localProfile.id !== remoteProfile.id) {
      await db.profiles.delete(localProfile.id);
    }

    await db.profiles.put(remoteProfile);
  }
}

async function putDailyFocusIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteDailyFocus: DailyFocus,
): Promise<void> {
  const localDailyFocus = await db.dailyFocus
    .where('[userId+localDate]')
    .equals([remoteDailyFocus.userId, remoteDailyFocus.localDate])
    .first();

  if (!localDailyFocus || isRemoteNewer(remoteDailyFocus.updatedAt, localDailyFocus.updatedAt)) {
    if (localDailyFocus && localDailyFocus.id !== remoteDailyFocus.id) {
      await db.dailyFocus.delete(localDailyFocus.id);
    }

    await db.dailyFocus.put(remoteDailyFocus);
  }
}

async function putCheckInIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteCheckIn: CheckIn,
): Promise<void> {
  const localCheckIn = await db.checkIns.where('sessionId').equals(remoteCheckIn.sessionId).first();

  if (!localCheckIn || isRemoteNewer(remoteCheckIn.updatedAt, localCheckIn.updatedAt)) {
    if (localCheckIn && localCheckIn.id !== remoteCheckIn.id) {
      await db.checkIns.delete(localCheckIn.id);
    }

    await db.checkIns.put(remoteCheckIn);
  }
}

async function putReflectionIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteReflection: Reflection,
): Promise<void> {
  const localReflection = await db.reflections
    .where('sessionId')
    .equals(remoteReflection.sessionId)
    .first();

  if (
    !localReflection ||
    isRemoteNewer(remoteReflection.updatedAt, localReflection.updatedAt)
  ) {
    if (localReflection && localReflection.id !== remoteReflection.id) {
      await db.reflections.delete(localReflection.id);
    }

    await db.reflections.put(remoteReflection);
  }
}

async function putObservationIfMissing(
  db: HoopnoteLocalDb,
  remoteObservation: Observation,
): Promise<void> {
  const localObservation = await db.observations.get(remoteObservation.id);

  if (!localObservation) {
    await db.observations.put(remoteObservation);
  }
}

async function putSkillStateIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteSkillState: SkillState,
): Promise<void> {
  const localSkillState = await db.skillState.get([
    remoteSkillState.userId,
    remoteSkillState.skillId
  ]);

  if (
    !localSkillState ||
    isRemoteNewer(remoteSkillState.updatedAt, localSkillState.updatedAt)
  ) {
    await db.skillState.put(remoteSkillState);
  }
}

async function putWeeklyReviewIfRemoteWins(
  db: HoopnoteLocalDb,
  remoteWeeklyReview: WeeklyReview,
): Promise<void> {
  const localWeeklyReview = await db.weeklyReviews
    .where('[userId+weekStart]')
    .equals([remoteWeeklyReview.userId, remoteWeeklyReview.weekStart])
    .first();

  if (
    !localWeeklyReview ||
    isRemoteNewer(remoteWeeklyReview.updatedAt, localWeeklyReview.updatedAt)
  ) {
    if (localWeeklyReview && localWeeklyReview.id !== remoteWeeklyReview.id) {
      await db.weeklyReviews.delete(localWeeklyReview.id);
    }

    await db.weeklyReviews.put(remoteWeeklyReview);
  }
}

async function putEntityIfRemoteWins<T extends { id: string; updatedAt: string }>(
  table: { get: (id: string) => Promise<T | undefined>; put: (entity: T) => Promise<string> },
  remoteEntity: T,
): Promise<void> {
  const localEntity = await table.get(remoteEntity.id);

  if (!localEntity || isRemoteNewer(remoteEntity.updatedAt, localEntity.updatedAt)) {
    await table.put(remoteEntity);
  }
}

function isRemoteNewer(remoteUpdatedAt: string, localUpdatedAt: string): boolean {
  return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt);
}
