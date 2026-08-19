import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  type LocalRepositories
} from '../../persistence/local';
import { createBrowserSyncService, type SyncService } from '../../sync';

export interface BrowserLocalServices {
  repositories: LocalRepositories;
  syncService: SyncService | null;
}

export function createBrowserLocalServices(): BrowserLocalServices {
  const db = createHoopnoteLocalDb(getLocalDatabaseName());

  return {
    repositories: createLocalRepositories(db),
    syncService: createBrowserSyncService(db)
  };
}

export function createBrowserLocalRepositories(): LocalRepositories {
  return createBrowserLocalServices().repositories;
}

function getLocalDatabaseName(): string | undefined {
  if (
    import.meta.env.VITE_ENABLE_E2E_AUTH !== 'true' ||
    typeof globalThis.sessionStorage === 'undefined'
  ) {
    return undefined;
  }

  return globalThis.sessionStorage.getItem('hoopnote:e2e-db-name') ?? undefined;
}
