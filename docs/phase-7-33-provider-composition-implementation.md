# Phase 7.33 Provider Composition Implementation

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave implements the approved `apps/core-host` composition wiring for the
runtime-backed local embedding provider behind an explicit opt-in:
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`.

Default behavior remains unchanged. Without the opt-in, Core Host keeps the
local embedding provider `unconfigured`, lists no Transformers runtime adapter,
adds no approved local embedding manifest to the model registry, and does not
compose an embedding execution provider.

With the opt-in, Core Host composes:

- the approved local embedding manifest into the model registry;
- a Transformers runtime adapter descriptor into the model runtime registry;
- a runtime-backed local embedding provider descriptor and configuration
  report;
- an embedding provider shell that requires a resource scheduler lease before
  runtime session creation; and
- sanitized runtime failure mapping and cleanup behavior.

The fixture embedding provider remains the explicit test fallback. When
`JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set, the fixture embedding provider
continues to own the embedding execution port so fixture regression flows are
not changed by local provider opt-in.

## Safety Boundary

This wave still does not:

- download model artifacts;
- write a persistent model cache;
- persist credentials, signed URLs, or private paths;
- launch the Python helper from product composition;
- create a real runtime session factory;
- access model artifacts;
- load a model;
- return real embedding vectors from the local model;
- change default opt-in behavior;
- change UI controls or default provider visibility; or
- convert model output into Windows or PowerShell operations.

The opt-in execution path can enter provider preflight and resource leasing,
then fails closed before any model artifact access or runtime load. The failure
surface is sanitized.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-composition.test.ts apps/core-host/test/check-boundaries-script.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

All commands above passed for this wave.

## Next Hard Pause

Do not add a real runtime session factory, launch the Python helper from Core
Host composition, read `JARVIS_K_RUNTIME_PYTHON` or model artifact paths for
product execution, access model artifacts, write caches, load the real model,
expose new UI controls, change default opt-in behavior, or enable real local
embedding inference without a separate product and security approval.
