# Phase 8.14 Core Host Fixture Memory Retrieval Env Wiring

Recorded on 2026-08-03 as the separately approved Core Host fixture-only
Memory retrieval env wiring implementation after the Phase 8.13 approval gate.

## Scope

This wave wires `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1` in
`apps/core-host` to the Phase 8.12 `CoreRuntime` Memory retrieval read route.
The route remains disabled by default.

When explicitly enabled, Core Host injects a fixture-only
`EmbeddingMemoryRetrievalPort` that delegates reads to the existing
`SqliteMemoryRepository.querySimilar(query)` API and injects a fixed fixture
query vector resolver. The resolver does not receive raw message text and does
not call any embedding provider.

## Safety Boundary

The wiring accepts only the fixture model ID
`fixture/core-host-memory-retrieval`. It does not route provider execution,
does not use real embedding provider output as a query vector, does not write
Memory vector data, does not persist Phase 7.43 or real runtime vectors, does
not change SQLite schema or indexes, and does not change Desktop IPC, UI
behavior, provider visibility, fixture fallback, or default opt-in behavior.

If no fixture vectors are present, retrieval returns a sanitized no-recall
observation. Startup and send-message smoke verified the opt-in path without
exposing raw vectors, raw text, private paths, raw diagnostics, signed URLs, or
credentials in command results.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- using real embedding provider output as a query vector;
- writing Memory vector data from provider execution output;
- persisting Phase 7.43 or real runtime vectors;
- adding Desktop IPC or UI controls for Memory retrieval;
- changing provider visibility or default opt-in behavior;
- changing SQLite schema or indexes;
- exposing raw vectors, raw text, private paths, or raw diagnostics; and
- converting retrieval/model output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/core-memory-retrieval-env-wiring.test.ts apps/core-host/test/core-memory-retrieval-env-wiring-approval-gate.test.ts packages/core/test/runtime.test.ts
npm.cmd run smoke:desktop:memory-retrieval-env-wiring
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
npm.cmd run smoke:desktop
```
