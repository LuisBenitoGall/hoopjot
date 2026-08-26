import 'fake-indexeddb/auto';

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthContext, type AuthContextValue } from '../../app/providers/authContext';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import { basketballContentRepository } from '../../content/basketball';
import {
  parseDailyFocus,
  parsePlayerGoal,
  type BasketballContentRepository,
  type DailyFocus,
  type GoalPriority,
  type GoalType,
  type Guideline,
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
import type { AuthUser } from '../../services/auth';
import { PlanRoute } from './PlanRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const secondUserId = '11111111-1111-4111-8111-222222222222';
const timestamp = '2026-08-24T10:00:00.000Z';
const today = '2026-08-24';
const openedDbs: HoopjotLocalDb[] = [];

describe('PlanRoute', () => {
  beforeEach(async () => {
    document.documentElement.lang = 'en';
    await i18n.changeLanguage('en');
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

  it('localizes ProfileSnapshot enum labels in Spanish without exposing enum keys', async () => {
    await i18n.changeLanguage('es');
    const { repositories } = await createPlanFixture({
      goals: [
        makeGoal({
          goalType: 'more_minutes',
          id: '33333333-3333-4333-8333-333333333341',
          priority: 1,
        }),
        makeGoal({
          goalType: 'inside_game',
          id: '33333333-3333-4333-8333-333333333342',
          priority: 2,
        }),
        makeGoal({
          customLabel: 'Tiro libre',
          goalType: 'custom',
          id: '33333333-3333-4333-8333-333333333343',
          priority: 3,
        }),
      ],
      profile: makeProfile({
        competitiveLevel: 'semi_pro',
        heightCm: 196,
        primaryPosition: 'center',
        secondaryPosition: 'power_forward',
      }),
    });

    renderPlanRoute('/plan', repositories);

    const snapshot = getProfileSnapshotSection('Tu punto de partida');

    expect(await within(snapshot).findByText('Pívot')).toBeInTheDocument();
    expect(within(snapshot).getByText('Ala-pívot')).toBeInTheDocument();
    expect(within(snapshot).getByText('196 cm')).toBeInTheDocument();
    expect(within(snapshot).getByText('Semiprofesional')).toBeInTheDocument();
    expect(within(snapshot).getByText('Más minutos')).toBeInTheDocument();
    expect(within(snapshot).getByText('Juego interior')).toBeInTheDocument();
    expect(within(snapshot).getByText('Tiro libre')).toBeInTheDocument();
    expect(snapshot.textContent).not.toMatch(
      /center|power_forward|semi_pro|more_minutes|inside_game|custom/,
    );
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
    expect(await screen.findByText('Primary position')).toBeInTheDocument();
    expect(screen.getByText('Competitive level')).toBeInTheDocument();
    expect(screen.queryByText('Secondary position')).not.toBeInTheDocument();
    expect(screen.queryByText('Height')).not.toBeInTheDocument();
    expect(screen.queryByText('Active goals')).not.toBeInTheDocument();
  });

  it('keeps ProfileSnapshot in the fixed Plan section order when profile facts and goals are absent', async () => {
    const { repositories } = await createPlanFixture({ profile: null });

    const { container } = renderPlanRoute('/plan', repositories);

    await screen.findByRole('heading', { level: 1, name: 'Your game plan' });
    const article = container.querySelector('main > article');

    if (!article) {
      throw new Error('Plan article not found');
    }

    const sections = Array.from(article.children) as HTMLElement[];

    expect(sections).toHaveLength(5);
    expect(
      within(sections[0]).getByRole('heading', { level: 1, name: 'Your game plan' }),
    ).toBeInTheDocument();
    expect(
      within(sections[1]).getByRole('heading', { level: 2, name: 'Your starting point' }),
    ).toBeInTheDocument();
    expect(within(sections[2]).getByText('See the whole map')).toBeInTheDocument();
    expect(sections[3]).toHaveAttribute('data-testid', 'development-map');
    expect(
      within(sections[4]).getByRole('heading', {
        level: 2,
        name: 'How we will work this plan',
      }),
    ).toBeInTheDocument();
    expect(within(sections[1]).queryByText('Primary position')).not.toBeInTheDocument();
    expect(within(sections[1]).queryByText('Competitive level')).not.toBeInTheDocument();
    expect(within(sections[1]).queryByText('Active goals')).not.toBeInTheDocument();
  });

  it('keeps deterministic Plan structure while showing only each authenticated user facts', async () => {
    const { repositories } = await createPlanFixture({ profile: null });

    await repositories.profiles.save(
      makeProfile({
        alias: 'User A',
        id: '22222222-2222-4222-8222-222222222231',
        userId,
      }),
    );
    await repositories.profiles.save(
      makeProfile({
        alias: 'User B',
        competitiveLevel: 'academy',
        heightCm: 196,
        id: '22222222-2222-4222-8222-222222222232',
        primaryPosition: 'center',
        secondaryPosition: 'power_forward',
        userId: secondUserId,
      }),
    );

    for (const goal of [
      makeGoal({
        goalType: 'fundamentals',
        id: '33333333-3333-4333-8333-333333333351',
        priority: 1,
        userId,
      }),
      makeGoal({
        goalType: 'defense',
        id: '33333333-3333-4333-8333-333333333352',
        priority: 2,
        userId,
      }),
      makeGoal({
        goalType: 'confidence',
        id: '33333333-3333-4333-8333-333333333353',
        priority: 3,
        userId,
      }),
      makeGoal({
        goalType: 'rebounding',
        id: '33333333-3333-4333-8333-333333333361',
        priority: 1,
        userId: secondUserId,
      }),
      makeGoal({
        goalType: 'finishing',
        id: '33333333-3333-4333-8333-333333333362',
        priority: 2,
        userId: secondUserId,
      }),
      makeGoal({
        goalType: 'decision_making',
        id: '33333333-3333-4333-8333-333333333363',
        priority: 3,
        userId: secondUserId,
      }),
    ]) {
      await repositories.playerGoals.save(goal);
    }

    const userAView = renderPlanRoute('/plan', repositories, {
      authValue: authenticatedAuthValue(makeAuthUser(userId)),
    });
    const userASnapshot = getProfileSnapshotSection('Your starting point');

    expect(await within(userASnapshot).findByText('Point guard')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('Shooting guard')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('182 cm')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('Club')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('Fundamentals')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('Defense')).toBeInTheDocument();
    expect(within(userASnapshot).getByText('Confidence')).toBeInTheDocument();
    expect(within(userASnapshot).queryByText('Center')).not.toBeInTheDocument();
    expect(within(userASnapshot).queryByText('Rebounding')).not.toBeInTheDocument();

    const userASections = await getDevelopmentSectionTitles();
    expect(userASections).toEqual([
      'Attack',
      'Defense',
      'Transition',
      'Communication & decisions',
      'Habits & attention',
    ]);
    expectNoGeneratedCoachingInference(userAView.container);

    userAView.unmount();

    const userBView = renderPlanRoute('/plan', repositories, {
      authValue: authenticatedAuthValue(makeAuthUser(secondUserId)),
    });
    const userBSnapshot = getProfileSnapshotSection('Your starting point');

    expect(await within(userBSnapshot).findByText('Center')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('Power forward')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('196 cm')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('Academy')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('Rebounding')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('Finishing')).toBeInTheDocument();
    expect(within(userBSnapshot).getByText('Decision making')).toBeInTheDocument();
    expect(within(userBSnapshot).queryByText('Point guard')).not.toBeInTheDocument();
    expect(within(userBSnapshot).queryByText('Fundamentals')).not.toBeInTheDocument();
    expect(within(userBSnapshot).getAllByRole('listitem')).toHaveLength(3);

    expect(await getDevelopmentSectionTitles()).toEqual(userASections);
    expectNoGeneratedCoachingInference(userBView.container);
  });

  it('limits active goals to three when rendering the ProfileSnapshot', async () => {
    const { repositories } = await createPlanFixture();

    vi.spyOn(repositories.playerGoals, 'listByUserId').mockResolvedValue([
      makeGoal({
        goalType: 'fundamentals',
        id: '33333333-3333-4333-8333-333333333371',
        priority: 1,
      }),
      makeGoal({
        goalType: 'defense',
        id: '33333333-3333-4333-8333-333333333372',
        priority: 2,
      }),
      makeGoal({
        goalType: 'confidence',
        id: '33333333-3333-4333-8333-333333333373',
        priority: 3,
      }),
      makeGoal({
        goalType: 'rebounding',
        id: '33333333-3333-4333-8333-333333333374',
        priority: 3,
      }),
    ]);

    renderPlanRoute('/plan', repositories);

    const snapshot = getProfileSnapshotSection('Your starting point');

    expect(await within(snapshot).findByText('Fundamentals')).toBeInTheDocument();
    expect(within(snapshot).getAllByRole('listitem')).toHaveLength(3);
    expect(within(snapshot).queryByText('Rebounding')).not.toBeInTheDocument();
  });

  it('keeps editorial subsections visible and omits only unavailable guideline links', async () => {
    const { repositories } = await createPlanFixture();

    renderPlanRoute('/plan', repositories, {
      contentRepository: makeContentRepositoryWithoutGuideline('att.finish.two-foot-balance'),
    });

    const map = await screen.findByTestId('development-map');

    expect(within(map).getAllByRole('heading', { level: 3, name: 'On ball' })[0]).toBeInTheDocument();
    expect(within(map).getByText('Catch ready to play, not just to hold the ball.')).toBeInTheDocument();
    expect(await within(map).findByRole('link', { name: 'Protect the outside hip' })).toHaveAttribute(
      'href',
      '/plan/att.onball.protect-outside-hip',
    );
    expect(
      within(map).queryByRole('link', { name: 'Finish with two-foot balance' }),
    ).not.toBeInTheDocument();
  });

  it('renders guideline detail from the existing catalog and returns to Plan', async () => {
    const { repositories } = await createPlanFixture();

    renderPlanRoute('/plan/def.rebound.find-player-first', repositories);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Find your player first' }),
    ).toBeInTheDocument();
    expect(screen.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeInTheDocument();
    expect(
      screen.getByText(
        'When the shot goes up, locate your opponent before tracking the ball.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Plan' })).toHaveAttribute('href', '/plan');
    expect(screen.queryByRole('link', { name: 'Back to Game' })).not.toBeInTheDocument();
    expect(screen.queryByText('Common mistakes')).not.toBeInTheDocument();
    expect(screen.queryByText('Reflection prompt')).not.toBeInTheDocument();
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
  profile?: PlayerProfile | null;
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

function renderPlanRoute(
  initialPath: string,
  repositories: LocalRepositories,
  {
    authValue = authenticatedAuthValue(),
    contentRepository,
  }: {
    authValue?: AuthContextValue;
    contentRepository?: BasketballContentRepository;
  } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthContext.Provider value={authValue}>
          <Routes>
            <Route
              element={<PlanRoute contentRepository={contentRepository} getLocalDate={() => today} />}
              path="/plan"
            />
            <Route
              element={<PlanRoute contentRepository={contentRepository} getLocalDate={() => today} />}
              path="/plan/:guidelineId"
            />
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

function makeGoal({
  customLabel,
  goalType,
  id,
  priority,
  userId: goalUserId = userId,
}: {
  customLabel?: string;
  goalType: GoalType;
  id: string;
  priority: GoalPriority;
  userId?: string;
}): PlayerGoal {
  return parsePlayerGoal({
    id,
    userId: goalUserId,
    goalType,
    customLabel,
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

function authenticatedAuthValue(user: AuthUser = makeAuthUser(userId)): AuthContextValue {
  return {
    error: null,
    refreshOnboardingStatus: vi.fn(async () => undefined),
    resetError: vi.fn(),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    signUp: vi.fn(async () => ({ requiresEmailConfirmation: false, user })),
    state: {
      isPasswordRecoverySession: false,
      status: 'authenticated',
      user,
    },
    updatePassword: vi.fn(async () => undefined),
  };
}

function makeAuthUser(id: string): AuthUser {
  return {
    email: `${id}@example.com`,
    id,
    onboardingCompleted: true,
  };
}

function getProfileSnapshotSection(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 2, name: title });
  const section = heading.closest('section');

  if (!section) {
    throw new Error('ProfileSnapshot section not found');
  }

  return section;
}

async function getDevelopmentSectionTitles(): Promise<string[]> {
  const map = await screen.findByTestId('development-map');

  return within(map)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent ?? '');
}

function expectNoGeneratedCoachingInference(container: HTMLElement): void {
  expect(container.textContent).not.toMatch(
    /Because you are|At your height|As a center you should|Because you are a guard|At your level|Players your age|Your body profile suggests|Your goals mean/i,
  );
}

function makeContentRepositoryWithoutGuideline(
  missingGuidelineId: string,
): BasketballContentRepository {
  return {
    async getGuidelineById(id: string): Promise<Guideline | null> {
      if (id === missingGuidelineId) {
        return null;
      }

      return basketballContentRepository.getGuidelineById(id);
    },
    async getSkillById(id) {
      return basketballContentRepository.getSkillById(id);
    },
    async listGuidelines() {
      const guidelines = await basketballContentRepository.listGuidelines();

      return guidelines.filter((guideline) => guideline.id !== missingGuidelineId);
    },
    async listSkills() {
      return basketballContentRepository.listSkills();
    },
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
