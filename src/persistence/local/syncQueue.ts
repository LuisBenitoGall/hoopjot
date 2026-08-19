import { z } from 'zod';

import { entityIdSchema, userIdSchema, utcIsoDateTimeSchema } from '../../domain';

export const syncEntityTypeSchema = z.enum([
  'profiles',
  'player_goals',
  'sessions',
  'check_ins',
  'reflections',
  'observations',
  'skill_state',
  'daily_focus',
  'weekly_reviews'
]);

export const syncOperationTypeSchema = z.enum(['upsert', 'delete']);

export const syncOperationSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    entityType: syncEntityTypeSchema,
    entityId: z.string().min(1),
    operation: syncOperationTypeSchema,
    payload: z.unknown().optional(),
    createdAt: utcIsoDateTimeSchema,
    attemptCount: z.number().int().nonnegative(),
    lastAttemptAt: utcIsoDateTimeSchema.optional(),
    lastError: z.string().min(1).optional()
  })
  .strict();

export type SyncEntityType = z.infer<typeof syncEntityTypeSchema>;
export type SyncOperationType = z.infer<typeof syncOperationTypeSchema>;
export type SyncOperation = z.infer<typeof syncOperationSchema>;

export interface SyncOperationInput {
  entityId: string;
  entityType: SyncEntityType;
  operation: SyncOperationType;
  payload?: unknown;
  userId: string;
}

export function createSyncOperation(input: SyncOperationInput, createdAt: string): SyncOperation {
  return syncOperationSchema.parse({
    id: crypto.randomUUID(),
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payload: input.payload,
    createdAt,
    attemptCount: 0
  });
}

