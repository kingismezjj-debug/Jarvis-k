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

## Wave 7.12: Windows Packaging Approval Guard

- Status: complete.
- Added a provider-local Windows packaging approval record for the planned
  Transformers local embedding runtime.
- The approval record covers installer policy, user-cache model storage,
  update/rollback behavior, NOTICE/license bundle requirements, size-budget
  review, and sanitized packaging output boundaries.
- The `runtime.packaging` readiness gate now requires both
  `packagingReviewed: true` and an approved packaging record matching the
  provider, model, runtime package name, package location, and composition root.
- Pending or mismatched packaging approval records fail closed.
- The approved packaging policy keeps installer creation, model/runtime
  bundling, runtime dependencies, downloads, execution, committed cache paths,
  persisted signed URLs, and exposed packaging values disabled.
- No installer, runtime package, runtime dependency, model download, model
  file, model cache, signed URL, provider credential, provider registration,
  composition change, benchmark value, or local embedding execution was added
  in this wave.

### Current Gate

- Local embedding Windows packaging approval, readiness provider, and
  composition decision tests: PASS, 20 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 60 test files and 313 tests.

## Wave 7.13: Dedicated Runtime Package Preflight Guard

- Status: complete.
- Added a provider-local runtime package preflight approval record for the
  planned Transformers local embedding runtime package.
- The approval record fixes the future package name, package location,
  composition root, private-package requirement, adapter-only public surface,
  import policy, and execution safety constraints.
- The approved preflight keeps package scaffolding, workspace registration,
  runtime behavior implementation, runtime dependencies, downloads, execution,
  process-launcher exports, downloader exports, model artifact path exports,
  provider-policy exports, and exposed preflight values disabled.
- The future package may expose only runtime adapter descriptor, runtime adapter
  factory, runtime health probe, and sanitized error mapping surfaces.
- Runtime dependency imports remain blocked until a separate dependency
  approval wave.
- No runtime package, workspace registration, runtime dependency, model
  download, model file, model cache, signed URL, provider credential, provider
  registration, composition change, benchmark value, or local embedding
  execution was added in this wave.

### Current Gate

- Local embedding runtime package preflight tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 61 test files and 316 tests.

## Wave 7.14: Runtime Dependency Selection Guard

- Status: complete.
- Added a provider-local runtime dependency selection approval record for the
  planned Transformers local embedding runtime.
- Selected `python_transformers_child_process` as the preferred future fidelity
  path while keeping dependency addition explicitly unapproved.
- Deferred `transformers_js_child_process` until tokenizer, pooling, and model
  compatibility are proven.
- Deferred `onnx_runtime_child_process` until an approved conversion and
  tokenizer/pooling parity plan exists.
- The approved record requires runtime dependencies to stay scoped to the
  future dedicated runtime package only, with concrete composition in
  `apps/core-host`, supervised child-process isolation, resource scheduler
  leases, future license/NOTICE review, future native redistribution review,
  future benchmark approval, and fallback behavior.
- The approved selection keeps dependency addition, concrete package version
  selection, runtime dependency allowlists, runtime dependencies, downloads,
  execution, and exposed dependency values disabled.
- No `package.json` dependency change, runtime package, workspace
  registration, Python environment, runtime dependency, model download, model
  file, model cache, signed URL, provider credential, provider registration,
  composition change, benchmark value, or local embedding execution was added
  in this wave.

### Current Gate

- Local embedding runtime dependency selection tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 62 test files and 319 tests.

## Wave 7.15: Runtime Package Scaffold with Fake Runtime

- Status: complete.
- Created the dedicated private runtime workspace
  `@jarvis-k/inference-runtime-transformers-local` at
  `packages/inference-runtime-transformers-local`.
- Added only `@jarvis-k/contracts` as a workspace dependency.
- Added a fake fail-closed runtime surface with descriptor creation, health
  report creation, unavailable runtime adapter factory, and sanitized runtime
  error mapping.
- The fake runtime reports `unavailable`; `canLoad` always returns `false`;
  `load` always throws a sanitized unavailable error.
- Root workspace, build, typecheck, test, and verify paths now include the new
  runtime package.
- The dependency boundary checker now includes the new runtime package and
  permits only `@jarvis-k/contracts` workspace imports from its source.
- The scaffold keeps real runtime dependencies, Python environments, model
  artifact access, downloads, cache access, runtime registration, provider
  composition, and local embedding execution disabled.
