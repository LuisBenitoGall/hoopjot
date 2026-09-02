import { GuideService, normalizeGuideLocale } from './guideService';
import { resolveGuide, type GuideSelection } from '../../content/guide';
import type { PlayerProfile, PlayerProfileRepository } from '../../domain';

const userId = '11111111-1111-4111-8111-111111111111';
const timestamp = '2026-08-24T10:00:00.000Z';

describe('GuideService', () => {
  it('maps the real profile primary and secondary positions into a Guide selection', async () => {
    const resolve = vi.fn((selection: GuideSelection) => resolveGuide(selection));
    const service = new GuideService({
      profileRepository: fakeProfileRepository(
        makeProfile({
          primaryPosition: 'point_guard',
          secondaryPosition: 'shooting_guard',
        }),
      ),
      resolve,
    });

    const result = await service.getGuideForPlayer({ locale: 'en-US', userId });

    expect(result.status).toBe('ready');
    expect(resolve).toHaveBeenCalledWith({
      locale: 'en',
      primaryPosition: 'PG',
      secondaryPosition: 'SG',
    });
    expect(result.status === 'ready' ? result.guide.primaryPosition : null).toBe('PG');
    expect(result.status === 'ready' ? result.guide.secondaryPosition : null).toBe('SG');
  });

  it('resolves Spanish Guide content from the real app locale', async () => {
    const service = new GuideService({
      profileRepository: fakeProfileRepository(makeProfile()),
    });

    const result = await service.getGuideForPlayer({ locale: 'es-ES', userId });

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' ? result.guide.locale : null).toBe('es');
    expect(result.status === 'ready' ? result.guide.title : null).toBe(
      'HOOPJOT — GUÍA DE TRABAJO Y HÁBITOS',
    );
  });

  it('keeps the real primary position while using the neutral order-independent bridge', async () => {
    const service = new GuideService({
      profileRepository: fakeProfileRepository(
        makeProfile({
          primaryPosition: 'shooting_guard',
          secondaryPosition: 'point_guard',
        }),
      ),
    });

    const result = await service.getGuideForPlayer({ locale: 'en', userId });

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' ? result.guide.primaryPosition : null).toBe('SG');
    expect(result.status === 'ready' ? result.guide.secondaryPosition : null).toBe('PG');
    expect(result.status === 'ready' ? result.guide.bridgeKey : null).toBe('PG_SG');
  });

  it('uses the Guide fallback locale when the app receives an unsupported locale', async () => {
    expect(normalizeGuideLocale('fr-FR')).toBe('es');
    expect(normalizeGuideLocale(undefined)).toBe('es');
  });

  it('resolves without a bridge when secondary position is absent', async () => {
    const service = new GuideService({
      profileRepository: fakeProfileRepository(makeProfile({ secondaryPosition: undefined })),
    });

    const result = await service.getGuideForPlayer({ locale: 'en', userId });

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' ? result.guide.bridgeKey : 'unexpected').toBeNull();
    expect(result.status === 'ready' ? result.guide.secondaryPosition : 'unexpected').toBeNull();
  });

  it('resolves without a bridge when secondary position matches primary position', async () => {
    const service = new GuideService({
      profileRepository: fakeProfileRepository(
        makeProfile({
          primaryPosition: 'small_forward',
          secondaryPosition: 'small_forward',
        }),
      ),
    });

    const result = await service.getGuideForPlayer({ locale: 'en', userId });

    expect(result.status).toBe('ready');
    expect(result.status === 'ready' ? result.guide.primaryPosition : null).toBe('SF');
    expect(result.status === 'ready' ? result.guide.bridgeKey : 'unexpected').toBeNull();
  });

  it('does not resolve or infer Guide content without a valid primary position', async () => {
    const resolve = vi.fn((selection: GuideSelection) => resolveGuide(selection));
    const service = new GuideService({
      profileRepository: fakeProfileRepository({
        ...makeProfile(),
        primaryPosition: undefined,
      } as unknown as PlayerProfile),
      resolve,
    });

    const result = await service.getGuideForPlayer({ locale: 'en', userId });

    expect(result).toEqual({ status: 'missing_primary_position' });
    expect(resolve).not.toHaveBeenCalled();
  });
});

function fakeProfileRepository(profile: PlayerProfile | null): Pick<PlayerProfileRepository, 'getByUserId'> {
  return {
    getByUserId: vi.fn(async (requestedUserId: string) =>
      requestedUserId === userId ? profile : null,
    ),
  };
}

function makeProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    userId,
    alias: 'Wing',
    birthYear: 2004,
    heightCm: 182,
    dominantHand: 'right',
    primaryPosition: 'point_guard',
    secondaryPosition: 'shooting_guard',
    experienceYears: 6,
    competitiveLevel: 'club',
    weeklyPractices: 3,
    weeklyGames: 1,
    locale: 'en',
    physicalContext: { status: 'none' },
    onboardingCompletedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}
