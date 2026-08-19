import type {
  DailyFocus,
  Guideline,
  Observation,
  Reflection,
  Session,
  Skill,
  SkillState
} from '../../domain';
import { aggregateProgress } from './progressAggregator';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '99999999-9999-4999-8999-999999999999';
const localDate = '2026-08-18';
const timestamp = '2026-08-18T12:00:00.000Z';
const reboundFocusId = '22222222-2222-4222-8222-222222222222';
const finishFocusId = '33333333-3333-4333-8333-333333333333';

describe('aggregateProgress', () => {
  it('returns an empty learning state for sparse local data', () => {
    const overview = aggregateProgress({
      dailyFocuses: [],
      guidelines: [],
      localDate,
      observations: [],
      reflections: [],
      sessions: [],
      skillStates: [],
      skills: [],
      userId
    });

    expect(overview.learningState).toBe('empty');
    expect(overview.weekStart).toBe('2026-08-17');
    expect(overview.recentSessions).toEqual([]);
    expect(overview.focusAreas).toEqual([]);
    expect(overview.signals).toEqual([]);
  });

  it('keeps early progress qualitative while patterns are still building', () => {
    const overview = aggregateProgress({
      dailyFocuses: [
        makeDailyFocus({
          id: reboundFocusId,
          guidelineId: 'def.rebound.find-player-first',
          localDate
        })
      ],
      guidelines: [makeGuideline({ id: 'def.rebound.find-player-first' })],
      localDate,
      observations: [],
      reflections: [],
      sessions: [makeSession({ id: '44444444-4444-4444-8444-444444444444' })],
      skillStates: [],
      skills: [makeSkill({ id: 'def.rebound.find-player' })],
      userId
    });

    expect(overview.learningState).toBe('building');
    expect(overview.recentSessions[0]?.trend).toBe('learning');
    expect(overview.focusAreas[0]).toMatchObject({
      skillId: 'def.rebound.find-player',
      trend: 'learning'
    });
  });

  it('summarizes recent sessions, common focus areas and qualitative skill signals', () => {
    const sessions = [
      makeSession({
        id: '44444444-4444-4444-8444-444444444444',
        startedAt: '2026-08-18T12:00:00.000Z'
      }),
      makeSession({
        id: '55555555-5555-4555-8555-555555555555',
        startedAt: '2026-08-17T12:00:00.000Z'
      }),
      makeSession({
        id: '66666666-6666-4666-8666-666666666666',
        startedAt: '2026-08-16T12:00:00.000Z'
      }),
      makeSession({
        id: '77777777-7777-4777-8777-777777777777',
        userId: otherUserId
      })
    ];
    const overview = aggregateProgress({
      dailyFocuses: [
        makeDailyFocus({
          id: reboundFocusId,
          guidelineId: 'def.rebound.find-player-first',
          localDate: '2026-08-18'
        }),
        makeDailyFocus({
          id: '88888888-8888-4888-8888-888888888888',
          guidelineId: 'def.rebound.find-player-first',
          localDate: '2026-08-17'
        }),
        makeDailyFocus({
          id: finishFocusId,
          guidelineId: 'att.finish.two-foot-balance',
          localDate: '2026-08-16'
        })
      ],
      guidelines: [
        makeGuideline({ id: 'def.rebound.find-player-first' }),
        makeGuideline({
          category: 'attack',
          id: 'att.finish.two-foot-balance',
          skillIds: ['att.finish.two-foot-balance'],
          subcategory: 'finishing'
        })
      ],
      localDate,
      observations: [
        makeObservation({
          id: '99999999-9999-4999-8999-999999999998',
          polarity: 'positive',
          skillId: 'def.rebound.find-player'
        }),
        makeObservation({
          id: '99999999-9999-4999-8999-999999999997',
          observedAt: '2026-08-17T12:00:00.000Z',
          polarity: 'positive',
          skillId: 'def.rebound.find-player'
        }),
        makeObservation({
          id: '99999999-9999-4999-8999-999999999996',
          polarity: 'negative',
          skillId: 'att.finish.two-foot-balance'
        })
      ],
      reflections: [
        makeReflection({
          dailyFocusId: reboundFocusId,
          focusRating: 5,
          sessionId: '44444444-4444-4444-8444-444444444444'
        }),
        makeReflection({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          dailyFocusId: reboundFocusId,
          focusRating: 4,
          sessionId: '55555555-5555-4555-8555-555555555555'
        }),
        makeReflection({
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          dailyFocusId: finishFocusId,
          focusRating: 2,
          sessionId: '66666666-6666-4666-8666-666666666666'
        })
      ],
      sessions,
      skillStates: [
        makeSkillState({
          skillId: 'att.finish.two-foot-balance',
          trend: 'down'
        })
      ],
      skills: [
        makeSkill({ id: 'def.rebound.find-player' }),
        makeSkill({
          category: 'attack',
          id: 'att.finish.two-foot-balance',
          subcategory: 'finishing'
        })
      ],
      userId
    });

    expect(overview.learningState).toBe('ready');
    expect(overview.recentSessions).toHaveLength(3);
    expect(overview.recentSessions[0]).toMatchObject({
      guideline: { id: 'def.rebound.find-player-first' },
      trend: 'improving'
    });
    expect(overview.focusAreas.map((focusArea) => focusArea.skillId)).toEqual([
      'def.rebound.find-player',
      'att.finish.two-foot-balance'
    ]);
    expect(overview.signals.map((signal) => [signal.skillId, signal.trend])).toEqual([
      ['att.finish.two-foot-balance', 'needs_attention'],
      ['def.rebound.find-player', 'improving']
    ]);
  });
});

function makeDailyFocus(overrides: Partial<DailyFocus>): DailyFocus {
  return {
    id: reboundFocusId,
    userId,
    localDate,
    guidelineId: 'def.rebound.find-player-first',
    reasonCode: 'rotation',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeGuideline(overrides: Partial<Guideline>): Guideline {
  return {
    id: 'def.rebound.find-player-first',
    skillIds: ['def.rebound.find-player'],
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positions: ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_rebound_find_player_first',
    active: true,
    ...overrides
  };
}

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'def.rebound.find-player',
    code: 'DEF-REB-FIND',
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positionAffinity: ['all'],
    tags: ['rebounding'],
    active: true,
    ...overrides
  };
}

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    userId,
    type: 'practice',
    startedAt: timestamp,
    completedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeReflection(overrides: Partial<Reflection>): Reflection {
  return {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    userId,
    sessionId: '44444444-4444-4444-8444-444444444444',
    dailyFocusId: reboundFocusId,
    focusRating: 5,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeObservation(overrides: Partial<Observation>): Observation {
  return {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    userId,
    skillId: 'def.rebound.find-player',
    polarity: 'positive',
    weight: 1,
    source: 'reflection',
    confidence: 1,
    observedAt: timestamp,
    ...overrides
  };
}

function makeSkillState(overrides: Partial<SkillState>): SkillState {
  return {
    userId,
    skillId: 'def.rebound.find-player',
    score: 0.5,
    confidence: 0.8,
    sampleCount: 3,
    trend: 'flat',
    updatedAt: timestamp,
    ...overrides
  };
}
