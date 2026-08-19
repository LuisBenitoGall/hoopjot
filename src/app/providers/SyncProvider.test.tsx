import { render, screen } from '@testing-library/react';

import type { SyncProcessResult } from '../../sync';
import { AuthContext, type AuthContextValue } from './authContext';
import { SyncProvider } from './SyncProvider';
import { useSyncStatus } from './syncContext';

const userId = '11111111-1111-4111-8111-111111111111';

const syncedResult: SyncProcessResult = {
  failedOperation: null,
  nextRetryAt: null,
  pendingOperationCount: 0,
  processedCount: 0
};

describe('SyncProvider', () => {
  it('keeps sync attention visible while retry-backoff operations remain queued', async () => {
    const pendingResult: SyncProcessResult = {
      failedOperation: null,
      nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
      pendingOperationCount: 1,
      processedCount: 0
    };
    const refreshOnboardingStatus = vi.fn(async () => undefined);
    const syncService = {
      bootstrap: vi.fn(async () => undefined),
      processQueue: vi.fn(async () => pendingResult)
    };

    const { unmount } = render(
      <AuthContext.Provider value={authenticatedAuthValue({ refreshOnboardingStatus })}>
        <SyncProvider syncService={syncService}>
          <SyncStatusProbe />
        </SyncProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByLabelText('sync status')).toHaveTextContent('needs_attention');
    expect(screen.getByLabelText('initial bootstrap status')).toHaveTextContent('complete');
    expect(refreshOnboardingStatus).not.toHaveBeenCalled();
    unmount();
  });

  it('refreshes onboarding status after bootstrap before processing the queue', async () => {
    const refreshOnboardingStatus = vi.fn(async () => undefined);
    const calls: string[] = [];
    const syncService = {
      bootstrap: vi.fn(async () => {
        calls.push('bootstrap');
      }),
      processQueue: vi.fn(async () => {
        calls.push('queue');
        return syncedResult;
      })
    };

    const { unmount } = render(
      <AuthContext.Provider
        value={authenticatedAuthValue({ onboardingCompleted: false, refreshOnboardingStatus })}
      >
        <SyncProvider syncService={syncService}>
          <SyncStatusProbe />
        </SyncProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByLabelText('initial bootstrap status')).toHaveTextContent('complete');
    expect(refreshOnboardingStatus).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['bootstrap', 'queue']);
    unmount();
  });

  it('exposes failed initial bootstrap separately from normal queued sync', async () => {
    const syncService = {
      bootstrap: vi.fn(async () => {
        throw new Error('relation "profiles" does not exist');
      }),
      processQueue: vi.fn(async () => syncedResult)
    };

    const { unmount } = render(
      <AuthContext.Provider value={authenticatedAuthValue({ onboardingCompleted: false })}>
        <SyncProvider syncService={syncService}>
          <SyncStatusProbe />
        </SyncProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByLabelText('initial bootstrap status')).toHaveTextContent(
      'needs_attention',
    );
    expect(screen.getByLabelText('sync status')).toHaveTextContent('needs_attention');
    expect(syncService.processQueue).not.toHaveBeenCalled();
    unmount();
  });
});

function SyncStatusProbe() {
  const { initialBootstrapStatus, status } = useSyncStatus();

  return (
    <>
      <output aria-label="sync status">{status}</output>
      <output aria-label="initial bootstrap status">{initialBootstrapStatus}</output>
    </>
  );
}

function authenticatedAuthValue({
  onboardingCompleted = true,
  refreshOnboardingStatus = async () => undefined
}: {
  onboardingCompleted?: boolean;
  refreshOnboardingStatus?: () => Promise<void>;
} = {}): AuthContextValue {
  return {
    error: null,
    refreshOnboardingStatus,
    resetError: () => undefined,
    sendPasswordResetEmail: async () => undefined,
    signIn: async () => undefined,
    signOut: async () => undefined,
    signUp: async () => ({ requiresEmailConfirmation: false, user: null }),
    state: {
      isPasswordRecoverySession: false,
      status: 'authenticated',
      user: {
        email: 'player@example.com',
        id: userId,
        onboardingCompleted
      }
    },
    updatePassword: async () => undefined
  };
}