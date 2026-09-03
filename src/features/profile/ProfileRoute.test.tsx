import 'fake-indexeddb/auto';

import { render, screen, within } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ProfileService } from '../../application/profile';
import { AuthContext, type AuthContextValue } from '../../app/providers/authContext';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import { SyncContext } from '../../app/providers/syncContext';
import type { PlayerProfile } from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb,
  type LocalRepositories
} from '../../persistence/local';
import type { AuthUser } from '../../services/auth';
import { ProfileRoute } from './ProfileRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T16:00:00.000Z';
const updatedAt = '2026-08-19T10:00:00.000Z';
const openedDbs: HoopjotLocalDb[] = [];

describe('ProfileRoute', () => {
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

  it('opens the saved profile and persists local profile edits', async () => {
    const user = setupUser();
    const { db, repositories } = await createProfileFixture();
    const retryNow = vi.fn(async () => undefined);

    renderProfileRoute(repositories, retryNow);

    expect(await screen.findByLabelText('Alias')).toHaveValue('Wing');
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Alias'));
    await user.type(screen.getByLabelText('Alias'), 'LeadGuard');
    await user.clear(screen.getByLabelText('Height in cm'));
    await user.type(screen.getByLabelText('Height in cm'), '188');
    await user.selectOptions(screen.getByLabelText('Primary position'), 'shooting_guard');
    await user.selectOptions(screen.getByLabelText('Dominant hand'), 'left');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Saved locally')).toBeInTheDocument();

    const savedProfile = await repositories.profiles.getByUserId(userId);
    expect(savedProfile).toMatchObject({
      alias: 'LeadGuard',
      dominantHand: 'left',
      heightCm: 188,
      primaryPosition: 'shooting_guard',
      updatedAt
    });
    expect(await db.profiles.toArray()).toHaveLength(1);
    expect((await repositories.syncQueue.list()).filter((operation) => operation.entityType === 'profiles')).toHaveLength(2);
    expect(retryNow).toHaveBeenCalledOnce();
  });

  it('keeps Profile as secondary configuration without dashboard content', async () => {
    const { repositories } = await createProfileFixture();

    renderProfileRoute(repositories);

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Alias')).toHaveValue('Wing');
    expect(screen.getByLabelText('Birth year')).toHaveValue(2004);
    expect(screen.getByLabelText('Primary position')).toHaveValue('point_guard');
    expect(screen.getByLabelText('Competitive level')).toHaveValue('club');
    expect(screen.getByLabelText('App language')).toHaveValue('en');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(within(header).queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
    const primaryLinks = within(primaryNavigation).getAllByRole('link');

    expect(primaryLinks.map((link) => link.textContent)).toEqual([
      'Today',
      'Plan',
      'Guide',
      'Journal',
    ]);
    expect(within(primaryNavigation).queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly review')).not.toBeInTheDocument();
    expect(screen.queryByText('Progress signals')).not.toBeInTheDocument();
    expect(screen.queryByText('Focus rating')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommendation score')).not.toBeInTheDocument();
  });

  it('keeps language selection and logout inside Profile', async () => {
    const user = setupUser();
    const signOut = vi.fn(async () => undefined);
    const { repositories } = await createProfileFixture();

    renderProfileRoute(repositories, vi.fn(async () => undefined), authenticatedAuthValue({ signOut }));

    await user.selectOptions(await screen.findByLabelText('App language'), 'es');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(await repositories.profiles.getByUserId(userId)).toMatchObject({ locale: 'es' });

    await user.selectOptions(screen.getByLabelText('Idioma de la app'), 'en');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(await repositories.profiles.getByUserId(userId)).toMatchObject({ locale: 'en' });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledOnce();
  });

  it('keeps the previous profile when edits fail validation', async () => {
    const user = setupUser();
    const { repositories } = await createProfileFixture();

    renderProfileRoute(repositories);

    expect(await screen.findByLabelText('Birth year')).toHaveValue(2004);

    await user.clear(screen.getByLabelText('Birth year'));
    await user.type(screen.getByLabelText('Birth year'), '2015');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('Hoopjot is for players 16 and older.')).toBeInTheDocument();
    expect(await repositories.profiles.getByUserId(userId)).toMatchObject({
      birthYear: 2004,
      updatedAt: timestamp
    });
  });
});

function setupUser(): ReturnType<typeof userEvent.setup> {
  return userEvent.setup({
    delay: null,
    pointerEventsCheck: PointerEventsCheckLevel.Never,
    skipHover: true
  });
}

async function createProfileFixture(): Promise<{
  db: HoopjotLocalDb;
  repositories: LocalRepositories;
}> {
  const db = createHoopjotLocalDb(`hoopjot-profile-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  const repositories = createLocalRepositories(db);
  await repositories.profiles.save(makeProfile());

  return { db, repositories };
}

function renderProfileRoute(
  repositories: LocalRepositories,
  retryNow = vi.fn(async () => undefined),
  authValue = authenticatedAuthValue(),
) {
  const service = new ProfileService({
    now: () => new Date(updatedAt),
    profileRepository: repositories.profiles
  });

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthContext.Provider value={authValue}>
          <SyncContext.Provider value={{ initialBootstrapStatus: 'complete', retryNow, status: 'synced' }}>
            <Routes>
              <Route element={<ProfileRoute service={service} />} path="/profile" />
            </Routes>
          </SyncContext.Provider>
        </AuthContext.Provider>
      </LocalRepositoriesProvider>
    </MemoryRouter>,
  );
}

function makeProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    userId,
    alias: 'Wing',
    birthYear: 2004,
    heightCm: 182,
    dominantHand: 'right',
    primaryPosition: 'point_guard',
    secondaryPosition: 'shooting_guard',
    experienceYears: 6,
    competitiveLevel: 'club',
    weeklyPractices: 3,
    weeklyGames: 1,
    locale: 'en',
    physicalContext: { status: 'none' },
    onboardingCompletedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function authenticatedAuthValue({
  signOut = vi.fn(async () => undefined)
}: {
  signOut?: AuthContextValue['signOut'];
} = {}): AuthContextValue {
  const user: AuthUser = {
    email: 'player@example.com',
    id: userId,
    onboardingCompleted: true
  };

  return {
    error: null,
    refreshOnboardingStatus: vi.fn(async () => undefined),
    resetError: vi.fn(),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signOut,
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    state: {
      isPasswordRecoverySession: false,
      status: 'authenticated',
      user
    },
    updatePassword: vi.fn(async () => undefined)
  };
}
