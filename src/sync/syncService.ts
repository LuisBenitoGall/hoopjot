import {
  parseCheckIn,
  parseDailyFocus,
  parseObservation,
  parsePlayerGoal,
  parsePlayerProfile,
  parseReflection,
  parseSession,
  parseSkillState,
  parseWeeklyReview
} from '../domain';
import type {
  HoopnoteLocalDb,
  SyncEntityType,
  SyncOperation
} from '../persistence/local';
import { mergeRemoteUserData } from './localMerge';
import type {
  RemoteSyncAdapter,
  RemoteSyncEntity,
  SyncProcessResult
} from './types';

interface SyncServiceDependencies {
  db: HoopnoteLocalDb;
  getNow?: () => Date;
  getOnlineStatus?: () => boolean;
  remote: RemoteSyncAdapter;
}

const baseRetryDelayMs = 1000;
const maxRetryDelayMs = 60_000;

export class SyncService {
  private readonly getNow: () => Date;
  private readonly getOnlineStatus: () => boolean;

  constructor(private readonly dependencies: SyncServiceDependencies) {
    this.getNow = dependencies.getNow ?? (() => new Date());
    this.getOnlineStatus =
      dependencies.getOnlineStatus ??
      (() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  }

  async bootstrap(userId: string): Promise<void> {
    this.assertOnline();

    const remoteData = await this.dependencies.remote.listUserData(userId);
    await mergeRemoteUserData(this.dependencies.db, remoteData);
  }

  async bootstrapAndProcessQueue(userId: string): Promise<SyncProcessResult> {
    await this.bootstrap(userId);

    return this.processQueue(userId);
  }

  async processQueue(userId: string): Promise<SyncProcessResult> {
    this.assertOnline();

    const operations = (await this.dependencies.db.syncQueue.orderBy('createdAt').toArray())
      .filter((operation) => operation.userId === userId);
    const pendingOperationIds = new Set(operations.map((operation) => operation.id));
    const dueOperations = operations.filter((operation) => isOperationDue(operation, this.getNow()));
    let processedCount = 0;

    for (const operation of dueOperations) {
      const attemptAt = this.getNow().toISOString();
      const attemptCount = operation.attemptCount + 1;

      try {
        await this.applyOperation(operation);
        await this.dependencies.db.syncQueue.delete(operation.id);
        pendingOperationIds.delete(operation.id);
        processedCount += 1;
      } catch (error) {
        const failedOperation = {
          ...operation,
          attemptCount,
          lastAttemptAt: attemptAt,
          lastError: getSyncErrorMessage(error)
        };

        await this.dependencies.db.syncQueue.put(failedOperation);

        return {
          failedOperation,
          nextRetryAt: getNextRetryAt(failedOperation),
          pendingOperationCount: pendingOperationIds.size,
          processedCount
        };
      }
    }

    const pendingOperations = operations.filter((operation) =>
      pendingOperationIds.has(operation.id),
    );

    return {
      failedOperation: null,
      nextRetryAt: getEarliestRetryAt(pendingOperations),
      pendingOperationCount: pendingOperations.length,
      processedCount
    };
  }

  private async applyOperation(operation: SyncOperation): Promise<void> {
    if (operation.operation === 'upsert') {
      await this.dependencies.remote.upsert(
        operation.entityType,
        parseSyncEntityPayload(operation.entityType, operation.payload),
      );
      return;
    }

    if (operation.entityType === 'sessions' && operation.payload) {
      await this.dependencies.remote.upsert('sessions', parseSession(operation.payload));
      return;
    }

    await this.dependencies.remote.delete({
      entityId: operation.entityId,
      entityType: operation.entityType,
      payload: operation.payload,
      userId: operation.userId
    });
  }

  private assertOnline(): void {
    if (!this.getOnlineStatus()) {
      throw new SyncServiceError('offline', 'Network is unavailable.');
    }
  }
}

export class SyncServiceError extends Error {
  readonly code: 'offline' | 'remote_error';

  constructor(code: 'offline' | 'remote_error', message: string) {
    super(message);
    this.name = 'SyncServiceError';
    this.code = code;
  }
}

export function getRetryDelayMs(attemptCount: number): number {
  if (attemptCount <= 0) {
    return 0;
  }

  return Math.min(maxRetryDelayMs, baseRetryDelayMs * 2 ** (attemptCount - 1));
}

function isOperationDue(operation: SyncOperation, now: Date): boolean {
  if (!operation.lastAttemptAt) {
    return true;
  }

  const elapsedMs = now.getTime() - Date.parse(operation.lastAttemptAt);

  return elapsedMs >= getRetryDelayMs(operation.attemptCount);
}

function getNextRetryAt(operation: SyncOperation): string {
  const lastAttemptAt = operation.lastAttemptAt ?? new Date().toISOString();

  return new Date(
    Date.parse(lastAttemptAt) + getRetryDelayMs(operation.attemptCount),
  ).toISOString();
}

function getEarliestRetryAt(operations: SyncOperation[]): string | null {
  return operations
    .map((operation) => getNextRetryAt(operation))
    .sort()
    .at(0) ?? null;
}

function parseSyncEntityPayload(
  entityType: SyncEntityType,
  payload: unknown,
): RemoteSyncEntity {
  switch (entityType) {
    case 'profiles':
      return parsePlayerProfile(payload);
    case 'player_goals':
      return parsePlayerGoal(payload);
    case 'sessions':
      return parseSession(payload);
    case 'check_ins':
      return parseCheckIn(payload);
    case 'reflections':
      return parseReflection(payload);
    case 'observations':
      return parseObservation(payload);
    case 'skill_state':
      return parseSkillState(payload);
    case 'daily_focus':
      return parseDailyFocus(payload);
    case 'weekly_reviews':
      return parseWeeklyReview(payload);
  }
}

function getSyncErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return 'Remote sync failed.';
}
