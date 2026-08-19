import type { SyncEntityType } from '../persistence/local';
import type {
  RemoteDeleteInput,
  RemoteSyncAdapter,
  RemoteSyncEntity,
  RemoteUserData
} from './types';

const storageKey = 'hoopnote:e2e-remote-data';

const emptyRemoteUserData: RemoteUserData = {
  checkIns: [],
  dailyFocuses: [],
  observations: [],
  playerGoals: [],
  profiles: [],
  reflections: [],
  sessions: [],
  skillStates: [],
  weeklyReviews: []
};

export class E2ERemoteSyncAdapter implements RemoteSyncAdapter {
  async listUserData(userId: string): Promise<RemoteUserData> {
    const data = readStore();

    return {
      checkIns: data.checkIns.filter((entity) => entity.userId === userId),
      dailyFocuses: data.dailyFocuses.filter((entity) => entity.userId === userId),
      observations: data.observations.filter((entity) => entity.userId === userId),
      playerGoals: data.playerGoals.filter((entity) => entity.userId === userId),
      profiles: data.profiles.filter((entity) => entity.userId === userId),
      reflections: data.reflections.filter((entity) => entity.userId === userId),
      sessions: data.sessions.filter((entity) => entity.userId === userId),
      skillStates: data.skillStates.filter((entity) => entity.userId === userId),
      weeklyReviews: data.weeklyReviews.filter((entity) => entity.userId === userId)
    };
  }

  async upsert(entityType: SyncEntityType, entity: RemoteSyncEntity): Promise<void> {
    writeStore(upsertRemoteEntity(readStore(), entityType, entity));
  }

  async delete(input: RemoteDeleteInput): Promise<void> {
    writeStore(deleteRemoteEntity(readStore(), input));
  }
}

export function shouldUseE2ERemoteSyncAdapter(): boolean {
  return (
    import.meta.env.VITE_ENABLE_E2E_AUTH === 'true' &&
    typeof globalThis.sessionStorage !== 'undefined' &&
    globalThis.sessionStorage.getItem('hoopnote:e2e-remote-sync') === '1'
  );
}

function upsertRemoteEntity(
  data: RemoteUserData,
  entityType: SyncEntityType,
  entity: RemoteSyncEntity,
): RemoteUserData {
  switch (entityType) {
    case 'profiles':
      return { ...data, profiles: upsertByKey(data.profiles, entity, getProfileKey) };
    case 'player_goals':
      return { ...data, playerGoals: upsertByKey(data.playerGoals, entity, getIdKey) };
    case 'sessions':
      return { ...data, sessions: upsertByKey(data.sessions, entity, getIdKey) };
    case 'check_ins':
      return { ...data, checkIns: upsertByKey(data.checkIns, entity, getSessionKey) };
    case 'reflections':
      return { ...data, reflections: upsertByKey(data.reflections, entity, getSessionKey) };
    case 'observations':
      return { ...data, observations: upsertByKey(data.observations, entity, getIdKey) };
    case 'skill_state':
      return { ...data, skillStates: upsertByKey(data.skillStates, entity, getSkillStateKey) };
    case 'daily_focus':
      return { ...data, dailyFocuses: upsertByKey(data.dailyFocuses, entity, getDailyFocusKey) };
    case 'weekly_reviews':
      return {
        ...data,
        weeklyReviews: upsertByKey(data.weeklyReviews, entity, getWeeklyReviewKey)
      };
  }
}

function deleteRemoteEntity(data: RemoteUserData, input: RemoteDeleteInput): RemoteUserData {
  switch (input.entityType) {
    case 'profiles':
      return { ...data, profiles: data.profiles.filter((entity) => entity.id !== input.entityId) };
    case 'player_goals':
      return {
        ...data,
        playerGoals: data.playerGoals.filter((entity) => entity.id !== input.entityId)
      };
    case 'sessions':
      return { ...data, sessions: data.sessions.filter((entity) => entity.id !== input.entityId) };
    case 'check_ins':
      return { ...data, checkIns: data.checkIns.filter((entity) => entity.id !== input.entityId) };
    case 'reflections':
      return {
        ...data,
        reflections: data.reflections.filter((entity) => entity.id !== input.entityId)
      };
    case 'observations':
      return {
        ...data,
        observations: data.observations.filter((entity) => entity.id !== input.entityId)
      };
    case 'skill_state':
      return {
        ...data,
        skillStates: data.skillStates.filter(
          (entity) => `${entity.userId}:${entity.skillId}` !== input.entityId,
        )
      };
    case 'daily_focus':
      return {
        ...data,
        dailyFocuses: data.dailyFocuses.filter((entity) => entity.id !== input.entityId)
      };
    case 'weekly_reviews':
      return {
        ...data,
        weeklyReviews: data.weeklyReviews.filter((entity) => entity.id !== input.entityId)
      };
  }
}

function upsertByKey<T extends RemoteSyncEntity>(
  entities: T[],
  nextEntity: RemoteSyncEntity,
  getKey: (entity: T) => string,
): T[] {
  const typedNextEntity = nextEntity as T;
  const nextKey = getKey(typedNextEntity);
  const withoutExistingEntity = entities.filter((entity) => getKey(entity) !== nextKey);

  return [...withoutExistingEntity, typedNextEntity];
}

function getIdKey(entity: { id: string }): string {
  return entity.id;
}

function getProfileKey(entity: { userId: string }): string {
  return entity.userId;
}

function getSessionKey(entity: { sessionId: string }): string {
  return entity.sessionId;
}

function getSkillStateKey(entity: { skillId: string; userId: string }): string {
  return `${entity.userId}:${entity.skillId}`;
}

function getDailyFocusKey(entity: { localDate: string; userId: string }): string {
  return `${entity.userId}:${entity.localDate}`;
}

function getWeeklyReviewKey(entity: { userId: string; weekStart: string }): string {
  return `${entity.userId}:${entity.weekStart}`;
}

function readStore(): RemoteUserData {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return emptyRemoteUserData;
  }

  const rawValue = globalThis.sessionStorage.getItem(storageKey);

  if (!rawValue) {
    return emptyRemoteUserData;
  }

  try {
    return {
      ...emptyRemoteUserData,
      ...(JSON.parse(rawValue) as Partial<RemoteUserData>)
    };
  } catch {
    return emptyRemoteUserData;
  }
}

function writeStore(data: RemoteUserData): void {
  globalThis.sessionStorage?.setItem(storageKey, JSON.stringify(data));
}
