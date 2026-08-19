import 'fake-indexeddb/auto';

import {
  createHoopnoteLocalDb,
  createLocalRepositories,
  resetLocalDatabase,
  type HoopnoteLocalDb
} from '../../persistence/local';
import {
  defaultSelfAssessment,
  OnboardingCompletionError,
  OnboardingService
} from './onboardingService';
import type { OnboardingDraft } from '../../domain';

const userId = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-08-18T12:00:00.000Z');

const openedDbs: HoopnoteLocalDb[] = [];

describe('OnboardingService', () => {
  afterEach(async () => {
    const dbs = openedDbs.splice(0);

    for (const db of dbs) {
      await resetLocalDatabase(db);
      db.close();
      await db.delete();
    }
  });

  it('completes onboarding with optional alias, height and physical context omitted', async () => {
    const { repositories, service } = makeService();

    await repositories.onboardingDrafts.save(
      makeDraft({
        alias: undefined,
        heightCm: undefined,
        physicalContext: undefined
      }),
    );

    const result = await service.complete(userId);

    expect(result.profile).toMatchObject({
      alias: undefined,
      birthYear: 2010,
      heightCm: undefined,
      locale: 'en',
      onboardingCompletedAt: now.toISOString(),
      physicalContext: undefined,
      primaryPosition: 'point_guard',
      userId
    });
    expect(result.goals.map((goal) => goal.goalType)).toEqual(['fundamentals', 'defense']);
    expect(await repositories.profiles.getByUserId(userId)).toMatchObject({
      onboardingCompletedAt: now.toISOString()
    });
    expect(await repositories.playerGoals.listByUserId(userId)).toHaveLength(2);
    const completedDraft = await repositories.onboardingDrafts.getByUserId(userId);

    expect(completedDraft).toMatchObject({
      completedAt: now.toISOString(),
      currentStep: 'completion',
      selfAssessment: defaultSelfAssessment
    });
    expect(completedDraft).not.toHaveProperty('physicalContext');
  });

  it('rejects completion below the minimum age', async () => {
    const { repositories, service } = makeService();

    await repositories.onboardingDrafts.save(makeDraft({ birthYear: 2011 }));

    await expect(service.complete(userId)).rejects.toBeInstanceOf(OnboardingCompletionError);
    await expect(service.complete(userId)).rejects.toMatchObject({ code: 'invalid_age' });
    expect(await repositories.profiles.getByUserId(userId)).toBeNull();
  });
});

function makeService() {
  const db = createHoopnoteLocalDb(`hoopnote-onboarding-service-${crypto.randomUUID()}`);
  openedDbs.push(db);
  const repositories = createLocalRepositories(db);
  const ids = [
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ];

  return {
    repositories,
    service: new OnboardingService({
      createId: () => {
        const id = ids.shift();

        if (!id) {
          throw new Error('No test ID available.');
        }

        return id;
      },
      draftRepository: repositories.onboardingDrafts,
      getNow: () => now,
      getReferenceYear: () => 2026,
      goalRepository: repositories.playerGoals,
      profileRepository: repositories.profiles
    })
  };
}

function makeDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    userId,
    currentStep: 'completion',
    locale: 'en',
    birthYear: 2010,
    primaryPosition: 'point_guard',
    competitiveLevel: 'club',
    goalTypes: ['fundamentals', 'defense'],
    selfAssessment: defaultSelfAssessment,
    updatedAt: now.toISOString(),
    ...overrides
  };
}
