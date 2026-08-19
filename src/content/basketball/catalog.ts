import { z } from 'zod';

import {
  guidelineSchema,
  parseGuideline,
  parseSkill,
  skillSchema,
  type Guideline,
  type Skill
} from '../../domain';
import {
  starterCatalogVersion,
  starterGuidelines,
  starterSkills
} from './editorialStarterCatalog';

export interface BasketballCatalog {
  guidelines: Guideline[];
  skills: Skill[];
  version: string;
}

const basketballCatalogSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    skills: z.array(skillSchema).min(1),
    guidelines: z.array(guidelineSchema).min(1)
  })
  .strict();

export const basketballCatalog: BasketballCatalog = basketballCatalogSchema.parse({
  version: starterCatalogVersion,
  skills: starterSkills.map(parseSkill),
  guidelines: starterGuidelines.map(parseGuideline)
});

export const basketballCatalogVersion = basketballCatalog.version;
