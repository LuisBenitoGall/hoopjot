import { z } from 'zod';

import { entityIdSchema, localDateSchema, semanticIdSchema, userIdSchema } from './schemas';
import { utcIsoDateTimeSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const dailyFocusReasonCodeSchema = z.enum([
  'goal',
  'recent_difficulty',
  'coach_feedback',
  'development_path',
  'rotation'
]);

export const dailyFocusStatusSchema = z.enum(['planned', 'viewed', 'completed', 'skipped']);

export const dailyFocusSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    localDate: localDateSchema,
    guidelineId: semanticIdSchema,
    reasonCode: dailyFocusReasonCodeSchema,
    status: dailyFocusStatusSchema,
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type DailyFocusReasonCode = z.infer<typeof dailyFocusReasonCodeSchema>;
export type DailyFocusStatus = z.infer<typeof dailyFocusStatusSchema>;
export type DailyFocus = z.infer<typeof dailyFocusSchema>;

export function parseDailyFocus(value: unknown): DailyFocus {
  return parseDomainEntity(dailyFocusSchema, value, 'DailyFocus');
}

