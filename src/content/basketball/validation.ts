import { z } from 'zod';

import type { Guideline } from '../../domain';
import { basketballCatalog } from './catalog';

export const MVP_STARTER_GUIDELINE_COUNT = 12;

export const guidelineTranslationSchema = z
  .object({
    title: z.string().min(1),
    instruction: z.string().min(1),
    cue: z.string().min(1),
    explanation: z.string().min(1).optional(),
    commonMistakes: z.array(z.string().min(1)).optional(),
    reflectionPrompt: z.string().min(1).optional()
  })
  .strict();

export type GuidelineTranslation = z.infer<typeof guidelineTranslationSchema>;

export function validateBasketballCatalogIntegrity(): string[] {
  return [
    ...validateUniqueIds('skills', basketballCatalog.skills),
    ...validateUniqueIds('guidelines', basketballCatalog.guidelines),
    ...validateGuidelineSkillReferences(),
    ...validateStarterCoverage()
  ];
}

export function validateBasketballContentTranslations(
  resourcesByLocale: Record<string, unknown>,
): string[] {
  const issues: string[] = [];

  for (const [locale, resource] of Object.entries(resourcesByLocale)) {
    for (const guideline of basketballCatalog.guidelines) {
      const value = getPathValue(resource, guideline.translationKey);
      const parsed = guidelineTranslationSchema.safeParse(value);

      if (value === undefined) {
        issues.push(`${locale}:${guideline.id} is missing ${guideline.translationKey}`);
        continue;
      }

      if (!parsed.success) {
        issues.push(
          `${locale}:${guideline.id} has invalid content: ${parsed.error.issues
            .map((issue) => `${issue.path.join('.') || 'value'} ${issue.message}`)
            .join(', ')}`,
        );
      }
    }
  }

  return issues;
}

function validateUniqueIds(collectionName: string, items: Array<{ id: string }>): string[] {
  const seen = new Set<string>();
  const issues: string[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push(`${collectionName} contains duplicate id ${item.id}`);
    }

    seen.add(item.id);
  }

  return issues;
}

function validateGuidelineSkillReferences(): string[] {
  const skillIds = new Set(basketballCatalog.skills.map((skill) => skill.id));
  const issues: string[] = [];

  for (const guideline of basketballCatalog.guidelines) {
    for (const skillId of guideline.skillIds) {
      if (!skillIds.has(skillId)) {
        issues.push(`${guideline.id} references missing skill ${skillId}`);
      }
    }
  }

  return issues;
}

function validateStarterCoverage(): string[] {
  const activeGuidelines = basketballCatalog.guidelines.filter((guideline) => guideline.active);
  const requirements: Array<{ label: string; matches: (guideline: Guideline) => boolean }> = [
    { label: 'attack', matches: (guideline) => guideline.category === 'attack' },
    { label: 'defense', matches: (guideline) => guideline.category === 'defense' },
    { label: 'rebounding', matches: (guideline) => guideline.subcategory === 'rebounding' },
    { label: 'transition', matches: (guideline) => guideline.category === 'transition' },
    { label: 'habits', matches: (guideline) => guideline.category === 'habits' }
  ];
  const issues: string[] = [];

  if (activeGuidelines.length !== MVP_STARTER_GUIDELINE_COUNT) {
    issues.push(
      `starter catalog contains ${activeGuidelines.length} active guidelines; expected ${MVP_STARTER_GUIDELINE_COUNT}`,
    );
  }

  for (const requirement of requirements) {
    if (!activeGuidelines.some(requirement.matches)) {
      issues.push(`starter catalog is missing ${requirement.label} coverage`);
    }
  }

  return issues;
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, source);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
