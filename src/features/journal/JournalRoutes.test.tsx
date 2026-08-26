import 'fake-indexeddb/auto';

import { render, screen, within } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom';

import {
  type JournalEntry,
  type JournalServicePort,
  type JournalTimeline
} from '../../application/journal';
import { AuthProvider } from '../../app/providers/AuthProvider';
import { LocalRepositoriesProvider } from '../../app/providers/LocalRepositoriesProvider';
import type { Guideline, Reflection, Session } from '../../domain';
import i18n from '../../i18n/config';
import {
  createHoopjotLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopjotLocalDb
} from '../../persistence/local';
import type { AuthService, AuthUser } from '../../services/auth';
import {
  JournalRoute,
  SessionDetailRoute
} from './JournalRoutes';

const userId = '11111111-1111-4111-8111-111111111111';
const practiceSessionId = '33333333-3333-4333-8333-333333333333';
const gameSessionId = '44444444-4444-4444-8444-444444444444';
const learningSessionId = '55555555-5555-4555-8555-555555555555';
const recoverySessionId = '66666666-6666-4666-8666-666666666666';
const missingGuidelineSessionId = '77777777-7777-4777-8777-777777777777';
const practiceAt = '2026-08-18T16:00:00.000Z';
const gameAt = '2026-08-20T16:00:00.000Z';
const learningAt = '2026-08-17T16:00:00.000Z';
const recoveryAt = '2026-08-16T16:00:00.000Z';
const openedDbs: HoopjotLocalDb[] = [];

describe('Journal routes', () => {
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

  it('renders the exact Journal page intro and a chronological notebook list', async () => {
    const service = new FakeJournalService([
      makeJournalEntry({
        note: 'Game note that should stay short in the list.',
        sessionId: gameSessionId,
        timestamp: gameAt,
        type: 'game'
      }),
      makeJournalEntry({
        note: 'Practice note that should be clamped to two lines.',
        sessionId: practiceSessionId,
        timestamp: practiceAt,
        type: 'practice'
      }),
      makeJournalEntry({
        note: undefined,
        sessionId: learningSessionId,
        timestamp: learningAt,
        type: 'learning'
      }),
      makeJournalEntry({
        note: undefined,
        sessionId: recoverySessionId,
        timestamp: recoveryAt,
        type: 'recovery'
      })
    ]);

    renderJournalRoutes('/journal', service);

    expect(await screen.findByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(
      screen.getByText('Your practice and game notes, without turning them into a report.'),
    ).toBeInTheDocument();

    const list = await screen.findByLabelText('Journal entries');
    const entries = within(list).getAllByRole('link');

    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.textContent)).toEqual([
      expect.stringContaining('Game'),
      expect.stringContaining('Practice'),
      expect.stringContaining('Learning'),
      expect.stringContaining('Recovery')
    ]);
    expect(entries[0]).toHaveTextContent(formatExpectedDate('2026-08-20'));
    expect(entries[0]).toHaveTextContent('Find your player first');
    expect(entries[0]).toHaveTextContent('5 of 5');
    expect(entries[0]).toHaveTextContent('Game note that should stay short in the list.');
    expect(screen.getByText('Game note that should stay short in the list.').getAttribute('style')).toContain(
      '-webkit-line-clamp: 2',
    );
    expect(screen.queryByText('Coach said stay low.')).not.toBeInTheDocument();
    expect(screen.queryByText('Locate matchup early.')).not.toBeInTheDocument();
    expect(screen.queryByText('Energy')).not.toBeInTheDocument();
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Physical feeling')).not.toBeInTheDocument();
    expect(screen.queryByText('Reflection saved')).not.toBeInTheDocument();
    expect(screen.queryByText('Session type')).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly review')).not.toBeInTheDocument();
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();
    expect(screen.queryByText('Progress signals')).not.toBeInTheDocument();
    expect(service.listTimeline).toHaveBeenLastCalledWith(userId);
  });

  it('shows only the allowed session detail fields', async () => {
    const service = new FakeJournalService([makeJournalEntry()]);

    renderJournalRoutes(`/journal/${practiceSessionId}`, service);

    expect(await screen.findByRole('heading', { name: 'Find your player first' })).toBeInTheDocument();
    expect(screen.getByText(formatExpectedDate('2026-08-18'))).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('SHOT / PLAYER / CONTACT / BALL')).toBeInTheDocument();
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByText('Closed out before watching the ball.')).toBeInTheDocument();
    expect(screen.getByText('Coach said stay low.')).toBeInTheDocument();
    expect(screen.queryByText('Energy')).not.toBeInTheDocument();
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Physical feeling')).not.toBeInTheDocument();
    expect(screen.queryByText('Pre-session check-in')).not.toBeInTheDocument();
    expect(screen.queryByText('Locate matchup early.')).not.toBeInTheDocument();
    expect(screen.queryByText('Remember next time')).not.toBeInTheDocument();
    expect(screen.queryByText('Reflection saved')).not.toBeInTheDocument();
  });

  it('omits empty reflection text fields and survives missing guideline content', async () => {
    const service = new FakeJournalService([
      makeJournalEntry({
        coachFeedback: '',
        guideline: null,
        note: '',
        sessionId: missingGuidelineSessionId
      })
    ]);

    renderJournalRoutes(`/journal/${missingGuidelineSessionId}`, service);

    expect(await screen.findByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.queryByText('Find your player first')).not.toBeInTheDocument();
    expect(screen.queryByText('SHOT / PLAYER / CONTACT / BALL')).not.toBeInTheDocument();
    expect(screen.queryByText('What happened?')).not.toBeInTheDocument();
    expect(screen.queryByText('Coach feedback')).not.toBeInTheDocument();
    expect(screen.queryByText('Remember next time')).not.toBeInTheDocument();
  });

  it('renders the Spanish title and exact intro', async () => {
    await i18n.changeLanguage('es');
    const service = new FakeJournalService([]);

    renderJournalRoutes('/journal', service);

    expect(await screen.findByRole('heading', { name: 'Diario' })).toBeInTheDocument();
    expect(
      screen.getByText('Tus notas de entrenamientos y partidos, sin convertirlas en un informe.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Aún no hay nada en tu diario.' }),
    ).toBeInTheDocument();
  });
});

