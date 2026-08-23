import 'fake-indexeddb/auto';

import {
  entityIdSchema,
  type CheckIn,
  type DailyFocus,
  type Observation,
  type OnboardingDraft,
  type PlayerGoal,
  type PlayerProfile,
  type Reflection,
  type Session,
  type SkillState,
  type WeeklyReview
} from '../../domain';
import {
  createClientId,
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb
} from './index';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T00:00:00.000Z';
const updatedTimestamp = '2026-08-18T01:00:00.000Z';
const sessionId = '22222222-2222-4222-8222-222222222222';
const focusId = '44444444-4444-4444-8444-444444444444';

const openedDbs: HoopjotLocalDb[] = [];

describe('local Dexie repositories', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      db.close();
    }

    await Promise.all(
      dbs.map(async (db) => {
        await db.delete();
      }),
    );
  });

  it('creates client UUIDs', () => {
    expect(entityIdSchema.safeParse(createClientId()).success).toBe(true);
  });

  it('persists create, read and update across a database reopen', async () => {
    const dbName = makeDbName('profile-reopen');
    let db = openDb(dbName);
    let repositories = createLocalRepositories(db);

    await repositories.profiles.save(validPlayerProfile());
    await repositories.profiles.save({ ...validPlayerProfile(), alias: 'Wing' });
    db.close();

    db = openDb(dbName);
    repositories = createLocalRepositories(db);

    const profile = await repositories.profiles.getByUserId(userId);

    expect(profile?.alias).toBe('Wing');
    expect(await repositories.syncQueue.list()).toHaveLength(2);
  });

  it('persists local onboarding drafts without creating sync operations', async () => {
    const db = openDb('onboarding-draft');
    const repositories = createLocalRepositories(db);

    await repositories.onboardingDrafts.save(validOnboardingDraft());

    expect(await repositories.onboardingDrafts.getByUserId(userId)).toMatchObject({
      currentStep: 'goals',
      birthYear: 2010,
      goalTypes: ['fundamentals']
    });
    expect(await repositories.syncQueue.list()).toEqual([]);

    await repositories.onboardingDrafts.deleteByUserId(userId);

    expect(await repositories.onboardingDrafts.getByUserId(userId)).toBeNull();
  });

  it('hard deletes non-tombstone entities and enqueues delete operations', async () => {
    const db = openDb('hard-delete');
    const repositories = createLocalRepositories(db);

    await repositories.profiles.save(validPlayerProfile());
    await repositories.profiles.deleteByUserId(userId);

    expect(await repositories.profiles.getByUserId(userId)).toBeNull();

    const operations = await repositories.syncQueue.list();
    expect(operations.map((operation) => operation.operation)).toEqual(['upsert', 'delete']);
    expect(operations[operations.length - 1]?.entityType).toBe('profiles');
  });

  it('keeps session tombstones locally while hiding deleted sessions from reads', async () => {
    const db = openDb('session-tombstone');
    const repositories = createLocalRepositories(db);
    const deletedAt = '2026-08-18T02:00:00.000Z';

    await repositories.sessions.save(validSession());
    await repositories.sessions.delete(sessionId, deletedAt);

    expect(await repositories.sessions.getById(sessionId)).toBeNull();
    expect(await repositories.sessions.listByUserId(userId)).toEqual([]);

    const rawSession = await db.sessions.get(sessionId);
    expect(rawSession?.deletedAt).toBe(deletedAt);

    const deleteOperation = (await repositories.syncQueue.list()).find(
      (operation) => operation.operation === 'delete',
    );
    expect(deleteOperation?.entityType).toBe('sessions');
    expect(deleteOperation?.payload).toMatchObject({ id: sessionId, deletedAt });
  });

  it('enforces repository contracts for MVP user-owned entities', async () => {
    const db = openDb('repository-contracts');
    const repositories = createLocalRepositories(db);

    await repositories.playerGoals.save(validGoal('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'));
    await repositories.checkIns.save(validCheckIn());
    await repositories.reflections.save(validReflection());
    await repositories.observations.save(validObservation());
    await repositories.skillState.save(validSkillState());
    await repositories.dailyFocus.save(validDailyFocus());
    await repositories.weeklyReviews.save(validWeeklyReview());

    expect(await repositories.playerGoals.listByUserId(userId)).toHaveLength(1);
    expect(await repositories.checkIns.getBySessionId(sessionId)).toMatchObject({ energy: 4 });
    expect(await repositories.reflections.getBySessionId(sessionId)).toMatchObject({
      focusRating: 5
    });
    expect(await repositories.observations.listByUserId(userId)).toHaveLength(1);
    expect(await repositories.skillState.getBySkillId(userId, 'def.rebound')).toMatchObject({
      trend: 'flat'
    });
    expect(await repositories.skillState.listByUserId(userId)).toHaveLength(1);
    expect(await repositories.dailyFocus.getByLocalDate(userId, '2026-08-18')).toMatchObject({
      status: 'planned'
    });
    expect(await repositories.dailyFocus.listByUserId(userId)).toHaveLength(1);
    expect(await repositories.weeklyReviews.getByWeekStart(userId, '2026-08-17')).toMatchObject({
      nextPrioritySkillIds: ['def.rebound']
    });

    await repositories.playerGoals.delete('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    await repositories.checkIns.delete('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    await repositories.reflections.delete('33333333-3333-4333-8333-333333333333');
    await repositories.observations.delete('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    await repositories.skillState.delete(userId, 'def.rebound');
    await repositories.dailyFocus.delete(focusId);
    await repositories.weeklyReviews.delete('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');

    expect(await repositories.playerGoals.listByUserId(userId)).toEqual([]);
    expect(await repositories.checkIns.getBySessionId(sessionId)).toBeNull();
    expect(await repositories.reflections.getBySessionId(sessionId)).toBeNull();
    expect(await repositories.observations.listByUserId(userId)).toEqual([]);
    expect(await repositories.skillState.getBySkillId(userId, 'def.rebound')).toBeNull();
    expect(await repositories.skillState.listByUserId(userId)).toEqual([]);
    expect(await repositories.dailyFocus.getByLocalDate(userId, '2026-08-18')).toBeNull();
    expect(await repositories.dailyFocus.listByUserId(userId)).toEqual([]);
    expect(await repositories.weeklyReviews.getByWeekStart(userId, '2026-08-17')).toBeNull();

    expect((await repositories.syncQueue.list()).filter((operation) => operation.operation === 'delete')).toHaveLength(7);
  });

  it('rejects a fourth active goal inside the local repository', async () => {
    const db = openDb('goal-limit');
    const repositories = createLocalRepositories(db);

    await repositories.playerGoals.save(validGoal('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'));
    await repositories.playerGoals.save(validGoal('cccccccc-cccc-4ccc-8ccc-cccccccccccc'));
    await repositories.playerGoals.save(validGoal('dddddddd-dddd-4ddd-8ddd-dddddddddddd'));

    await expect(
      repositories.playerGoals.save(validGoal('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')),
    ).rejects.toMatchObject({
      code: 'too_many_active_goals'
    });

    expect(await repositories.playerGoals.listByUserId(userId)).toHaveLength(3);
  });

  it('resets all local tables for development and tests', async () => {
    const db = openDb('reset');
    const repositories = createLocalRepositories(db);

    await repositories.profiles.save(validPlayerProfile());
    await repositories.sessions.save(validSession());

    await resetLocalDatabase(db);

    expect(await repositories.profiles.getByUserId(userId)).toBeNull();
    expect(await repositories.sessions.listByUserId(userId)).toEqual([]);
    expect(await repositories.syncQueue.list()).toEqual([]);
  });
});

