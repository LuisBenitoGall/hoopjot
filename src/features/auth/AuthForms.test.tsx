import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../../app/providers/AuthProvider';
import {
  AuthServiceError,
  type AuthService,
  type AuthUser
} from '../../services/auth';
import i18n from '../../i18n/config';
import { AuthForm } from './AuthForms';

describe('AuthForm', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
  });

  it('shows a clear offline error for sign in', async () => {
    const user = userEvent.setup();
    const authService = createFakeAuthService({
      signIn: vi.fn(async () => {
        throw new AuthServiceError(
          'network_unavailable',
          'A network connection is required for this authentication action.',
        );
      })
    });

    render(<AuthForm mode="signIn" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('Email'), 'player@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('A network connection is required for this auth action.'),
    ).toBeInTheDocument();
    expect(authService.signIn).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'password123'
    });
  });

  it('submits a new password for a recovery session', async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn(async () => ({
      email: 'player@example.com',
      id: 'player-1',
      onboardingCompleted: true
    }));
    const authService = createFakeAuthService({ updatePassword });

    render(<AuthForm mode="updatePassword" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(updatePassword).toHaveBeenCalledWith('password123');
  });
});

function createAuthWrapper(authService: AuthService) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider authService={authService}>{children}</AuthProvider>
      </MemoryRouter>
    );
  };
}

function createFakeAuthService(overrides: Partial<AuthService> = {}): AuthService {
  const user: AuthUser = {
    email: 'player@example.com',
    id: 'player-1',
    onboardingCompleted: true
  };

  return {
    getCurrentUser: vi.fn(async () => null),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => user),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    updatePassword: vi.fn(async () => user),
    ...overrides
  };
}