class FakeJournalService implements JournalServicePort {
  constructor(private readonly entries: JournalEntry[]) {}

  readonly getSessionDetail = vi.fn(async (_userId: string, requestedSessionId: string) =>
    this.entries.find((entry) => entry.session.id === requestedSessionId) ?? null,
  );

  readonly listTimeline = vi.fn(
    async (): Promise<JournalTimeline> => ({
      filter: 'all',
      groups: groupEntriesByLocalDate(this.entries),
      totalCount: this.entries.length
    }),
  );
}

function renderJournalRoutes(initialPath: string, service: JournalServicePort) {
  const db = createHoopjotLocalDb(`hoopjot-journal-route-${crypto.randomUUID()}`);
  openedDbs.push(db);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocalRepositoriesProvider repositories={createLocalRepositories(db)}>
        <AuthProvider authService={createFakeAuthService()}>
          <Routes>
            <Route element={<JournalRoute service={service} />} path="/journal" />
            <Route
              element={<SessionDetailRoute service={service} />}
              path="/journal/:sessionId"
            />
          </Routes>
        </AuthProvider>
      </LocalRepositoriesProvider>
    </MemoryRouter>,
  );
}

function formatExpectedDate(localDate: string): string {
  const [year, month, day] = localDate.split('-').map(Number);

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
}

function groupEntriesByLocalDate(entries: JournalEntry[]): JournalTimeline['groups'] {
  const groups = new Map<string, JournalEntry[]>();

  for (const entry of entries) {
    groups.set(entry.localDate, [...(groups.get(entry.localDate) ?? []), entry]);
  }

  return Array.from(groups.entries()).map(([localDate, groupEntries]) => ({
    entries: groupEntries,
    localDate
  }));
}

function makeJournalEntry({
  coachFeedback = 'Coach said stay low.',
  guideline = makeGuideline(),
  note = 'Closed out before watching the ball.',
  sessionId = practiceSessionId,
  timestamp = practiceAt,
  type = 'practice'
}: {
  coachFeedback?: string;
  guideline?: Guideline | null;
  note?: string;
  sessionId?: string;
  timestamp?: string;
  type?: Session['type'];
} = {}): JournalEntry {
  const session = makeSession({ id: sessionId, timestamp, type });
  const localDate = timestamp.slice(0, 10);

  return {
    checkIn: {
      id: '88888888-8888-4888-8888-888888888888',
      userId,
      sessionId,
      energy: 4,
      confidence: 3,
      physicalFeeling: 4,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    dailyFocus: {
      id: '99999999-9999-4999-8999-999999999999',
      userId,
      localDate,
      guidelineId: 'def.rebound.find-player-first',
      reasonCode: 'rotation',
      status: 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    guideline,
    localDate,
    occurredAt: timestamp,
    reflection: makeReflection({ coachFeedback, note, sessionId, timestamp }),
    session
  };
}

function makeSession({
  id,
  timestamp,
  type
}: {
  id: string;
  timestamp: string;
  type: Session['type'];
}): Session {
  return {
    id,
    userId,
    type,
    startedAt: timestamp,
    completedAt: '2026-08-18T17:00:00.000Z',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeReflection({
  coachFeedback,
  note,
  sessionId,
  timestamp
}: {
  coachFeedback?: string;
  note?: string;
  sessionId: string;
  timestamp: string;
}): Reflection {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    userId,
    sessionId,
    dailyFocusId: '99999999-9999-4999-8999-999999999999',
    focusRating: 5,
    coachFeedback,
    note,
    rememberNextTime: 'Locate matchup early.',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeGuideline(): Guideline {
  return {
    id: 'def.rebound.find-player-first',
    skillIds: ['def.rebound.box-out'],
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positions: ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_rebound_find_player_first',
    active: true
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
