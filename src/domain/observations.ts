import { z } from 'zod';

import { semanticIdSchema, userIdSchema, utcIsoDateTimeSchema } from './schemas';
import { entityIdSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const observationPolaritySchema = z.enum(['positive', 'negative', 'neutral']);

export const observationSourceSchema = z.enum([
  'self_assessment',
  'reflection',
  'coach_feedback',
  'system',
  'ai'
]);

export const observationSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    sessionId: entityIdSchema.optional(),
    reflectionId: entityIdSchema.optional(),
    skillId: semanticIdSchema,
    pattern: z.string().min(1).max(120).optional(),
    polarity: observationPolaritySchema,
    weight: z.number(),
    source: observationSourceSchema,
    confidence: z.number().min(0).max(1),
    observedAt: utcIsoDateTimeSchema
  })
  .strict();

export const skillTrendSchema = z.enum(['up', 'flat', 'down', 'unknown']);

export const skillStateSchema = z
  .object({
    userId: userIdSchema,
    skillId: semanticIdSchema,
    score: z.number(),
    confidence: z.number().min(0).max(1),
    sampleCount: z.number().int().nonnegative(),
    trend: skillTrendSchema,
    lastObservedAt: utcIsoDateTimeSchema.optional(),
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type ObservationPolarity = z.infer<typeof observationPolaritySchema>;
export type ObservationSource = z.infer<typeof observationSourceSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type SkillTrend = z.infer<typeof skillTrendSchema>;
export type SkillState = z.infer<typeof skillStateSchema>;

export function parseObservation(value: unknown): Observation {
  return parseDomainEntity(observationSchema, value, 'Observation');
}

export function parseSkillState(value: unknown): SkillState {
  return parseDomainEntity(skillStateSchema, value, 'SkillState');
}

