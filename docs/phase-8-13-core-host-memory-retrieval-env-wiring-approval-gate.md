# Phase 8.13 Core Host Memory Retrieval Env Wiring Approval Gate

Recorded on 2026-08-03 as the Core Host approval gate for future Memory
retrieval env wiring after the Phase 8.12 Core read route.

## Scope

This wave adds an approval-only gate in `apps/core-host` for a future
implementation that may read `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1` and
wire a fixture-only `EmbeddingMemoryRetrievalPort` into `CoreRuntime`.

The gate records review evidence for the env key, exact Core Host diff,
constructor wiring plan, fixture-only retrieval port plan, fixture query
vector resolver plan, default-disabled behavior, Desktop smoke plan, rollback
plan, and sanitized recall observation plan.

It does not read the env value, does not change Core Host startup behavior,
does not modify `CoreRuntime` construction, and does not inject any retrieval
port or fixture query vector resolver.

## Safety Boundary

This approval gate does not enable Memory retrieval in product flows. It does
not route provider execution, does not persist Phase 7.43 or real runtime
vectors, does not write Memory vector data, does not run SQLite migrations,
and does not change Desktop IPC, UI behavior, provider visibility, or default
opt-in behavior.

All reports expose only fixed booleans, fixed reason text, and the public env
key name. They never include env values, raw vectors, raw text, private paths,
raw diagnostics, signed URLs, credentials, model artifacts, or cache paths.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- reading `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING`;
- passing Memory retrieval options into `CoreRuntime`;
- injecting a fixture-only `EmbeddingMemoryRetrievalPort`;
- injecting a fixture query vector resolver;
- adding or changing Desktop IPC or UI behavior;
- routing provider execution output into Memory;
- persisting Phase 7.43 or real runtime vectors;
- writing Memory vector data;
- changing SQLite schema or indexes; and
- exposing raw vectors, raw text, private paths, or raw diagnostics.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/core-memory-retrieval-env-wiring-approval-gate.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
npm.cmd run smoke:desktop
```

Desktop smoke is required because this wave touches `apps/core-host`, even
though it does not change runtime composition behavior.
