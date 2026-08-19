# Security and privacy

## Principles

- collect minimum data;
- private by default;
- no public player profiles;
- no advertising profile;
- no sale of user data;
- user data export/deletion should be feasible by design.

## Sensitive context

Physical/health context is optional and potentially sensitive.

Rules:
- never required for core product usage;
- no diagnosis;
- no rehab progression recommendations;
- no "train through pain" suggestions;
- user can edit/remove it.

## Age

Minimum supported age: 16.

Onboarding must prevent completion for users below the configured minimum age.

Before public launch, legal/privacy copy must be reviewed for target jurisdictions. This product specification is not legal advice.

## Supabase

- RLS enabled on all exposed user-owned tables.
- Policies keyed to `auth.uid()`.
- Prefer restrictive default posture.
- Global content is read-only to normal users.

## Secrets

Never commit:
- `.env` secrets;
- service-role key;
- private AI provider keys.

Provide `.env.example` with placeholders only.

## Logging

Do not log reflection content, physical notes, access tokens or email addresses unnecessarily.
Sanitize production error reporting.

## Data deletion

Design user-owned tables so account deletion can cascade or be safely orchestrated.
Storage objects, when introduced later, must follow the same ownership model.
