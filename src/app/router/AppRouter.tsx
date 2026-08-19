import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from '../providers/AuthProvider';
import { AppErrorBoundary } from '../providers/AppErrorBoundary';
import { LocalRepositoriesProvider } from '../providers/LocalRepositoriesProvider';
import { PwaProvider } from '../providers/PwaProvider';
import { SyncProvider } from '../providers/SyncProvider';
import { createBrowserLocalServices } from '../providers/browserLocalServices';
import {
  DefaultRoute,
  PublicAuthRoute,
  RequireAuthenticatedApp,
  RequireOnboardingState
} from './authGuards';
import { SmokeRoute } from '../shell/SmokeRoute';
import {
  RecoveryRoute,
  SignInRoute,
  SignUpRoute,
  WelcomeRoute
} from '../../features/auth/AuthRoutes';
import {
  GameKnowledgeBaseRoute,
  GuidelineDetailRoute
} from '../../features/knowledge/GameKnowledgeBaseRoute';
import {
  JournalRoute,
  SessionDetailRoute
} from '../../features/journal/JournalRoutes';
import { OnboardingRoute } from '../../features/onboarding/OnboardingRoute';
import { ProfileRoute } from '../../features/profile/ProfileRoute';
import { ProgressRoute } from '../../features/progress/ProgressRoute';
import { TodayRoute } from '../../features/today/TodayRoute';
import type { LocalRepositories } from '../../persistence/local';
import type { AuthService } from '../../services/auth';
import type { SyncService } from '../../sync';

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
      element: (
        <RequireAuthenticatedApp>
          <GameKnowledgeBaseRoute />
        </RequireAuthenticatedApp>
      )
    },
    {
      path: '/game/:guidelineId',
      element: (
        <RequireAuthenticatedApp>
          <GuidelineDetailRoute />
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
      element: (
        <RequireAuthenticatedApp>
          <ProgressRoute />
        </RequireAuthenticatedApp>
      )
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
              <RouterProvider router={router} />
            </SyncProvider>
          </AuthProvider>
        </PwaProvider>
      </LocalRepositoriesProvider>
    </AppErrorBoundary>
  );
}
