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

## Wave 6.8: Runtime Strategy As Readiness Gate

- Status: complete.
- Connected the runtime strategy record to the local embedding readiness
  evaluator.
- Added `runtime.strategy` as a formal provider configuration requirement.
- The strategy must be explicitly approved and all runtime gates must be
  satisfied before readiness can pass: dependency license review, Windows
  packaging plan, process isolation plan, tokenizer/config pinning, and
  benchmark acceptance.
- Preflight requirement visibility now includes the runtime strategy gate.
- No runtime dependency, runtime package, provider registration, model
  artifact, download path, or real execution behavior was added in this wave.

### Current Gate

- Local embedding runtime strategy and readiness tests: PASS, 14 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 43 test files and 231 tests.

## Wave 6.9: Composition Decision Guard

- Status: complete.
- Added a local embedding composition decision that separates readiness from
  execution enablement.
- Readiness alone is not enough: runtime registration, execution provider
  composition, and explicit execution enablement must also pass.
- The planned provider descriptor now reports composition blockers by default,
  while remaining `unconfigured` and `disabled`.
- No runtime registration, execution provider, explicit enablement flag, model
  artifact, download path, runtime dependency, or real execution behavior was
  added in this wave.

### Current Gate

- Local embedding composition decision tests: PASS, 3 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 44 test files and 234 tests.

## Wave 6.10: Local Embedding Manifest Draft Guard

- Status: complete.
- Added a provider-local manifest draft for `Qwen/Qwen3-Embedding-0.6B` as an
  audit artifact only.
- The draft records capability, source, runtime direction, and license while
  remaining `status: draft`, `installable: false`, and
  `downloadEnabled: false`.
- The draft intentionally omits formal manifest fields such as immutable
  revision, artifact digest, and size so it cannot be accepted as a
  `ModelManifest` or registered in the static model registry.
- Added tests that block artifact URLs, revision fields, SHA-256 digests, and
  installable/downloadable state from appearing in the draft.
- Extracted local embedding provider/model constants to avoid extending the
  readiness/artifact-plan import cycle.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, or execution
  behavior was added in this wave.

### Current Gate

- Local embedding manifest draft tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 45 test files and 238 tests.

## Wave 6.11: Immutable Revision Approval Guard

- Status: complete.
- Added a provider-local revision approval record for the selected embedding
  model.
- The default record is `pending`, omits upstream URLs and artifact digests,
  and keeps `downloadEnabled: false`.
- Readiness now requires `model.revision` to pass both manifest validation and
  an approved local revision record matching the manifest revision.
- Floating revisions such as `main`, `master`, `latest`, and `HEAD` remain
  blocked even if a caller marks the record approved.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, or execution
  behavior was added in this wave.

### Current Gate

- Local embedding revision approval and readiness tests: PASS, 2 test files
  and 12 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 46 test files and 243 tests.

## Wave 6.12: Artifact Pin Approval Guard

- Status: complete.
- Added a provider-local artifact pin approval record for the selected
  embedding model.
- The default record is `pending`, keeps `downloadEnabled: false`, and omits
  upstream URLs, artifact revisions, and SHA-256 digests.
- Readiness now requires `artifact.pins` to pass both structural pin
  validation and an approved local artifact pin approval record matching every
  required artifact key, role, revision, and digest.
- Floating artifact revisions such as `main`, `master`, `latest`, and `HEAD`
  remain blocked even if a caller marks the record approved.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, or execution
  behavior was added in this wave.

### Current Gate

- Local embedding artifact approval, readiness, and composition tests: PASS,
  3 test files and 16 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 47 test files and 248 tests.

## Wave 6.13: License Redistribution Approval Guard

- Status: complete.
- Added a provider-local license approval record for the selected embedding
  model.
- The default record is `pending`, keeps `downloadEnabled: false`, and omits
  upstream URLs, artifact digests, and artifact references.
- Readiness now requires `license.redistribution_review` to pass both the
  existing manual redistribution flag and an approved local license record
  matching the selected model, source, and Apache-2.0 manifest license.
- Red-risk manifests remain blocked even if a caller marks the license record
  approved.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, or execution
  behavior was added in this wave.

### Current Gate

- Local embedding license approval, readiness, and composition tests: PASS,
  3 test files and 18 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 48 test files and 254 tests.

## Wave 6.14: Benchmark Resource Profile Approval Guard

- Status: complete.
- Added a provider-local benchmark approval record for the selected embedding
  model.
- The default record is `pending`, keeps `downloadEnabled: false` and
  `executionEnabled: false`, and omits model files, URLs, artifact digests,
  and real metric values.
- Readiness now requires `benchmarks.local_resource_profile` to pass both the
  existing manual benchmark flag and an approved local benchmark record.
- Lite, Standard, and Local Enhanced profiles must each have latency, memory,
  and quality profile capture marked before the benchmark gate can pass.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, benchmark
  execution, or provider execution behavior was added in this wave.

