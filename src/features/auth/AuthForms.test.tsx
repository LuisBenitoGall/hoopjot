import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../../app/providers/AuthProvider';
import { AuthServiceError, type AuthService, type AuthUser } from '../../services/auth';
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
      }),
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
      password: 'password123',
    });
  });

  it('submits a new password for a recovery session', async () => {
    const user = userEvent.setup();
    const updatePassword = vi.fn(async () => ({
      email: 'player@example.com',
      id: 'player-1',
      onboardingCompleted: true,
    }));
    const authService = createFakeAuthService({ updatePassword });

    render(<AuthForm mode="updatePassword" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(updatePassword).toHaveBeenCalledWith('password123');
  });

  it('shows a rate-limit message when recovery email sending is throttled', async () => {
    const user = userEvent.setup();
    const authService = createFakeAuthService({
      sendPasswordResetEmail: vi.fn(async () => {
        throw new AuthServiceError('rate_limited', 'email rate limit exceeded');
      }),
    });

    render(<AuthForm mode="recovery" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('Email'), 'player@example.com');
    await user.click(screen.getByRole('button', { name: 'Send recovery email' }));

    expect(
      await screen.findByText(
        'Too many auth emails were requested. Wait about an hour, or configure custom SMTP in the Supabase dashboard.',
      ),
    ).toBeInTheDocument();
    expect(authService.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'player@example.com',
    });
  });

  it('shows email, password, and password confirmation on signup only', () => {
    render(<AuthForm mode="signUp" />, { wrapper: createAuthWrapper(createFakeAuthService()) });

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('does not show password confirmation on sign in or recovery', () => {
    const { unmount } = render(<AuthForm mode="signIn" />, {
      wrapper: createAuthWrapper(createFakeAuthService()),
    });

    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
    unmount();

    render(<AuthForm mode="recovery" />, {
      wrapper: createAuthWrapper(createFakeAuthService()),
    });
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
  });

  it('requires matching passwords on signup and logs the user in without a check-email step', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn(async () => ({
      requiresEmailConfirmation: false,
      user: {
        email: 'player@example.com',
        id: 'player-1',
        onboardingCompleted: false,
      },
    }));
    const authService = createFakeAuthService({ signUp });

    render(<AuthForm mode="signUp" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('Email'), 'player@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(signUp).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'password123',
    });
    expect(screen.queryByText('Check your email to confirm your account.')).not.toBeInTheDocument();
  });

  it('does not submit signup when the password confirmation does not match', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn(async () => ({
      requiresEmailConfirmation: false,
      user: {
        email: 'player@example.com',
        id: 'player-1',
        onboardingCompleted: false,
      },
    }));
    const authService = createFakeAuthService({ signUp });

    render(<AuthForm mode="signUp" />, { wrapper: createAuthWrapper(authService) });

    await user.type(screen.getByLabelText('Email'), 'player@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
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
    onboardingCompleted: true,
  };

  return {
    getCurrentUser: vi.fn(async () => null),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => user),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    updatePassword: vi.fn(async () => user),
    ...overrides,
  };
}
