# Authentication

## MVP decision

Email registration is required.

The product remains private and pseudonymous: real name, phone and public identity are not required.

## Provider

Supabase Auth.

## MVP flows

- Sign up with email.
- Verify email if project configuration requires verification.
- Sign in.
- Sign out.
- Password reset / recovery.
- Session restoration.

Exact auth method (password vs passwordless/magic-link) should be chosen in spec implementation with preference for the simplest robust email flow supported by the project environment. Do not add social login in MVP.

## Relationship to player profile

Auth user and PlayerProfile are separate concepts.

`auth.uid()` owns the profile and user-generated data.
Alias is optional and may be non-identifying.

## Routing

Unauthenticated:
- welcome;
- sign up;
- sign in;
- recovery.

Authenticated but onboarding incomplete:
- onboarding only.

Authenticated + onboarding complete:
- main application.

## Offline constraints

Existing authenticated sessions may use locally cached application data while offline.
New sign-in/sign-up requires network connectivity.

Do not fake authentication offline.

## Security

RLS must protect every user-owned remote table.
No service-role key in frontend.
