import { z } from 'zod';

import {
  entityIdSchema,
  oneToFiveSchema,
  userIdSchema,
  utcIsoDateTimeSchema
} from './schemas';
import { parseDomainEntity } from './validation';

export const reflectionSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    sessionId: entityIdSchema,
    dailyFocusId: entityIdSchema.optional(),
    focusRating: oneToFiveSchema,
    note: z.string().min(1).max(2000).optional(),
    coachFeedback: z.string().min(1).max(2000).optional(),
    rememberNextTime: z.string().min(1).max(1000).optional(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type Reflection = z.infer<typeof reflectionSchema>;

export function parseReflection(value: unknown): Reflection {
  return parseDomainEntity(reflectionSchema, value, 'Reflection');
}

