# Offline and synchronization

## Principle

Hoopnote is **local-first**, not merely "offline-capable".

User interactions write to IndexedDB first and update the UI immediately.

## Local database

Use Dexie over IndexedDB.

Do not store domain records in `localStorage`.

## Write flow

```text
User action
  ↓
Validate
  ↓
Dexie transaction
  ├── write/update entity
  └── enqueue sync operation
  ↓
UI reflects local state
  ↓
Sync worker attempts remote mutation
```

## Sync queue

Each operation should include:

```ts
interface SyncOperation {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  operation: "upsert" | "delete";
  payload?: unknown;
  createdAt: string;
  attemptCount: number;
  lastAttemptAt?: string;
  lastError?: string;
}
```

## Retry

- retry when connectivity returns;
- bounded exponential backoff while app is active;
- do not spin continuously in background;
- failed sync must not destroy local data.

## Conflict strategy for MVP

Use last-write-wins based on `updatedAt`.

Requirements:
- client-generated IDs;
- UTC timestamps;
- deterministic remote upsert;
- deleted records represented by tombstones (`deletedAt`) until safely synchronized.

Document known limitations for concurrent multi-device editing.

## Read flow

The UI reads from local repositories.

Remote sync may merge fresh data into IndexedDB.
Components should not require the network to render core flows.

## First device bootstrap

After sign-in:
1. initialize local DB;
2. download/merge user-owned remote state;
3. mark bootstrap complete;
4. render app from local state.

If offline before first successful authenticated bootstrap, show a clear limited-state screen.

## Connectivity

Use browser connectivity events only as hints.
Actual request failures are authoritative.

## PWA caching

Cache:
- app shell;
- static content catalog;
- translations;
- required icons/assets.

Do not cache authenticated API responses in the service worker as the primary persistence mechanism.

## Sync observability

Provide developer logs/diagnostics in development.
User UI should expose only simple states:
- synced;
- syncing;
- offline;
- needs attention (rare).
