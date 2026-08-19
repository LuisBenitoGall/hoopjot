import type {
  DailyFocus,
  Guideline,
  Observation,
  PlayerGoal,
  PlayerProfile,
  Skill,
  SkillState
} from '../../domain';
import {
  rankRecommendationCandidates,
  selectRecommendedGuideline,
  type RecommendationEngineInput
} from './recommendationEngine';

const userId = '11111111-1111-4111-8111-111111111111';
const localDate = '2026-08-18';
const timestamp = '2026-08-18T12:00:00.000Z';

describe('recommendation engine V1', () => {
  it('returns the same deterministic ranking for the same sparse inputs', () => {
    const input = createInput({
      guidelines: [
        makeGuideline({ id: 'def.rebound.find-player-first', skillIds: ['def.rebound'] }),
        makeGuideline({ id: 'att.finish.two-foot-balance', skillIds: ['att.finish'] }),
        makeGuideline({ id: 'habits.prep.one-cue', skillIds: ['habits.prep'] })
      ],
      skills: [
        makeSkill({ id: 'def.rebound', category: 'defense', tags: ['rebounding'] }),
        makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] }),
        makeSkill({ id: 'habits.prep', category: 'habits', tags: ['preparation'] })
      ]
    });

    const firstRanking = rankRecommendationCandidates(input).map((candidate) => candidate.guideline.id);
    const secondRanking = rankRecommendationCandidates(input).map((candidate) => candidate.guideline.id);

    expect(firstRanking).toEqual(secondRanking);
    expect(firstRanking).toHaveLength(3);
  });

  it('excludes exact guideline repeats inside the five-day cooldown', () => {
    const repeatedGuideline = makeGuideline({
      id: 'def.rebound.find-player-first',
      skillIds: ['def.rebound']
    });
    const alternativeGuideline = makeGuideline({
      id: 'att.finish.two-foot-balance',
      skillIds: ['att.finish']
    });

    const ranking = rankRecommendationCandidates(
      createInput({
        guidelines: [repeatedGuideline, alternativeGuideline],
        recentFocuses: [makeDailyFocus({ guidelineId: repeatedGuideline.id, localDate: '2026-08-15' })],
        skills: [
          makeSkill({ id: 'def.rebound', category: 'defense', tags: ['rebounding'] }),
          makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] })
        ]
      }),
    );

    expect(ranking.map((candidate) => candidate.guideline.id)).toEqual([
      alternativeGuideline.id
    ]);
  });

  it('raises candidates that match active player goals', () => {
    const defenseGuideline = makeGuideline({
      category: 'defense',
      id: 'def.onball.contain-first-step',
      skillIds: ['def.onball']
    });
    const attackGuideline = makeGuideline({
      category: 'attack',
      id: 'att.finish.two-foot-balance',
      skillIds: ['att.finish']
    });

    const recommendation = selectRecommendedGuideline(
      createInput({
        activeGoals: [makeGoal({ goalType: 'defense' })],
        guidelines: [attackGuideline, defenseGuideline],
        skills: [
          makeSkill({ id: 'def.onball', category: 'defense', tags: ['containment'] }),
          makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] })
        ]
      }),
    );

    expect(recommendation?.guideline.id).toBe(defenseGuideline.id);
    expect(recommendation?.reasonCode).toBe('goal');
  });

  it('boosts recent repeated negative observations on linked skills', () => {
    const difficultyGuideline = makeGuideline({
      id: 'att.finish.two-foot-balance',
      skillIds: ['att.finish']
    });
    const neutralGuideline = makeGuideline({
      id: 'habits.prep.one-cue',
      skillIds: ['habits.prep']
    });

    const recommendation = selectRecommendedGuideline(
      createInput({
        guidelines: [neutralGuideline, difficultyGuideline],
        observations: [
          makeObservation({
            id: '22222222-2222-4222-8222-222222222222',
            observedAt: '2026-08-17T12:00:00.000Z',
            polarity: 'negative',
            skillId: 'att.finish'
          }),
          makeObservation({
            id: '33333333-3333-4333-8333-333333333333',
            observedAt: '2026-08-16T12:00:00.000Z',
            polarity: 'negative',
            skillId: 'att.finish'
          })
        ],
        skills: [
          makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] }),
          makeSkill({ id: 'habits.prep', category: 'habits', tags: ['preparation'] })
        ]
      }),
    );

    expect(recommendation?.guideline.id).toBe(difficultyGuideline.id);
    expect(recommendation?.reasonCode).toBe('recent_difficulty');
    expect(recommendation?.breakdown.signals.observationSignal).toBeGreaterThan(0.5);
  });

  it('uses explicit coach feedback observations as a priority boost', () => {
    const coachGuideline = makeGuideline({
      id: 'comm.screen.call-early',
      skillIds: ['comm.screen']
    });
    const fallbackGuideline = makeGuideline({
      id: 'transition.run-immediately',
      skillIds: ['transition.run']
    });

    const recommendation = selectRecommendedGuideline(
      createInput({
        guidelines: [fallbackGuideline, coachGuideline],
        observations: [
          makeObservation({
            id: '22222222-2222-4222-8222-222222222222',
            observedAt: '2026-08-17T12:00:00.000Z',
            polarity: 'neutral',
            skillId: 'comm.screen',
            source: 'coach_feedback'
          })
        ],
        skills: [
          makeSkill({ id: 'comm.screen', category: 'communication', tags: ['screen', 'talk'] }),
          makeSkill({ id: 'transition.run', category: 'transition', tags: ['tempo'] })
        ]
      }),
    );

    expect(recommendation?.guideline.id).toBe(coachGuideline.id);
    expect(recommendation?.reasonCode).toBe('coach_feedback');
    expect(recommendation?.breakdown.modifiers.coachFeedbackBoost).toBeGreaterThan(0);
  });

  it('lets position fit affect ranking when content targets the player position', () => {
    const guardGuideline = makeGuideline({
      id: 'att.guard.create-window',
      positions: ['point_guard'],
      skillIds: ['att.guard']
    });
    const centerGuideline = makeGuideline({
      id: 'att.center.duck-in',
      positions: ['center'],
      skillIds: ['att.center']
    });

    const recommendation = selectRecommendedGuideline(
      createInput({
        guidelines: [centerGuideline, guardGuideline],
        playerProfile: makeProfile({ primaryPosition: 'point_guard' }),
        skills: [
          makeSkill({ id: 'att.guard', positionAffinity: ['point_guard'], tags: ['spacing'] }),
          makeSkill({ id: 'att.center', positionAffinity: ['center'], tags: ['contact'] })
        ]
      }),
    );

    expect(recommendation?.guideline.id).toBe(guardGuideline.id);
    expect(recommendation?.breakdown.signals.positionFit).toBe(1);
  });

  it('penalizes a skill that has appeared in three consecutive recent focuses', () => {
    const repeatedSkillGuideline = makeGuideline({
      id: 'def.rebound.find-player-first',
      skillIds: ['def.rebound']
    });
    const alternativeGuideline = makeGuideline({
      id: 'decision.extra-pass-window',
      skillIds: ['decision.pass']
    });
    const pastGuidelines = [
      makeGuideline({ id: 'past.rebound.one', skillIds: ['def.rebound'] }),
      makeGuideline({ id: 'past.rebound.two', skillIds: ['def.rebound'] }),
      makeGuideline({ id: 'past.rebound.three', skillIds: ['def.rebound'] })
    ];

    const ranking = rankRecommendationCandidates(
      createInput({
        activeGoals: [makeGoal({ goalType: 'rebounding' })],
        guidelines: [repeatedSkillGuideline, alternativeGuideline, ...pastGuidelines],
        recentFocuses: [
          makeDailyFocus({ guidelineId: 'past.rebound.one', localDate: '2026-08-17' }),
          makeDailyFocus({ guidelineId: 'past.rebound.two', localDate: '2026-08-16' }),
          makeDailyFocus({ guidelineId: 'past.rebound.three', localDate: '2026-08-15' })
        ],
        skills: [
          makeSkill({ id: 'def.rebound', category: 'defense', tags: ['rebounding'] }),
          makeSkill({ id: 'decision.pass', category: 'decision_making', tags: ['passing'] })
        ]
      }),
    );

    expect(ranking[0]?.guideline.id).toBe(alternativeGuideline.id);
    expect(
      ranking.find((candidate) => candidate.guideline.id === repeatedSkillGuideline.id)?.breakdown
        .modifiers.consecutiveSkillPenalty,
    ).toBeGreaterThan(0);
  });

  it('uses weak skill state as a recent difficulty signal', () => {
    const weakGuideline = makeGuideline({
      id: 'def.onball.contain-first-step',
      skillIds: ['def.onball']
    });
    const stableGuideline = makeGuideline({
      id: 'habits.prep.one-cue',
      skillIds: ['habits.prep']
    });

    const recommendation = selectRecommendedGuideline(
      createInput({
        guidelines: [stableGuideline, weakGuideline],
        skillStates: [
          makeSkillState({
            score: 0.15,
            skillId: 'def.onball',
            trend: 'down'
          }),
          makeSkillState({
            score: 0.9,
            skillId: 'habits.prep',
            trend: 'up'
          })
        ],
        skills: [
          makeSkill({ id: 'def.onball', category: 'defense', tags: ['containment'] }),
          makeSkill({ id: 'habits.prep', category: 'habits', tags: ['preparation'] })
        ]
      }),
    );

    expect(recommendation?.guideline.id).toBe(weakGuideline.id);
    expect(recommendation?.reasonCode).toBe('recent_difficulty');
  });

  it('returns no recommendation when all candidates are ineligible', () => {
    const recommendation = selectRecommendedGuideline(
      createInput({
        context: 'learning',
        guidelines: [
          makeGuideline({
            contexts: ['practice'],
            id: 'att.finish.two-foot-balance',
            skillIds: ['att.finish']
          })
        ],
        skills: [makeSkill({ id: 'att.finish', tags: ['finishing'] })]
      }),
    );

    expect(recommendation).toBeNull();
  });

  it('filters candidates that are not translated for the provided locale resources', () => {
    const translatedGuideline = makeGuideline({
      id: 'decision.extra-pass-window',
      skillIds: ['decision.pass'],
      translationKey: 'guidelines.decision_extra_pass_window'
    });
    const untranslatedGuideline = makeGuideline({
      id: 'att.finish.two-foot-balance',
      skillIds: ['att.finish'],
      translationKey: 'guidelines.missing_translation'
    });

    const ranking = rankRecommendationCandidates(
      createInput({
        availableTranslationKeys: ['guidelines.decision_extra_pass_window'],
        guidelines: [untranslatedGuideline, translatedGuideline],
        skills: [
          makeSkill({ id: 'decision.pass', category: 'decision_making', tags: ['passing'] }),
          makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] })
        ]
      }),
    );

    expect(ranking.map((candidate) => candidate.guideline.id)).toEqual([
      translatedGuideline.id
    ]);
  });
});

