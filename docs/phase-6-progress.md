# Phase 6 Progress

Phase 6 starts from the Phase 5 fixture-backed inference foundation. The goal
is to introduce one real-provider path at a time while keeping Core, Desktop,
UI, contracts, and capabilities provider-neutral.

The first capability is embedding. It has the smallest DTO surface, no binary
image input, and is the lowest-risk path for proving real local inference
readiness before model downloads or native runtime execution are enabled.

## Wave 6.1: Local Embedding Provider Readiness

- Status: complete.
- Added `@jarvis-k/inference-adapter-embedding-local` as the dedicated package
  for the planned local embedding provider boundary.
- The provider currently reports `embedding.local.qwen3` as `unconfigured` and
  `disabled` for `Qwen/Qwen3-Embedding-0.6B`.
- Added an explicit configuration report covering the remaining real-provider
  gates: immutable model revision, artifact SHA-256, runtime adapter,
  packaging plan, license/redistribution review, and benchmark/resource
  profile.
- Added a fail-closed `UnavailableLocalEmbeddingProvider` so accidental direct
  use cannot execute a model.
- Registered the local embedding readiness descriptor in `apps/core-host`
  alongside the fixture providers. No execution provider is injected for the
  local embedding path.
- Updated dependency-boundary guards so Core cannot import the planned local
  adapter directly. `apps/core-host` remains the only concrete composition root.

### Current Gate

- Targeted local embedding adapter and boundary tests: PASS, 2 test files and
  12 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 39 test files and 213 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- `npm run smoke:desktop:fixture-inference`: PASS.

## Wave 6.2: Embedding Manifest Readiness Evaluation

- Status: complete.
- Added a provider-local readiness evaluator for the embedding manifest and
  the remaining runtime, packaging, redistribution, and benchmark gates.
- The evaluator rejects missing manifests, floating revisions, missing
  SHA-256 digests, red-risk licenses, and incomplete runtime review.
- A complete readiness report still produces an `unconfigured` provider
  descriptor because execution is not composed until the real runtime adapter
  is separately approved and implemented.
- No real model revision, model artifact, runtime dependency, download path, or
  provider execution was added in this wave.

### Current Gate

- Local embedding readiness tests: PASS, 5 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 39 test files and 215 tests.

## Wave 6.3: Local Embedding Runtime Boundary Skeleton

- Status: complete.
- Added a planning-only descriptor and fail-closed implementation of the
  existing `ModelRuntimeAdapter` port.
- The skeleton declares the current candidate runtime direction without
  installing Transformers, Python, CUDA, ONNX, or any native runtime.
- `canLoad` remains false and `load` always fails with a sanitized
  configuration error.
- The skeleton is intentionally not registered in `apps/core-host`;
  `UnavailableModelRuntimeRegistry` continues to advertise no real runtime.
- No model manifest, artifact, download path, runtime package, or execution
  provider was enabled in this wave.

### Current Gate

- Local embedding runtime boundary tests: PASS, 3 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 40 test files and 218 tests.

## Wave 6.4: Runtime Strategy Guard

- Status: complete.
- Added a local embedding runtime strategy record that keeps the current
  runtime direction provisional and scoped to a future dedicated package:
  `@jarvis-k/inference-runtime-transformers-local`.
- Documented the remaining runtime gates: dependency license review, Windows
  packaging plan, process isolation plan, tokenizer/config artifact pinning,
  and benchmark acceptance.
- Added tests that keep runtime dependencies out of contracts, capabilities,
  Core, Desktop, and UI.
- Updated the planning-only runtime descriptor to surface the future dedicated
  package boundary.
- No runtime dependency, model artifact, download path, provider registration,
  or execution behavior was added in this wave.

### Current Gate

- Local embedding runtime strategy tests: PASS, 4 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 41 test files and 222 tests.

## Wave 6.5: Local Embedding Preflight Guard

- Status: complete.
- Added provider-specific preflight coverage for `embedding.local.qwen3`.
- The planned provider can be visible in an inference provider registry while
  execution preflight still blocks because the provider is `unconfigured` and
  `disabled`.
- Configuration requirements remain observable before any execution path is
  allowed, including manifest approval, runtime adapter, and benchmark gates.
- No provider registration change, runtime dependency, model manifest,
  artifact download, model loading, or real embedding execution was added in
  this wave.

### Current Gate

- Local embedding preflight tests: PASS, 2 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 42 test files and 224 tests.

## Wave 6.6: Local Embedding Artifact Pin Plan

- Status: complete.
- Added a local embedding artifact pin plan for the future model weights,
  model config, tokenizer config, tokenizer vocabulary, and pooling config.
- The plan is intentionally `unpinned` and `downloadEnabled: false`.
- No upstream URLs, placeholder digests, signed URLs, model files, or real
  download paths are exposed.
- Added a pin-completeness helper that accepts only required artifacts with an
  immutable revision and valid SHA-256 digest.
- No model manifest, runtime dependency, artifact download, model loading, or
  real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact plan tests: PASS, 4 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 43 test files and 228 tests.

## Wave 6.7: Artifact Pins As Readiness Gate

- Status: complete.
- Connected the artifact pin plan to the local embedding readiness evaluator.
- Added `artifact.pins` as a formal provider configuration requirement.
- An otherwise complete manifest/runtime review remains blocked until every
  required artifact has an immutable revision and valid SHA-256 digest.
- Preflight requirement visibility now includes the artifact pin gate.
- No real artifact revision, SHA-256, upstream URL, download path, model file,
  runtime dependency, or execution behavior was added in this wave.

### Current Gate

- Local embedding readiness and preflight tests: PASS, 8 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 43 test files and 229 tests.

## Remaining Phase 6 Work

- Choose and document the exact immutable model revision for
  `Qwen/Qwen3-Embedding-0.6B`.
- Decide the dedicated runtime adapter strategy without adding runtime
  dependencies to Core, Desktop, UI, contracts, or capabilities.
- Add model artifact manifest pins and SHA-256 digests before any download path
  is enabled.
- Add provider-specific preflight tests for blocked, degraded, and eventually
  available states.
- Add a real execution adapter only after packaging, license, redistribution,
  and benchmark gates are complete.
