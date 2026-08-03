# Phase 8.16 Provider-Backed Query Vector

Recorded on 2026-08-03 as the separately approved implementation after the
Phase 8.15 provider query-vector approval gate.

## Scope

This wave implements an explicit opt-in provider-backed query-vector resolver
for Memory retrieval in `apps/core-host`.

The resolver is available only when all of these gates are enabled:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`; and
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.

When enabled, Core Host uses the existing local embedding provider execution
path to generate a query vector for the accepted message and passes that vector
only to the existing bounded `SqliteMemoryRepository.querySimilar(query)` read.
The Memory query remains fixture-indexed through
`fixture/core-host-memory-retrieval`; this phase does not write real provider
vectors to Memory.

## Safety Boundary

The implementation keeps default behavior disabled. `CoreRuntime` now passes a
bounded, sanitized `queryText` value to the injected resolver, but command
results, events, snapshots, smoke reports, and docs do not expose raw message
text or raw vectors.

Core Host validates query text, provider availability gates, timeout bounds,
single-vector result shape, dimensions, and finite vector values. If any gate
or validation fails, retrieval degrades to sanitized no-recall and normal
message acceptance continues.

This wave does not download artifacts, write persistent model caches, persist
credentials or signed URLs, write Memory vector records, persist Phase 7.43 or
real runtime vectors, run SQLite schema or index migrations, change Desktop
IPC, add UI controls, change provider visibility, change fixture fallback, or
change default opt-in behavior.

## Rollback

Unset `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR` to return the
Phase 8.14 route to the fixed fixture query-vector resolver. Unset
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` to disable Memory retrieval routing
entirely.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- writing Memory vector records from real provider output;
- persisting Phase 7.43 or real runtime vectors;
- using real provider vectors as stored Memory index data;
- adding Desktop IPC or UI controls for Memory retrieval;
- changing provider visibility or default opt-in behavior;
- changing SQLite schema or indexes;
- exposing raw vectors, raw text, private paths, or raw diagnostics; and
- converting retrieval/model output into Windows or PowerShell operations.

## Verification

```powershell
npx vitest run apps/core-host/test/core-memory-retrieval-env-wiring.test.ts packages/core/test/runtime.test.ts apps/core-host/test/memory-retrieval-provider-query-vector-approval-gate.test.ts
npm.cmd run build -w @jarvis-k/core
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
```
