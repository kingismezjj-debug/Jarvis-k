# Phase 7 Runtime Implementation Approval Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave approves implementation constraints for a future local embedding
runtime package. It does not create that package and does not add runtime
dependencies.

- Future package: `@jarvis-k/inference-runtime-transformers-local`.
- Future package location: `packages/inference-runtime-transformers-local`.
- Composition root: `apps/core-host`.

## Package Manifest Constraints

- The future runtime package must be private.
- It must export the runtime adapter surface only.
- The current dependency allowlist is empty.
- Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, TensorFlow, Hugging Face,
  and native/helper runtime dependencies remain forbidden until a separate
  implementation wave approves them.

## Cache Layout Constraints

- No cache path may be committed.
- No model artifact may be committed.
- No signed URL may be persisted.
- Artifact hashes must be verified before use.
- Failed verification must clean up partial artifacts.

## Helper Lifecycle Constraints

- Runtime execution is planned for a supervised child process.
- Supervisor remains `apps/core-host`.
- Startup and shutdown timeouts must be defined.
- A resource scheduler lease is required before model loading.
- Logs and failure details must be sanitized.
- Direct shell execution is not allowed.

## Failure Modes

- Startup failure: report provider unconfigured.
- Load failure: report provider unconfigured.
- Artifact verification failure: report artifact unavailable.
- Execution failure: report sanitized failure.
- Fallback provider behavior is required.

## Hard Blocks

- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `implementationValuesExposed` remains `false`.

## Non-Goals

- No runtime package.
- No runtime dependency.
- No model download.
- No model cache.
- No provider registration.
- No local embedding execution.