- No Python, Transformers, ONNX, CUDA, Paddle, llama.cpp, native helper,
  runtime dependency, model download, model file, model cache, signed URL,
  provider credential, provider registration, composition change, benchmark
  value, or local embedding execution was added in this wave.

### Current Gate

- Local Transformers runtime scaffold tests: PASS, 3 tests.
- `npm run build -w @jarvis-k/inference-runtime-transformers-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 63 test files and 323 tests.

## Wave 7.16: Artifact Cache and Download Manager Dry-Run

- Status: complete.
- Added a dry-run artifact cache and download manager state machine to
  `@jarvis-k/inference-runtime-transformers-local`.
- The state machine defines `pending`, `downloading`, `verifying`, `ready`,
  `corrupted`, `cleanup_required`, and `rollback_ready` states.
- Valid dry-run transitions cover future download start, download completion,
  digest verification pass/fail, cleanup request/completion, and rollback
  request/completion.
- Invalid transitions fail closed and keep the current state.
- The dry-run plan records user-cache provider namespace policy, SHA-256
  verification-before-ready policy, partial download cleanup, rollback
  requirement, signed URL exclusion, credential material exclusion, and
  uninstall retention behavior.
- The dry-run manager keeps network access, filesystem writes, real downloads,
  cache mutation, concrete cache paths, model artifact access, digest value
  exposure, runtime execution, and provider composition disabled.
- No real download, filesystem write, cache directory, signed URL, credential,
  digest value, model artifact, runtime dependency, provider registration,
  composition change, benchmark value, or local embedding execution was added
  in this wave.

### Current Gate

- Local Transformers runtime scaffold and artifact cache dry-run tests: PASS,
  6 tests.
- `npm run build -w @jarvis-k/inference-runtime-transformers-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 64 test files and 326 tests.

## Wave 7.17: Controlled Artifact Download and SHA-256 Verification Guard

- Status: complete.
- Added a fail-closed controlled artifact download and SHA-256 verification
  guard to `@jarvis-k/inference-runtime-transformers-local`.
- The guard supports two future operations: `prepare_download` from the
  `pending` cache state and `verify_download` from the `verifying` cache state.
- The guard requires safe relative artifact keys, HTTPS source URLs, unsigned
  and query-free source URLs, lowercase SHA-256 expected digests, matching
  observed SHA-256 digests before ready state, cache-state alignment, and all
  artifact/revision/license/download/cache/verification/cleanup/rollback
  approvals.
- The guard rejects unsafe artifact keys, signed/query/token URLs, digest
  mismatch, missing approvals, wrong cache states, observed digests during
  download preparation, missing observed digests during verification, and any
  requested side effect.
- Guard results do not echo source URLs or digest values.
- The guard keeps network access, filesystem writes, real downloads, cache
  mutation, signed URL persistence, credential persistence, source URL
  exposure, digest value exposure, model artifact access, runtime execution,
  and provider composition disabled.
- No real downloader, filesystem cache implementation, SHA-256 hashing
  implementation, cache path, model artifact, signed URL, credential, runtime
  dependency, provider registration, composition change, benchmark value, or
  local embedding execution was added in this wave.

### Current Gate

- Local Transformers runtime scaffold, artifact cache dry-run, and controlled
  artifact download guard tests: PASS, 10 tests.
