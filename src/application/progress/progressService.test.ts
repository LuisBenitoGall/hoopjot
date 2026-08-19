import 'fake-indexeddb/auto';

import { basketballContentRepository } from '../../content/basketball';
import type {
  DailyFocus,
  Reflection,
  Session
} from '../../domain';
import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  type HoopnoteLocalDb
} from '../../persistence/local';
import { ProgressService } from './progressService';

const userId = '11111111-1111-4111-8111-111111111111';
const localDate = '2026-08-18';
const timestamp = '2026-08-18T12:00:00.000Z';
const dbs: HoopnoteLocalDb[] = [];

describe('ProgressService', () => {
  afterEach(async () => {
    const openedDbs = dbs.splice(0);

    for (const db of openedDbs) {
      db.close();
    }

    await Promise.all(
      openedDbs.map(async (db) => {
        await db.delete();
      }),
    );
  });

  it('does not duplicate a weekly review for the same local week', async () => {
    const db = openDb('dedupe');
    const repositories = createLocalRepositories(db);
    const service = makeService(repositories, {
      createId: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    });

    await seedProgressData(repositories);

    const firstResult = await service.getOrCreateWeeklyReview(userId);
    const secondResult = await service.getOrCreateWeeklyReview(userId);

    expect(firstResult.created).toBe(true);
    expect(secondResult.created).toBe(false);
    expect(secondResult.weeklyReview.id).toBe(firstResult.weeklyReview.id);
    expect(await db.weeklyReviews.where({ userId }).count()).toBe(1);
    expect(
      (await repositories.syncQueue.list()).filter(
        (operation) => operation.entityType === 'weekly_reviews',
      ),
    ).toHaveLength(1);
  });

  it('persists user-entered weekly notes across a local database reopen', async () => {
    const dbName = makeDbName('notes-reopen');
    let db = openDb(dbName, false);
    let repositories = createLocalRepositories(db);
    let service = makeService(repositories, {
      createId: () => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    });

    await seedProgressData(repositories);
    await service.saveWeeklyReviewNotes({
      userId,
      userImprovementNote: 'Closed out with better timing.',
      userNextWeekNote: 'Keep tracking the matchup first.'
    });
    db.close();

    db = openDb(dbName, false);
    repositories = createLocalRepositories(db);
    service = makeService(repositories, {
      createId: () => 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    });

    const dashboard = await service.getProgressDashboard(userId);

    expect(dashboard.weeklyReview).toMatchObject({
      userImprovementNote: 'Closed out with better timing.',
      userNextWeekNote: 'Keep tracking the matchup first.',
      weekStart: '2026-08-17'
    });
  });
});

function makeService(
  repositories: ReturnType<typeof createLocalRepositories>,
  overrides: { createId: () => string },
) {
  return new ProgressService({
    contentRepository: basketballContentRepository,
    createId: overrides.createId,
    dailyFocusRepository: repositories.dailyFocus,
    getLocalDate: () => localDate,
    getNow: () => new Date(timestamp),
    observationRepository: repositories.observations,
    reflectionRepository: repositories.reflections,
    sessionRepository: repositories.sessions,
    skillStateRepository: repositories.skillState,
    weeklyReviewRepository: repositories.weeklyReviews
  });
}

async function seedProgressData(
  repositories: ReturnType<typeof createLocalRepositories>,
): Promise<void> {
  await repositories.dailyFocus.save(makeDailyFocus());
  await repositories.sessions.save(makeSession());
  await repositories.reflections.save(makeReflection());
}

function openDb(name: string, generateName = true): HoopnoteLocalDb {
  const db = createHoopnoteLocalDb(generateName ? makeDbName(name) : name);
  dbs.push(db);
  return db;
}

function makeDbName(name: string): string {
  return `hoopnote-progress-${name}-${crypto.randomUUID()}`;
}

function makeDailyFocus(): DailyFocus {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    userId,
    localDate,
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeSession(): Session {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    userId,
    type: 'practice',
    startedAt: timestamp,
    completedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeReflection(): Reflection {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    userId,
    sessionId: '33333333-3333-4333-8333-333333333333',
    dailyFocusId: '22222222-2222-4222-8222-222222222222',
    focusRating: 5,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
