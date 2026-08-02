# Phase 7.35 Runtime Session Factory Lifecycle

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave implements the separately approved Core Host runtime session factory
wiring and Python helper lifecycle boundary for the runtime-backed local
embedding provider.

Product approval allowed only explicit opt-in Core Host wiring. Default
behavior remains disabled, UI/default visibility is unchanged, fixture
fallback remains preserved, and real model artifact path reads, model loading,
and real inference stay blocked.

Security approval allowed only reading `JARVIS_K_RUNTIME_PYTHON` and starting
the supervised Python Transformers child-process helper for lifecycle health.
It did not approve model artifact path reads, model loading, real embedding
inference, persistent credential or signed URL storage, raw diagnostics
exposure, default opt-in changes, or conversion of model output into
Windows/PowerShell operations.

## Implementation

Core Host now creates a default local embedding runtime session factory when
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1` composes the local embedding
provider and no test session factory is injected.

The factory:

- reads only `JARVIS_K_RUNTIME_PYTHON`;
- launches the existing dedicated runtime helper script through the supervised
  child-process JSONL transport;
- performs a helper `health` handshake;
- rejects degraded or unsafe helper health without exposing raw diagnostics;
- does not pass a model directory to the helper;
- does not call helper `load`;
- does not call helper `embed`;
- returns a session whose `embed` method remains blocked by the runtime gate;
- sends helper `shutdown` during session release; and
- preserves resource lease cleanup through the existing provider finally path.

The existing fixture embedding provider still owns embedding execution when
`JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set.

## Safety Boundary

This wave still does not:

- read model artifact paths;
- access model artifacts;
- write a persistent model cache;
- load a model;
- execute real local embedding inference;
- expose the Python executable path or helper script path in DTOs, logs, tests,
  docs, or UI;
- persist credentials, signed URLs, private paths, or raw diagnostics;
- add runtime dependencies to Core, Desktop, UI, contracts, or capabilities;
- change provider registration behavior;
- change default opt-in behavior;
- add UI controls; or
- convert model output into Windows or PowerShell operations.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-runtime-session-factory.test.ts apps/core-host/test/local-embedding-runtime-session-factory-preflight.test.ts apps/core-host/test/local-embedding-composition.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

All commands above passed for this wave. Real Python helper health smoke was
not run because `JARVIS_K_RUNTIME_PYTHON` is not configured in the local
environment.

## Next Hard Pause

Do not read model artifact paths, pass a model directory to the helper, call
helper `load`, call helper `embed`, access model artifacts, write model caches,
load the real model, expose raw runtime diagnostics, change provider
registration behavior, change default opt-in behavior, or enable real local
embedding inference without separate product and security approval for that
exact model-load and inference stage.
