export const domainErrorCodes = [
  'invalid_entity',
  'invalid_age',
  'too_many_active_goals'
] as const;

export type DomainErrorCode = (typeof domainErrorCodes)[number];

export interface DomainIssue {
  message: string;
  path: string;
}

export class DomainValidationError extends Error {
  readonly code: DomainErrorCode;
  readonly issues: DomainIssue[];

  constructor(code: DomainErrorCode, message: string, issues: DomainIssue[] = []) {
    super(message);
    this.name = 'DomainValidationError';
    this.code = code;
    this.issues = issues;
  }
}

