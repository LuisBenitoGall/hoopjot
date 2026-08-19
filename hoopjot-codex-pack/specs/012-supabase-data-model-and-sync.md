# 012 — Supabase data model and sync

## Goal

Implement remote persistence, RLS and local-first synchronization.

## Read first

- `docs/OFFLINE_SYNC.md`
- `docs/SECURITY_PRIVACY.md`
- `docs/DATA_MODEL.md`
- `docs/AUTHENTICATION.md`

## Deliverables

- SQL migrations for user-owned tables.
- RLS enabled and policies based on `auth.uid()`.
- Remote repository/sync adapter isolated from UI.
- Initial remote bootstrap merge.
- Sync queue processing.
- Retry behavior.
- Last-write-wins conflict behavior.
- Tombstone delete sync.
- Sync state indicator.
- Setup documentation for Supabase project.

## Acceptance criteria

- User A cannot access User B rows by policy.
- Local writes succeed while offline.
- Reconnect synchronizes queued mutations.
- Reload renders local state without waiting for remote.
- Remote merge does not duplicate entities.

## Tests / verification

Unit/integration tests where practical; include documented manual RLS verification and E2E offline/reconnect test.

## Out of scope

- No realtime subscriptions unless required.
- No Storage/video.
- No service-role use in browser.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