### Current Gate

- Local embedding benchmark approval, readiness, and composition tests: PASS,
  3 test files and 19 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 49 test files and 259 tests.

## Wave 6.15: Readiness Checklist Summary Guard

- Status: complete.
- Added a provider-local readiness checklist that summarizes the approval
  state for revision, artifact pins, runtime strategy, license redistribution,
  and benchmark profiles.
- The default checklist is blocked, keeps `downloadEnabled: false` and
  `executionEnabled: false`, and exposes only gate status plus sanitized
  reasons.
- Approved records can satisfy the checklist without exposing revision values,
  SHA-256 digests, artifact filenames, URLs, model files, or benchmark metric
  values in the summary output.
- The checklist is not registered as an execution provider and does not change
  `apps/core-host` composition.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, benchmark
  execution, or provider execution behavior was added in this wave.

### Current Gate

- Local embedding readiness checklist tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 50 test files and 263 tests.

## Wave 6.16: Configuration Checklist Visibility Guard

- Status: complete.
- Connected the provider-local readiness checklist to the local embedding
  provider configuration report.
- Configuration report reasons now include sanitized checklist blockers for
  revision, artifact pins, runtime strategy, license redistribution, and
  benchmark profile gates.
- The report does not expose revision values, SHA-256 digests, artifact
  filenames, URLs, model files, benchmark metric values, download enablement,
  or execution enablement.
- Fully approved readiness input still reports only that local embedding
  execution is disabled until a real runtime provider is composed.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, benchmark
  execution, or provider execution behavior was added in this wave.

### Current Gate

- Local embedding readiness provider and checklist tests: PASS, 2 test files
  and 17 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 50 test files and 264 tests.

## Wave 6.17: Phase 6 Go/No-Go Checklist

- Status: complete.
- Added `docs/phase-6-go-no-go.md` as the Phase 6 readiness handoff checklist.
- Documented the current safe state, guard inventory, no-go rules, and go
  criteria for revision selection, artifact pinning, runtime work, and
  execution enablement.
- Reaffirmed that real downloads, model artifacts, signed URLs, credentials,
  real runtime dependencies, runtime registration, and provider execution
  remain blocked until separately approved and verified.
- No code path, provider composition, runtime dependency, download path,
  artifact pin, or execution behavior was added in this wave.

### Current Gate

- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 50 test files and 264 tests.

## Wave 6.18: Revision Selection Procedure Guard

- Status: complete.
- Added a provider-local revision selection procedure guard for the planned
  local embedding provider.
- Added `docs/phase-6-revision-selection-procedure.md` to define the later
  manual process for selecting an immutable upstream revision.
- The procedure blocks floating revisions, enabled downloads, artifact pinning
  during revision selection, non-local approval records, and unverified work.
- A candidate can become ready for approval without exposing the candidate
  revision in the procedure summary output.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, benchmark
  execution, or provider execution behavior was added in this wave.

### Current Gate

- Local embedding revision selection procedure tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 51 test files and 267 tests.

## Wave 6.19: Artifact Pinning Procedure Guard

- Status: complete.
- Added a provider-local artifact pinning procedure guard for the planned
  local embedding provider.
- Added `docs/phase-6-artifact-pinning-procedure.md` to define the later
  manual process for moving from approved revision to approved artifact pins.
- The procedure blocks artifact pinning until revision approval, required
  artifact confirmation, digest verification, signed URL exclusion, disabled
  downloads, provider-local approval records, and verification gates pass.
- A candidate artifact-pinning wave can become ready for approval without
  exposing revision values, SHA-256 digests, artifact filenames, or URLs in the
  procedure summary output.
- No real model revision, artifact digest, upstream URL, model manifest,
  runtime dependency, download path, provider registration, benchmark
  execution, or provider execution behavior was added in this wave.

### Current Gate

- Local embedding artifact pinning procedure tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 52 test files and 270 tests.

## Wave 6.20: Runtime Implementation Procedure Guard

- Status: complete.
- Added a provider-local runtime implementation procedure guard for the
  planned local embedding provider.
- Added `docs/phase-6-runtime-implementation-procedure.md` to define the future
  dedicated runtime package boundary, supervised helper process, Windows
  packaging, resource scheduler integration, failure degradation, and
  verification gates.
- The procedure remains pending by default and blocks runtime dependencies and
  execution enablement during the approval wave.
- A future implementation wave can become ready for approval without exposing
  revisions, artifact digests, artifact filenames, URLs, local private paths,
  dependency versions, or benchmark metrics.
- No runtime dependency, runtime package implementation, model artifact,
  download path, provider registration, composition change, or real embedding
  execution was added in this wave.

### Current Gate

- Local embedding runtime implementation procedure tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 53 test files and 273 tests.

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
