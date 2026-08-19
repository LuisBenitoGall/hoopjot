import { z } from 'zod';

export const entityIdSchema = z.string().uuid();
export const semanticIdSchema = z.string().min(1);
export const userIdSchema = z.string().uuid();
export const utcIsoDateTimeSchema = z.string().datetime({ offset: true });
export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const oneToFiveSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
]);

export const syncStatusSchema = z.enum(['local', 'pending', 'synced', 'error']);

export const syncFieldsSchema = z.object({
  id: entityIdSchema,
  userId: userIdSchema,
  createdAt: utcIsoDateTimeSchema,
  updatedAt: utcIsoDateTimeSchema,
  deletedAt: utcIsoDateTimeSchema.optional(),
  syncStatus: syncStatusSchema
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type SyncFields = z.infer<typeof syncFieldsSchema>;

