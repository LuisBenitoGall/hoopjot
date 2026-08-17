# 003 — Local database

## Goal

Implement Dexie/IndexedDB local persistence behind repository contracts.

## Read first

- `docs/DATA_MODEL.md`
- `docs/OFFLINE_SYNC.md`
- `docs/ARCHITECTURE.md`

## Deliverables

- Dexie database schema and version 1 migration.
- Local repositories for user-owned MVP entities.
- Client UUID creation.
- Transactions where multiple records must change atomically.
- Local sync queue table/model.
- Repository contract tests.
- Domain data is not stored in localStorage.

## Acceptance criteria

- Create/read/update/delete works after page reload.
- Tombstone delete behavior implemented where specified.
- Sync operations are enqueued for syncable mutations.
- Local database can be reset in development/test helpers.

## Tests / verification

Repository integration tests using fake-indexeddb or suitable test environment. Run full checks.

## Out of scope

- No Supabase syncing.
- No UI feature implementation.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
