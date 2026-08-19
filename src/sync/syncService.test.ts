import 'fake-indexeddb/auto';

import type { PlayerProfile, Session } from '../domain';
import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  type HoopnoteLocalDb
} from '../persistence/local';
import { SyncService } from './syncService';
import type {
  RemoteDeleteInput,
  RemoteSyncAdapter,
  RemoteSyncEntity,
  RemoteUserData
} from './types';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T00:00:00.000Z';
const laterTimestamp = '2026-08-18T00:00:01.000Z';
const sessionId = '22222222-2222-4222-8222-222222222222';

const openedDbs: HoopnoteLocalDb[] = [];

describe('SyncService', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      db.close();
      await db.delete();
    }
  });

  it('pushes queued local upserts and clears successful operations', async () => {
    const db = openDb('upsert');
    const repositories = createLocalRepositories(db);
    const remote = new FakeRemoteSyncAdapter();
    const service = new SyncService({ db, remote });

    await repositories.profiles.save(validPlayerProfile());

    const result = await service.processQueue(userId);

    expect(result).toMatchObject({
      failedOperation: null,
      nextRetryAt: null,
      pendingOperationCount: 0,
      processedCount: 1
    });
    expect(remote.upserts).toHaveLength(1);
    expect(remote.upserts[0]).toMatchObject({ entityType: 'profiles' });
    expect(await db.syncQueue.toArray()).toEqual([]);
  });

  it('records failures and respects retry backoff before trying again', async () => {
    const db = openDb('retry');
    const repositories = createLocalRepositories(db);
    const remote = new FakeRemoteSyncAdapter();
    let now = new Date(timestamp);
    const service = new SyncService({
      db,
      getNow: () => now,
      remote
    });

    await repositories.profiles.save(validPlayerProfile());
    remote.failNextUpsert = true;

    const failed = await service.processQueue(userId);

    expect(failed.failedOperation).toMatchObject({
      attemptCount: 1,
      entityType: 'profiles',
      lastError: 'Remote write failed.'
    });
    expect(failed).toMatchObject({
      nextRetryAt: laterTimestamp,
      pendingOperationCount: 1,
      processedCount: 0
    });
    expect(remote.upserts).toHaveLength(0);

    const notDue = await service.processQueue(userId);

    expect(notDue).toMatchObject({
      failedOperation: null,
      nextRetryAt: laterTimestamp,
      pendingOperationCount: 1,
      processedCount: 0
    });
    expect(await db.syncQueue.count()).toBe(1);

    now = new Date(laterTimestamp);

    const retried = await service.processQueue(userId);

    expect(retried).toMatchObject({
      failedOperation: null,
      nextRetryAt: null,
      pendingOperationCount: 0,
      processedCount: 1
    });
    expect(remote.upserts).toHaveLength(1);
    expect(await db.syncQueue.toArray()).toEqual([]);
  });

  it('merges remote bootstrap data without duplicate user profiles', async () => {
    const db = openDb('bootstrap');
    const remote = new FakeRemoteSyncAdapter();
    const service = new SyncService({ db, remote });

    await db.profiles.put(validPlayerProfile({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));
    remote.data.profiles = [
      validPlayerProfile({
        alias: 'Remote profile',
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        updatedAt: laterTimestamp
      })
    ];

    await service.bootstrap(userId);

    const profiles = await db.profiles.where('userId').equals(userId).toArray();

    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({
      alias: 'Remote profile',
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    });
    expect(await db.syncQueue.toArray()).toEqual([]);
  });

  it('syncs deleted sessions as tombstone upserts', async () => {
    const db = openDb('tombstone');
    const repositories = createLocalRepositories(db);
    const remote = new FakeRemoteSyncAdapter();
    const service = new SyncService({ db, remote });
    const deletedAt = '2026-08-18T01:00:00.000Z';

    await repositories.sessions.save(validSession());
    await db.syncQueue.clear();
    await repositories.sessions.delete(sessionId, deletedAt);

    await service.processQueue(userId);

    expect(remote.deletes).toEqual([]);
    expect(remote.upserts).toHaveLength(1);
    expect(remote.upserts[0]).toMatchObject({
      entity: {
        deletedAt,
        id: sessionId
      },
      entityType: 'sessions'
    });
    expect(await db.syncQueue.toArray()).toEqual([]);
  });
});

class FakeRemoteSyncAdapter implements RemoteSyncAdapter {
  data: RemoteUserData = emptyRemoteUserData();
  deletes: RemoteDeleteInput[] = [];
  failNextUpsert = false;
  upserts: Array<{ entity: RemoteSyncEntity; entityType: string }> = [];

  async delete(input: RemoteDeleteInput): Promise<void> {
    this.deletes.push(input);
  }

  async listUserData(): Promise<RemoteUserData> {
    return this.data;
  }

  async upsert(entityType: string, entity: RemoteSyncEntity): Promise<void> {
    if (this.failNextUpsert) {
      this.failNextUpsert = false;
      throw new Error('Remote write failed.');
    }

    this.upserts.push({ entity, entityType });
  }
}

function openDb(name: string): HoopnoteLocalDb {
  const db = createHoopnoteLocalDb(`hoopnote-sync-test-${name}-${crypto.randomUUID()}`);
  openedDbs.push(db);
  return db;
}

function emptyRemoteUserData(): RemoteUserData {
  return {
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
}

function validPlayerProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    birthYear: 2010,
    competitiveLevel: 'club',
    createdAt: timestamp,
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    locale: 'en',
    primaryPosition: 'point_guard',
    updatedAt: timestamp,
    userId,
    ...overrides
  };
}

function validSession(overrides: Partial<Session> = {}): Session {
  return {
    createdAt: timestamp,
    id: sessionId,
    type: 'practice',
    updatedAt: timestamp,
    userId,
    ...overrides
  };
}
