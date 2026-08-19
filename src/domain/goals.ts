import { z } from 'zod';

import { DomainValidationError } from './errors';
import { entityIdSchema, userIdSchema, utcIsoDateTimeSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const MAX_ACTIVE_GOALS = 3;

export const goalTypeSchema = z.enum([
  'more_minutes',
  'fundamentals',
  'game_understanding',
  'defense',
  'rebounding',
  'inside_game',
  'finishing',
  'decision_making',
  'confidence',
  'rebuild_game_confidence',
  'custom'
]);

export const goalPrioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const playerGoalSchema = z
  .object({
    id: entityIdSchema,
    userId: userIdSchema,
    goalType: goalTypeSchema,
    customLabel: z.string().min(1).max(80).optional(),
    priority: goalPrioritySchema,
    active: z.boolean(),
    createdAt: utcIsoDateTimeSchema,
    updatedAt: utcIsoDateTimeSchema
  })
  .strict();

export type GoalType = z.infer<typeof goalTypeSchema>;
export type GoalPriority = z.infer<typeof goalPrioritySchema>;
export type PlayerGoal = z.infer<typeof playerGoalSchema>;

export function parsePlayerGoal(value: unknown): PlayerGoal {
  return parseDomainEntity(playerGoalSchema, value, 'PlayerGoal');
}

export function countActiveGoals(goals: Pick<PlayerGoal, 'active'>[]): number {
  return goals.filter((goal) => goal.active).length;
}

export function assertActiveGoalLimit(goals: Pick<PlayerGoal, 'active'>[]): void {
  const activeGoalCount = countActiveGoals(goals);

  if (activeGoalCount > MAX_ACTIVE_GOALS) {
    throw new DomainValidationError(
      'too_many_active_goals',
      `A player can have at most ${MAX_ACTIVE_GOALS} active goals`,
      [{ path: 'goals', message: `${activeGoalCount} active goals provided` }],
    );
  }
}

export function assertCanSaveGoal(existingGoals: PlayerGoal[], nextGoal: PlayerGoal): void {
  const goalsById = new Map(existingGoals.map((goal) => [goal.id, goal]));
  goalsById.set(nextGoal.id, nextGoal);
  assertActiveGoalLimit([...goalsById.values()]);
}

