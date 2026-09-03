import 'fake-indexeddb/auto';

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthContext, type AuthContextValue } from '../../app/providers/authContext';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import type { PlayerProfile } from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb,
  type LocalRepositories,
} from '../../persistence/local';
import type { AuthUser } from '../../services/auth';
import { GuideRoute } from './GuideRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-24T10:00:00.000Z';
const openedDbs: HoopjotLocalDb[] = [];

describe('GuideRoute', () => {
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

    vi.restoreAllMocks();
  });

  it('renders the resolved English Guide for a primary-position profile', async () => {
    const { repositories } = await createGuideFixture({
      profile: makeProfile({ secondaryPosition: undefined }),
    });

    renderGuideRoute('/guide', repositories);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'HOOPJOT — WORK AND HABITS GUIDE',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('30 ideas to help you learn, train and compete better')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'ABOUT THIS GUIDE' })).toBeInTheDocument();
    expect(screen.getAllByTestId('guide-chapter')).toHaveLength(6);
    expect(screen.getAllByTestId('guide-point')).toHaveLength(30);
    expect(screen.getByRole('heading', { level: 2, name: '12 Rules' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'ONE LAST IDEA' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Plan' })).toHaveAttribute('href', '/plan');

    expectNoEditorialMetadata();
    expectPrimaryNavigation(['Today', 'Plan', 'Guide', 'Journal']);
    expect(screen.getByRole('link', { name: 'Guide', current: 'page' })).toHaveAttribute(
      'href',
      '/guide',
    );
  });

  it('renders a hybrid PG and SG Guide without exposing internal bridge keys', async () => {
    const { repositories } = await createGuideFixture({
      profile: makeProfile({
        primaryPosition: 'point_guard',
        secondaryPosition: 'shooting_guard',
      }),
    });

    renderGuideRoute('/guide', repositories);

    expect(await screen.findAllByTestId('guide-point')).toHaveLength(30);
    expect(screen.getByText('YOUR STARTING POINT')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('PG_SG');
    expect(document.body.textContent).not.toContain('SG_PG');
    expectNoEditorialMetadata();
  });

  it('keeps SG as primary while using the same neutral PG_SG bridge without exposing it', async () => {
    const { repositories } = await createGuideFixture({
      profile: makeProfile({
        primaryPosition: 'shooting_guard',
        secondaryPosition: 'point_guard',
      }),
    });

    renderGuideRoute('/guide', repositories);

    expect(await screen.findAllByTestId('guide-point')).toHaveLength(30);
    expect(screen.getByText('YOUR STARTING POINT')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('PG_SG');
    expect(document.body.textContent).not.toContain('SG_PG');
  });

  it('shows a controlled incomplete-profile state when no primary position is available', async () => {
    const { repositories } = await createGuideFixture({ profile: null });

    renderGuideRoute('/guide', repositories);

    expect(await screen.findByRole('heading', { name: 'Add your primary position' })).toBeInTheDocument();
    expect(
      screen.getByText('Guide needs your primary player position to select the right role pack.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile');
    expect(screen.queryByRole('heading', { name: 'HOOPJOT — WORK AND HABITS GUIDE' })).not.toBeInTheDocument();
  });

  it('renders Spanish Guide content from the current app locale without mixing English core copy', async () => {
    await i18n.changeLanguage('es');
    const { repositories } = await createGuideFixture();

    renderGuideRoute('/guide', repositories);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'HOOPJOT — GUÍA DE TRABAJO Y HÁBITOS',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'SOBRE ESTA GUÍA' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '12 reglas' })).toBeInTheDocument();
    expect(screen.queryByText('ABOUT THIS GUIDE')).not.toBeInTheDocument();
    expect(screen.queryByText('Getting better at basketball is not about collecting moves.')).not.toBeInTheDocument();
  });
});

async function createGuideFixture({
  profile = makeProfile(),
}: {
  profile?: PlayerProfile | null;
} = {}): Promise<{ repositories: LocalRepositories }> {
  const db = createHoopjotLocalDb(`hoopjot-guide-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  const repositories = createLocalRepositories(db);

  if (profile) {
    await repositories.profiles.save(profile);
  }

  return { repositories };
}

function renderGuideRoute(initialPath: string, repositories: LocalRepositories) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthContext.Provider value={authenticatedAuthValue()}>
          <Routes>
            <Route element={<GuideRoute />} path="/guide" />
          </Routes>
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
    ...overrides,
  };
}

function authenticatedAuthValue(): AuthContextValue {
  return {
    error: null,
    refreshOnboardingStatus: vi.fn(async () => undefined),
    resetError: vi.fn(),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user: makeAuthUser() })),
    state: {
      isPasswordRecoverySession: false,
      status: 'authenticated',
      user: makeAuthUser(),
    },
    updatePassword: vi.fn(async () => undefined),
  };
}

function makeAuthUser(): AuthUser {
  return {
    email: 'player@example.com',
    id: userId,
    onboardingCompleted: true,
  };
}

function expectPrimaryNavigation(expectedLabels: string[]): void {
  const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
  const primaryLinks = within(primaryNavigation).getAllByRole('link');

  expect(primaryLinks.map((link) => link.textContent)).toEqual(expectedLabels);
}

function expectNoEditorialMetadata(): void {
  const text = document.body.textContent ?? '';

  for (const hiddenText of [
    'INSERT',
    'OVERRIDE',
    'BRIDGE',
    'slotId',
    'filenames',
    'source provenance',
    'Tipo',
    'Type',
    'Estado editorial',
    'Editorial status',
    'Role Purpose',
    'Bridge Purpose',
  ]) {
    expect(text).not.toContain(hiddenText);
  }
}
