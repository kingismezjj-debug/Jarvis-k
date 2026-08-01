# Phase 7 Runtime Packaging and Process Isolation Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

- Planned runtime: `transformers`.
- Future dedicated runtime package:
  `@jarvis-k/inference-runtime-transformers-local`.
- Future package location:
  `packages/inference-runtime-transformers-local`.
- Composition root:
  `apps/core-host`.

This wave approves only the runtime strategy, packaging plan, and process
isolation guard. It does not add a runtime package or any runtime dependency.

## Package Boundary

- Runtime dependencies are allowed only in the future dedicated runtime package.
- Runtime dependencies remain forbidden in:
  - `packages/contracts`;
  - `packages/capabilities`;
  - `packages/core`;
  - `apps/desktop`;
  - `apps/ui`.
- `apps/core-host` remains the only concrete composition root.
- Current status: runtime dependencies introduced: `false`.

## Process Isolation

- Planned execution mode: supervised child process.
- Supervisor: `apps/core-host`.
- IPC: private child-process IPC.
- Resource scheduler lease required before model load.
- Failure reporting must be sanitized.
- Direct shell execution from model output is not allowed.
- Model output may only influence actions through validated intents.

## Windows Packaging Plan

- Packaging status: planned only.
- Bundled model artifacts: `false`.
- Committed cache paths: `false`.
- Installer bundling: deferred.
- Update/rollback plan required before runtime implementation.
- NOTICE bundle required before packaging or redistribution.

## Non-Goals

- No Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, native helper, or
  model runtime dependency is added.
- No model file, model cache, signed URL, provider credential, benchmark value,
  provider registration, or local embedding execution is added.
- `runtime.adapter`, `runtime.packaging`, benchmark, provider registration, and
  explicit execution enablement remain separate later gates.
