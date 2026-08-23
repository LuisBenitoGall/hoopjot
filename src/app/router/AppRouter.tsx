import { lazy, Suspense, useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';

import { CookieConsentProvider } from '../CookieConsent';
import { AuthProvider } from '../providers/AuthProvider';
import { AppErrorBoundary } from '../providers/AppErrorBoundary';
import { LocalRepositoriesProvider } from '../providers/LocalRepositoriesProvider';
import { PwaProvider } from '../providers/PwaProvider';
import { SyncProvider } from '../providers/SyncProvider';
import { createBrowserLocalServices } from '../providers/browserLocalServices';
import {
  AuthLoadingRoute,
  DefaultRoute,
  PublicAuthRoute,
  RequireAuthenticatedApp,
  RequireOnboardingState
} from './authGuards';
import type { LocalRepositories } from '../../persistence/local';
import type { AuthService } from '../../services/auth';
import type { SyncService } from '../../sync';

const WelcomeRoute = lazy(() =>
  import('../../features/auth/AuthRoutes').then(({ WelcomeRoute }) => ({ default: WelcomeRoute })),
);
const SignInRoute = lazy(() =>
  import('../../features/auth/AuthRoutes').then(({ SignInRoute }) => ({ default: SignInRoute })),
);
const SignUpRoute = lazy(() =>
  import('../../features/auth/AuthRoutes').then(({ SignUpRoute }) => ({ default: SignUpRoute })),
);
const RecoveryRoute = lazy(() =>
  import('../../features/auth/AuthRoutes').then(({ RecoveryRoute }) => ({ default: RecoveryRoute })),
);
const LegalIndexRoute = lazy(() =>
  import('../../features/auth/LegalRoutes').then(({ LegalIndexRoute }) => ({
    default: LegalIndexRoute
  })),
);
const LegalNoticeRoute = lazy(() =>
  import('../../features/auth/LegalRoutes').then(({ LegalNoticeRoute }) => ({
    default: LegalNoticeRoute
  })),
);
const PrivacyPolicyRoute = lazy(() =>
  import('../../features/auth/LegalRoutes').then(({ PrivacyPolicyRoute }) => ({
    default: PrivacyPolicyRoute
  })),
);
const CookiePolicyRoute = lazy(() =>
  import('../../features/auth/LegalRoutes').then(({ CookiePolicyRoute }) => ({
    default: CookiePolicyRoute
  })),
);
const TermsRoute = lazy(() =>
  import('../../features/auth/LegalRoutes').then(({ TermsRoute }) => ({ default: TermsRoute })),
);
const OnboardingRoute = lazy(() =>
  import('../../features/onboarding/OnboardingRoute').then(({ OnboardingRoute }) => ({
    default: OnboardingRoute
  })),
);
const TodayRoute = lazy(() =>
  import('../../features/today/TodayRoute').then(({ TodayRoute }) => ({ default: TodayRoute })),
);
const PlanRoute = lazy(() =>
  import('../../features/plan/PlanRoute').then(({ PlanRoute }) => ({
    default: PlanRoute
  })),
);
const JournalRoute = lazy(() =>
  import('../../features/journal/JournalRoutes').then(({ JournalRoute }) => ({
    default: JournalRoute
  })),
);
const SessionDetailRoute = lazy(() =>
  import('../../features/journal/JournalRoutes').then(({ SessionDetailRoute }) => ({
    default: SessionDetailRoute
  })),
);
const ProfileRoute = lazy(() =>
  import('../../features/profile/ProfileRoute').then(({ ProfileRoute }) => ({
    default: ProfileRoute
  })),
);
const SmokeRoute = lazy(() =>
  import('../shell/SmokeRoute').then(({ SmokeRoute }) => ({ default: SmokeRoute })),
);

function LegacyGuidelineRedirect() {
  const { guidelineId } = useParams();

  return <Navigate replace to={`/plan/${guidelineId ?? ''}`} />;
}

function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: (
        <DefaultRoute>
          <WelcomeRoute />
        </DefaultRoute>
      )
    },
    {
      path: '/sign-in',
      element: (
        <PublicAuthRoute>
          <SignInRoute />
        </PublicAuthRoute>
      )
    },
    {
      path: '/sign-up',
      element: (
        <PublicAuthRoute>
          <SignUpRoute />
        </PublicAuthRoute>
      )
    },
    {
      path: '/recovery',
      element: (
        <PublicAuthRoute allowPasswordRecoverySession>
          <RecoveryRoute />
        </PublicAuthRoute>
      )
    },
    {
      path: '/legal',
      element: <LegalIndexRoute />
    },
    {
      path: '/legal/notice',
      element: <LegalNoticeRoute />
    },
    {
      path: '/legal/privacy',
      element: <PrivacyPolicyRoute />
    },
    {
      path: '/legal/cookies',
      element: <CookiePolicyRoute />
    },
    {
      path: '/legal/terms',
      element: <TermsRoute />
    },
    {
      path: '/privacy',
      element: <PrivacyPolicyRoute />
    },
    {
      path: '/cookies',
      element: <CookiePolicyRoute />
    },
    {
      path: '/terms',
      element: <TermsRoute />
    },
    {
      path: '/legal-notice',
      element: <LegalNoticeRoute />
    },
    {
      path: '/onboarding',
      element: (
        <RequireOnboardingState>
          <OnboardingRoute />
        </RequireOnboardingState>
      )
    },
    {
      path: '/app',
      element: (
        <RequireAuthenticatedApp>
          <TodayRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/game',
      element: <Navigate replace to="/plan" />
    },
    {
      path: '/game/:guidelineId',
      element: <LegacyGuidelineRedirect />
    },
    {
      path: '/plan',
      element: (
        <RequireAuthenticatedApp>
          <PlanRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/plan/:guidelineId',
      element: (
        <RequireAuthenticatedApp>
          <PlanRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/journal',
      element: (
        <RequireAuthenticatedApp>
          <JournalRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/journal/:sessionId',
      element: (
        <RequireAuthenticatedApp>
          <SessionDetailRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/progress',
      element: <Navigate replace to="/journal" />
    },
    {
      path: '/profile',
      element: (
        <RequireAuthenticatedApp>
          <ProfileRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/smoke',
      element: <SmokeRoute />
    }
  ]);
}

interface AppRouterProps {
  authService?: AuthService;
  repositories?: LocalRepositories;
  syncService?: SyncService | null;
}

export function AppRouter({
  authService,
  repositories: injectedRepositories,
  syncService: injectedSyncService
}: AppRouterProps) {
  const router = useMemo(() => createAppRouter(), []);
  const localServices = useMemo(
    () =>
      injectedRepositories
        ? { repositories: injectedRepositories, syncService: injectedSyncService ?? null }
        : createBrowserLocalServices(),
    [injectedRepositories, injectedSyncService],
  );
  const { repositories, syncService } = localServices;

  return (
    <AppErrorBoundary>
      <LocalRepositoriesProvider repositories={repositories}>
        <PwaProvider>
          <AuthProvider authService={authService} playerProfileRepository={repositories.profiles}>
            <SyncProvider syncService={syncService}>
              <CookieConsentProvider>
                <Suspense fallback={<AuthLoadingRoute />}>
                  <RouterProvider router={router} />
                </Suspense>
              </CookieConsentProvider>
            </SyncProvider>
          </AuthProvider>
        </PwaProvider>
      </LocalRepositoriesProvider>
    </AppErrorBoundary>
  );
}