function createInput(overrides: Partial<RecommendationEngineInput>): RecommendationEngineInput {
  return {
    activeGoals: [],
    context: 'practice',
    guidelines: [],
    localDate,
    observations: [],
    playerProfile: null,
    recentFocuses: [],
    skillStates: [],
    skills: [],
    userId,
    ...overrides
  };
}

function makeGuideline(overrides: Partial<Guideline>): Guideline {
  return {
    id: 'att.finish.two-foot-balance',
    skillIds: ['att.finish'],
    category: 'attack',
    subcategory: 'finishing',
    level: 'foundation',
    positions: ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.att_finish_two_foot_balance',
    active: true,
    ...overrides
  };
}

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'att.finish',
    code: 'ATT-FINISH',
    category: 'attack',
    subcategory: 'finishing',
    level: 'foundation',
    positionAffinity: ['all'],
    tags: ['finishing'],
    active: true,
    ...overrides
  };
}

function makeGoal(overrides: Partial<PlayerGoal>): PlayerGoal {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    userId,
    goalType: 'finishing',
    priority: 1,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeObservation(overrides: Partial<Observation>): Observation {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    userId,
    skillId: 'att.finish',
    polarity: 'negative',
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
    skillId: 'att.finish',
    score: 0.5,
    confidence: 1,
    sampleCount: 3,
    trend: 'flat',
    lastObservedAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeDailyFocus(overrides: Partial<DailyFocus>): DailyFocus {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    userId,
    localDate: '2026-08-17',
    guidelineId: 'att.finish.two-foot-balance',
    reasonCode: 'rotation',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function makeProfile(overrides: Partial<PlayerProfile>): PlayerProfile {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    userId,
    birthYear: 2004,
    primaryPosition: 'point_guard',
    competitiveLevel: 'club',
    locale: 'en',
    onboardingCompletedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}
