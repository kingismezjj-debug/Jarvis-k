# Phase 8.3 Memory Vector Execution Preflight

Recorded on 2026-08-03 as a Memory retrieval preparation wave after the
Phase 7.43 local embedding provider execution acceptance diagnostic.

## Scope

This wave adds a provider-neutral Memory vector schema and index proposal,
rollback plan, vector write/query port shape, and fixture-only execution
safety preflight in `@jarvis-k/memory`.

The proposed table is `memory_embeddings`, with future columns for source
identity, model identity, dimensions, vector payload, and creation time. The
proposed indexes are bounded by model/conversation and source identity. These
are proposal values only; no SQLite migration, index creation, or repository
implementation was added.

## Approval Meaning

An accepted preflight result means only
`ready_for_migration_approval`. It confirms that product and security approval
were recorded for this planning layer, the schema and rollback plan were
reviewed, provider-neutral ports exist, fixture-only safety tests are present,
and all execution or persistence behavior remains blocked.

The fixture safety report exposes only bounded counts and fixed reason codes.
It does not expose raw vectors, raw memory text, private paths, raw
diagnostics, signed URLs, credentials, or Phase 7.43 runtime vectors.

## Rollback Plan

The future migration rollback plan is:

- stop vector writes before rollback;
- drop vector indexes before dropping the proposed vector table;
- leave messages, conversations, summaries, and active conversation state
  unchanged; and
- run Memory health and export/import regression checks after rollback.

## Hard Pause

The following remain deferred until a separate explicit approval:

- SQLite schema or vector index migration;
- changes to `packages/memory-sqlite`;
- writing real Memory vector data;
- persisting Phase 7.43 runtime vectors;
- routing vectors into Core retrieval or product flows;
- changing Core default retrieval or UI behavior; and
- converting retrieval output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npx vitest run packages/memory/test/embedding-vector-execution-preflight.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, or provider
execution behavior.
