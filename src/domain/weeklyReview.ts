import { z } from 'zod';

import { entityIdSchema, localDateSchema, semanticIdSchema, userIdSchema } from './schemas';
import { utcIsoDateTimeSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const weeklyReviewSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    weekStart: localDateSchema,
    highlightedSkillIds: z.array(semanticIdSchema),
    improvingSkillIds: z.array(semanticIdSchema),
    recurringSkillIds: z.array(semanticIdSchema),
    nextPrioritySkillIds: z.array(semanticIdSchema),
    userImprovementNote: z.string().min(1).max(2000).optional(),
    userNextWeekNote: z.string().min(1).max(2000).optional(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;

export function parseWeeklyReview(value: unknown): WeeklyReview {
  return parseDomainEntity(weeklyReviewSchema, value, 'WeeklyReview');
}