- `npm run build -w @jarvis-k/inference-runtime-transformers-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 65 test files and 330 tests.
- Remote CI: PASS on commit `0a2e0b8`, run `30697925253`.

## Wave 7.18: Tokenizer and Config Integration Review

- Status: complete.
- Added a provider-local tokenizer/config integration review for the planned
  Transformers embedding runtime.
- The review covers model configuration, sentence-transformers configuration
  and module scope, tokenizer configuration and asset behavior, pooling
  configuration, text-batch input and embedding-vector output contracts,
  pooling parity, normalization parity, and dedicated runtime ownership.
- Connected the review to the runtime strategy `runtime.model_tokenizer_pin`
  gate. Missing, pending, or regressed tokenizer/config evidence now keeps the
  runtime strategy unapproved.
- Review output remains sanitized and does not expose URLs, SHA-256 values,
  artifact filenames, model files, cache paths, or private local paths.
- Runtime dependencies, downloads, model access, runtime registration,
  provider composition, benchmark execution, and local embedding execution
  remain disabled.

### Current Gate

- Local embedding tokenizer/config review and runtime strategy tests: PASS,
  8 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 66 test files and 335 tests.

## Wave 7.19: Runtime Helper Protocol Guard

- Status: complete.
- Added a pure protocol and validation guard to
  `@jarvis-k/inference-runtime-transformers-local` for the future supervised
  runtime helper.
- The protocol defines `health`, `load`, `embed`, and `shutdown` messages with
  bounded request/correlation IDs and response correlation preservation.
- `load` and `embed` require a resource lease identifier.
- Startup, request, and shutdown timeout policy is explicit and bounded.
- The guard requires private child-process IPC under `apps/core-host`, rejects
  direct shell execution, rejects unsafe/path-like values and arbitrary error
  messages, validates embedding results through the provider-neutral contract,
  and maps raw helper failures to canonical sanitized errors.
- The protocol currently reports the Transformers runtime as unavailable.
  Runtime dependencies, downloads, model artifacts, runtime loading,
  inference execution, provider registration, and concrete composition remain
  disabled.

### Current Gate

- Runtime helper protocol tests: PASS, 8 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 67 test files and 343 tests.

## Wave 7.20: Controlled Artifact Cache Executor Guard

- Status: complete as a plan-only preparation wave.
- Added a provider-local controlled artifact cache executor boundary to
  `@jarvis-k/inference-runtime-transformers-local`.
- The executor can plan download preparation, verified readiness, cleanup
  request staging, and rollback request staging without performing any action.
- Download and verification plans require matching accepted results from the
  existing artifact and SHA-256 guards.
- Cleanup and rollback request staging requires explicit approval flags.
- Every result reports `planOnly: true`, `executionDeferred: true`, and
  `stateMutationApplied: false`.
- Completion of cleanup or rollback is intentionally not exposed because it
  would require a separately approved filesystem/cache implementation.
- Network access, filesystem writes, downloads, model artifact reads, cache
  mutation, runtime dependencies, provider registration, composition changes,
  and inference execution remain disabled.

### Current Gate

- Controlled artifact cache executor tests: PASS, 5 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 68 test files and 348 tests.

## Wave 7.21: Runtime Adapter Isolation Guard

- Status: complete as a readiness guard only.
- Added a provider-local isolation guard for the planned Transformers
  embedding runtime adapter.
- The guard validates the provider-neutral runtime descriptor, dedicated
  package boundary, supervised private child-process protocol, resource lease
  requirement, sanitized errors, and fallback-provider availability.
- An accepted result means only `ready_for_dependency_approval`; composition,
  provider registration, default opt-in, model loading, and execution remain
  blocked.
- Regressions in runtime dependencies, downloads, execution, registration,
  default opt-in, helper isolation, fallback availability, unsafe descriptor
  notes, or descriptor capability are rejected.
- No real runtime adapter, runtime dependency, Python environment, model
  loader, artifact access, provider registration, composition change,
  benchmark value, or local embedding execution was added in this wave.

### Current Gate

- Runtime adapter isolation guard tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 69 test files and 352 tests.

## Wave 7.22: Runtime Acceptance Preflight

- Status: complete as a review-only preparation wave.
- Added a provider-local aggregate preflight for benchmark capture procedure,
  deferred benchmark values, license/native review, Windows packaging policy,
  runtime dependency selection, and runtime adapter isolation.
- An accepted result means only `ready_for_runtime_backed_capture`.
- The preflight requires benchmark result values to remain pending and
  uncaptured, and keeps runtime dependencies, downloads, cache writes,
  installer creation, provider registration, default opt-in, and execution
  disabled.
- Missing or regressed review evidence, captured metrics, dependency changes,
  packaging actions, provider registration, dirty verification, or unsafe
  state fail closed.
- No benchmark metric value, runtime dependency, native artifact, model file,
  cache, installer, provider registration, composition change, or local
  embedding execution was added in this wave.

### Current Gate

- Runtime acceptance preflight tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 70 test files and 356 tests.

## Wave 7.23: Composition Preflight

- Status: complete as a review-only preparation wave.
- Added a provider-local composition and enablement preflight for the planned
  Transformers embedding runtime.
- The preflight requires accepted runtime acceptance and adapter isolation
  evidence, the fixed `apps/core-host` composition root, unchanged Core Host
  composition and provider visibility, a fixture fallback, and clean
  verification.
- An accepted result means only
  `ready_for_explicit_composition_review`; `compositionAllowed` remains
  `false`.
- Provider registration, execution, default opt-in, runtime dependencies,
  downloads, model artifact access, cache writes, installer creation, model
  bundling, runtime loading, and inference execution remain disabled.
- No Core Host, Desktop, IPC, UI, contracts, capabilities, runtime dependency,
  model artifact, cache, installer, provider registration, or execution change
  was added in this wave.

### Current Gate

- Local embedding composition preflight tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 73 test files and 370 tests.

## Remaining Phase 7 Work

- Phase 7.13 through Phase 7.23 automation scope is complete.
- Phase 7 is now at the explicit composition approval boundary. Do not
  register the real provider, enable execution, change default opt-in behavior,
  add runtime dependencies, access model artifacts, or modify `apps/core-host`
  without a separate approval and implementation stage.
- Capture and approve real benchmark latency, memory, quality, and resource
  profiles only after runtime dependencies and execution are separately
  approved.
- Implement the dedicated runtime package only after artifact, license,
  packaging, and benchmark gates are approved.
- Register runtime and execution providers only in `apps/core-host`, behind
  explicit enablement and preflight checks, after the hard pause is lifted.

## Phase 8.1: Embedding Memory Retrieval Contract

- Status: complete as a provider-neutral contract and fixture preparation
  wave.
- Added bounded embedding memory records and queries, deterministic retrieval
  result schemas, sanitized match DTOs, and an injected retrieval port to
  `@jarvis-k/memory`.
- Added a fail-closed preflight whose accepted status is only
  `ready_for_fixture_contract`.
- The fixture test executor covers cosine ranking, conversation filtering,
  bounded results, dimension validation, and degraded no-match behavior.
- Memory schema/index migration, SQLite changes, vector writes, real
  embedding provider composition, retrieval execution, Core Host changes, and
  UI/Desktop/contracts exposure remain disabled.

### Current Gate

- Embedding retrieval contract tests: PASS, 4 tests.
- Embedding retrieval preflight tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 74 test files and 374 tests.

### Next Hard Pause

- Do not migrate the Memory schema or add a vector index without explicit
  approval.
- Do not modify `packages/memory-sqlite`, Core, `apps/core-host`, Desktop, UI,
  or contracts for retrieval until the schema and product behavior are
  separately decided.

## Phase 8.2: Retrieval Benchmark Harness

- Status: complete as a fixture-only benchmark preparation wave.
- Added a provider-neutral benchmark plan and evaluator for bounded retrieval
  cases.
- The harness measures only deterministic fixture results for recall-at-k,
  mean reciprocal rank, and degraded-case count.
- Every plan and report is marked `fixture_only`; execution is deferred,
  metric values are not persisted, and raw memory text and vector values are
  excluded.
- No model-backed retrieval, real benchmark capture, Memory schema/index
  migration, vector write, Core Host change, provider composition, or UI
  exposure was added in this wave.

### Current Gate

- Retrieval benchmark harness tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 74 test files and 374 tests.

### Next Hard Pause

- Real benchmark values remain deferred until a separately approved runtime
  and Memory execution stage.
- Do not add SQLite vector schema/index migration, vector writes, model-backed
  retrieval, Core Host composition, or user-facing retrieval output.

## Phase 9.1: Tool Governance Contract

- Status: complete as a provider-neutral contract and fixture preparation
  wave.
- Added tool descriptors, bounded primitive arguments, risk levels,
  allowlists, blocked IDs, permission scopes, confirmation requirements,
  sanitized policy decisions, audit records, and a fixture-only executor.
- Windows execution, shell execution, network access, model-driven tool
  invocation, raw tool input/output exposure, and real operating-system side
  effects remain disabled.
- No IPC command, Core handling, Desktop behavior, UI control, or
  `apps/core-host` composition change was added in this wave.

### Current Gate

- Tool protocol contract tests: PASS, 4 tests.
- Tool governance and fixture executor tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/contracts`: PASS.
- `npm run build -w @jarvis-k/capabilities`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 76 test files and 383 tests.

