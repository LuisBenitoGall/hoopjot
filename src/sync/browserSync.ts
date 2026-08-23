import type { HoopjotLocalDb } from '../persistence/local';
import {
  createSupabaseBrowserClient,
  getSupabaseBrowserConfig
} from '../services/auth/supabaseClient';
import {
  E2ERemoteSyncAdapter,
  shouldUseE2ERemoteSyncAdapter
} from './e2eRemoteSyncAdapter';
import { SupabaseRemoteSyncAdapter } from './remoteSupabaseAdapter';
import { SyncService } from './syncService';
import type { RemoteSyncAdapter } from './types';

export function createBrowserSyncService(db: HoopjotLocalDb): SyncService | null {
  const remote = createBrowserRemoteSyncAdapter();

  return remote ? new SyncService({ db, remote }) : null;
}

export function createBrowserRemoteSyncAdapter(): RemoteSyncAdapter | null {
  if (shouldUseE2ERemoteSyncAdapter()) {
    return new E2ERemoteSyncAdapter();
  }

  if (
    import.meta.env.VITE_ENABLE_E2E_AUTH === 'true' &&
    typeof globalThis.sessionStorage !== 'undefined'
  ) {
    return null;
  }

  const config = getSupabaseBrowserConfig();

  if (!config) {
    return null;
  }

  return new SupabaseRemoteSyncAdapter(createSupabaseBrowserClient(config));
}
