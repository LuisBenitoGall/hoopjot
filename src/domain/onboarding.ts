import { z } from 'zod';

import { goalTypeSchema, MAX_ACTIVE_GOALS } from './goals';
import {
  competitiveLevelSchema,
  dominantHandSchema,
  physicalContextSchema,
  playerPositionSchema
} from './player';
import { oneToFiveSchema, userIdSchema, utcIsoDateTimeSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const onboardingStepSchema = z.enum([
  'locale',
  'profile',
  'experience',
  'goals',
  'assessment',
  'physical',
  'completion'
]);

export const selfAssessmentSchema = z
  .object({
    ballHandling: oneToFiveSchema,
    shooting: oneToFiveSchema,
    defense: oneToFiveSchema,
    decisionMaking: oneToFiveSchema,
    confidence: oneToFiveSchema
  })
  .strict();

export const onboardingDraftSchema = z
  .object({
    userId: userIdSchema,
    currentStep: onboardingStepSchema,
    locale: z.string().min(2).max(16),
    alias: z.string().min(1).max(80).optional(),
    birthYear: z.number().int().gte(1900).lte(9999).optional(),
    heightCm: z.number().int().positive().optional(),
    dominantHand: dominantHandSchema.optional(),
    primaryPosition: playerPositionSchema.optional(),
    secondaryPosition: playerPositionSchema.optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    competitiveLevel: competitiveLevelSchema.optional(),
    weeklyPractices: z.number().int().nonnegative().optional(),
    weeklyGames: z.number().int().nonnegative().optional(),
    goalTypes: z.array(goalTypeSchema).max(MAX_ACTIVE_GOALS),
    selfAssessment: selfAssessmentSchema,
    physicalContext: physicalContextSchema.optional(),
    completedAt: utcIsoDateTimeSchema.optional(),
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type SelfAssessment = z.infer<typeof selfAssessmentSchema>;
export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export function parseOnboardingDraft(value: unknown): OnboardingDraft {
  return parseDomainEntity(onboardingDraftSchema, value, 'OnboardingDraft');
}
