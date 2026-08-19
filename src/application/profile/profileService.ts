import {
  DomainValidationError,
  assertMinimumAgeForOnboarding,
  parsePlayerProfile,
  type CompetitiveLevel,
  type DominantHand,
  type PhysicalContext,
  type PlayerPosition,
  type PlayerProfile,
  type PlayerProfileRepository
} from '../../domain';

export type ProfileServiceErrorCode =
  | 'birth_year_required'
  | 'competitive_level_required'
  | 'invalid_age'
  | 'not_found'
  | 'primary_position_required'
  | 'save_failed';

export class ProfileServiceError extends Error {
  readonly code: ProfileServiceErrorCode;

  constructor(code: ProfileServiceErrorCode, message: string) {
    super(message);
    this.name = 'ProfileServiceError';
    this.code = code;
  }
}

export interface ProfileUpdateInput {
  alias?: string;
  birthYear?: number;
  competitiveLevel?: CompetitiveLevel;
  dominantHand?: DominantHand;
  experienceYears?: number;
  heightCm?: number;
  locale: string;
  physicalContext?: PhysicalContext;
  primaryPosition?: PlayerPosition;
  secondaryPosition?: PlayerPosition;
  userId: string;
  weeklyGames?: number;
  weeklyPractices?: number;
}

interface ProfileServiceDependencies {
  now?: () => Date;
  profileRepository: PlayerProfileRepository;
}

export class ProfileService {
  private readonly now: () => Date;
  private readonly profileRepository: PlayerProfileRepository;

  constructor({ now = () => new Date(), profileRepository }: ProfileServiceDependencies) {
    this.now = now;
    this.profileRepository = profileRepository;
  }

  async getProfile(userId: string): Promise<PlayerProfile | null> {
    return this.profileRepository.getByUserId(userId);
  }

  async updateProfile(input: ProfileUpdateInput): Promise<PlayerProfile> {
    const existingProfile = await this.profileRepository.getByUserId(input.userId);

    if (!existingProfile) {
      throw new ProfileServiceError('not_found', 'Profile was not found.');
    }

    if (!input.birthYear) {
      throw new ProfileServiceError('birth_year_required', 'Birth year is required.');
    }

    if (!input.primaryPosition) {
      throw new ProfileServiceError('primary_position_required', 'Primary position is required.');
    }

    if (!input.competitiveLevel) {
      throw new ProfileServiceError(
        'competitive_level_required',
        'Competitive level is required.',
      );
    }

    try {
      assertMinimumAgeForOnboarding(input.birthYear, this.now().getFullYear());
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new ProfileServiceError('invalid_age', 'Player must be at least 16.');
      }

      throw error;
    }

    const updatedAt = this.now().toISOString();
    const profile = parsePlayerProfile({
      ...existingProfile,
      alias: normalizeOptionalText(input.alias),
      birthYear: input.birthYear,
      competitiveLevel: input.competitiveLevel,
      dominantHand: input.dominantHand,
      experienceYears: input.experienceYears,
      heightCm: input.heightCm,
      locale: input.locale,
      physicalContext: input.physicalContext,
      primaryPosition: input.primaryPosition,
      secondaryPosition: input.secondaryPosition,
      updatedAt,
      weeklyGames: input.weeklyGames,
      weeklyPractices: input.weeklyPractices
    });

    await this.profileRepository.save(profile);

    return profile;
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim() ?? '';

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
