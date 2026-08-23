import 'fake-indexeddb/auto';

import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '../../app/providers/AuthProvider';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb,
  type LocalRepositories
} from '../../persistence/local';
import type { AuthService, AuthUser } from '../../services/auth';
import { OnboardingRoute } from './OnboardingRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const authUser: AuthUser = {
  email: 'player@example.com',
  id: userId,
  onboardingCompleted: false
};

const openedDbs: HoopjotLocalDb[] = [];

describe('OnboardingRoute', () => {
  beforeEach(async () => {
    document.documentElement.lang = 'en';
    await i18n.changeLanguage('en');
  });

  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      await resetLocalDatabase(db);
      db.close();
      await db.delete();
    }
  });

  it('completes onboarding with alias, height and physical note omitted', async () => {
    const user = userEvent.setup();
    const { repositories } = renderOnboarding();

    await completeRequiredOnboardingSteps(user);
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await waitFor(async () => {
      const profile = await repositories.profiles.getByUserId(userId);

      expect(profile).toMatchObject({
        alias: undefined,
        birthYear: 2010,
        heightCm: undefined,
        onboardingCompletedAt: expect.any(String),
        physicalContext: undefined,
        primaryPosition: 'point_guard'
      });
    });
    await waitFor(async () => {
      const goals = await repositories.playerGoals.listByUserId(userId);

      expect(goals).toHaveLength(3);
    });
  });

  it('blocks players below the minimum age', async () => {
    const user = userEvent.setup();

    renderOnboarding();

    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Birth year'), '2011');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Hoopjot is for players 16 and older.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create your player profile' })).toBeInTheDocument();
  });

  it('enforces the three-goal limit', async () => {
    const user = userEvent.setup();

    renderOnboarding();
    await advanceToGoals(user);

    await user.click(screen.getByRole('button', { name: 'Fundamentals' }));
    await user.click(screen.getByRole('button', { name: 'Defense' }));
    await user.click(screen.getByRole('button', { name: 'Confidence' }));
    await user.click(screen.getByRole('button', { name: 'Rebounding' }));

    expect(await screen.findByText('Choose no more than three goals.')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 goals selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rebounding' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('switches locale immediately', async () => {
    const user = userEvent.setup();

    renderOnboarding();

    expect(await screen.findByRole('heading', { name: 'Pick your language' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(await screen.findByRole('heading', { name: 'Elige tu idioma' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });

  it('reloads saved onboarding progress from IndexedDB', async () => {
    const user = userEvent.setup();
    const { repositories, view } = renderOnboarding();

    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Birth year'), '2010');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { name: 'Where do you play?' })).toBeInTheDocument();

    await waitFor(async () => {
      const draft = await repositories.onboardingDrafts.getByUserId(userId);

      expect(draft).toMatchObject({
        birthYear: 2010,
        currentStep: 'experience'
      });
    });

    view.unmount();
    renderOnboarding(repositories);

    expect(await screen.findByRole('heading', { name: 'Where do you play?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Birth year')).toHaveValue(2010);
  });
});

async function completeRequiredOnboardingSteps(user: ReturnType<typeof userEvent.setup>) {
  await advanceToGoals(user);
  await user.click(screen.getByRole('button', { name: 'Fundamentals' }));
  await user.click(screen.getByRole('button', { name: 'Defense' }));
  await user.click(screen.getByRole('button', { name: 'Confidence' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('heading', { name: 'Set your baseline' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('heading', { name: 'Add physical context' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('heading', { name: 'Ready to start' })).toBeInTheDocument();
}

async function advanceToGoals(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Continue' }));
  await user.type(screen.getByLabelText('Birth year'), '2010');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.selectOptions(screen.getByLabelText('Primary position'), 'point_guard');
  await user.selectOptions(screen.getByLabelText('Competitive level'), 'club');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('heading', { name: 'Choose your goals' })).toBeInTheDocument();
}

function renderOnboarding(existingRepositories?: LocalRepositories): {
  repositories: LocalRepositories;
  view: RenderResult;
} {
  const repositories = existingRepositories ?? makeRepositories();
  const view = render(
    <LocalRepositoriesProvider repositories={repositories}>
      <AuthProvider authService={createFakeAuthService()} playerProfileRepository={repositories.profiles}>
        <MemoryRouter initialEntries={['/onboarding']}>
          <OnboardingRoute />
        </MemoryRouter>
      </AuthProvider>
    </LocalRepositoriesProvider>,
  );

  return { repositories, view };
}

function makeRepositories(): LocalRepositories {
  const db = createHoopjotLocalDb(`hoopjot-onboarding-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  return createLocalRepositories(db);
}

function createFakeAuthService(): AuthService {
  return {
    getCurrentUser: vi.fn(async () => authUser),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => authUser),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user: authUser })),
    updatePassword: vi.fn(async () => authUser)
  };
}