### Next Hard Pause

- Do not add real Windows tool execution, permission enforcement against the
  OS, IPC commands, Core routing, UI confirmation controls, or model-driven
  invocation without a separate product and security approval.

## Phase 10.1: Local Voice Capability Contract

- Status: complete as a provider-neutral contract, preflight, and fixture
  preparation wave.
- Added a local voice capability descriptor and fixture availability report to
  `packages/voice`.
- The contract covers the existing provider-neutral ASR and TTS playback
  coordination ports, future dedicated runtime ownership, supervised private
  IPC, resource lease requirements, and sanitized failure reporting.
- Added a fail-closed preflight whose accepted status is only
  `ready_for_fixture_contract`.
- Partial fixture availability reports `degraded` without exposing transcript
  text, audio bytes, credentials, URLs, cache paths, or private paths.
- Network access, credentials, runtime dependencies, model downloads, model
  loading, audio execution, provider registration, default opt-in, Core Host
  composition, Desktop IPC, and UI behavior remain disabled or unchanged.

### Current Gate

- Local voice contract and fixture tests: PASS.
- Local voice preflight tests: PASS.
- `npm.cmd run build -w @jarvis-k/voice`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS.

### Next Hard Pause

- Do not select or install a real local STT/TTS runtime, add runtime/native
  dependencies, access speech model artifacts, execute real audio, register a
  provider, change default opt-in behavior, or add UI/Desktop controls without
  a separate product and security approval.

