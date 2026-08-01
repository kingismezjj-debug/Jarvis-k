# Phase 7 Progress

Phase 7 starts from the Phase 6 local embedding readiness baseline. The goal
is to move from provider-local planning guards into real-provider developer
alpha readiness one narrow wave at a time.

The first capability remains embedding. The planned local embedding provider
must stay `unconfigured` and `disabled` until every readiness, runtime,
packaging, license, benchmark, and composition gate passes.

## Wave 7.1: Immutable Revision Selection

- Status: complete.
- Selected the immutable upstream revision for `Qwen/Qwen3-Embedding-0.6B`:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Verified by read-only upstream ref lookup:
  `git ls-remote https://huggingface.co/Qwen/Qwen3-Embedding-0.6B HEAD refs/heads/main`.
- Added a provider-local approved revision record factory that keeps
  `downloadEnabled: false`.
- The approved revision can satisfy only the `model.revision` gate when a
  later approved manifest uses the same revision.
- No artifact SHA-256 digest, artifact filename, model download, model file,
  cache, runtime dependency, provider registration, composition change, or real
  embedding execution was added in this wave.

### Current Gate

- Local embedding revision approval tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 55 test files and 280 tests.

## Wave 7.2: Artifact Role Inventory

- Status: complete.
- Added a provider-local artifact role inventory for the selected upstream
  revision.
- Recorded only upstream repository filenames and role decisions; no file
  content, LFS metadata, SHA-256 digest, cache, signed URL, or download path
  was recorded.
- Corrected the pooling config path in the artifact plan from the Phase 6
  placeholder `pooling.json` to the observed upstream path
  `1_Pooling/config.json`.
- Marked the current minimum required pin set as model weights, model config,
  tokenizer config, tokenizer vocabulary, and pooling config.
- Kept additional observed repository paths under deferred review for the later
  artifact pinning wave.
- No artifact SHA-256 digest, artifact pin approval, model download, model
  file, cache, runtime dependency, provider registration, composition change,
  or real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact inventory tests: PASS, 4 tests.
- Local embedding artifact plan tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 56 test files and 284 tests.

## Wave 7.3: Artifact Required Set Decision

- Status: complete.
- Added a provider-local artifact required-set decision guard for the selected
  upstream revision.
- Expanded the artifact plan from the Phase 7.2 minimum set to the full
  required pin set for model weights, model config, sentence-transformers
  config, generation config, sentence-transformers modules, tokenizer config,
  tokenizer graph, tokenizer merges, tokenizer vocabulary fallback, and pooling
  config.
- Marked `.gitattributes` and `README.md` as excluded from runtime artifact
  pinning.
- The required-set guard keeps downloads disabled, pinning disabled, and digest
  values absent while confirming that every artifact plan path is covered.
- No artifact SHA-256 digest, artifact pin approval, model download, model
  file, cache, runtime dependency, provider registration, composition change,
  or real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact required-set decision tests: PASS, 6 tests.
- Local embedding artifact plan and approval tests: PASS, 8 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 57 test files and 290 tests.

## Wave 7.4: Artifact Digest Capture Procedure Guard

- Status: complete.
- Added a provider-local artifact digest capture procedure guard for the
  selected upstream revision and confirmed required artifact set.
- The procedure defines the future SHA-256 capture approval boundary:
  digest method, isolated temporary workspace, signed URL exclusion,
  credential exclusion, cache path sanitization, read-only upstream access,
  double verification, and verification gates.
- The guard remains pending by default and blocks early digest capture,
  application downloads, artifact pinning, and local embedding execution.
- A future digest capture wave can become ready for approval without exposing
  artifact filenames, SHA-256 values, signed URLs, credentials, tokens, local
  cache paths, model files, runtime dependencies, or benchmark data.
- No artifact SHA-256 digest, artifact pin approval, model download, model
  file, cache, runtime dependency, provider registration, composition change,
  or real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact digest capture procedure tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 58 test files and 294 tests.

## Wave 7.5: Artifact Digest Approval Record Preparation

- Status: complete.
- Added provider-local prepared digest approval records for the selected
  upstream revision and required artifact set.
