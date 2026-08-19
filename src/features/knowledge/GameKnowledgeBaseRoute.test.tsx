import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom';

import { AuthProvider } from '../../app/providers/AuthProvider';
import i18n from '../../i18n/config';
import type { AuthService, AuthUser } from '../../services/auth';
import {
  GameKnowledgeBaseRoute,
  GuidelineDetailRoute
} from './GameKnowledgeBaseRoute';

describe('GameKnowledgeBaseRoute', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
  });

  it('browses and filters starter guidelines by category and subcategory', async () => {
    const user = userEvent.setup();

    render(<GameKnowledgeBaseRoute />, { wrapper: createRouteWrapper() });

    expect(
      await screen.findByRole('heading', { name: 'Basketball knowledge base' }),
    ).toBeInTheDocument();
    expect(screen.getByText('12 guidelines')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Defense' }));
    await user.selectOptions(screen.getByLabelText('Subcategory'), 'rebounding');

    expect(
      screen.getByRole('link', { name: 'Open guideline: Find your player first' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open guideline: Run first' }),
    ).not.toBeInTheDocument();
  });

  it('renders a guideline detail screen from a stable content id', async () => {
    render(
      <MemoryRouter initialEntries={['/game/def.rebound.find-player-first']}>
        <AuthProvider authService={createFakeAuthService()}>
          <Routes>
            <Route element={<GuidelineDetailRoute />} path="/game/:guidelineId" />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Find your player first' })).toBeInTheDocument();
    expect(screen.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeInTheDocument();
  });
});

function createRouteWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider authService={createFakeAuthService()}>{children}</AuthProvider>
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