## Phase 10.2: Local Voice Fixture Benchmark Harness

- Status: complete as a deterministic fixture-only benchmark preparation wave.
- Added a provider-neutral benchmark plan and evaluator in `packages/voice`.
- The harness covers PTT finalization, continuous-listening recovery, TTS
  interruption handling, degraded provider behavior, and resource overlap.
- Reports contain only bounded counts, sanitized outcomes, and safety flags;
  raw audio, transcript text, arbitrary observation fields, credentials, URLs,
  private paths, and model/runtime metrics are not persisted or echoed.
- Empty observations and resource overlap fail closed; partial fixture
  availability reports `degraded` without enabling production behavior.
- Real STT/TTS runtimes, artifacts, audio execution, provider registration,
  Core Host composition, Desktop IPC, and UI behavior remain unchanged.

### Current Gate

- Local voice fixture benchmark tests: PASS.
- `npm.cmd run build -w @jarvis-k/voice`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS.

### Next Hard Pause

- Do not capture real speech latency, memory, quality, resource, or audio
  metrics; select/install a real STT/TTS runtime; access voice artifacts;
  execute real audio; register a provider; change default opt-in behavior; or
  add UI/Desktop benchmark controls without a separate approval.

## Phase 10.3: Local Voice Runtime Isolation Guard

- Status: complete as a provider-local isolation guard preparation wave.
- Added a pending dedicated runtime adapter boundary for local voice.
- The guard requires future adapter-only exports, supervised child-process
  ownership, private IPC, resource leases, sanitized failures, and a fixture
  fallback.
- An accepted result means only
  `ready_for_runtime_dependency_approval`.
- Runtime dependencies, Python/native environments, network access,
  credentials, model downloads, model loading, audio execution, provider
  registration, default opt-in, and arbitrary descriptor values remain
  blocked or hidden.
- No runtime package was created and no Core Host, Desktop, IPC, UI, or
  provider composition change was made.

### Current Gate

- Local voice runtime isolation tests: PASS.
- `npm.cmd run build -w @jarvis-k/voice`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS.

### Next Hard Pause

- Do not approve or add real STT/TTS runtime dependencies, Python/native
  environments, speech artifacts, audio execution, provider registration,
  default opt-in, or UI/Desktop controls without a separate approval.

## Phase 10.4: Local Voice Runtime Acceptance Preflight

- Status: complete as a provider-neutral aggregate preflight preparation wave.
- Added an aggregate guard for the fixture benchmark plan, runtime isolation
  boundary, and deferred license, Windows packaging, and native dependency
  reviews.
- An accepted result means only
  `ready_for_runtime_backed_capture`.
- Real speech benchmark values remain pending and unexposed; network access,
  credentials, runtime dependencies, model downloads, model loading, audio
  execution, provider registration, default opt-in, and execution enablement
  remain disabled.
- Missing review evidence, captured metrics, dependency changes, packaging or
  native review completion, or dirty verification fail closed.
- No runtime package, artifact, cache, Core Host, Desktop, IPC, UI, or provider
  composition change was added.

