import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../providers/AuthProvider';
import { defaultPwaContextValue, PwaContext, type PwaContextValue } from '../providers/pwaContext';
import { AppShell } from './AppShell';
import i18n from '../../i18n/config';
import type { AuthService, AuthUser } from '../../services/auth';

describe('AppShell', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
  });

  it('renders the authenticated app shell', async () => {
    render(<AppShell />, { wrapper: createAppWrapper() });

    expect(await screen.findByRole('link', { name: 'Hoopjot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Ready for today's reps" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.queryByText('Online')).not.toBeInTheDocument();

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
    const primaryLinks = within(primaryNavigation).getAllByRole('link');

    expect(primaryLinks.map((link) => link.textContent)).toEqual(['Today', 'Plan', 'Journal']);
    expect(primaryLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app',
      '/plan',
      '/journal'
    ]);
  });

  it('shows the connection indicator only for non-online states', async () => {
    render(<AppShell />, {
      wrapper: createAppWrapper({
        ...defaultPwaContextValue,
        connectionStatus: 'offline'
      })
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Offline ready');
  });

  it('can switch the shell language', async () => {
    const user = userEvent.setup();

    render(<AppShell />, { wrapper: createAppWrapper() });
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByText('Listo para las repeticiones de hoy')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });

  it('surfaces a pending app update', async () => {
    const user = userEvent.setup();
    const refreshApp = vi.fn(async () => undefined);

    render(<AppShell />, {
      wrapper: createAppWrapper({
        ...defaultPwaContextValue,
        isUpdateAvailable: true,
        refreshApp
      })
    });

    expect(await screen.findByRole('status', { name: 'App update' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(refreshApp).toHaveBeenCalledOnce();
  });
});

function createAppWrapper(pwaValue: PwaContextValue = defaultPwaContextValue) {
  const authService = createFakeAuthService();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <PwaContext.Provider value={pwaValue}>
          <AuthProvider authService={authService}>{children}</AuthProvider>
        </PwaContext.Provider>
      </MemoryRouter>
    );
  };
}

function createFakeAuthService(): AuthService {
  const user: AuthUser = {
    email: 'player@example.com',
    id: 'player-1',
    onboardingCompleted: true
  };

  return {
    getCurrentUser: vi.fn(async () => user),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => user),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    updatePassword: vi.fn(async () => user)
  };
}
