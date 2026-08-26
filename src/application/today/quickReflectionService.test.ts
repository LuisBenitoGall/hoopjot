import 'fake-indexeddb/auto';

import {
  parseDailyFocus,
  parseReflection,
  parseSession,
  type DailyFocus,
  type Reflection,
  type Session
} from '../../domain';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb
} from '../../persistence/local';
import { QuickReflectionService } from './quickReflectionService';

const userId = '11111111-1111-4111-8111-111111111111';
const focusId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const reflectionId = '44444444-4444-4444-8444-444444444444';
const localDate = '2026-08-24';
const startedAt = '2026-08-24T10:00:00.000Z';
const completedAt = '2026-08-24T11:00:00.000Z';

const openedDbs: HoopjotLocalDb[] = [];

describe('QuickReflectionService', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      await resetLocalDatabase(db);
      db.close();
      await db.delete();
    }
  });

  it('creates a session without a check-in, saves a rating-only reflection and completes the focus', async () => {
    const { db, repositories } = makeRepositories();
    const service = new QuickReflectionService({
      createId: makeSequentialIds([sessionId, reflectionId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(completedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await db.syncQueue.clear();

    const state = await service.saveQuickReflection({
      focusRating: 4,
      sessionType: 'practice',
      userId
    });

    expect(state.session).toMatchObject({
      completedAt,
      id: sessionId,
      startedAt: completedAt,
      type: 'practice'
    });
    expect(state.reflection).toMatchObject({
      dailyFocusId: focusId,
      focusRating: 4,
      id: reflectionId,
      sessionId
    });
    expect(state.reflection?.rememberNextTime).toBeUndefined();
    expect(state.reflection?.rememberNextTime).not.toBe('');
    expect(state.reflection?.rememberNextTime).not.toBeNull();
    expect(state.dailyFocus).toMatchObject({ status: 'completed' });
    expect(await db.checkIns.toArray()).toHaveLength(0);
    expect((await db.sessions.toArray())).toHaveLength(1);
    const [persistedReflection] = await db.reflections.toArray();

    expect(persistedReflection?.rememberNextTime).toBeUndefined();
    expect(persistedReflection?.rememberNextTime).not.toBe('');
    expect(persistedReflection?.rememberNextTime).not.toBeNull();
    expect((await db.reflections.toArray())).toHaveLength(1);
    const queuedEntityTypes = (await db.syncQueue.toArray()).map(
      (operation) => operation.entityType,
    );

    expect(queuedEntityTypes).toHaveLength(3);
    expect(queuedEntityTypes).toEqual(
      expect.arrayContaining(['sessions', 'reflections', 'daily_focus']),
    );
  });

  it('reuses an existing game session and applies the selected practice type', async () => {
    const { db, repositories } = makeRepositories();
    const service = new QuickReflectionService({
      createId: makeSequentialIds([reflectionId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(completedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await repositories.sessions.save(validSession({ notes: 'Keep existing session data.', type: 'game' }));
    await db.syncQueue.clear();

    const state = await service.saveQuickReflection({
      focusRating: 5,
      sessionType: 'practice',
      userId
    });

    expect(state.session).toMatchObject({
      completedAt,
      id: sessionId,
      notes: 'Keep existing session data.',
      type: 'practice'
    });
    expect(await db.checkIns.toArray()).toHaveLength(0);
    expect(await db.sessions.toArray()).toMatchObject([
      {
        id: sessionId,
        notes: 'Keep existing session data.',
        type: 'practice'
      }
    ]);
    expect((await db.reflections.toArray())).toHaveLength(1);
  });

  it('reuses an existing practice session and applies the selected game type', async () => {
    const { db, repositories } = makeRepositories();
    const service = new QuickReflectionService({
      createId: makeSequentialIds([reflectionId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(completedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await repositories.sessions.save(validSession({ notes: 'Keep existing practice data.', type: 'practice' }));
    await db.syncQueue.clear();

    const state = await service.saveQuickReflection({
      focusRating: 5,
      sessionType: 'game',
      userId
    });

    expect(state.session).toMatchObject({
      completedAt,
      id: sessionId,
      notes: 'Keep existing practice data.',
      type: 'game'
    });
    expect(await db.sessions.toArray()).toMatchObject([
      {
        id: sessionId,
        notes: 'Keep existing practice data.',
        type: 'game'
      }
    ]);
    expect((await db.sessions.toArray())).toHaveLength(1);
    expect((await db.reflections.toArray())).toHaveLength(1);
  });

  it('maps note and coach feedback while leaving rememberNextTime omitted', async () => {
    const { db, repositories } = makeRepositories();
    const service = new QuickReflectionService({
      createId: makeSequentialIds([sessionId, reflectionId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(completedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await db.syncQueue.clear();

    const state = await service.saveQuickReflection({
      coachFeedback: '  Coach said talk early.  ',
      focusRating: 4,
      note: '  Closed out before watching the ball.  ',
      sessionType: 'practice',
      userId
    });

    expect(state.reflection).toMatchObject({
      coachFeedback: 'Coach said talk early.',
      note: 'Closed out before watching the ball.'
    });
    expect(state.reflection?.rememberNextTime).toBeUndefined();
    expect(state.reflection?.rememberNextTime).not.toBe('');
    expect(state.reflection?.rememberNextTime).not.toBeNull();
  });

  it('detects an existing saved reflection without creating another session or reflection', async () => {
    const { db, repositories } = makeRepositories();
    const service = new QuickReflectionService({
      createId: makeSequentialIds(['55555555-5555-4555-8555-555555555555']),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(completedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus({ status: 'completed' }));
    await repositories.sessions.save(validSession({ completedAt }));
    await repositories.reflections.save(validReflection({ focusRating: 3 }));
    await db.syncQueue.clear();

    const loadedState = await service.getTodayState(userId);
    const savedState = await service.saveQuickReflection({
      focusRating: 5,
      sessionType: 'practice',
      userId
    });

    expect(loadedState.reflection).toMatchObject({ focusRating: 3, id: reflectionId });
    expect(savedState.reflection).toMatchObject({ focusRating: 3, id: reflectionId });
    expect((await db.sessions.toArray())).toHaveLength(1);
    expect((await db.reflections.toArray())).toHaveLength(1);
    expect(await db.syncQueue.toArray()).toHaveLength(0);
  });
});

function makeRepositories() {
  const db = createHoopjotLocalDb(`hoopjot-quick-reflection-${crypto.randomUUID()}`);
  openedDbs.push(db);

  return { db, repositories: createLocalRepositories(db) };
}

function validDailyFocus(overrides: Partial<DailyFocus> = {}): DailyFocus {
  return parseDailyFocus({
    id: focusId,
    userId,
    localDate,
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'planned',
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides
  });
}

function validSession(overrides: Partial<Session> = {}): Session {
  return parseSession({
    id: sessionId,
    userId,
    type: 'practice',
    startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides
  });
}

function validReflection(overrides: Partial<Reflection> = {}): Reflection {
  return parseReflection({
    id: reflectionId,
    userId,
    sessionId,
    dailyFocusId: focusId,
    focusRating: 4,
    createdAt: completedAt,
    updatedAt: completedAt,
    ...overrides
  });
}

function makeSequentialIds(ids: string[]): () => string {
  let index = 0;

  return () => ids[Math.min(index++, ids.length - 1)] ?? ids[ids.length - 1] ?? reflectionId;
}
