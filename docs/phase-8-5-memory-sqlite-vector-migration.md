# Phase 8.5 Memory SQLite Vector Migration

Recorded on 2026-08-03 after explicit approval to begin the
`packages/memory-sqlite` SQLite vector migration implementation.

## Scope

This wave upgrades the SQLite Memory schema to version 3 and creates the
`memory_embeddings` table plus the approved indexes:

- `idx_memory_embeddings_model_conversation`
- `idx_memory_embeddings_source`

The table stores only future vector payload rows once a later write-path wave
is approved. This wave does not add any repository method that writes vectors,
does not connect retrieval execution, and does not route Phase 7.43 runtime
vectors into Memory.

## Migration Behavior

The migration is idempotent and runs through the existing repository
initialization path. Existing messages, conversations, summaries, and active
conversation state are preserved when v1/v2 databases are upgraded.

The vector table includes guarded source type, dimensions, non-empty payload,
and source uniqueness constraints. Snapshot restore clears
`memory_embeddings` so import/restore flows do not retain stale or orphaned
vector rows. Exported provider-neutral snapshots still contain only messages,
conversations, summaries, and active conversation state.

## Still Blocked

The following remain deferred until separate product and security approval:

- vector write repository API;
- vector query/retrieval repository API;
- persisting Phase 7.43 runtime vectors;
- connecting vector writes or queries to Core retrieval/product flows;
- UI retrieval behavior or provider visibility changes;
- raw vector/private path/raw diagnostic exposure; and
- converting retrieval output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory-sqlite
npx vitest run packages/memory-sqlite/test/sqlite-memory-repository.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, or provider
execution behavior.
