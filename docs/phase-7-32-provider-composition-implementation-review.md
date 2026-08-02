# Phase 7.32 Provider Composition Implementation Review

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a provider-local implementation review guard for the future
`apps/core-host` composition change. It consumes the accepted Phase 7.31
composition gate evidence and checks that the implementation review materials
are complete before product and security are asked to approve provider
registration and execution enablement.

The review is not the composition implementation. It does not modify
`apps/core-host`, register a provider, enable execution, change default opt-in
behavior, expose provider visibility, load a runtime, access artifacts, write a
cache, or run inference.

## Required Review Materials

The guard requires explicit confirmation of the accepted Phase 7.31 alternative
resource evidence and explicit review of:

- the exact future `apps/core-host` composition diff;
- explicit opt-in behavior;
- fixture fallback preservation;
- sanitized runtime error mapping;
- resource lease enforcement;
- startup and restart behavior;
- provider visibility behavior;
- rollback plan; and
- desktop smoke plan for the later implementation wave.

The accepted status is
`ready_for_product_security_composition_approval`. That status means only that
the implementation review materials are ready for a separate approval decision.

## Hard Blocks

- `compositionApprovalGranted` remains `false`.
- `compositionAllowed` remains `false`.
- `coreHostCompositionChanged` remains `false`.
- `providerVisibilityChanged` remains `false`.
- `providerRegistrationEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `defaultOptInEnabled` remains `false`.
- `runtimeLoaded` remains `false`.
- `inferenceExecuted` remains `false`.
- `modelArtifactAccessed` remains `false`.
- `cacheWritesEnabled` remains `false`.
- Product and security composition approval remain pending until the separate
  approval wave.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/inference-adapter-embedding-local
npm.cmd test -- packages/inference-adapter-embedding-local/test/local-embedding-provider-composition-implementation-review.test.ts packages/inference-adapter-embedding-local/test/local-embedding-composition-approval-gate.test.ts packages/inference-adapter-embedding-local/test/local-embedding-resource-profile-alternative-evidence.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke is not required for this wave because Core Host composition,
Desktop IPC, provider visibility, UI DTOs, startup supervision, and execution
behavior do not change.

## Next Hard Pause

Phase 7.33 implements the approved `apps/core-host` composition wiring behind
explicit opt-in. The remaining hard pause is now real runtime session creation:
do not launch the Python helper from product composition, access model
artifacts, write caches, load the model, expose UI controls, change default
opt-in behavior, or enable real local embedding inference without a separate
product and security approval.
