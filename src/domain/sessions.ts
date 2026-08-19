import { z } from 'zod';

import {
  entityIdSchema,
  oneToFiveSchema,
  userIdSchema,
  utcIsoDateTimeSchema
} from './schemas';
import { parseDomainEntity } from './validation';

export const sessionTypeSchema = z.enum(['practice', 'game', 'learning', 'recovery']);

export const sessionSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    type: sessionTypeSchema,
    scheduledAt: utcIsoDateTimeSchema.optional(),
    startedAt: utcIsoDateTimeSchema.optional(),
    completedAt: utcIsoDateTimeSchema.optional(),
    durationMinutes: z.number().int().positive().optional(),
    perceivedLoad: oneToFiveSchema.optional(),
    notes: z.string().min(1).max(2000).optional(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema,
    deletedAt: utcIsoDateTimeSchema.optional()
  })
  .strict();

export const checkInSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    sessionId: entityIdSchema,
    energy: oneToFiveSchema.optional(),
    confidence: oneToFiveSchema.optional(),
    physicalFeeling: oneToFiveSchema.optional(),
    note: z.string().min(1).max(1000).optional(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type SessionType = z.infer<typeof sessionTypeSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CheckIn = z.infer<typeof checkInSchema>;

export function parseSession(value: unknown): Session {
  return parseDomainEntity(sessionSchema, value, 'Session');
}

export function parseCheckIn(value: unknown): CheckIn {
  return parseDomainEntity(checkInSchema, value, 'CheckIn');
}

