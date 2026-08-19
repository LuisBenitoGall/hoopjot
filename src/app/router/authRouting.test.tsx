import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../providers/AuthProvider';
import { SyncContext, defaultSyncContextValue, type SyncContextValue } from '../providers/syncContext';
import {
  PublicAuthRoute,
  RequireAuthenticatedApp,
  RequireOnboardingState
} from './authGuards';
import {
  RecoveryRoute,
  SignInRoute
} from '../../features/auth/AuthRoutes';
import i18n from '../../i18n/config';
import type { AuthService, AuthUser } from '../../services/auth';

describe('auth routing', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
  });

  it('redirects unauthenticated app routes to sign in', async () => {
    renderAuthRoutes(createFakeAuthService(null), '/app');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('routes authenticated users without onboarding to onboarding after bootstrap completes', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(false)), '/app');

    expect(await screen.findByText('Onboarding gate')).toBeInTheDocument();
  });

  it('waits for initial remote bootstrap before sending an authenticated user to onboarding', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(false)), '/app', {
      initialBootstrapStatus: 'syncing'
    });

    expect(await screen.findByText('Checking session')).toBeInTheDocument();
    expect(screen.queryByText('Onboarding gate')).not.toBeInTheDocument();
  });

  it('shows sync attention instead of repeating onboarding when profile bootstrap fails', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(false)), '/app', {
      initialBootstrapStatus: 'needs_attention'
    });

    expect(
      await screen.findByRole('heading', { name: 'Profile sync unavailable' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Onboarding gate')).not.toBeInTheDocument();
  });

  it('allows authenticated onboarded users to reach the app shell', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(true)), '/app');

    expect(await screen.findByText('Authenticated app')).toBeInTheDocument();
  });

  it('keeps recovery available to authenticated recovery sessions', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(false)), '/recovery?type=recovery');

    expect(await screen.findByRole('heading', { name: 'Create a new password' })).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  it('redirects normal authenticated recovery visits back to onboarding state', async () => {
    renderAuthRoutes(createFakeAuthService(createUser(false)), '/recovery');

    expect(await screen.findByText('Onboarding gate')).toBeInTheDocument();
  });
});

function renderAuthRoutes(
  authService: AuthService,
  initialPath: string,
  syncOverrides: Partial<SyncContextValue> = {},
) {
  window.history.pushState({}, '', initialPath);

  return render(
    <AuthProvider authService={authService}>
      <SyncContext.Provider value={{ ...defaultSyncContextValue, ...syncOverrides }}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              element={
                <RequireAuthenticatedApp>
                  <p>Authenticated app</p>
                </RequireAuthenticatedApp>
              }
              path="/app"
            />
            <Route
              element={
                <RequireOnboardingState>
                  <p>Onboarding gate</p>
                </RequireOnboardingState>
              }
              path="/onboarding"
            />
            <Route
              element={
                <PublicAuthRoute allowPasswordRecoverySession>
                  <RecoveryRoute />
                </PublicAuthRoute>
              }
              path="/recovery"
            />
            <Route element={<SignInRoute />} path="/sign-in" />
          </Routes>
        </MemoryRouter>
      </SyncContext.Provider>
    </AuthProvider>,
  );
}

function createUser(onboardingCompleted: boolean): AuthUser {
  return {
    email: 'player@example.com',
    id: 'player-1',
    onboardingCompleted
  };
}

function createFakeAuthService(user: AuthUser | null): AuthService {
  return {
    getCurrentUser: vi.fn(async () => user),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => {
      if (!user) {
        throw new Error('No user configured.');
      }

      return user;
    }),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    updatePassword: vi.fn(async () => {
      if (!user) {
        throw new Error('No user configured.');
      }

      return user;
    })
  };
}