- Every required artifact slot is present, tied to the selected immutable
  revision, marked pending, and prepared for later digest capture.
- SHA-256 values remain absent and the prepared record cannot satisfy artifact
  pin approval or readiness by itself.
- Downloads remain disabled; no application download path, artifact pin
  approval, runtime dependency, provider registration, composition change, or
  local embedding execution was added in this wave.

### Current Gate

- Local embedding artifact approval tests: PASS, 6 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 58 test files and 296 tests.

## Wave 7.6: Artifact SHA-256 Digest Pinning

- Status: complete.
- Captured and approved SHA-256 digests for every required
  `Qwen/Qwen3-Embedding-0.6B` artifact at the selected immutable revision
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Used Hugging Face LFS `X-Linked-ETag` for `model.safetensors` to avoid
  storing or downloading the 1.19 GB weight file.
- Downloaded only public tokenizer/config text artifacts into a temporary
  directory outside the repository and verified their SHA-256 values with two
  local hashing implementations.
- Added explicit provider-local factories for the approved pinned artifact plan
  and approved artifact pin approval record.
- Strengthened approved artifact pin validation so approved records must carry
  the digest-capture preparation marker.
- Default artifact plan and prepared digest approval record remain
  pending/unpinned; downloads and execution remain disabled.
- No model file, model cache, signed URL, provider credential, runtime
  dependency, provider registration, composition change, benchmark value, or
  local embedding execution was added in this wave.

### Current Gate

- Local embedding artifact plan, artifact approval, readiness checklist,
  readiness provider, and composition decision tests: PASS, 32 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 58 test files and 298 tests.

## Wave 7.7: Manifest Approval

- Status: complete.
- Added an explicit provider-local approved `ModelManifest` for
  `Qwen/Qwen3-Embedding-0.6B`.
- The approved manifest uses the selected immutable revision, the Phase 7.6
  artifact digest set, a manifest-level artifact-set SHA-256 digest, and the
  total required artifact size.
- Added a manifest approval record and approval predicate that require matching
  revision evidence, approved artifact pins, matching artifact-set digest, and
  `downloadEnabled: false`.
- The default manifest draft remains audit-only and still cannot parse as a
  contracts `ModelManifest`.
- Provider configuration reports remain sanitized even when approved manifest
  and artifact pins are supplied.
- No model file, model cache, signed URL, provider credential, runtime
  dependency, provider registration, composition change, benchmark value, or
  local embedding execution was added in this wave.

### Current Gate

- Local embedding manifest approval, manifest draft, readiness provider, and
  readiness checklist tests: PASS, 26 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 59 test files and 303 tests.

## Wave 7.8: License and Redistribution Review Guard

- Status: complete.
- Verified public Hugging Face metadata for the selected immutable revision:
  `license:apache-2.0`.
- Strengthened the provider-local license approval record with explicit
  evidence for metadata license, manifest revision, model-weight review,
  tokenizer/config review, redistribution terms, NOTICE bundle definition,
  runtime dependency scope, and native dependency scope.
- Added an explicit approved license approval factory for the current pinned
  artifact set.
- License approval now rejects records with missing evidence, mismatched
  manifest revision, pending runtime/native dependency review, or red/unknown
  manifest license risk.
- Runtime and native dependency scopes are recorded as `none_added`; later waves
  that add runtime/native dependencies must open a separate review.
- Downloads, runtime registration, provider composition, and local embedding
  execution remain disabled.
- No model file, model cache, signed URL, provider credential, runtime
  dependency, provider registration, composition change, benchmark value, or
  local embedding execution was added in this wave.

### Current Gate

- Local embedding license approval, license review procedure, readiness
  provider, readiness checklist, and composition decision tests: PASS, 28
  tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 59 test files and 304 tests.

## Wave 7.9: Runtime Packaging and Process Isolation Guard

- Status: complete.
- Strengthened the provider-local runtime strategy with explicit package
  boundary, Windows packaging plan, and supervised child-process isolation
  evidence.
- Added an explicit approved runtime strategy factory for the planned
  Transformers runtime package boundary.
