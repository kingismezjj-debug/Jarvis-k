# Phase 8.9 Memory SQLite Fixture Vector Query

Recorded on 2026-08-03 as the separately approved fixture-only vector query
implementation for `packages/memory-sqlite`.

## Scope

This wave adds `querySimilar(query)` to the SQLite memory repository as a
fixture-only implementation of the provider-neutral vector retrieval port. The
method validates the query shape, accepts only `fixture/` model IDs, reads
bounded candidates from the existing schema v3 `memory_embeddings` table,
deserializes vector payloads in memory, computes deterministic cosine
similarity, and returns bounded match metadata.

The query path never returns stored vector payloads or memory text. Non-fixture
model IDs degrade with `VECTOR_NON_FIXTURE_QUERY_BLOCKED` using a sanitized
`blocked` model ID. Invalid queries degrade with `VECTOR_QUERY_INVALID`.
Unavailable schema and unexpected execution failures degrade with fixed reason
codes.

## Safety Boundary

The implementation remains local to `packages/memory-sqlite`. It does not
route retrieval into Core product behavior, does not connect provider
execution output to Memory writes, does not persist Phase 7.43 or real runtime
vectors, and does not change Desktop IPC or UI behavior.

Query results include only `id`, `conversationId`, `sourceType`, `sourceId`,
`modelId`, `score`, and `createdAt`. Tests inspect only bounded metadata and
sanitized reports; they do not expose raw vectors, memory text, private paths,
raw diagnostics, signed URLs, credentials, or model artifact paths.

## Hard Pause

The following remain deferred until separate product and security approval:

- connecting provider execution output to Memory vector writes;
- persisting Phase 7.43 or real runtime vectors;
- routing Memory vector retrieval into Core product behavior;
- adding Desktop IPC or UI controls for vector retrieval;
- exposing raw vectors, raw text, private paths, or raw diagnostics; and
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
