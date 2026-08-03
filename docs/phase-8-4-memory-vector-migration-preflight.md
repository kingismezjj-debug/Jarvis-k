# Phase 8.4 Memory Vector Migration Preflight

Recorded on 2026-08-03 as a review-only approval handoff wave after the
Phase 8.3 Memory vector execution preflight.

## Scope

This wave adds a provider-neutral SQLite migration implementation approval
preflight in `@jarvis-k/memory`. It creates a review-only migration plan for
the proposed `memory_embeddings` table and indexes, plus fixture-only safety
reporting for normal, blocked, degraded, and sanitized-output cases.

The accepted preflight status is only
`ready_for_sqlite_migration_implementation_approval`. It is a request boundary
for a later separate approval. It does not implement, execute, or dry-run a
SQLite migration.

## Approval Meaning

The preflight confirms that Phase 8.3 is accepted, product and security review
are recorded for this review layer, the future migration diff and rollback
plan are reviewed, backup/restore and Memory health checks are planned,
export/import regression is planned, and fixture-only safety tests are present.

The preflight remains fail-closed if any migration implementation, migration
execution, index creation, SQLite repository change, vector write, real vector
persistence, Phase 7.43 vector persistence, Core retrieval behavior change, UI
behavior change, raw vector exposure, private path exposure, raw diagnostic
exposure, or shell execution is observed.

## Hard Pause

The following remain deferred until a separate explicit product and security
approval:

- creating or modifying SQLite migrations;
- changing `packages/memory-sqlite`;
- executing a schema or index migration;
- writing or persisting real vectors;
- persisting Phase 7.43 runtime vectors;
- connecting vector writes or queries to Core retrieval/product flows;
- changing UI defaults; and
- converting retrieval output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npx vitest run packages/memory/test/embedding-vector-migration-preflight.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, provider
execution behavior, or SQLite persistence implementation.
