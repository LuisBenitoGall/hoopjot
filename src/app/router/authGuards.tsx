import { RefreshCcw } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type ReactNode } from 'react';

import type { InitialSyncBootstrapStatus } from '../../sync';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../providers/authContext';
import { useSyncStatus } from '../providers/syncContext';

export function AuthLoadingRoute() {
  const { t } = useTranslation('common');

  return (
    <main className="court-background flex min-h-screen items-center justify-center px-5 text-hoopnote-ink">
      <Card className="w-full max-w-sm text-center">
        <p className="text-sm font-black">{t('auth.loading')}</p>
      </Card>
    </main>
  );
}

export function DefaultRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { initialBootstrapStatus } = useSyncStatus();

  if (state.status === 'loading') {
    return <AuthLoadingRoute />;
  }

  if (state.status === 'authenticated') {
    const bootstrapGate = getOnboardingBootstrapGate(
      state.user.onboardingCompleted,
      initialBootstrapStatus,
    );

    if (bootstrapGate) {
      return bootstrapGate;
    }

    return <Navigate replace to={state.user.onboardingCompleted ? '/app' : '/onboarding'} />;
  }

  return children;
}

interface PublicAuthRouteProps {
  allowPasswordRecoverySession?: boolean;
  children: ReactNode;
}

export function PublicAuthRoute({
  allowPasswordRecoverySession = false,
  children
}: PublicAuthRouteProps) {
  const { state } = useAuth();
  const { initialBootstrapStatus } = useSyncStatus();

  if (state.status === 'loading') {
    return <AuthLoadingRoute />;
  }

  if (
    state.status === 'authenticated' &&
    !(allowPasswordRecoverySession && state.isPasswordRecoverySession)
  ) {
    const bootstrapGate = getOnboardingBootstrapGate(
      state.user.onboardingCompleted,
      initialBootstrapStatus,
    );

    if (bootstrapGate) {
      return bootstrapGate;
    }

    return <Navigate replace to={state.user.onboardingCompleted ? '/app' : '/onboarding'} />;
  }

  return children;
}

export function RequireAuthenticatedApp({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { state } = useAuth();
  const { initialBootstrapStatus } = useSyncStatus();

  if (state.status === 'loading') {
    return <AuthLoadingRoute />;
  }

  if (state.status !== 'authenticated') {
    return <Navigate replace state={{ from: location.pathname }} to="/sign-in" />;
  }

  const bootstrapGate = getOnboardingBootstrapGate(
    state.user.onboardingCompleted,
    initialBootstrapStatus,
  );

  if (bootstrapGate) {
    return bootstrapGate;
  }

  if (!state.user.onboardingCompleted) {
    return <Navigate replace to="/onboarding" />;
  }

  return children;
}

export function RequireOnboardingState({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const { initialBootstrapStatus } = useSyncStatus();

  if (state.status === 'loading') {
    return <AuthLoadingRoute />;
  }

  if (state.status !== 'authenticated') {
    return <Navigate replace to="/sign-in" />;
  }

  if (state.user.onboardingCompleted) {
    return <Navigate replace to="/app" />;
  }

  const bootstrapGate = getOnboardingBootstrapGate(
    state.user.onboardingCompleted,
    initialBootstrapStatus,
  );

  if (bootstrapGate) {
    return bootstrapGate;
  }

  return children;
}

function getOnboardingBootstrapGate(
  onboardingCompleted: boolean,
  initialBootstrapStatus: InitialSyncBootstrapStatus,
): ReactNode | null {
  if (onboardingCompleted || initialBootstrapStatus === 'complete') {
    return null;
  }

  if (initialBootstrapStatus === 'idle' || initialBootstrapStatus === 'syncing') {
    return <AuthLoadingRoute />;
  }

  return <AuthBootstrapBlockedRoute status={initialBootstrapStatus} />;
}

function AuthBootstrapBlockedRoute({
  status
}: {
  status: Extract<InitialSyncBootstrapStatus, 'needs_attention' | 'offline'>;
}) {
  const { retryNow } = useSyncStatus();
  const { t } = useTranslation('common');
  const isOffline = status === 'offline';

  return (
    <main className="court-background flex min-h-screen items-center justify-center px-5 text-hoopnote-ink">
      <Card className="w-full max-w-sm space-y-4 text-left">
        <p className="text-sm font-bold text-hoopnote-purple">{t('sync.bootstrap.eyebrow')}</p>
        <div className="space-y-2">
          <h1 className="text-2xl font-black leading-tight">
            {t(
              isOffline
                ? 'sync.bootstrap.offlineTitle'
                : 'sync.bootstrap.needsAttentionTitle',
            )}
          </h1>
          <p className="text-sm leading-6 text-hoopnote-muted">
            {t(
              isOffline
                ? 'sync.bootstrap.offlineDescription'
                : 'sync.bootstrap.needsAttentionDescription',
            )}
          </p>
        </div>
        <Button
          className="w-full"
          icon={<RefreshCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            void retryNow();
          }}
        >
          {t('sync.bootstrap.retry')}
        </Button>
      </Card>
    </main>
  );
}