# Phase 8.12 Core Memory Retrieval Read Routing

Recorded on 2026-08-03 as the separately approved Core retrieval read-routing
implementation after the Phase 8.11 approval gate.

## Scope

This wave adds the first Core runtime Memory retrieval read-routing path in
`CoreRuntime`. The route is disabled by default and only runs when the
injected Core option equivalent to
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1` is enabled.

The implementation uses only the provider-neutral
`EmbeddingMemoryRetrievalPort`, accepts only `fixture/` model IDs, validates a
bounded finite query vector from an injected fixture resolver, applies a Core
limit of 5 results, and returns sanitized recall metadata in the
`agent.sendMessage` command result after a user message is accepted.

The sanitized recall payload includes only match IDs, conversation IDs, source
types, source IDs, model IDs, scores, and timestamps. It never returns raw
vectors, raw text, private paths, raw diagnostics, provider execution output,
or model artifacts.

## Safety Boundary

The route does not call embedding provider execution, does not write vectors
to Memory, does not persist Phase 7.43 or real runtime vectors, does not change
SQLite schema or indexes, and does not change Desktop IPC, UI behavior,
provider visibility, or default opt-in behavior.

If the routing option is disabled, `agent.sendMessage` keeps the previous
response shape. If retrieval is unavailable, invalid, non-fixture, degraded,
or throws, the command still succeeds after the message is accepted and
returns a sanitized `memoryRecall.status: "degraded"` no-recall observation.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- wiring `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` from `apps/core-host`;
- adding Desktop IPC or UI controls for Memory retrieval;
- using real provider execution output as query vectors;
- persisting Phase 7.43 or real runtime vectors into Memory;
- writing real Memory vector data;
- changing SQLite schema or indexes;
- exposing raw vectors, raw text, private paths, or raw diagnostics; and
- converting retrieval/model output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core
npx vitest run packages/core/test/runtime.test.ts packages/core/test/memory-retrieval-routing-approval-gate.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, provider
execution behavior, or default runtime behavior.
