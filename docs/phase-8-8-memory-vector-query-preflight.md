# Phase 8.8 Memory Vector Query Preflight

Recorded on 2026-08-03 as a SQLite vector query implementation approval
handoff after the Phase 8.7 fixture-only vector write API.

## Scope

This wave adds a provider-neutral vector query API preflight in
`@jarvis-k/memory`. It defines the future SQLite `querySimilar(query)`
implementation plan, validation rules, vector deserialization review,
fixture-only cosine scoring plan, bounded result ordering, sanitized failure
codes, and fixture-only safety reporting for normal, blocked, degraded, and
sanitized-output cases.

The accepted preflight status is only
`ready_for_sqlite_query_implementation_approval`. It does not add a SQLite
repository query method, does not enable vector query execution, and does not
route retrieval into Core product behavior.

## Approval Meaning

The preflight confirms that the Phase 8.5 schema and Phase 8.7 fixture write
API exist, the provider-neutral query port and future SQLite implementation
plan were reviewed, vector deserialization and similarity scoring were
reviewed, bounded result behavior was reviewed, fixture-only query tests are
present, and sanitized failure mapping was reviewed.

It remains fail-closed if any query API implementation, vector query
execution, SQLite repository change, Phase 7.43 vector persistence, real
runtime vector persistence, Core retrieval routing, provider execution
routing, UI behavior change, raw vector exposure, raw text exposure, private
path exposure, raw diagnostic exposure, or shell execution is observed.

## Hard Pause

The following remain deferred until a separate explicit product and security
approval:

- implementing `querySimilar(query)` in `packages/memory-sqlite`;
- enabling SQLite vector query execution;
- persisting Phase 7.43 or real runtime vectors;
- connecting provider execution output to Memory writes;
- connecting Memory vector retrieval to Core product behavior;
- changing Desktop IPC or UI defaults; and
- exposing raw vectors, raw text, private paths, or raw diagnostics.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npx vitest run packages/memory/test/embedding-vector-query-preflight.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, provider
execution behavior, or SQLite persistence implementation.
