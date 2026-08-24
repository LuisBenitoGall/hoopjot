import 'fake-indexeddb/auto';

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../../app/providers/AuthProvider';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import {
  parseDailyFocus,
  parsePlayerGoal,
  type DailyFocus,
  type GoalPriority,
  type GoalType,
  type PlayerGoal,
  type PlayerProfile,
} from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb,
  type LocalRepositories,
} from '../../persistence/local';
import type { AuthService, AuthUser } from '../../services/auth';
import { PlanRoute } from './PlanRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-24T10:00:00.000Z';
const today = '2026-08-24';
const openedDbs: HoopjotLocalDb[] = [];

describe('PlanRoute', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
    mockMatchMedia(false);
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

  it('renders the complete English Plan manual with section order and current focus marker', async () => {
    const { repositories } = await createPlanFixture({
      currentFocus: makeDailyFocus({ guidelineId: 'def.rebound.find-player-first' }),
      goals: [
        makeGoal({
          goalType: 'fundamentals',
          id: '33333333-3333-4333-8333-333333333331',
          priority: 1,
        }),
        makeGoal({ goalType: 'defense', id: '33333333-3333-4333-8333-333333333332', priority: 2 }),
        makeGoal({
          goalType: 'confidence',
          id: '33333333-3333-4333-8333-333333333333',
          priority: 3,
        }),
      ],
      profile: makeProfile({ alias: 'Ace' }),
    });

    renderPlanRoute('/plan', repositories);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your game plan' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'This is your development plan, Ace. It is not meant to be worked on all at once. It brings together decisions and habits that should become a natural part of your game. Hoopjot will take one idea at a time into practices and games. What you record afterwards will help decide what to keep, reinforce or revisit.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('Your starting point')).toBeInTheDocument();
    expect(screen.getByText('Point guard')).toBeInTheDocument();
    expect(screen.getByText('Shooting guard')).toBeInTheDocument();
    expect(screen.getByText('182 cm')).toBeInTheDocument();
    expect(screen.getByText('Club')).toBeInTheDocument();
    expect(screen.getByText('Fundamentals')).toBeInTheDocument();

    const map = await screen.findByTestId('development-map');
    const sectionHeadings = within(map)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);

    expect(sectionHeadings).toEqual([
      'Attack',
      'Defense',
      'Transition',
      'Communication & decisions',
      'Habits & attention',
    ]);
    expect(within(map).getAllByRole('heading', { level: 3, name: 'On ball' })).toHaveLength(2);
    expect(within(map).getAllByRole('heading', { level: 3, name: 'Off ball' })).toHaveLength(2);
    expect(within(map).getByRole('heading', { level: 3, name: 'Rebounding' })).toBeInTheDocument();
    expect(within(map).getByText('TODAY')).toBeInTheDocument();
    expect(within(map).getByRole('link', { name: 'Find your player first' })).toHaveAttribute(
      'href',
      '/plan/def.rebound.find-player-first',
    );
    expect(within(map).queryByText(/%/)).not.toBeInTheDocument();
  });

  it('renders the complete Spanish Plan copy', async () => {
    await i18n.changeLanguage('es');
    const { repositories } = await createPlanFixture({
      currentFocus: makeDailyFocus({ guidelineId: 'habits.prep.one-cue' }),
      profile: makeProfile({ alias: 'Ala' }),
    });

    renderPlanRoute('/plan', repositories);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tu plan de juego' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Este es tu plan de trabajo, Ala. No está pensado para que lo hagas todo a la vez. Reúne decisiones y hábitos que queremos convertir en parte natural de tu juego. Hoopjot irá tomando una idea cada vez y la llevará a tus entrenamientos y partidos. Después, lo que registres servirá para decidir qué conviene mantener, reforzar o volver a mirar.',
      ),
    ).toBeInTheDocument();

    const map = await screen.findByTestId('development-map');
    expect(
      within(map)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'Ataque',
      'Defensa',
      'Transición',
      'Comunicación y decisiones',
      'Hábitos y atención',
    ]);
    expect(screen.getByText('Cómo vamos a trabajar este plan')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No necesitas memorizarlo todo. El plan está aquí para que puedas volver a él cuando quieras entender el conjunto. En el día a día, Hoopjot elegirá una sola idea. Llévala contigo al entrenamiento o al partido. Después registra brevemente qué ocurrió, qué sentiste que funcionó y qué merece volver a aparecer. La mejora no vendrá de marcar casillas, sino de repetir buenas decisiones hasta que dejen de parecer nuevas.',
      ),
    ).toBeInTheDocument();
    expect(within(map).getByText('HOY')).toBeInTheDocument();
  });

  it('omits optional ProfileSnapshot facts when they are missing', async () => {
    const { repositories } = await createPlanFixture({
      profile: makeProfile({
        alias: undefined,
        heightCm: undefined,
        secondaryPosition: undefined,
      }),
    });

    renderPlanRoute('/plan', repositories);

    expect(await screen.findByText('Your starting point')).toBeInTheDocument();
    expect(screen.getByText('Primary position')).toBeInTheDocument();
    expect(screen.getByText('Competitive level')).toBeInTheDocument();
    expect(screen.queryByText('Secondary position')).not.toBeInTheDocument();
    expect(screen.queryByText('Height')).not.toBeInTheDocument();
    expect(screen.queryByText('Active goals')).not.toBeInTheDocument();
  });

  it('renders guideline detail from the existing catalog and returns to Plan', async () => {
    const { repositories } = await createPlanFixture();

    renderPlanRoute('/plan/def.rebound.find-player-first', repositories);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Find your player first' }),
    ).toBeInTheDocument();
    expect(screen.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Plan' })).toHaveAttribute('href', '/plan');
    expect(screen.queryByRole('link', { name: 'Back to Game' })).not.toBeInTheDocument();
  });

  it('marks reduced-motion mode for immediate readable content', async () => {
    mockMatchMedia(true);
    const { repositories } = await createPlanFixture();

    renderPlanRoute('/plan', repositories);

    const map = await screen.findByTestId('development-map');

    expect(map).toHaveAttribute('data-reduced-motion', 'true');
    expect(map).toHaveAttribute('data-in-view', 'true');
  });
});

