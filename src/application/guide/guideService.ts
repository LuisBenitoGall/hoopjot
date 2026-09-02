import {
  playerPositionToGuidePosition,
  resolveGuide,
  toGuideSelectionFromPlayerProfile,
  type GuideLocale,
  type ResolvedGuide,
} from '../../content/guide';
import {
  type PlayerPosition,
  type PlayerProfile,
  type PlayerProfileRepository,
} from '../../domain';

export type GuideForPlayerResult =
  | {
      guide: ResolvedGuide;
      status: 'ready';
    }
  | {
      status: 'missing_primary_position';
    };

export interface GuideForPlayerInput {
  locale: string | undefined;
  userId: string;
}

export interface GuideServicePort {
  getGuideForPlayer(input: GuideForPlayerInput): Promise<GuideForPlayerResult>;
}

interface GuideServiceDependencies {
  profileRepository: Pick<PlayerProfileRepository, 'getByUserId'>;
  resolve?: typeof resolveGuide;
}

export class GuideService implements GuideServicePort {
  private readonly profileRepository: Pick<PlayerProfileRepository, 'getByUserId'>;
  private readonly resolve: typeof resolveGuide;

  constructor({ profileRepository, resolve = resolveGuide }: GuideServiceDependencies) {
    this.profileRepository = profileRepository;
    this.resolve = resolve;
  }

  async getGuideForPlayer({
    locale,
    userId,
  }: GuideForPlayerInput): Promise<GuideForPlayerResult> {
    const profile = await this.profileRepository.getByUserId(userId);
    const primaryPosition = getValidPlayerPosition(profile, 'primaryPosition');

    if (!primaryPosition) {
      return { status: 'missing_primary_position' };
    }

    const secondaryPosition = getValidPlayerPosition(profile, 'secondaryPosition');
    const guide = this.resolve(
      toGuideSelectionFromPlayerProfile({
        locale: normalizeGuideLocale(locale),
        primaryPosition,
        secondaryPosition,
      }),
    );

    return {
      guide,
      status: 'ready',
    };
  }
}

export function normalizeGuideLocale(locale: string | undefined): GuideLocale {
  const language = locale?.split('-')[0]?.toLowerCase();

  if (language === 'en' || language === 'es') {
    return language;
  }

  return 'es';
}

function getValidPlayerPosition(
  profile: PlayerProfile | null,
  key: 'primaryPosition' | 'secondaryPosition',
): PlayerPosition | null {
  const value = profile?.[key];

  return isPlayerPosition(value) ? value : null;
}

function isPlayerPosition(value: unknown): value is PlayerPosition {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(playerPositionToGuidePosition, value)
  );
}
