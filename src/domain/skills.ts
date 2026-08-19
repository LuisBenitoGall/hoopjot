import { z } from 'zod';

import { playerPositionSchema } from './player';
import { semanticIdSchema } from './schemas';
import { parseDomainEntity } from './validation';

export const skillCategorySchema = z.enum([
  'attack',
  'defense',
  'transition',
  'communication',
  'decision_making',
  'habits'
]);

export const skillLevelSchema = z.enum(['foundation', 'intermediate', 'advanced']);

export const positionAffinitySchema = z.union([
  z.array(playerPositionSchema).min(1),
  z.tuple([z.literal('all')])
]);

export const guidelineContextSchema = z.enum(['practice', 'game', 'learning']);

export const skillSchema = z
  .object({
    id: semanticIdSchema,
    code: z.string().min(1),
    category: skillCategorySchema,
    subcategory: z.string().min(1),
    level: skillLevelSchema,
    positionAffinity: positionAffinitySchema,
    tags: z.array(z.string().min(1)),
    active: z.boolean()
  })
  .strict();

export const guidelineSchema = z
  .object({
    id: semanticIdSchema,
    skillIds: z.array(semanticIdSchema).min(1),
    category: z.string().min(1),
    subcategory: z.string().min(1),
    level: skillLevelSchema,
    positions: positionAffinitySchema,
    contexts: z.array(guidelineContextSchema).min(1),
    translationKey: z.string().min(1),
    active: z.boolean()
  })
  .strict();

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillLevel = z.infer<typeof skillLevelSchema>;
export type PositionAffinity = z.infer<typeof positionAffinitySchema>;
export type GuidelineContext = z.infer<typeof guidelineContextSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Guideline = z.infer<typeof guidelineSchema>;

export function parseSkill(value: unknown): Skill {
  return parseDomainEntity(skillSchema, value, 'Skill');
}

export function parseGuideline(value: unknown): Guideline {
  return parseDomainEntity(guidelineSchema, value, 'Guideline');
}