### Current Gate

- Local voice runtime acceptance preflight tests: PASS.
- `npm.cmd run build -w @jarvis-k/voice`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS.

### Next Hard Pause

- Do not add real STT/TTS runtime dependencies, Python/native environments,
  speech artifacts, real audio or benchmark capture, provider registration,
  execution enablement, installation policy, or UI/Desktop controls without a
  separate approval and implementation stage.

## Phase 11.1: OCR, Screen, and Vision Contract Guards

- Status: complete as a provider-neutral, fixture-only preparation wave.
- Added bounded screen-capture request and result schemas, provider-neutral
  vision analysis schemas, and injected screen-capture and vision provider
  ports.
- Added a fail-closed local visual preflight whose accepted status is only
  `ready_for_fixture_contract`.
- Added deterministic fixture screen-capture and vision providers while
  retaining the existing fixture OCR provider as the regression path.
- The preflight blocks real screen capture, permission handling, raw pixel
  persistence or exposure, model loading, network access, runtime
  dependencies, provider registration, operating-system command conversion,
  Core Host composition, Desktop IPC, and UI behavior.
- No real OCR or vision runtime, model artifact, cache, screen capture,
  provider registration, IPC command, Core Host change, Desktop change, or UI
  change was added.

### Current Gate

- Local visual contract, fixture provider, preflight, normal, blocked,
  degraded, and sanitized-output tests: PASS.
- `npm.cmd run build -w @jarvis-k/contracts`: PASS.
- `npm.cmd run build -w @jarvis-k/capabilities`: PASS.
- `npm.cmd run build -w @jarvis-k/inference-adapter-fixture`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not add real screen capture, permission prompts, OCR or vision runtime
  dependencies, visual model artifacts, model loading, network access,
  provider registration, Core Host routing, Desktop IPC, or UI controls
  without a separate product, privacy, and security approval.

## Phase 11.2: Visual Fixture Benchmark Harness

- Status: complete as a deterministic, provider-neutral, fixture-only
  benchmark preparation wave.
- Added a bounded benchmark plan and evaluator for OCR result completion,
  screen-capture metadata completion, vision analysis completion, degraded
  fixture coverage, and sanitized-output safety checks.
- Reports expose only bounded counts, outcomes, reason codes, and a
  safety-violation flag; raw pixels, OCR text, arbitrary vision output,
  credentials, URLs, private paths, and model metrics remain unpersisted and
  unexposed.
- Empty observations, failed cases, and unsafe observation flags fail closed.
  Degraded fixture coverage reports `degraded` without enabling real
  execution.
- Added a fixture smoke that composes the deterministic screen, OCR, and
  vision providers through the benchmark evaluator in memory.
- No real visual benchmark capture, screen access, model runtime, model
  artifact, cache, provider registration, Core Host change, Desktop change,
  IPC command, or UI change was added.

### Current Gate

- Local visual benchmark and fixture composition tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not capture real visual latency, quality, memory, or resource metrics.
  Do not add real screen capture, permission prompts, OCR or vision runtime
  dependencies, visual model artifacts, model loading, provider
  registration, Core Host routing, Desktop IPC, or UI controls without
  separate product, privacy, and security approval.

## Phase 11.3: Visual Runtime Isolation Guard

- Status: complete as a provider-neutral isolation guard preparation wave.
- Added a pending dedicated runtime adapter boundary for local OCR and vision.
- The guard requires adapter-only exports, supervised private child-process IPC,
  resource leases, sanitized errors, a screen-capture permission boundary, a
  fixture fallback, and composition rooted in `apps/core-host`.
- An accepted result means only
  `ready_for_runtime_dependency_approval`.
- Runtime dependencies, model downloads, model loading, screen capture,
  OCR execution, vision execution, provider registration, default opt-in,
  raw pixel persistence or exposure, network access, credentials, and
  model-output command conversion remain blocked.
- No runtime package, dependency, screen permission, model artifact, cache,
  provider registration, Core Host change, Desktop change, IPC command, or UI
  change was added.

### Current Gate

- Local visual runtime isolation guard tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not approve or add visual runtime dependencies, screen-capture APIs or
  permissions, model artifacts, model loading, OCR/vision execution, provider
  registration, default opt-in, Core Host routing, Desktop IPC, or UI controls
  without a separate product, privacy, and security approval.