function openDb(name: string): HoopjotLocalDb {
  const db = createHoopjotLocalDb(name);
  openedDbs.push(db);
  return db;
}

function makeDbName(name: string): string {
  return `hoopjot-test-${name}-${crypto.randomUUID()}`;
}

function validPlayerProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    userId,
    birthYear: 2010,
    primaryPosition: 'point_guard',
    competitiveLevel: 'club',
    locale: 'en',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function validOnboardingDraft(): OnboardingDraft {
  return {
    userId,
    currentStep: 'goals',
    locale: 'en',
    birthYear: 2010,
    primaryPosition: 'point_guard',
    competitiveLevel: 'club',
    goalTypes: ['fundamentals'],
    selfAssessment: {
      ballHandling: 3,
      shooting: 3,
      defense: 3,
      decisionMaking: 3,
      confidence: 3
    },
    updatedAt: timestamp
  };
}

function validGoal(id: string): PlayerGoal {
  return {
    id,
    userId,
    goalType: 'fundamentals',
    priority: 1,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validSession(overrides: Partial<Session> = {}): Session {
  return {
    id: sessionId,
    userId,
    type: 'practice',
    durationMinutes: 90,
    perceivedLoad: 3,
    createdAt: timestamp,
    updatedAt: updatedTimestamp,
    ...overrides
  };
}

function validCheckIn(): CheckIn {
  return {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    userId,
    sessionId,
    energy: 4,
    confidence: 3,
    physicalFeeling: 4,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validReflection(): Reflection {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    userId,
    sessionId,
    dailyFocusId: focusId,
    focusRating: 5,
    rememberNextTime: 'Locate matchup early.',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validObservation(): Observation {
  return {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    userId,
    sessionId,
    reflectionId: '33333333-3333-4333-8333-333333333333',
    skillId: 'def.rebound',
    polarity: 'positive',
    weight: 1,
    source: 'reflection',
    confidence: 0.8,
    observedAt: timestamp
  };
}

function validSkillState(): SkillState {
  return {
    userId,
    skillId: 'def.rebound',
    score: 0.6,
    confidence: 0.7,
    sampleCount: 3,
    trend: 'flat',
    updatedAt: timestamp
  };
}

function validDailyFocus(): DailyFocus {
  return {
    id: focusId,
    userId,
    localDate: '2026-08-18',
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'goal',
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validWeeklyReview(): WeeklyReview {
  return {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    userId,
    weekStart: '2026-08-17',
    highlightedSkillIds: ['def.rebound'],
    improvingSkillIds: [],
    recurringSkillIds: [],
    nextPrioritySkillIds: ['def.rebound'],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
