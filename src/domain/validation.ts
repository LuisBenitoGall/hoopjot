import { z, type ZodType } from 'zod';

import { DomainValidationError, type DomainIssue } from './errors';

export function parseDomainEntity<T>(schema: ZodType<T>, value: unknown, entityName: string): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new DomainValidationError(
        'invalid_entity',
        `${entityName} is invalid`,
        error.issues.map(toDomainIssue),
      );
    }

    throw error;
  }
}

function toDomainIssue(issue: z.ZodIssue): DomainIssue {
  return {
    message: issue.message,
    path: issue.path.join('.')
  };
}

