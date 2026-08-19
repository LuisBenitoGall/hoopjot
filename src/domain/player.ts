import { z } from 'zod';

import { DomainValidationError } from './errors';
import { entityIdSchema, userIdSchema, utcIsoDateTimeSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const MINIMUM_PLAYER_AGE = 16;

export const playerPositionSchema = z.enum([
  'point_guard',
  'shooting_guard',
  'small_forward',
  'power_forward',
  'center'
]);

export const dominantHandSchema = z.enum(['right', 'left', 'both', 'prefer_not_to_say']);

export const competitiveLevelSchema = z.enum([
  'recreational',
  'club',
  'academy',
  'high_school',
  'college',
  'semi_pro',
  'professional',
  'other'
]);

export const physicalContextSchema = z
  .object({
    status: z.enum(['none', 'recovering', 'limited', 'prefer_not_to_say']),
    note: z.string().min(1).max(500).optional()
  })
  .strict();

export const playerProfileSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    alias: z.string().min(1).max(80).optional(),
    birthYear: z.number().int().gte(1900).lte(9999),
    heightCm: z.number().int().positive().optional(),
    dominantHand: dominantHandSchema.optional(),
    primaryPosition: playerPositionSchema,
    secondaryPosition: playerPositionSchema.optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    competitiveLevel: competitiveLevelSchema,
    weeklyPractices: z.number().int().nonnegative().optional(),
    weeklyGames: z.number().int().nonnegative().optional(),
    locale: z.string().min(2).max(16),
    physicalContext: physicalContextSchema.optional(),
    onboardingCompletedAt: utcIsoDateTimeSchema.optional(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type PlayerPosition = z.infer<typeof playerPositionSchema>;
export type DominantHand = z.infer<typeof dominantHandSchema>;
export type CompetitiveLevel = z.infer<typeof competitiveLevelSchema>;
export type PhysicalContext = z.infer<typeof physicalContextSchema>;
export type PlayerProfile = z.infer<typeof playerProfileSchema>;

export function parsePlayerProfile(value: unknown): PlayerProfile {
  return parseDomainEntity(playerProfileSchema, value, 'PlayerProfile');
}

export function calculateAgeFromBirthYear(birthYear: number, referenceYear: number): number {
  return referenceYear - birthYear;
}

export function assertMinimumAgeForOnboarding(
  birthYear: number,
  referenceYear: number,
): void {
  const age = calculateAgeFromBirthYear(birthYear, referenceYear);

  if (age < MINIMUM_PLAYER_AGE) {
    throw new DomainValidationError(
      'invalid_age',
      `Player must be at least ${MINIMUM_PLAYER_AGE} to complete onboarding`,
      [{ path: 'birthYear', message: `Calculated age ${age} is below ${MINIMUM_PLAYER_AGE}` }],
    );
  }
}

export function assertCanCompleteOnboarding(
  profile: Pick<PlayerProfile, 'birthYear'>,
  referenceYear: number,
): void {
  assertMinimumAgeForOnboarding(profile.birthYear, referenceYear);
}