- Runtime strategy approval now requires:
  - dependencies scoped to the future dedicated runtime package only;
  - protected packages and apps kept out of runtime dependency scope;
  - composition rooted in `apps/core-host`;
  - supervised child-process IPC;
  - resource scheduler lease before model load;
  - sanitized failure reporting;
  - direct shell execution from model output blocked;
  - Windows packaging plan present;
  - model artifacts and cache paths not bundled or committed;
  - `runtimeDependenciesIntroduced: false`;
  - `executionEnabled: false`.
- The `runtime.strategy` readiness gate can now be satisfied explicitly, while
  `runtime.adapter`, `runtime.packaging`, benchmark, provider registration, and
  execution enablement remain separate later gates.
- No Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, native helper,
  runtime dependency, model file, model cache, signed URL, provider credential,
  provider registration, composition change, benchmark value, or local
  embedding execution was added in this wave.

### Current Gate

- Local embedding runtime strategy, runtime implementation procedure, runtime
  adapter, readiness provider, readiness checklist, and composition decision
  tests: PASS, 32 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 59 test files and 305 tests.

## Wave 7.10: Benchmark Capture Approval Guard

- Status: complete.
- Added a provider-local benchmark capture approval record that approves the
  benchmark input-set and method boundary without recording real metric values.
- Approved capture inputs are sanitized bilingual smoke, retrieval regression,
  and resource stress sets.
- Approved methods cover cold/warm latency runs, peak process memory, fixed
  retrieval expectations, scheduler-lease resource isolation, sanitized
  failure degradation, and privacy-sanitized inputs/outputs/logs.
- Capture approval explicitly requires `metricValuesCaptured: false`,
  `metricValuesExposed: false`, `downloadEnabled: false`, and
  `executionEnabled: false`.
- The benchmark result approval gate remains separate; real latency, memory,
  quality, and resource profiles still need a later runtime-backed capture
  wave before readiness can pass.
- No model execution, model download, runtime dependency, model file, model
  cache, signed URL, provider credential, provider registration, composition
  change, or benchmark metric value was added in this wave.

### Current Gate

- Local embedding benchmark capture procedure, benchmark approval, readiness
  provider, and readiness checklist tests: PASS, 26 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 59 test files and 307 tests.

## Wave 7.11: Runtime Implementation Approval Guard

- Status: complete.
- Added a provider-local runtime implementation approval record that approves
  implementation constraints without creating a runtime package or adding
  runtime dependencies.
- The approval record covers the future package manifest constraints, cache
  layout constraints, helper lifecycle constraints, and sanitized failure-mode
  mapping.
- Future runtime package constraints require a private package at
  `packages/inference-runtime-transformers-local`, adapter-only exports, an
  empty dependency allowlist for this wave, and the runtime dependency denylist.
- Cache constraints require no committed cache path, no committed model
  artifacts, no persisted signed URLs, hash verification before use, and cleanup
  after failed verification.
- Helper lifecycle constraints require supervised child process execution under
  `apps/core-host`, startup/shutdown timeouts, resource scheduler lease,
  sanitized logs, and no direct shell execution.
- The guard explicitly requires `runtimeDependenciesIntroduced: false`,
  `downloadEnabled: false`, `executionEnabled: false`, and
  `implementationValuesExposed: false`.
- No runtime package, runtime dependency, model download, model file, model
  cache, signed URL, provider credential, provider registration, composition
  change, benchmark value, or local embedding execution was added in this wave.

### Current Gate

- Local embedding runtime implementation procedure, runtime strategy, and
  runtime adapter tests: PASS, 14 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 59 test files and 309 tests.

## Remaining Phase 7 Work

- Complete final Windows packaging review, native/runtime dependency review for
  any dependencies actually added, and tokenizer/config runtime integration
  review.
- Capture and approve real benchmark latency, memory, quality, and resource
  profiles only after runtime dependencies and execution are separately
  approved.
- Implement the dedicated runtime package only after artifact, license,
  packaging, and benchmark gates are approved.
- Register runtime and execution providers only in `apps/core-host`, behind
  explicit enablement and preflight checks.
