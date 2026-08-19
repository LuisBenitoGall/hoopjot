import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode
} from 'react';

import type { AuthState } from '../../services/auth';
import {
  SyncServiceError,
  type InitialSyncBootstrapStatus,
  type SyncIndicatorStatus,
  type SyncProcessResult,
  type SyncService
} from '../../sync';
import { useAuth } from './authContext';
import { SyncContext, type SyncContextValue } from './syncContext';

type SyncProviderService = Pick<SyncService, 'bootstrap' | 'processQueue'>;

interface SyncProviderProps {
  children: ReactNode;
  syncService?: SyncProviderService | null;
}

interface BootstrapState {
  status: InitialSyncBootstrapStatus;
  userId: string | null;
}

const activeSyncIntervalMs = 15_000;

export function SyncProvider({ children, syncService = null }: SyncProviderProps) {
  const { refreshOnboardingStatus, state: authState } = useAuth();
  const authenticatedUserId = authState.status === 'authenticated' ? authState.user.id : null;
  const retryTimerRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const refreshOnboardingStatusRef = useRef(refreshOnboardingStatus);
  const shouldRefreshOnboardingAfterBootstrapRef = useRef(false);
  const [status, setStatus] = useState<SyncIndicatorStatus>('synced');
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    status: 'idle',
    userId: null
  });
  const initialBootstrapStatus = getInitialBootstrapStatus(
    authState,
    syncService,
    bootstrapState,
  );

  useEffect(() => {
    refreshOnboardingStatusRef.current = refreshOnboardingStatus;
  }, [refreshOnboardingStatus]);

  useEffect(() => {
    shouldRefreshOnboardingAfterBootstrapRef.current =
      authState.status === 'authenticated' && !authState.user.onboardingCompleted;
  }, [authState]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const processSync = useCallback(
    async (mode: 'bootstrap' | 'queue' = 'queue') => {
      if (!authenticatedUserId || !syncService || isProcessingRef.current) {
        return;
      }

      const userId = authenticatedUserId;

      if (mode === 'bootstrap') {
        setBootstrapState({ status: 'syncing', userId });
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');

        if (mode === 'bootstrap') {
          setBootstrapState({ status: 'offline', userId });
        }

        return;
      }

      clearRetryTimer();
      isProcessingRef.current = true;
      setStatus('syncing');

      try {
        const result =
          mode === 'bootstrap'
            ? await bootstrapThenProcessQueue(syncService, userId, async () => {
                if (shouldRefreshOnboardingAfterBootstrapRef.current) {
                  await refreshOnboardingStatusRef.current();
                }
              })
            : await syncService.processQueue(userId);

        if (mode === 'bootstrap') {
          setBootstrapState({ status: 'complete', userId });
        }

        if (result.failedOperation || result.pendingOperationCount > 0) {
          setStatus('needs_attention');
          scheduleRetry(retryTimerRef, result.nextRetryAt, () => {
            void processSync('queue');
          });
          return;
        }

        setStatus('synced');
      } catch (error) {
        setStatus(toSyncStatus(error));

        if (mode === 'bootstrap') {
          setBootstrapState({ status: toInitialBootstrapFailureStatus(error), userId });
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [authenticatedUserId, clearRetryTimer, syncService],
  );

  useEffect(() => {
    if (!authenticatedUserId || !syncService) {
      setStatus('synced');
      setBootstrapState({ status: 'complete', userId: null });
      return undefined;
    }

    void processSync('bootstrap');

    const handleOnline = () => {
      void processSync('bootstrap');
    };
    const handleOffline = () => {
      setStatus('offline');
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void processSync('queue');
      }
    };
    const intervalId = window.setInterval(() => {
      void processSync('queue');
    }, activeSyncIntervalMs);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearRetryTimer();
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authenticatedUserId, clearRetryTimer, processSync, syncService]);

  const retryNow = useCallback(async () => {
    await processSync(initialBootstrapStatus === 'complete' ? 'queue' : 'bootstrap');
  }, [initialBootstrapStatus, processSync]);

  const value = useMemo<SyncContextValue>(
    () => ({
      initialBootstrapStatus,
      retryNow,
      status
    }),
    [initialBootstrapStatus, retryNow, status],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

async function bootstrapThenProcessQueue(
  syncService: SyncProviderService,
  userId: string,
  refreshOnboardingStatus: () => Promise<void>,
): Promise<SyncProcessResult> {
  await syncService.bootstrap(userId);
  await refreshOnboardingStatus();

  return syncService.processQueue(userId);
}

function getInitialBootstrapStatus(
  authState: AuthState,
  syncService: SyncProviderService | null,
  bootstrapState: BootstrapState,
): InitialSyncBootstrapStatus {
  if (authState.status !== 'authenticated' || !syncService || authState.user.onboardingCompleted) {
    return 'complete';
  }

  return bootstrapState.userId === authState.user.id ? bootstrapState.status : 'syncing';
}

function scheduleRetry(
  retryTimerRef: MutableRefObject<number | null>,
  nextRetryAt: string | null,
  retry: () => void,
): void {
  if (typeof window === 'undefined' || !nextRetryAt) {
    return;
  }

  const delayMs = Math.max(0, Date.parse(nextRetryAt) - Date.now());

  retryTimerRef.current = window.setTimeout(retry, delayMs);
}

function toSyncStatus(error: unknown): SyncIndicatorStatus {
  if (error instanceof SyncServiceError && error.code === 'offline') {
    return 'offline';
  }

  return 'needs_attention';
}

function toInitialBootstrapFailureStatus(
  error: unknown,
): Extract<InitialSyncBootstrapStatus, 'needs_attention' | 'offline'> {
  if (error instanceof SyncServiceError && error.code === 'offline') {
    return 'offline';
  }

  return 'needs_attention';
}