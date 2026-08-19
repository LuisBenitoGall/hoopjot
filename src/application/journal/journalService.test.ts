import 'fake-indexeddb/auto';

import type {
  BasketballContentRepository,
  CheckIn,
  DailyFocus,
  Guideline,
  Session,
  Skill
} from '../../domain';
import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopnoteLocalDb
} from '../../persistence/local';
import { JournalService } from './journalService';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const focusId = '33333333-3333-4333-8333-333333333333';
const reflectedSessionId = '44444444-4444-4444-8444-444444444444';
const sameDaySessionId = '55555555-5555-4555-8555-555555555555';
const olderSessionId = '66666666-6666-4666-8666-666666666666';
const oldestSessionId = '77777777-7777-4777-8777-777777777777';
const deletedSessionId = '88888888-8888-4888-8888-888888888888';
const reflectedAt = '2026-08-18T16:00:00.000Z';
const sameDayAt = '2026-08-18T12:00:00.000Z';
const olderAt = '2026-08-17T12:00:00.000Z';
const oldestAt = '2026-08-16T12:00:00.000Z';

const openedDbs: HoopnoteLocalDb[] = [];

describe('JournalService', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      await resetLocalDatabase(db);
      db.close();
      await db.delete();
    }
  });

  it('groups sessions by local date newest first, filters by type and hides tombstones', async () => {
    const { repositories } = makeRepositories();
    const service = new JournalService({
      checkInRepository: repositories.checkIns,
      contentRepository: new MemoryContentRepository([
        makeGuideline({ id: 'def.rebound.find-player-first' })
      ]),
      dailyFocusRepository: repositories.dailyFocus,
      reflectionRepository: repositories.reflections,
      sessionRepository: repositories.sessions
    });

    await repositories.dailyFocus.save(validDailyFocus());
    await repositories.sessions.save(
      makeSession({
        id: oldestSessionId,
        startedAt: oldestAt,
        type: 'practice'
      }),
    );
    await repositories.sessions.save(
      makeSession({
        id: olderSessionId,
        startedAt: olderAt,
        type: 'game'
      }),
    );
    await repositories.sessions.save(
      makeSession({
        id: sameDaySessionId,
        startedAt: sameDayAt,
        type: 'learning'
      }),
    );
    await repositories.sessions.save(
      makeSession({
        id: reflectedSessionId,
        startedAt: reflectedAt,
        type: 'practice'
      }),
    );
    await repositories.checkIns.save(validCheckIn());
    await repositories.reflections.save({
      id: '99999999-9999-4999-8999-999999999999',
      userId,
      sessionId: reflectedSessionId,
      dailyFocusId: focusId,
      focusRating: 5,
      note: 'Closed out before watching the ball.',
      createdAt: reflectedAt,
      updatedAt: reflectedAt
    });
    await repositories.sessions.save(
      makeSession({
        id: deletedSessionId,
        startedAt: '2026-08-19T12:00:00.000Z',
        type: 'game'
      }),
    );
    await repositories.sessions.delete(deletedSessionId, '2026-08-19T13:00:00.000Z');
    await repositories.sessions.save(
      makeSession({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: otherUserId
      }),
    );

    const timeline = await service.listTimeline(userId);
    const entryIds = timeline.groups.flatMap((group) =>
      group.entries.map((entry) => entry.session.id),
    );

    expect(timeline.groups.map((group) => group.localDate)).toEqual([
      '2026-08-18',
      '2026-08-17',
      '2026-08-16'
    ]);
    expect(timeline.groups[0]?.entries.map((entry) => entry.session.id)).toEqual([
      reflectedSessionId,
      sameDaySessionId
    ]);
    expect(entryIds).not.toContain(deletedSessionId);
    expect(timeline.groups[0]?.entries[0]).toMatchObject({
      checkIn: { energy: 4 },
      dailyFocus: { id: focusId },
      guideline: { id: 'def.rebound.find-player-first' },
      reflection: { focusRating: 5 }
    });

    const gameTimeline = await service.listTimeline(userId, 'game');

    expect(gameTimeline.totalCount).toBe(1);
    expect(gameTimeline.groups[0]?.entries[0]?.session.id).toBe(olderSessionId);

    await expect(service.getSessionDetail(userId, reflectedSessionId)).resolves.toMatchObject({
      guideline: { id: 'def.rebound.find-player-first' },
      reflection: { focusRating: 5 },
      session: { id: reflectedSessionId }
    });
    await expect(service.getSessionDetail(userId, deletedSessionId)).resolves.toBeNull();
  });
});

function makeRepositories() {
  const db = createHoopnoteLocalDb(`hoopnote-journal-service-${crypto.randomUUID()}`);
  openedDbs.push(db);

  return { db, repositories: createLocalRepositories(db) };
}

function validDailyFocus(): DailyFocus {
  return {
    id: focusId,
    userId,
    localDate: '2026-08-18',
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'completed',
    createdAt: reflectedAt,
    updatedAt: reflectedAt
  };
}

function validCheckIn(): CheckIn {
  return {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    userId,
    sessionId: reflectedSessionId,
    energy: 4,
    confidence: 3,
    physicalFeeling: 4,
    createdAt: reflectedAt,
    updatedAt: reflectedAt
  };
}

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: reflectedSessionId,
    userId,
    type: 'practice',
    startedAt: reflectedAt,
    createdAt: reflectedAt,
    updatedAt: reflectedAt,
    ...overrides
  };
}

function makeGuideline(overrides: Partial<Guideline>): Guideline {
  return {
    id: 'def.rebound.find-player-first',
    skillIds: ['def.rebound.box-out'],
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positions: ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_rebound_find_player_first',
    active: true,
    ...overrides
  };
}

class MemoryContentRepository implements BasketballContentRepository {
  constructor(private readonly guidelines: Guideline[]) {}

  async getGuidelineById(id: string): Promise<Guideline | null> {
    return this.guidelines.find((guideline) => guideline.id === id) ?? null;
  }

  async getSkillById(): Promise<Skill | null> {
    return null;
  }

  async listGuidelines(): Promise<Guideline[]> {
    return this.guidelines;
  }

  async listSkills(): Promise<Skill[]> {
    return [];
  }
}
