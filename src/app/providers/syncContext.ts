import { createContext, useContext } from 'react';

import type { InitialSyncBootstrapStatus, SyncIndicatorStatus } from '../../sync';

export interface SyncContextValue {
  initialBootstrapStatus: InitialSyncBootstrapStatus;
  retryNow: () => Promise<void>;
  status: SyncIndicatorStatus;
}

export const defaultSyncContextValue: SyncContextValue = {
  initialBootstrapStatus: 'complete',
  retryNow: async () => undefined,
  status: 'synced'
};

export const SyncContext = createContext<SyncContextValue>(defaultSyncContextValue);

export function useSyncStatus(): SyncContextValue {
  return useContext(SyncContext);
}