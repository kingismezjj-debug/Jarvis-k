# Phase 8.1 Embedding Memory Retrieval Contract

Recorded on 2026-08-01 as the first low-risk preparation wave for embedding
memory retrieval.

## Scope

This wave defines provider-neutral embedding memory retrieval records, bounded
queries, sanitized match results, and an injected retrieval port in
`@jarvis-k/memory`.

The wave also adds a fail-closed preflight that separates the contract and
fixture boundary from the later production work. The fixture test executor
proves deterministic cosine ranking, conversation filtering, bounded results,
dimension validation, and degraded no-match behavior.

## Approval Meaning

An accepted preflight result means only
`ready_for_fixture_contract`. It does not approve production retrieval,
embedding provider composition, vector writes, SQLite schema changes, vector
index creation, Core composition, or UI exposure.

Retrieval results contain identifiers, model identity, timestamps, and bounded
scores only. They do not expose raw memory text, query vectors, stored vectors,
credentials, URLs, private paths, or model artifact values.

## Hard Pause

The following remain deferred until a separate explicit approval:

- Memory database schema or vector index migration;
- changes to `packages/memory-sqlite`;
- Core or `apps/core-host` composition;
- real embedding provider registration or execution;
- vector writes or model-backed retrieval; and
- UI, Desktop, or contracts exposure.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, or provider visibility.