async function createPlanFixture({
  currentFocus,
  goals = [],
  profile = makeProfile(),
}: {
  currentFocus?: DailyFocus;
  goals?: PlayerGoal[];
  profile?: PlayerProfile;
} = {}): Promise<{ repositories: LocalRepositories }> {
  const db = createHoopjotLocalDb(`hoopjot-plan-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  const repositories = createLocalRepositories(db);

  if (profile) {
    await repositories.profiles.save(profile);
  }

  for (const goal of goals) {
    await repositories.playerGoals.save(goal);
  }

  if (currentFocus) {
    await repositories.dailyFocus.save(currentFocus);
  }

  return { repositories };
}

function renderPlanRoute(initialPath: string, repositories: LocalRepositories) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthProvider
          authService={createFakeAuthService()}
          playerProfileRepository={repositories.profiles}
        >
          <Routes>
            <Route element={<PlanRoute getLocalDate={() => today} />} path="/plan" />
            <Route element={<PlanRoute getLocalDate={() => today} />} path="/plan/:guidelineId" />
          </Routes>
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
    ...overrides,
  };
}

function makeGoal({
  goalType,
  id,
  priority,
}: {
  goalType: GoalType;
  id: string;
  priority: GoalPriority;
}): PlayerGoal {
  return parsePlayerGoal({
    id,
    userId,
    goalType,
    priority,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function makeDailyFocus({ guidelineId }: { guidelineId: string }): DailyFocus {
  return parseDailyFocus({
    id: '44444444-4444-4444-8444-444444444444',
    userId,
    localDate: today,
    guidelineId,
    reasonCode: 'rotation',
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function createFakeAuthService(): AuthService {
  const user: AuthUser = {
    email: 'player@example.com',
    id: userId,
    onboardingCompleted: true,
  };

  return {
    getCurrentUser: vi.fn(async () => user),
    onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => user),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    updatePassword: vi.fn(async () => user),
  };
}

function mockMatchMedia(prefersReducedMotion: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}
