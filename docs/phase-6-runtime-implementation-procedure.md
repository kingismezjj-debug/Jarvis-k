# Phase 6 Runtime Implementation Procedure

This procedure defines the approval boundary for a future local embedding
runtime implementation. It does not implement, install, register, or execute a
runtime.

Current target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Runtime direction: provisional `transformers`
- Dedicated package boundary:
  `@jarvis-k/inference-runtime-transformers-local`

## Procedure State

Runtime implementation is currently `pending`.

The provider-local guard can report whether a later implementation wave is
ready for manual approval. Its summary does not expose revisions, artifact
digests, artifact filenames, URLs, local private paths, dependency versions,
or benchmark metrics.

## Required Checks

- Package boundary approved: runtime dependencies stay in the dedicated
  runtime package and never enter contracts, capabilities, Core, Desktop, or
  UI.
- Helper process supervised: runtime lifecycle, health, timeout, restart, and
  shutdown behavior are defined outside Agent Core.
- Windows packaging documented: installation size, native dependencies,
  updates, rollback, and uninstall cleanup are reviewed before implementation.
- Resource scheduler integrated: model load and execution require explicit
  leases with deterministic release behavior.
- Failure degradation defined: startup, load, execution, and shutdown failures
  produce sanitized blocked/degraded states instead of crashing Agent Core.
- Runtime dependencies deferred: no Transformers, Python, CUDA, ONNX, Paddle,
  llama.cpp, native runtime, or model artifact is introduced by this procedure.
- Execution disabled: no runtime registration, execution-provider composition,
  or execution enablement occurs in this wave.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify gates
  pass.

## Future Implementation Boundary

The future runtime package may implement the existing provider-neutral runtime
ports. `apps/core-host` remains the only composition root allowed to connect
that implementation to the application. Agent Core must continue to depend
only on injected ports.

The runtime must be fail-closed and supervised. Resource acquisition must
precede model loading, and all leases and helper processes must be released on
failure, cancellation, timeout, restart, and shutdown.

## Non-Goals

This procedure must not introduce:

- Runtime dependencies or a runtime package implementation.
- Real model revisions, artifacts, caches, downloads, or URLs.
- Provider registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Verification

Run at minimum:

- `npm run build -w @jarvis-k/inference-adapter-embedding-local`
- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- `npm run typecheck`
- `npm run verify`

Desktop smoke tests are required only if a later wave changes Core Host
composition, Desktop IPC, startup supervision, or provider visibility.
