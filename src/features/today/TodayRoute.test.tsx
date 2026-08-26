import 'fake-indexeddb/auto';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  QuickReflectionService,
  TodayService
} from '../../application/today';
import { AuthProvider } from '../../app/providers/AuthProvider';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import { basketballContentRepository } from '../../content/basketball';
import { parseDailyFocus, parseSession, type DailyFocus, type Session } from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb,
  type LocalRepositories
} from '../../persistence/local';
import type { AuthService, AuthUser } from '../../services/auth';
import { TodayRoute } from './TodayRoute';

const userId = '11111111-1111-4111-8111-111111111111';
const focusId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const reflectionId = '44444444-4444-4444-8444-444444444444';
const localDate = '2026-08-24';
const timestamp = '2026-08-24T10:00:00.000Z';
const savedAt = '2026-08-24T11:00:00.000Z';

const openedDbs: HoopjotLocalDb[] = [];

describe('TodayRoute', () => {
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

    vi.restoreAllMocks();
  });

  it('renders compact Today without legacy status or pre-session controls', async () => {
    const { db, repositories } = await createTodayFixture();

    renderTodayRoute(repositories);

    expect(
      await screen.findByRole('heading', { level: 1, name: "TODAY'S FOCUS" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Log how it went' })).toBeInTheDocument();

    const main = screen.getByRole('main');

    expect(within(main).getByText(localDate)).toBeInTheDocument();
    expect(within(main).getAllByRole('button')).toHaveLength(1);
    expect(within(main).queryByRole('button', { name: 'Mark viewed' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('button', { name: 'Start session' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('heading', { name: 'Session and reflection' })).not.toBeInTheDocument();
    expect(within(main).queryByText('Planned')).not.toBeInTheDocument();
    expect(within(main).queryByText('Viewed')).not.toBeInTheDocument();
    expect(within(main).queryByText('Energy')).not.toBeInTheDocument();
    expect(within(main).queryByText('Confidence')).not.toBeInTheDocument();
    expect(within(main).queryByText('Physical feeling')).not.toBeInTheDocument();
    expect(within(main).queryByRole('button', { name: 'Learning' })).not.toBeInTheDocument();
    expect(within(main).queryByRole('button', { name: 'Recovery' })).not.toBeInTheDocument();

    await waitFor(async () => {
      await expectFocusStatus(repositories, 'viewed');
    });
    expect((await db.checkIns.toArray())).toHaveLength(0);
  });

  it('opens quick reflection inline and saves a rating-only reflection with confirmation on reload', async () => {
    const user = userEvent.setup();
    const { db, repositories } = await createTodayFixture();
    const firstRender = renderTodayRoute(repositories);

    await user.click(await screen.findByRole('button', { name: 'Log how it went' }));

    const sessionTypeGroup = screen.getByText('What was it today?').closest('fieldset');

    if (!sessionTypeGroup) {
      throw new Error('Session type fieldset not found');
    }

    expect(within(sessionTypeGroup).getByRole('button', { name: 'Practice' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(sessionTypeGroup).getByRole('button', { name: 'Game' })).toBeInTheDocument();
    expect(within(sessionTypeGroup).queryByRole('button', { name: 'Learning' })).not.toBeInTheDocument();
    expect(within(sessionTypeGroup).queryByRole('button', { name: 'Recovery' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('What did you notice or want to remember?')).toBeInTheDocument();
    expect(screen.queryByLabelText('Remember next time')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Add coach feedback' }),
    ).not.toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add coach feedback' }));
    expect(screen.getByRole('textbox', { name: 'Add coach feedback' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('4 of 5'));
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    expect(
      await screen.findByText('Saved. We will take it into account for the next focuses.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log how it went' })).not.toBeInTheDocument();
    await expectFocusStatus(repositories, 'completed');
    expect((await db.sessions.toArray())).toMatchObject([
      {
        completedAt: savedAt,
        id: sessionId,
        type: 'practice'
      }
    ]);
    const [reflection] = await db.reflections.toArray();

    expect(reflection).toMatchObject({
      focusRating: 4,
      id: reflectionId
    });
    expect(reflection?.note).toBeUndefined();
    expect(reflection?.coachFeedback).toBeUndefined();
    expect(reflection?.rememberNextTime).toBeUndefined();
    expect(reflection?.rememberNextTime).not.toBe('');
    expect(reflection?.rememberNextTime).not.toBeNull();
    expect((await db.checkIns.toArray())).toHaveLength(0);

    firstRender.unmount();
    renderTodayRoute(repositories);

    expect(
      await screen.findByText('Saved. We will take it into account for the next focuses.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log how it went' })).not.toBeInTheDocument();
  });

  it.each([
    ['no incomplete session', undefined],
    ['an incomplete Practice session', 'practice'],
    ['an incomplete Game session', 'game']
  ] satisfies Array<[string, Session['type'] | undefined]>)(
    'defaults Quick Reflection to Practice with %s',
    async (_label, incompleteSessionType) => {
      const user = userEvent.setup();
      const { repositories } = await createTodayFixture({ incompleteSessionType });

      renderTodayRoute(repositories);

      await user.click(await screen.findByRole('button', { name: 'Log how it went' }));

      const sessionTypeGroup = getSessionTypeGroup();

      expect(within(sessionTypeGroup).getByRole('button', { name: 'Practice' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(within(sessionTypeGroup).getByRole('button', { name: 'Game' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    },
  );

  it('reuses an incomplete Game session and changes it to Practice when the user keeps the default', async () => {
    const user = userEvent.setup();
    const { db, repositories } = await createTodayFixture({ incompleteSessionType: 'game' });

    renderTodayRoute(repositories);

    await user.click(await screen.findByRole('button', { name: 'Log how it went' }));

    const sessionTypeGroup = getSessionTypeGroup();
    expect(within(sessionTypeGroup).getByRole('button', { name: 'Practice' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByLabelText('4 of 5'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Saved. We will take it into account for the next focuses.'),
    ).toBeInTheDocument();
    expect(await db.sessions.toArray()).toMatchObject([
      {
        id: sessionId,
        type: 'practice'
      }
    ]);
    expect((await db.sessions.toArray())).toHaveLength(1);
  });

  it('reuses an incomplete Game session and keeps Game when the user explicitly selects it', async () => {
    const user = userEvent.setup();
    const { db, repositories } = await createTodayFixture({ incompleteSessionType: 'game' });

    renderTodayRoute(repositories);

    await user.click(await screen.findByRole('button', { name: 'Log how it went' }));
    await user.click(screen.getByRole('button', { name: 'Game' }));
    await user.click(screen.getByLabelText('4 of 5'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Saved. We will take it into account for the next focuses.'),
    ).toBeInTheDocument();
    expect(await db.sessions.toArray()).toMatchObject([
      {
        id: sessionId,
        type: 'game'
      }
    ]);
    expect((await db.sessions.toArray())).toHaveLength(1);
  });
});

async function createTodayFixture({
  incompleteSessionType
}: {
  incompleteSessionType?: Session['type'];
} = {}): Promise<{
  db: HoopjotLocalDb;
  repositories: LocalRepositories;
}> {
  const db = createHoopjotLocalDb(`hoopjot-today-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  const repositories = createLocalRepositories(db);
  await repositories.dailyFocus.save(validDailyFocus());
  if (incompleteSessionType) {
    await repositories.sessions.save(validSession({ type: incompleteSessionType }));
  }
  await db.syncQueue.clear();

  return { db, repositories };
}

function renderTodayRoute(repositories: LocalRepositories) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <LocalRepositoriesProvider repositories={repositories}>
        <AuthProvider
          authService={createFakeAuthService()}
          playerProfileRepository={repositories.profiles}
        >
          <Routes>
            <Route
              element={
                <TodayRoute
                  quickReflectionService={
                    new QuickReflectionService({
                      createId: makeSequentialIds([sessionId, reflectionId]),
                      dailyFocusRepository: repositories.dailyFocus,
                      getLocalDate: () => localDate,
                      getNow: () => new Date(savedAt),
                      reflectionRepository: repositories.reflections,
                      sessionRepository: repositories.sessions
                    })
                  }
                  service={
                    new TodayService({
                      contentRepository: basketballContentRepository,
                      dailyFocusRepository: repositories.dailyFocus,
                      getLocalDate: () => localDate,
                      getNow: () => new Date(timestamp),
                      sessionRepository: repositories.sessions
                    })
                  }
                />
              }
              path="/app"
            />
          </Routes>
        </AuthProvider>
      </LocalRepositoriesProvider>
    </MemoryRouter>,
  );
}

function validDailyFocus(overrides: Partial<DailyFocus> = {}): DailyFocus {
  return parseDailyFocus({
    id: focusId,
    userId,
    localDate,
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  });
}

function validSession(overrides: Partial<Session> = {}): Session {
  return parseSession({
    id: sessionId,
    userId,
    type: 'practice',
    startedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  });
}

function getSessionTypeGroup(): HTMLElement {
  const sessionTypeGroup = screen.getByText('What was it today?').closest('fieldset');

  if (!sessionTypeGroup) {
    throw new Error('Session type fieldset not found');
  }

  return sessionTypeGroup;
}

async function expectFocusStatus(
  repositories: LocalRepositories,
  status: DailyFocus['status'],
): Promise<void> {
  await expect(repositories.dailyFocus.getByLocalDate(userId, localDate)).resolves.toMatchObject({
    status
  });
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

function makeSequentialIds(ids: string[]): () => string {
  let index = 0;

  return () => ids[Math.min(index++, ids.length - 1)] ?? ids[ids.length - 1] ?? sessionId;
}
