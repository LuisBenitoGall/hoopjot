import type {
  BasketballContentRepository,
  DailyFocus,
  DailyFocusRepository,
  Guideline,
  Observation,
  ObservationRepository,
  PlayerGoal,
  PlayerGoalRepository,
  PlayerProfile,
  PlayerProfileRepository,
  Session,
  SessionRepository,
  Skill,
  SkillState,
  SkillStateRepository
} from '../../domain';
import { TodayService } from './todayService';

const userId = '11111111-1111-4111-8111-111111111111';
const focusId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const localDate = '2026-08-18';
const timestamp = '2026-08-18T12:00:00.000Z';
const updatedTimestamp = '2026-08-18T13:00:00.000Z';

describe('TodayService', () => {
  it('creates one deterministic starter focus per date and preserves it on reload', async () => {
    const dailyFocusRepository = new MemoryDailyFocusRepository();
    const service = createService({
      dailyFocusRepository,
      guidelines: [makeGuideline({ id: 'att.onball.protect-outside-hip' })],
      sessions: []
    });

    const firstResult = await service.getOrCreateTodayFocus(userId);
    const secondResult = await service.getOrCreateTodayFocus(userId);

    expect(firstResult.dailyFocus).toMatchObject({
      id: focusId,
      localDate,
      reasonCode: 'rotation',
      status: 'planned'
    });
    expect(secondResult.dailyFocus).toEqual(firstResult.dailyFocus);
    expect(dailyFocusRepository.saveCount).toBe(1);
    expect(dailyFocusRepository.count()).toBe(1);
  });

  it('uses a practice, game or learning session context when selecting starter content', async () => {
    const service = createService({
      guidelines: [
        makeGuideline({
          contexts: ['practice', 'game'],
          id: 'att.onball.protect-outside-hip'
        }),
        makeGuideline({
          contexts: ['learning'],
          id: 'decision.extra-pass-window',
          translationKey: 'guidelines.decision_extra_pass_window'
        })
      ],
      sessions: [makeSession({ type: 'learning' })]
    });

    const result = await service.getOrCreateTodayFocus(userId);

    expect(result.selectionContext).toBe('learning');
    expect(result.guideline?.id).toBe('decision.extra-pass-window');
  });

  it('does not create a guideline recommendation for a recovery-only day', async () => {
    const contentRepository = new MemoryContentRepository([
      makeGuideline({ id: 'att.onball.protect-outside-hip' })
    ]);
    const dailyFocusRepository = new MemoryDailyFocusRepository();
    const service = createService({
      contentRepository,
      dailyFocusRepository,
      sessions: [makeSession({ type: 'recovery' })]
    });

    const result = await service.getOrCreateTodayFocus(userId);

    expect(result).toMatchObject({
      dailyFocus: null,
      guideline: null,
      localDate,
      unavailableReason: 'recovery_session'
    });
    expect(contentRepository.listGuidelines).not.toHaveBeenCalled();
    expect(dailyFocusRepository.count()).toBe(0);
  });

  it('updates the locally stored focus status', async () => {
    const dailyFocusRepository = new MemoryDailyFocusRepository();
    const service = createService({
      dailyFocusRepository,
      getNow: makeSequentialNow([timestamp, updatedTimestamp]),
      guidelines: [makeGuideline({ id: 'att.onball.protect-outside-hip' })],
      sessions: []
    });

    await service.getOrCreateTodayFocus(userId);
    const result = await service.updateTodayFocusStatus(userId, 'completed');

    expect(result.dailyFocus).toMatchObject({
      status: 'completed',
      updatedAt: updatedTimestamp
    });
    expect(await dailyFocusRepository.getByLocalDate(userId, localDate)).toMatchObject({
      status: 'completed'
    });
  });

  it('uses active goals and profile context when creating the daily focus', async () => {
    const service = createService({
      goals: [makeGoal({ goalType: 'rebounding' })],
      guidelines: [
        makeGuideline({
          category: 'attack',
          id: 'att.finish.two-foot-balance',
          skillIds: ['att.finish']
        }),
        makeGuideline({
          category: 'defense',
          id: 'def.rebound.find-player-first',
          skillIds: ['def.rebound'],
          subcategory: 'rebounding'
        })
      ],
      profile: makeProfile({ primaryPosition: 'center' }),
      sessions: [],
      skills: [
        makeSkill({ id: 'att.finish', tags: ['finishing'] }),
        makeSkill({
          category: 'defense',
          id: 'def.rebound',
          positionAffinity: ['center'],
          tags: ['rebounding']
        })
      ]
    });

    const result = await service.getOrCreateTodayFocus(userId);

    expect(result.guideline?.id).toBe('def.rebound.find-player-first');
    expect(result.dailyFocus).toMatchObject({
      guidelineId: 'def.rebound.find-player-first',
      reasonCode: 'goal'
    });
  });

  it('uses recent structured observations when creating the daily focus', async () => {
    const service = createService({
      guidelines: [
        makeGuideline({
          id: 'habits.prep.one-cue',
          skillIds: ['habits.prep']
        }),
        makeGuideline({
          category: 'attack',
          id: 'att.finish.two-foot-balance',
          skillIds: ['att.finish']
        })
      ],
      observations: [
        makeObservation({
          id: '77777777-7777-4777-8777-777777777777',
          observedAt: '2026-08-17T12:00:00.000Z',
          skillId: 'att.finish'
        }),
        makeObservation({
          id: '88888888-8888-4888-8888-888888888888',
          observedAt: '2026-08-16T12:00:00.000Z',
          skillId: 'att.finish'
        })
      ],
      sessions: [],
      skills: [
        makeSkill({ id: 'habits.prep', category: 'habits', tags: ['preparation'] }),
        makeSkill({ id: 'att.finish', category: 'attack', tags: ['finishing'] })
      ]
    });

    const result = await service.getOrCreateTodayFocus(userId);

    expect(result.guideline?.id).toBe('att.finish.two-foot-balance');
    expect(result.dailyFocus?.reasonCode).toBe('recent_difficulty');
  });
});

