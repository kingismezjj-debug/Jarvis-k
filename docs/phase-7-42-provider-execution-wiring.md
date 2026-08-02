# Phase 7.42 Provider Execution Wiring

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave implements runtime-backed local embedding provider execution in
`apps/core-host` behind a second explicit opt-in:
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.

The existing provider composition opt-in remains separate:
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`.

Provider composition without the execution opt-in still loads only through the
approved lifecycle path and fails closed before helper `embed`.

## Implementation Boundary

- `apps/core-host` remains the only concrete composition root.
- The runtime-backed local embedding provider remains default-off.
- Fixture embedding remains the explicit fallback when
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set.
- The session factory verifies the approved artifact digest set and calls helper
  `load` before any helper `embed`.
- Helper `embed` is called only after the separate execution opt-in is present.
- Embedding requests are schema-validated before execution.
- Embedding results are schema-validated, checked for matching model ID,
  expected vector count, requested dimensions, input IDs, vector shape, and
  finite values before returning through the existing embedding DTO.
- Runtime, protocol, timeout, artifact, model-load, and vector-shape failures
  are mapped to sanitized error messages.
- Resource leases and helper sessions are released on success and failure.
- The local embedding provider configuration report exposes the execution
  opt-in as a separate environment requirement.

## Safety Boundary

This wave does not add downloads, persistent model cache writes, credential or
signed URL persistence, raw diagnostics, raw vector logging, Memory routing,
vector persistence, Memory schema/index migration, UI visibility changes,
provider default opt-in changes, Desktop IPC changes, installer/update/rollback
behavior, or Windows/PowerShell execution from model output.

The only product-facing vector surface added here is the existing
`agent.generateEmbeddings` command result when both local embedding opt-ins and
approved runtime/model environment variables are set.

## Verification

Completed locally on 2026-08-02:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/local-embedding-composition.test.ts apps/core-host/test/local-embedding-runtime-session-factory.test.ts apps/core-host/test/local-embedding-provider-execution-wiring-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Core Host build: PASS.
- Core Host local embedding composition, runtime session factory, and provider
  execution wiring preflight tests: PASS, 20 tests.
- `npm.cmd run verify`: PASS, 106 test files and 528 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not route embedding vectors to Memory, persist vectors, run a Memory
schema/index migration, expose local embedding controls in UI, change provider
default opt-in behavior, add downloads, write persistent model caches, create
installer/update/rollback behavior, or convert model output into
Windows/PowerShell operations without a separate product and security approval
for that exact implementation wave.
