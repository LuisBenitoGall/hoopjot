import 'fake-indexeddb/auto';

import type { DailyFocus } from '../../domain';
import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopnoteLocalDb
} from '../../persistence/local';
import { SessionReflectionService } from './sessionReflectionService';

const userId = '11111111-1111-4111-8111-111111111111';
const focusId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const checkInId = '44444444-4444-4444-8444-444444444444';
const reflectionId = '55555555-5555-4555-8555-555555555555';
const localDate = '2026-08-18';
const startedAt = '2026-08-18T10:00:00.000Z';
const completedAt = '2026-08-18T11:00:00.000Z';

const openedDbs: HoopnoteLocalDb[] = [];

describe('SessionReflectionService', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      await resetLocalDatabase(db);
      db.close();
      await db.delete();
    }
  });

  it('starts and completes a session without optional check-in fields', async () => {
    const { db, repositories } = makeRepositories();
    const service = new SessionReflectionService({
      checkInRepository: repositories.checkIns,
      createId: makeSequentialIds([sessionId, reflectionId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: makeSequentialNow([startedAt, completedAt]),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await db.syncQueue.clear();

    const startedState = await service.startSession({
      userId,
      type: 'practice'
    });

    expect(startedState.latestSession).toMatchObject({
      id: sessionId,
      startedAt,
      type: 'practice'
    });
    expect(startedState.checkIn).toBeNull();

    const completedState = await service.completeSession({
      userId,
      sessionId,
      focusRating: 4
    });

    expect(completedState.latestSession).toMatchObject({
      completedAt,
      id: sessionId
    });
    expect(completedState.reflection).toMatchObject({
      dailyFocusId: focusId,
      focusRating: 4,
      id: reflectionId,
      sessionId
    });
    expect(completedState.reflection?.note).toBeUndefined();

    const entityTypes = (await db.syncQueue.toArray()).map((operation) => operation.entityType);

    expect(entityTypes).toHaveLength(3);
    expect(entityTypes.filter((entityType) => entityType === 'sessions')).toHaveLength(2);
    expect(entityTypes).toEqual(expect.arrayContaining(['reflections']));
  });

  it('persists optional pre-session check-in ratings and enqueues them for sync', async () => {
    const { db, repositories } = makeRepositories();
    const service = new SessionReflectionService({
      checkInRepository: repositories.checkIns,
      createId: makeSequentialIds([sessionId, checkInId]),
      dailyFocusRepository: repositories.dailyFocus,
      getLocalDate: () => localDate,
      getNow: () => new Date(startedAt),
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    const state = await service.startSession({
      userId,
      type: 'game',
      checkIn: {
        confidence: 4,
        energy: 5,
        physicalFeeling: 3
      }
    });

    expect(state.checkIn).toMatchObject({
      confidence: 4,
      energy: 5,
      physicalFeeling: 3,
      sessionId
    });
    const entityTypes = (await db.syncQueue.toArray()).map((operation) => operation.entityType);

    expect(entityTypes).toHaveLength(2);
    expect(entityTypes).toEqual(expect.arrayContaining(['sessions', 'check_ins']));
  });
});

function makeRepositories() {
  const db = createHoopnoteLocalDb(`hoopnote-session-service-${crypto.randomUUID()}`);
  openedDbs.push(db);

  return { db, repositories: createLocalRepositories(db) };
}

function validDailyFocus(): DailyFocus {
  return {
    id: focusId,
    userId,
    localDate,
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'planned',
    createdAt: startedAt,
    updatedAt: startedAt
  };
}

function makeSequentialIds(ids: string[]): () => string {
  let index = 0;

  return () => ids[Math.min(index++, ids.length - 1)] ?? ids[ids.length - 1] ?? sessionId;
}

function makeSequentialNow(values: string[]): () => Date {
  let index = 0;

  return () => new Date(values[Math.min(index++, values.length - 1)] ?? startedAt);
}