function createService({
  contentRepository,
  dailyFocusRepository = new MemoryDailyFocusRepository(),
  getNow = () => new Date(timestamp),
  goals = [],
  guidelines = [],
  observations = [],
  profile = null,
  sessions,
  skillStates = [],
  skills = []
}: {
  contentRepository?: BasketballContentRepository;
  dailyFocusRepository?: DailyFocusRepository;
  getNow?: () => Date;
  goals?: PlayerGoal[];
  guidelines?: Guideline[];
  observations?: Observation[];
  profile?: PlayerProfile | null;
  sessions: Session[];
  skillStates?: SkillState[];
  skills?: Skill[];
}): TodayService {
  return new TodayService({
    contentRepository: contentRepository ?? new MemoryContentRepository(guidelines, skills),
    createId: () => focusId,
    dailyFocusRepository,
    getLocalDate: () => localDate,
    getNow,
    goalRepository: new MemoryGoalRepository(goals),
    observationRepository: new MemoryObservationRepository(observations),
    profileRepository: new MemoryProfileRepository(profile),
    sessionRepository: new MemorySessionRepository(sessions),
    skillStateRepository: new MemorySkillStateRepository(skillStates)
  });
}

class MemoryDailyFocusRepository implements DailyFocusRepository {
  saveCount = 0;
  private readonly records = new Map<string, DailyFocus>();

  async delete(id: string): Promise<void> {
    for (const [key, dailyFocus] of this.records.entries()) {
      if (dailyFocus.id === id) {
        this.records.delete(key);
        break;
      }
    }
  }

  async getByLocalDate(userId: string, localDate: string): Promise<DailyFocus | null> {
    return this.records.get(getFocusKey(userId, localDate)) ?? null;
  }

  async getById(id: string): Promise<DailyFocus | null> {
    return Array.from(this.records.values()).find((dailyFocus) => dailyFocus.id === id) ?? null;
  }

  async listByUserId(userId: string): Promise<DailyFocus[]> {
    return Array.from(this.records.values()).filter((dailyFocus) => dailyFocus.userId === userId);
  }

