import { DomainValidationError } from './errors';
import { parseDailyFocus } from './focus';
import { parsePlayerGoal } from './goals';
import { parseObservation, parseSkillState } from './observations';
import { parsePlayerProfile } from './player';
import { parseReflection } from './reflections';
import { parseCheckIn, parseSession } from './sessions';
import { parseGuideline, parseSkill } from './skills';
import { parseWeeklyReview } from './weeklyReview';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-18T00:00:00.000Z';
const sessionId = '22222222-2222-4222-8222-222222222222';
const reflectionId = '33333333-3333-4333-8333-333333333333';
const focusId = '44444444-4444-4444-8444-444444444444';

describe('entity parsers', () => {
  it('parses valid MVP domain entities', () => {
    expect(parsePlayerProfile(validPlayerProfile()).primaryPosition).toBe('point_guard');
    expect(parsePlayerGoal(validGoal()).goalType).toBe('rebuild_game_confidence');
    expect(parseSkill(validSkill()).category).toBe('defense');
    expect(parseGuideline(validGuideline()).contexts).toEqual(['practice', 'game']);
    expect(parseSession(validSession()).type).toBe('practice');
    expect(parseCheckIn(validCheckIn()).energy).toBe(4);
    expect(parseReflection(validReflection()).focusRating).toBe(5);
    expect(parseObservation(validObservation()).confidence).toBe(0.8);
    expect(parseSkillState(validSkillState()).trend).toBe('flat');
    expect(parseDailyFocus(validDailyFocus()).status).toBe('planned');
    expect(parseWeeklyReview(validWeeklyReview()).nextPrioritySkillIds).toEqual([
      'def.rebound.find-player-first'
    ]);
  });

  it('rejects missing required fields with a stable domain error', () => {
    const invalidProfile = { ...validPlayerProfile(), primaryPosition: undefined };

    const error = captureDomainError(() => parsePlayerProfile(invalidProfile));

    expect(error.code).toBe('invalid_entity');
    expect(error.issues.some((issue) => issue.path === 'primaryPosition')).toBe(true);
  });

  it('keeps recovery as a session type but not a guideline context', () => {
    expect(parseSession({ ...validSession(), type: 'recovery' }).type).toBe('recovery');

    const error = captureDomainError(() =>
      parseGuideline({ ...validGuideline(), contexts: ['recovery'] }),
    );

    expect(error.code).toBe('invalid_entity');
    expect(error.issues.some((issue) => issue.path === 'contexts.0')).toBe(true);
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

function validPlayerProfile() {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    userId,
    birthYear: 2010,
    dominantHand: 'right',
    primaryPosition: 'point_guard',
    secondaryPosition: 'shooting_guard',
    competitiveLevel: 'club',
    weeklyPractices: 3,
    weeklyGames: 1,
    locale: 'en',
    physicalContext: { status: 'prefer_not_to_say' },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validGoal() {
  return {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    userId,
    goalType: 'rebuild_game_confidence',
    priority: 2,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validSkill() {
  return {
    id: 'def.rebound',
    code: 'DEF-REB',
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positionAffinity: ['all'],
    tags: ['rebounding'],
    active: true
  };
}

function validGuideline() {
  return {
    id: 'def.rebound.find-player-first',
    skillIds: ['def.rebound'],
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positions: ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_rebound_find_player_first',
    active: true
  };
}

function validSession() {
  return {
    id: sessionId,
    userId,
    type: 'practice',
    scheduledAt: timestamp,
    durationMinutes: 90,
    perceivedLoad: 3,
    notes: 'Team practice',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validCheckIn() {
  return {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    userId,
    sessionId,
    energy: 4,
    confidence: 3,
    physicalFeeling: 4,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validReflection() {
  return {
    id: reflectionId,
    userId,
    sessionId,
    dailyFocusId: focusId,
    focusRating: 5,
    rememberNextTime: 'Check body contact before watching the ball.',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validObservation() {
  return {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    userId,
    sessionId,
    reflectionId,
    skillId: 'def.rebound',
    pattern: 'boxing out',
    polarity: 'positive',
    weight: 1,
    source: 'reflection',
    confidence: 0.8,
    observedAt: timestamp
  };
}

function validSkillState() {
  return {
    userId,
    skillId: 'def.rebound',
    score: 0.6,
    confidence: 0.7,
    sampleCount: 3,
    trend: 'flat',
    lastObservedAt: timestamp,
    updatedAt: timestamp
  };
}

function validDailyFocus() {
  return {
    id: focusId,
    userId,
    localDate: '2026-08-18',
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'goal',
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function validWeeklyReview() {
  return {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    userId,
    weekStart: '2026-08-17',
    highlightedSkillIds: ['def.rebound'],
    improvingSkillIds: ['def.rebound'],
    recurringSkillIds: [],
    nextPrioritySkillIds: ['def.rebound.find-player-first'],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
