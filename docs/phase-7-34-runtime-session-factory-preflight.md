# Phase 7.34 Runtime Session Factory Preflight

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a Core Host preflight guard for the next possible runtime
session factory implementation wave. It reviews the exact conditions that must
be true before `apps/core-host` can replace the disabled local embedding
session factory with a real Python Transformers child-process session factory.

The preflight is review-only. It does not read `JARVIS_K_RUNTIME_PYTHON`, read
model artifact paths, launch the Python helper, access artifacts, write caches,
load a model, execute real local embedding inference, change provider
registration behavior, change default opt-in behavior, or expose runtime
diagnostics.

## Review Boundary

The preflight requires evidence for:

- explicit opt-in composition in `apps/core-host`;
- approved manifest, runtime descriptor, and provider shell composition
  remaining opt-in only;
- fixture embedding fallback preservation;
- resource lease enforcement before any future session creation;
- sanitized runtime error mapping;
- startup, restart, and rollback review;
- future Python environment handling without reading or exposing the value;
- separate product approval requirement; and
- separate security approval requirement.

When complete, the preflight can return only
`ready_for_runtime_session_factory_approval`. That status is a handoff for
separate product and security approval; it is not permission to implement,
launch, load, or execute the real runtime.

## Safety Boundary

The guard fixes these outputs to `false`:

- product approval granted;
- security approval granted;
- session factory implementation allowed;
- session factory implemented;
- runtime Python environment read;
- runtime Python environment value exposed;
- model artifact path read;
- Python helper launch enabled;
- model artifact access enabled;
- cache writes enabled;
- model load enabled;
- real local inference enabled;
- runtime dependency changes introduced;
- provider registration changed;
- default opt-in enabled;
- model output shell execution enabled;
- private path exposure enabled; and
- raw diagnostics exposed.

Degraded results mean review evidence is incomplete while side effects remain
blocked. Blocked results mean an unsafe side effect or approval/regression was
requested.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-runtime-session-factory-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:local-embedding-composition
```

## Next Hard Pause

Do not implement a real runtime session factory, read
`JARVIS_K_RUNTIME_PYTHON`, read model artifact paths, launch the Python helper,
access model artifacts, write caches, load the real model, expose raw runtime
diagnostics, change provider registration behavior, change default opt-in
behavior, or enable real local embedding inference without separate product
and security approval for that exact runtime session factory implementation.