  async save(dailyFocus: DailyFocus): Promise<void> {
    this.saveCount += 1;
    this.records.set(getFocusKey(dailyFocus.userId, dailyFocus.localDate), dailyFocus);
  }

  count(): number {
    return this.records.size;
  }
}

class MemorySessionRepository implements SessionRepository {
  constructor(private readonly sessions: Session[]) {}

  async delete(): Promise<void> {
    return undefined;
  }

  async getById(id: string): Promise<Session | null> {
    return this.sessions.find((session) => session.id === id) ?? null;
  }

  async listByUserId(userId: string): Promise<Session[]> {
    return this.sessions.filter((session) => session.userId === userId);
  }

  async save(session: Session): Promise<void> {
    this.sessions.push(session);
  }
}

class MemoryContentRepository implements BasketballContentRepository {
  readonly listGuidelines = vi.fn(async () => this.guidelines);

  constructor(
    private readonly guidelines: Guideline[],
    private readonly skills: Skill[] = [],
  ) {}

  async getGuidelineById(id: string): Promise<Guideline | null> {
    return this.guidelines.find((guideline) => guideline.id === id) ?? null;
  }

  async getSkillById(): Promise<Skill | null> {
    return null;
  }

  async listSkills(): Promise<Skill[]> {
    return this.skills;
  }
}

class MemoryGoalRepository implements PlayerGoalRepository {
  constructor(private readonly goals: PlayerGoal[]) {}

  async delete(): Promise<void> {
    return undefined;
  }

  async listByUserId(userId: string): Promise<PlayerGoal[]> {
    return this.goals.filter((goal) => goal.userId === userId);
  }

  async save(goal: PlayerGoal): Promise<void> {
    this.goals.push(goal);
  }
}

class MemoryObservationRepository implements ObservationRepository {
  constructor(private readonly observations: Observation[]) {}

  async delete(): Promise<void> {
    return undefined;
  }

  async listByUserId(userId: string): Promise<Observation[]> {
    return this.observations.filter((observation) => observation.userId === userId);
  }

  async save(observation: Observation): Promise<void> {
    this.observations.push(observation);
  }
}

class MemoryProfileRepository implements PlayerProfileRepository {
  constructor(private readonly profile: PlayerProfile | null) {}

  async deleteByUserId(): Promise<void> {
    return undefined;
  }

  async getByUserId(userId: string): Promise<PlayerProfile | null> {
    return this.profile?.userId === userId ? this.profile : null;
  }

  async save(): Promise<void> {
    return undefined;
  }
}

class MemorySkillStateRepository implements SkillStateRepository {
  constructor(private readonly skillStates: SkillState[]) {}

  async delete(): Promise<void> {
    return undefined;
  }

  async getBySkillId(userId: string, skillId: string): Promise<SkillState | null> {
    return (
      this.skillStates.find(
        (skillState) => skillState.userId === userId && skillState.skillId === skillId,
      ) ?? null
    );
  }

  async listByUserId(userId: string): Promise<SkillState[]> {
    return this.skillStates.filter((skillState) => skillState.userId === userId);
  }

  async save(skillState: SkillState): Promise<void> {
    this.skillStates.push(skillState);
  }
}

function makeGuideline(overrides: Partial<Guideline>): Guideline {
  const id = overrides.id ?? 'att.onball.protect-outside-hip';

  return {
    id,
    skillIds: ['att.onball.protect-dribble'],
    category: 'attack',
    subcategory: 'on_ball',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.att_onball_protect_outside_hip',
    active: true,
    ...overrides
  };
}

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: sessionId,
    userId,
    type: 'practice',
    scheduledAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
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

function makeProfile(overrides: Partial<PlayerProfile>): PlayerProfile {
  return {
    id: '66666666-6666-4666-8666-666666666666',
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

function makeSequentialNow(values: string[]): () => Date {
  let index = 0;

  return () => new Date(values[Math.min(index++, values.length - 1)] ?? timestamp);
}

function getFocusKey(userId: string, localDate: string): string {
  return `${userId}:${localDate}`;
}
