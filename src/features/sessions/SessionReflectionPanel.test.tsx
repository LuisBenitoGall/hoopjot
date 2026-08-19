import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  CompleteSessionInput,
  SessionReflectionServicePort,
  SessionReflectionState,
  StartSessionInput
} from '../../application/sessions';
import type {
  Reflection,
  Session
} from '../../domain';
import i18n from '../../i18n/config';
import { SessionReflectionPanel } from './SessionReflectionPanel';

const userId = '11111111-1111-4111-8111-111111111111';
const sessionId = '33333333-3333-4333-8333-333333333333';
const timestamp = '2026-08-18T10:00:00.000Z';

describe('SessionReflectionPanel', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    void i18n.changeLanguage('en');
  });

  it('starts a session without optional check-in fields and saves a rating-only reflection', async () => {
    const user = userEvent.setup();
    const service = new FakeSessionReflectionService();

    render(<SessionReflectionPanel service={service} userId={userId} />);

    expect(await screen.findByRole('heading', { name: 'Session and reflection' })).toBeInTheDocument();
    expect(screen.getByText(/not a diagnosis or load plan/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start session' }));

    expect(service.startSession).toHaveBeenCalledWith({
      userId,
      type: 'practice',
      checkIn: {}
    });
    expect(await screen.findByText('In progress')).toBeInTheDocument();

    await user.click(screen.getByLabelText('4 of 5'));
    await user.click(screen.getByRole('button', { name: 'Complete + save reflection' }));

    expect(service.completeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        focusRating: 4,
        sessionId,
        userId
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Reflection saved' })).toBeInTheDocument();
  });
});

class FakeSessionReflectionService implements SessionReflectionServicePort {
  private state: SessionReflectionState = {
    checkIn: null,
    dailyFocus: null,
    latestSession: null,
    localDate: '2026-08-18',
    reflection: null
  };

  readonly getTodaySessionState = vi.fn(async () => this.state);

  readonly startSession = vi.fn(async (input: StartSessionInput) => {
    this.state = {
      ...this.state,
      latestSession: makeSession(input.type)
    };

    return this.state;
  });

  readonly completeSession = vi.fn(async (input: CompleteSessionInput) => {
    this.state = {
      ...this.state,
      latestSession: this.state.latestSession
        ? { ...this.state.latestSession, completedAt: timestamp }
        : null,
      reflection: makeReflection(input.focusRating)
    };

    return this.state;
  });
}

function makeSession(type: Session['type']): Session {
  return {
    id: sessionId,
    userId,
    type,
    startedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function makeReflection(focusRating: Reflection['focusRating']): Reflection {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    userId,
    sessionId,
    focusRating,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
