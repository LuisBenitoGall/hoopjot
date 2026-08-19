import { DomainValidationError } from './errors';
import { assertCanSaveGoal, type PlayerGoal } from './goals';
import { assertCanCompleteOnboarding, type PlayerProfile } from './player';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T00:00:00.000Z';

describe('domain rules', () => {
  it('rejects onboarding completion below the minimum age', () => {
    const profile = makePlayerProfile({ birthYear: 2011 });

    const error = captureDomainError(() => assertCanCompleteOnboarding(profile, 2026));

    expect(error.code).toBe('invalid_age');
    expect(error.issues).toEqual([
      { path: 'birthYear', message: 'Calculated age 15 is below 16' }
    ]);
  });

  it('allows onboarding completion at the minimum age', () => {
    const profile = makePlayerProfile({ birthYear: 2010 });

    expect(() => assertCanCompleteOnboarding(profile, 2026)).not.toThrow();
  });

  it('rejects saving a fourth active goal', () => {
    const existingGoals = [
      makeGoal('22222222-2222-4222-8222-222222222222'),
      makeGoal('33333333-3333-4333-8333-333333333333'),
      makeGoal('44444444-4444-4444-8444-444444444444')
    ];

    const error = captureDomainError(() =>
      assertCanSaveGoal(existingGoals, makeGoal('55555555-5555-4555-8555-555555555555')),
    );

    expect(error.code).toBe('too_many_active_goals');
  });

  it('allows replacing an existing active goal without increasing the active count', () => {
    const existingGoals = [
      makeGoal('22222222-2222-4222-8222-222222222222'),
      makeGoal('33333333-3333-4333-8333-333333333333'),
      makeGoal('44444444-4444-4444-8444-444444444444')
    ];

    expect(() =>
      assertCanSaveGoal(
        existingGoals,
        makeGoal('44444444-4444-4444-8444-444444444444', 'decision_making'),
      ),
    ).not.toThrow();
  });
});

function captureDomainError(run: () => void): DomainValidationError {
  try {
    run();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a domain validation error');
}

function makePlayerProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    userId,
    birthYear: 2010,
    primaryPosition: 'point_guard',
    competitiveLevel: 'club',
    locale: 'en',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeGoal(
  id: string,
  goalType: PlayerGoal['goalType'] = 'fundamentals',
): PlayerGoal {
  return {
    id,
    userId,
    goalType,
    priority: 1,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

