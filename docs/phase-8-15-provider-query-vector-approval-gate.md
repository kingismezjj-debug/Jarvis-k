# Phase 8.15 Provider Query Vector Approval Gate

Recorded on 2026-08-03 as the separate approval gate for a future
provider-backed Memory retrieval query-vector implementation after Phase 8.14.

## Scope

This wave adds only a Core Host approval gate for a future implementation that
may resolve Memory retrieval query vectors through the runtime-backed local
embedding provider. The planned future env key is
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR`, but this gate does
not read the env value and does not change Core Host startup behavior.

The gate reviews the required prerequisites and safety plan for a later
implementation:

- Phase 7.42 provider execution wiring and Phase 7.43 provider execution
  acceptance evidence;
- Phase 8.12 Core read routing and Phase 8.14 Core Host fixture env wiring;
- explicit opt-in behavior;
- query input sanitization before provider execution;
- provider execution preflight;
- bounded timeout and cancellation;
- vector shape and finite-value validation;
- fail-closed no-recall behavior;
- no vector persistence; and
- rollback smoke coverage.

## Safety Boundary

The approval gate does not implement provider query-vector routing, does not
read env values, does not call helper `embed`, does not return, log, expose, or
persist raw vectors, does not write Memory vector data, does not persist Phase
7.43 or real runtime vectors, does not run SQLite schema or index migrations,
and does not change Desktop IPC, UI behavior, provider visibility, fixture
fallback, or default opt-in behavior.

Any future implementation must remain explicitly opt-in, route failures to a
sanitized no-recall degradation, and keep retrieval/model output from becoming
Windows or PowerShell operations.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- reading `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR`;
- using provider execution output as a Memory retrieval query vector;
- calling helper `embed` for retrieval routing;
- returning, logging, exposing, or persisting raw vectors;
- writing Memory vector records from real provider output;
- persisting Phase 7.43 or real runtime vectors;
- adding Desktop IPC or UI controls for Memory retrieval;
- changing provider visibility or default opt-in behavior;
- changing SQLite schema or indexes; and
- converting retrieval/model output into Windows or PowerShell operations.

## Verification

```powershell
npx vitest run apps/core-host/test/memory-retrieval-provider-query-vector-approval-gate.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```
