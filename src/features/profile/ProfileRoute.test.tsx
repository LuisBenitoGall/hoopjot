import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ProfileService } from '../../application/profile';
import { AuthProvider } from '../../app/providers/AuthProvider';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import { SyncContext } from '../../app/providers/syncContext';
import type { PlayerProfile } from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopnoteLocalDb,
  type LocalRepositories
} from '../../persistence/local';
import type { AuthService, AuthUser } from '../../services/auth';
import { ProfileRoute } from './ProfileRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T16:00:00.000Z';
const updatedAt = '2026-08-19T10:00:00.000Z';
const openedDbs: HoopnoteLocalDb[] = [];

describe('ProfileRoute', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
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
    const user = userEvent.setup();
    const { repositories } = await createProfileFixture();
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
    expect((await repositories.syncQueue.list()).filter((operation) => operation.entityType === 'profiles')).toHaveLength(2);
    expect(retryNow).toHaveBeenCalledOnce();
  });

  it('keeps the previous profile when edits fail validation', async () => {
    const user = userEvent.setup();
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

async function createProfileFixture(): Promise<{
  repositories: LocalRepositories;
}> {
  const db = createHoopnoteLocalDb(`hoopnote-profile-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  const repositories = createLocalRepositories(db);
  await repositories.profiles.save(makeProfile());

  return { repositories };
}

function renderProfileRoute(
  repositories: LocalRepositories,
  retryNow = vi.fn(async () => undefined),
) {
  const service = new ProfileService({
    now: () => new Date(updatedAt),
    profileRepository: repositories.profiles
  });

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthProvider
          authService={createFakeAuthService()}
          playerProfileRepository={repositories.profiles}
        >
          <SyncContext.Provider value={{ initialBootstrapStatus: 'complete', retryNow, status: 'synced' }}>
            <Routes>
              <Route element={<ProfileRoute service={service} />} path="/profile" />
            </Routes>
          </SyncContext.Provider>
        </AuthProvider>
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

function createFakeAuthService(): AuthService {
  const user: AuthUser = {
    email: 'player@example.com',
    id: userId,
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
