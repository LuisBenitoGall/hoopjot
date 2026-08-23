import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom';

import {
  type JournalEntry,
  type JournalFilter,
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
const sessionId = '33333333-3333-4333-8333-333333333333';
const timestamp = '2026-08-18T16:00:00.000Z';
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

  it('renders a locale-aware timeline and filters by session type', async () => {
    const user = userEvent.setup();
    const service = new FakeJournalService([makeJournalEntry()]);

    renderJournalRoutes('/journal', service);

    expect(await screen.findByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(await screen.findByText('Find your player first')).toBeInTheDocument();
    expect(screen.getByText(formatExpectedGroupDate())).toBeInTheDocument();
    expect(screen.getByText('Reflection saved')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Game' }));

    expect(await screen.findByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument();
    expect(service.listTimeline).toHaveBeenLastCalledWith(userId, 'game');
  });

  it('shows the selected session focus and reflection detail', async () => {
    const service = new FakeJournalService([makeJournalEntry()]);

    renderJournalRoutes(`/journal/${sessionId}`, service);

    expect(await screen.findByRole('heading', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daily focus' })).toBeInTheDocument();
    expect(screen.getByText('Find your player first')).toBeInTheDocument();
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByText('Closed out before watching the ball.')).toBeInTheDocument();
  });
});

class FakeJournalService implements JournalServicePort {
  constructor(private readonly entries: JournalEntry[]) {}

  readonly getSessionDetail = vi.fn(async (_userId: string, requestedSessionId: string) =>
    this.entries.find((entry) => entry.session.id === requestedSessionId) ?? null,
  );

  readonly listTimeline = vi.fn(
    async (_userId: string, filter: JournalFilter = 'all'): Promise<JournalTimeline> => {
      const entries = this.entries.filter(
        (entry) => filter === 'all' || entry.session.type === filter,
      );

      return {
        filter,
        groups: entries.length > 0 ? [{ entries, localDate: entries[0]?.localDate ?? '' }] : [],
        totalCount: entries.length
      };
    },
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

function formatExpectedGroupDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric'
  }).format(new Date(2026, 7, 18));
}

function makeJournalEntry(): JournalEntry {
  const session = makeSession();

  return {
    checkIn: {
      id: '44444444-4444-4444-8444-444444444444',
      userId,
      sessionId,
      energy: 4,
      confidence: 3,
      physicalFeeling: 4,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    dailyFocus: {
      id: '55555555-5555-4555-8555-555555555555',
      userId,
      localDate: '2026-08-18',
      guidelineId: 'def.rebound.find-player-first',
      reasonCode: 'rotation',
      status: 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    guideline: makeGuideline(),
    localDate: '2026-08-18',
    occurredAt: timestamp,
    reflection: makeReflection(),
    session
  };
}

function makeSession(): Session {
  return {
    id: sessionId,
    userId,
    type: 'practice',
    startedAt: timestamp,
    completedAt: '2026-08-18T17:00:00.000Z',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeReflection(): Reflection {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    userId,
    sessionId,
    dailyFocusId: '55555555-5555-4555-8555-555555555555',
    focusRating: 5,
    note: 'Closed out before watching the ball.',
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
