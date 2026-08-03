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

## Wave 7.19: Runtime Helper Protocol and Client

- Status: complete as a provider-local protocol and transport-agnostic client
  preparation wave.
- Added a pure protocol and validation guard plus an injected-transport client
  to `@jarvis-k/inference-runtime-transformers-local` for the future
  supervised runtime helper.
- The protocol defines `health`, `load`, `embed`, and `shutdown` messages with
  bounded request/correlation IDs and response correlation preservation.
- The client owns request correlation, bounded timeouts, response validation,
  shutdown, helper exit recovery, and sanitized error mapping without owning a
  concrete process launcher.
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

- Runtime helper protocol and client tests: PASS, 12 tests.
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
- Phase 7.24 now implements the real Python Transformers helper and supervised
  child-process transport inside the dedicated runtime package.
- Phase 7.25 now prepares the explicit real-artifact access and runtime-backed
  benchmark approval handoff without granting any side effect.
- Phase 7.26 now runs the approved artifact verification and runtime-backed
  embedding benchmark in a temporary directory; peak helper memory remains
  deferred.
- Phase 7.27 now hardens the provider-local peak working-set probe; the
  approved Transformers environment rerun completed, but real artifact-backed
  memory capture remains deferred because no valid lifecycle sample was
  obtained.
- Phase 7.28 now enters a separate provider composition approval gate. The
  review boundary is accepted only as a handoff; readiness is still deferred
  on the local resource profile and composition remains disabled.
- Phase 7.29 now prepares the independent product and security approval package
  for the resource profile. The latest real-model memory sample remains
  deferred, and neither approval is recorded yet.
- The runtime helper is not registered, provider execution is not enabled,
  default opt-in is unchanged, and no real Qwen artifact is retained.
- Do not register the real provider, change default opt-in behavior, access
  real model artifacts outside the approved acceptance runner, or modify
  `apps/core-host` without the separate composition and artifact approval
  stages.
- Capture and approve real benchmark latency, memory, quality, and resource
  profiles only after a real approved model artifact is available.
- Register runtime and execution providers only in `apps/core-host`, behind
  explicit enablement and preflight checks, after the hard pause is lifted.

## Phase 7.24: Real Python Transformers Runtime

- Status: complete as a dedicated runtime implementation wave; real model
  artifact execution remains separately gated.
- Added a supervised Node child-process JSONL transport with shell execution
  disabled, minimal child environment, bounded output framing, stderr
  draining, process-exit recovery, and sanitized protocol failures.
- Added a Python Transformers helper with local-file-only loading,
  `trust_remote_code=False`, CPU execution, attention-mask mean pooling, L2
  normalization, resource-lease validation, and sanitized error mapping.
- Added a pinned Python dependency manifest inside the dedicated runtime
  package only.
- Added a runtime smoke that proves dependency health and a temporary
  synthetic-model load/embed lifecycle without downloading or retaining a real
  model artifact.
- No provider registration, Core Host composition, Desktop IPC, UI behavior,
  public contract change, real Qwen artifact access, model cache, or default
  opt-in change was added.

### Current Gate

- Node child-process transport tests: PASS.
- Python helper dependency health smoke: PASS.
- Temporary synthetic Transformers load/embed smoke: PASS.
- Runtime package build: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run verify`: PASS, 92 test files and 460 tests.

## Phase 7.25: Real Artifact Access Approval Gate

- Status: complete as a provider-local, review-only approval handoff wave.
- Added a fail-closed gate for the first real artifact access and
  runtime-backed benchmark run.
- The gate checks runtime helper evidence, synthetic fixture coverage, package
  build and verification status, artifact/license/benchmark/cache review,
  approved Python environment availability, fixture fallback availability, and
  composition remaining opt-in.
- A complete result means only
  `ready_for_explicit_artifact_access_approval`.
- Incomplete evidence reports `degraded`; any requested network, filesystem,
  model, benchmark, registration, enablement, or diagnostic side effect is
  `blocked`.
- Artifact access, cache writes, real model loading, benchmark capture,
  provider registration, execution enablement, and default opt-in remain
  disabled.

### Current Gate

- Artifact access approval policy, normal, degraded, blocked, and sanitized
  output tests: PASS.
- Runtime package build: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 93 test files and 464 tests.
- Offline synthetic runtime smoke: blocked by the current external Python
  environment; the smoke now reports only a sanitized environment failure and
  does not expose child-process commands or temporary paths.

### Next Hard Pause

- Stop before any real Qwen artifact access, network request, cache write,
  model directory read, real model load, runtime-backed benchmark capture,
  provider registration, execution enablement, or default opt-in change.
- Require explicit user approval for the artifact-access scope and retain the
  workspace in a clean, locally verifiable state.

## Phase 7.26: Real Artifact and Runtime Benchmark

- Status: complete for approved artifact verification and runtime-backed
  latency/quality capture; peak helper memory remains deferred.
- Added an explicit acceptance-only runner that downloads the approved
  artifact set to a temporary directory, verifies each artifact twice,
  matches the approved aggregate size, starts the Python Transformers helper,
  captures cold/warm latency, checks dimensions and normalized output, and
  removes the temporary directory on every exit path.
- Latest run passed artifact verification for 10 artifacts and matched the
  approved aggregate size of `1,207,470,234` bytes.
- Latest runtime-backed rerun result: Python `3.14.4`, Transformers `5.14.1`,
  Torch `2.13.0+cpu`, 1024 dimensions, 5 vectors, model load `475.90 ms`,
  first embedding `482.38 ms`, warm p50 `438.82 ms`, warm p95 `441.24 ms`,
  finite values and normalization passed, stable cosine `1`.
- Peak helper working-set capture remains deferred. The hardened probe works
  against a dependency-ready health process but did not obtain a valid sample
  during the real model lifecycle; no memory value is claimed.
- No model file or cache remains after the run. Provider registration,
  execution enablement, Core Host composition, Desktop IPC, UI behavior, and
  default opt-in remain unchanged.

### Current Gate

- Approved artifact download and double SHA-256 verification: PASS.
- Temporary model load and embedding execution: PASS.
- Runtime latency and quality benchmark: PASS.
- Temporary directory cleanup: PASS.
- Peak helper memory benchmark: DEFERRED.
- Full repository verification after this wave: PASS, 93 test files and
  464 tests.

### Next Hard Pause

- Do not register the real provider, change default opt-in, modify
  `apps/core-host`, expose provider visibility, or add model lifecycle/cache
  behavior without a separate composition and product approval.
- Treat peak memory capture as an open acceptance item until a safe,
  sanitized sampling path is approved and verified.

## Phase 7.27: Peak Memory Sampling Diagnostic

- Status: complete as a provider-local probe hardening and diagnostic wave;
  real artifact-backed memory acceptance remains deferred.
- Updated the optional Windows process probe to request the query and virtual
  memory read rights required by the memory API and to report
  `PeakWorkingSetSize` rather than a single current working-set sample.
- A short-lived non-model child process produced a positive sanitized sample
  through the hardened probe path.
- The approved Transformers environment was configured transiently for a
  successful benchmark rerun and then removed with its caches. The real model
  lifecycle still produced no valid memory sample, so no memory value is
  claimed.
- No artifact access, model directory, model cache, provider registration,
  execution enablement, Core Host composition, Desktop IPC, UI behavior, or
  default opt-in change was added.

### Current Gate

- Hardened probe syntax: PASS.
- Non-model child-process probe: PASS.
- Real artifact-backed peak memory capture: DEFERRED.
- Provider registration and execution enablement: unchanged and disabled.

### Next Hard Pause

- Keep the local resource profile gate deferred because the configured
  environment rerun did not produce a valid real-model lifecycle sample.
- Carry the result into the separate provider composition approval gate as a
  review-only handoff.
- Do not register the real provider, change default opt-in, modify
  `apps/core-host`, or expose provider visibility in this wave.

## Phase 7.28: Provider Composition Approval Gate

- Status: in progress as a provider-local, review-only approval handoff.
- Added a separate composition approval gate that consumes the existing
  composition preflight and readiness report without changing composition.
- The gate distinguishes three states: blocked review boundary,
  deferred readiness, and ready for manual composition approval.
- Current handoff state is `deferred_pending_readiness` because
  `benchmarks.local_resource_profile` remains unsatisfied.
- `compositionApprovalGranted`, `compositionAllowed`,
  `providerRegistrationEnabled`, `executionEnabled`, and
  `defaultOptInEnabled` remain `false`.
- Runtime registration, execution-provider composition, Core Host changes,
  provider visibility, Desktop IPC, UI behavior, artifact access, cache writes,
  model loading, and installer behavior remain unchanged.
- The fixture provider remains available as the regression fallback.

### Current Gate

- Composition approval gate normal, deferred, blocked, and sanitized-output
  tests: PASS, 4 tests.
- Composition preflight remains review-only and fail-closed.
- Local resource benchmark readiness: DEFERRED.
- Provider registration and execution enablement: unchanged and disabled.

### Next Hard Pause

- Do not register the real provider, compose the execution provider, change
  default opt-in, expose provider visibility, or modify `apps/core-host`.
- Do not treat the handoff as product, security, or release approval.
- Resolve the deferred local resource profile and obtain a separate explicit
  approval before any composition implementation wave.

## Phase 7.29: Resource Profile Product and Security Approval

- Status: in progress as an approved provider-local diagnostic wave; resource
  profile completion remains deferred.
- Added a separate resource profile gate with explicit product and security
  decisions.
- The gate distinguishes missing sample, ready for review, approved for
  composition review, and blocked safety states.
- The current state remains `deferred_pending_sample` because the approved
  2026-08-02 real-model lifecycle rerun did not produce a valid memory sample.
- The acceptance runner now records only bounded sample counts and fixed
  sanitized failure reason codes.
- Product approval and security approval were explicitly granted for one local
  acceptance diagnostic only; they do not grant provider composition.
- The approved temporary rerun passed artifact verification, manifest size
  matching, helper health, model load, embedding quality, latency capture, and
  cleanup, but resource sampling produced 0 valid samples with sanitized reason
  code `memory_probe_failed`.
- Provider registration, execution enablement, default opt-in, Core Host
  composition, Desktop IPC, UI visibility, artifact access, cache writes,
  model loading, and installer behavior remain unchanged.

### Current Gate

- Resource profile policy and normal, deferred, ready, approved, blocked, and
  sanitized-output tests: PASS, 5 tests.
- Acceptance runner syntax check: PASS.
- Temporary artifact/runtime benchmark: PASS.
- Artifact cleanup and temporary environment cleanup: PASS.
- Real-model memory profile: DEFERRED.
- Resource sampling attempts: 8.
- Valid memory samples: 0.
- Sanitized resource reason code: `memory_probe_failed`.
- Product approval: APPROVED for acceptance diagnostic only.
- Security approval: APPROVED for one temporary benchmark rerun only.

### Next Hard Pause

- Resolve or disposition the missing valid real-model memory sample before
  claiming the resource profile is complete.
- Only after a valid real-model sample exists may the resource gate report
  `approved_for_composition_review`.
- Do not register the real provider, change default opt-in, compose execution,
  or modify `apps/core-host`.

## Phase 7.30: Memory Sampling Gap Disposition

- Status: complete as a provider-local deferred-disposition wave.
- Added a formal disposition guard for the real helper lifecycle memory
  sampling gap observed during the approved Phase 7.29 temporary benchmark
  rerun.
- The accepted disposition records only that artifact verification, runtime
  benchmark, cleanup, product approval, security approval, hidden metrics, and
  fixed sanitized reason-code requirements were met.
- The gap is dispositioned as a known local diagnostic limitation, not as a
  completed resource profile.
- The guard explicitly returns `resourceProfileComplete: false`,
  `readinessSatisfied: false`, `compositionAllowed: false`,
  `providerRegistrationEnabled: false`, `executionEnabled: false`, and
  `defaultOptInEnabled: false`.
- The `benchmarks.local_resource_profile` readiness gate remains unsatisfied.
- No model artifact access, cache write, model load, provider registration,
  execution enablement, default opt-in change, Core Host composition, Desktop
  IPC, UI visibility, or installer behavior was added.

### Current Gate

- Resource profile disposition normal, blocked, metric-value, approval,
  cleanup, provider-registration, execution, default opt-in, and sanitized
  output tests: PASS.
- Formal disposition: `recorded_deferred_diagnostic_gap`.
- Resource profile: INCOMPLETE.
- Local resource readiness: UNSATISFIED.
- Provider composition: BLOCKED.

### Next Hard Pause

- Do not enter provider composition from this disposition alone.
- A future wave must either capture valid resource evidence with a separately
  approved method or make a separate product, security, and release decision to
  replace the resource-profile requirement.
- Do not register the real provider, change default opt-in, compose execution,
  or modify `apps/core-host`.

## Phase 7.31: Alternative Resource Evidence

- Status: complete as a provider-local alternative evidence wave.
- Added an approved alternative resource evidence guard that consumes the Phase
  7.30 deferred disposition plus explicit product and security approvals.
- The accepted evidence is limited to bounded sampling attempts, successful
  runtime benchmark completion, cleanup, and the sanitized
  `memory_probe_failed` reason code.
- The evidence is a local acceptance diagnostic only, not a product SLO, and
  does not enter UI, Core, provider visibility, or default behavior.
- Local embedding readiness may now satisfy
  `benchmarks.local_resource_profile` with accepted alternative evidence.
- The provider-local composition gate can now report
  `ready_for_manual_composition_approval` when all other readiness evidence is
  present.
- The composition gate still returns `compositionApprovalGranted: false`,
  `compositionAllowed: false`, `providerRegistrationEnabled: false`,
  `executionEnabled: false`, and `defaultOptInEnabled: false`.
- No model artifact access, cache write, model load, provider registration,
  execution enablement, default opt-in change, Core Host composition, Desktop
  IPC, UI visibility, or installer behavior was added.

### Current Gate

- Alternative resource evidence normal, blocked, approval, product-SLO,
  UI/Core exposure, provider-registration, execution, default opt-in, readiness,
  composition-review, and sanitized-output tests: PASS.
- Formal alternative evidence:
  `accepted_for_composition_review_only`.
- Local resource readiness: SATISFIED for composition review only.
- Provider composition approval: NOT GRANTED.
- Provider composition implementation: BLOCKED pending separate review.

### Next Hard Pause

- Review the exact `apps/core-host` composition diff and explicit opt-in
  behavior before any real provider registration.
- Reconfirm fixture fallback, sanitized errors, resource lease enforcement,
  startup/restart behavior, provider visibility, and rollback path.
- Obtain separate product and security approval for provider registration and
  execution enablement.

## Phase 7.32: Provider Composition Implementation Review

- Status: complete as a provider-local implementation review preparation wave.
- Added a composition implementation review guard that consumes the accepted
  Phase 7.31 composition approval gate evidence.
- The guard requires explicit confirmation of the Phase 7.31 alternative
  resource evidence plus review of the exact future `apps/core-host`
  composition diff, explicit opt-in behavior, fixture fallback preservation,
  sanitized runtime error mapping, resource lease enforcement,
  startup/restart behavior, provider visibility behavior, rollback plan, and
  desktop smoke plan.
- An accepted result means only
  `ready_for_product_security_composition_approval`.
- The guard still returns `compositionApprovalGranted: false`,
  `compositionAllowed: false`, `coreHostCompositionChanged: false`,
  `providerVisibilityChanged: false`, `providerRegistrationEnabled: false`,
  `executionEnabled: false`, and `defaultOptInEnabled: false`.
- Product and security composition approval remain pending for a separate
  wave.
- No Core Host composition change, provider registration, provider visibility
  change, execution enablement, default opt-in change, artifact access, cache
  write, runtime load, inference execution, Desktop IPC, UI behavior, or
  installer behavior was added.

### Current Gate

- Provider composition implementation review normal, blocked, missing Phase
  7.31 alternative evidence, missing exact diff, missing
  fallback/resource/error/lifecycle/rollback/smoke review, attempted mutation,
  and sanitized-output tests: PASS.
- Implementation review:
  `ready_for_product_security_composition_approval`.
- Provider composition approval: NOT GRANTED.
- Provider composition implementation: BLOCKED pending separate product and
  security approval.

### Next Hard Pause

- Do not change `apps/core-host`, register the runtime-backed embedding
  provider, enable execution, expose provider visibility, change default
  opt-in behavior, access model artifacts, write caches, or load the runtime
  without separate product and security approval for the exact composition
  implementation.

## Phase 7.33: Provider Composition Implementation

- Status: complete as an explicit opt-in Core Host composition wave.
- Added `apps/core-host` composition wiring behind
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`.
- Default behavior remains unchanged: no approved local embedding manifest is
  added, no Transformers runtime adapter is listed, no runtime-backed
  embedding provider is composed, and the local embedding provider remains
  `unconfigured` and `disabled`.
- With explicit opt-in, Core Host adds the approved local embedding manifest,
  lists the Transformers runtime adapter descriptor, reports the local
  embedding provider as runtime-backed, and composes an embedding provider
  shell.
- The provider shell validates requests, requires a resource scheduler lease
  before runtime session creation, releases provider resources on success or
  failure, and maps runtime failures to sanitized messages.
- The default runtime session factory still fails closed before Python helper
  launch, model artifact access, model load, cache write, or real embedding
  generation.
- Fixture embedding fallback is preserved. If
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set, the fixture embedding provider
  continues to own the embedding execution port.
- No model artifact download, persistent cache write, credential or signed URL
  persistence, real Python helper launch, model load, real local embedding
  inference, UI control, default opt-in change, or Windows/PowerShell
  operation execution was added.

### Current Gate

- Core Host local embedding composition normal, default-disabled, opt-in,
  resource-lease, sanitized-failure, model-mismatch, and boundary tests: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Provider composition implementation: available only behind explicit opt-in.
- Real runtime session factory: NOT IMPLEMENTED.
- Real model artifact access and model load: BLOCKED.

### Next Hard Pause

- Do not add a real runtime session factory, launch the Python helper from
  Core Host composition, read `JARVIS_K_RUNTIME_PYTHON` or model artifact
  paths for product execution, access model artifacts, write caches, load the
  real model, expose new UI controls, change default opt-in behavior, or
  enable real local embedding inference without a separate product and
  security approval.

## Phase 7.34: Runtime Session Factory Preflight

- Status: complete as a Core Host review-only preflight wave.
- Added a fail-closed `apps/core-host` preflight for the next possible real
  runtime session factory implementation wave.
- The preflight reviews explicit opt-in composition, approved manifest and
  runtime descriptor opt-in behavior, fixture fallback preservation, resource
  lease enforcement, sanitized error mapping, startup/restart/rollback review,
  future Python environment handling, and separate product/security approval
  requirements.
- Accepted preflight status is only
  `ready_for_runtime_session_factory_approval`.
- Degraded results cover incomplete review evidence while every side effect
  remains blocked.
- Blocked results cover attempted approval, registration/default opt-in
  mutation, runtime dependency change, Python environment read, helper launch,
  artifact/cache/model access, real inference, private path exposure, raw
  diagnostics exposure, or model-output shell execution.
- No runtime session factory implementation, Python helper launch, runtime
  Python environment read, model artifact path read, artifact access,
  persistent cache write, model load, real local embedding inference, provider
  registration behavior change, UI change, default opt-in change, or
  Windows/PowerShell operation execution was added.

### Current Gate

- Core Host runtime session factory preflight normal, degraded, blocked, and
  sanitized-output tests: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 100 test files and 497 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Real runtime session factory: NOT IMPLEMENTED.
- Real Python helper launch from Core Host: BLOCKED.
- Real model artifact access and model load: BLOCKED.

### Next Hard Pause

- Do not implement a real runtime session factory, read
  `JARVIS_K_RUNTIME_PYTHON`, read model artifact paths, launch the Python
  helper, access model artifacts, write caches, load the real model, expose
  raw runtime diagnostics, change provider registration behavior, change
  default opt-in behavior, or enable real local embedding inference without
  separate product and security approval.

## Phase 7.35: Runtime Session Factory Lifecycle

- Status: complete as an approved Core Host helper lifecycle wiring wave.
- Product approval allowed only explicit opt-in Core Host runtime session
  factory wiring. Default behavior remains disabled, UI/default visibility is
  unchanged, fixture fallback remains preserved, and real model artifact path
  reads, model loading, and real inference stay blocked.
- Security approval allowed only reading `JARVIS_K_RUNTIME_PYTHON` and
  starting the supervised Python Transformers child-process helper for
  lifecycle health.
- Core Host now creates the default local embedding runtime session factory
  when `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1` composes the provider and
  no test session factory is injected.
- The factory reads only `JARVIS_K_RUNTIME_PYTHON`, launches the dedicated
  runtime helper script through the supervised JSONL transport, performs a
  helper `health` handshake, rejects degraded or unsafe helper health with
  sanitized errors, and sends helper `shutdown` during session release.
- The factory does not pass a model directory to the helper, call helper
  `load`, call helper `embed`, read model artifact paths, access artifacts,
  write caches, load a model, or execute real local embedding inference.
- The returned session remains blocked at `embed` by the runtime execution
  gate, and the existing provider finally path still releases the resource
  lease.
- Fixture embedding fallback is preserved. If
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set, the fixture embedding provider
  continues to own the embedding execution port.

### Current Gate

- Core Host runtime session factory normal, missing-Python, unsafe-health,
  composition-wiring, lifecycle shutdown, blocked-execution, and
  sanitized-output tests: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd test -- apps/core-host/test/local-embedding-runtime-session-factory.test.ts apps/core-host/test/local-embedding-runtime-session-factory-preflight.test.ts apps/core-host/test/local-embedding-composition.test.ts`: PASS.
- `npm.cmd run verify`: PASS, 101 test files and 502 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Real Python helper health smoke was not run because
  `JARVIS_K_RUNTIME_PYTHON` is not configured in the local environment.
- Real model artifact path reads: BLOCKED.
- Real model load: BLOCKED.
- Real local embedding inference: BLOCKED.

### Next Hard Pause

- Do not read model artifact paths, pass a model directory to the helper, call
  helper `load`, call helper `embed`, access model artifacts, write model
  caches, load the real model, expose raw runtime diagnostics, change provider
  registration behavior, change default opt-in behavior, or enable real local
  embedding inference without separate product and security approval.

## Phase 7.36: Model Load and Inference Preflight

- Status: complete as a Core Host review-only preflight wave.
- Added a fail-closed `apps/core-host` preflight for the next possible model
  artifact path, helper `load`, and helper `embed` implementation stage.
- The preflight reviews Core Host composition root ownership, explicit opt-in
  provider behavior, Phase 7.35 helper lifecycle wiring, runtime Python
  environment approval evidence, approved manifest availability, artifact pin
  review, model artifact path policy, digest verification before load, helper
  `load` and `embed` contracts, resource lease before load, sanitized error
  mapping, fixture fallback, startup/restart/rollback review, and separate
  product/security approval requirements.
- Accepted preflight status is only
  `ready_for_model_load_inference_approval`.
- Degraded results cover incomplete review evidence while every side effect
  remains blocked.
- Blocked results cover attempted approval mutation, model artifact path read,
  model directory passing, helper `load` or `embed` call, artifact access,
  cache write, download, model load, real inference, raw vector exposure,
  provider registration change, default opt-in change, UI visibility change,
  raw diagnostics exposure, private path exposure, credential or signed URL
  persistence, or model-output shell execution.
- No model artifact path read, model directory handoff, helper `load`, helper
  `embed`, artifact access, persistent cache write, download, model load, real
  local embedding inference, UI change, provider registration behavior change,
  default opt-in change, raw diagnostics exposure, raw vector exposure, or
  Windows/PowerShell operation execution was added.

### Current Gate

- Core Host model load/inference preflight normal, degraded, blocked, approval
  mutation, side-effect, visibility, diagnostics, credential, shell, and
  sanitized-output tests: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd test -- apps/core-host/test/local-embedding-model-load-inference-preflight.test.ts`: PASS.
- `npm.cmd run verify`: PASS, 102 test files and 506 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- Desktop smoke tests were not required because Core Host startup, provider
  composition, Desktop IPC, UI visibility, and execution behavior did not
  change.
- Real model artifact path reads: BLOCKED.
- Helper `load`: BLOCKED.
- Helper `embed`: BLOCKED.
- Real local embedding inference: BLOCKED.

### Next Hard Pause

- Do not read model artifact paths, pass a model directory to the helper, call
  helper `load`, call helper `embed`, access artifacts, write caches, download
  artifacts, load the real model, expose raw runtime diagnostics, expose raw
  embedding vectors, change provider registration behavior, change default
  opt-in behavior, change UI visibility, or enable real local embedding
  inference without separate product and security approval.

## Phase 7.37: Model Artifact Path Handoff and Helper Load

- Status: complete as an explicit opt-in Core Host model-load-only wave.
- Added an explicit Core Host model directory env gate:
  `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`.
- Core Host verifies the approved local embedding artifact set with SHA-256
  before helper launch and before helper `load`.
- The runtime helper protocol now accepts an optional private
  `modelDirectory` field only on `load` requests.
- The Python helper prefers the private `load` payload model directory and
  retains the previous internal env fallback for approved runtime smoke and
  acceptance scripts.
- The helper load response returns only a sanitized session identifier, model
  id, capability, and timestamp; it does not echo the directory, digests, raw
  diagnostics, signed URLs, credentials, or private paths.
- `embed()` remains blocked in the Core Host runtime session and does not call
  helper `embed`.
- Provider registration, default opt-in behavior, fixture fallback, UI
  visibility, downloads, persistent cache writes, real embedding vectors, and
  Windows/PowerShell execution behavior remain unchanged.

### Current Gate

- Targeted Core Host and runtime helper protocol/client/process-transport
  tests: PASS, 5 files and 26 tests.
- `npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local`: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 102 test files and 509 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Helper `load`: ALLOWED only after local digest verification under explicit
  provider opt-in.
- Helper `embed`: BLOCKED.
- Real local embedding vectors in product flow: BLOCKED.

### Next Hard Pause

- Do not call helper `embed`, expose real embedding vectors, route real local
  embedding output into product retrieval or tool flows, change provider
  registration behavior, change default opt-in behavior, change UI visibility,
  add persistent model cache writes, download artifacts, or change Windows
  execution behavior without separate product and security approval.

## Phase 7.38: Helper Embed Implementation Preflight

- Status: complete as a Core Host review-only preflight wave.
- Added a fail-closed `apps/core-host` preflight for the next possible helper
  `embed` implementation stage.
- The preflight reviews Core Host composition root ownership, explicit opt-in
  provider behavior, Phase 7.35 helper lifecycle wiring, Phase 7.37 artifact
  digest verification and helper `load`, runtime Python and model directory
  env approvals, approved manifest availability, helper `embed` contract,
  loaded session identifier handoff, resource lease before embed, input batch
  and text bounds, dimension validation, vector sanitization, timeout and
  cancellation, sanitized error mapping, operation supervisor boundary, fixture
  fallback, and separate product/security approval requirements.
- Accepted preflight status is only `ready_for_helper_embed_approval`.
- Degraded results cover incomplete review evidence while every side effect
  remains blocked.
- Blocked results cover attempted helper `embed`, vector return, Memory
  routing, vector persistence, vector log exposure, product inference,
  provider registration change, default opt-in change, UI visibility change,
  raw diagnostics exposure, private path exposure, credential or signed URL
  persistence, model-output shell execution, download/cache mutation, or Memory
  schema migration.
- No helper `embed`, real vector return, Memory routing, vector persistence,
  product inference, provider registration/default opt-in/UI change, download,
  persistent cache write, raw diagnostics exposure, private path exposure, or
  Memory migration was added.

### Current Gate

- Core Host helper embed preflight normal, degraded, blocked, approval,
  visibility, diagnostics, credential, download/cache, Memory migration,
  shell, and sanitized-output tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd test -- apps/core-host/test/local-embedding-helper-embed-preflight.test.ts`: PASS.
- `npm.cmd run verify`: PASS, 103 test files and 513 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Helper `embed`: BLOCKED.
- Real local embedding vectors in product flow: BLOCKED.
- Memory schema/index migration: BLOCKED.

### Next Hard Pause

- Do not call helper `embed`, expose real embedding vectors, route vectors to
  Memory or product inference flows, persist vectors, change provider
  registration behavior, change default opt-in behavior, change UI visibility,
  add downloads, write persistent model caches, or run a Memory schema/index
  migration without separate product and security approval.

## Phase 7.39: Helper Embed Diagnostic Harness Preflight

- Status: complete as a Core Host review-only preflight wave.
- Added a fail-closed `apps/core-host` preflight and sanitized report shape for
  a future helper `embed` diagnostic harness.
- The preparation wave is fixture-transport-only and does not call helper
  `embed`.
- The preflight reviews diagnostic harness scope, sanitized report schema,
  bounded diagnostic case plan, raw input text redaction, vector value
  redaction, fixed failure reason codes, cleanup and release behavior, and
  separate product/security approval requirements.
- The diagnostic report shape may expose only bounded counts, fixed reason
  codes, and cleanup status.
- Accepted preflight status is only
  `ready_for_diagnostic_harness_approval`.
- Blocked results cover attempted helper `embed`, real vector return, raw
  input persistence, vector persistence/logging, artifact access, product
  inference, Memory routing, Memory migration, provider/default opt-in/UI
  changes, raw diagnostic or private path exposure, signed URL or credential
  persistence, downloads, persistent cache writes, or model-output shell
  execution.
- No helper `embed`, model artifact access, real vector return, raw input
  persistence, vector persistence/logging, Memory routing, Memory migration,
  product inference, provider registration/default opt-in/UI change, download,
  persistent cache write, raw diagnostics exposure, private path exposure, or
  Windows/PowerShell behavior change was added.

### Current Gate

- Core Host helper embed diagnostic preflight normal, degraded, blocked,
  approval, visibility, diagnostics, credential, download/cache, Memory,
  shell, and sanitized-output tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 104 test files and 517 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Helper `embed`: BLOCKED.
- Real local embedding vectors in diagnostic or product flow: BLOCKED.
- Memory schema/index migration: BLOCKED.

### Next Hard Pause

- Do not call helper `embed`, access real model artifacts for a diagnostic run,
  expose real embedding vectors, route vectors to Memory or product inference
  flows, persist vectors, change provider registration behavior, change
  default opt-in behavior, change UI visibility, add downloads, write
  persistent model caches, or run a Memory schema/index migration without
  separate product and security approval.

## Phase 7.40: Helper Embed Diagnostic Execution

- Status: implemented as an isolated Core Host diagnostic runner; real local
  helper embed execution is available only when the dedicated diagnostic opt-in
  and approved runtime/model environment are configured.
- Added `runCoreHostLocalEmbeddingHelperEmbedDiagnostic`, which requires
  product/security approval flags, Phase 7.38 and 7.39 preflight evidence, and
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC=1`.
- The runner reads `JARVIS_K_RUNTIME_PYTHON` and
  `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR` only inside `apps/core-host`, verifies
  the approved SHA-256 artifact pin set before helper launch, acquires a
  resource lease, and calls helper `health`, `load`, `embed`, and `shutdown`.
- The report exposes only bounded counts, step status, fixed reason codes, and
  cleanup status; it does not expose raw input text, vector values, private
  paths, artifact paths, SHA-256 values, signed URLs, credentials, or raw
  helper diagnostics.
- Added `npm.cmd run diagnostic:local-embedding:helper-embed` as an explicit
  opt-in local diagnostic command.
- The current local environment lacks the diagnostic opt-in and approved
  runtime/model env values, so no real helper launch, artifact access, load,
  or embed occurred during local verification.
- No helper `embed` product path, Memory routing, vector persistence,
  provider/default opt-in/UI change, download, persistent cache write, raw
  diagnostic exposure, private path exposure, or Windows/PowerShell behavior
  change was added.

### Current Gate

- Core Host helper embed diagnostic runner normal, approval-missing,
  opt-in-missing, env-missing, artifact-failure, embed-failure,
  unsafe-side-effect, cleanup, and sanitized-output tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `node tests/local-embedding-helper-embed-diagnostic.mjs`: PASS as sanitized
  degraded report with `diagnostic_opt_in_missing`; no helper launch, artifact
  access, load, or embed occurred.
- `npm.cmd run diagnostic:local-embedding:helper-embed`: PASS as sanitized
  degraded report with `diagnostic_opt_in_missing`; no helper launch, artifact
  access, load, or embed occurred.
- `npm.cmd run verify`: PASS, 105 test files and 521 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Product inference helper `embed` path: BLOCKED.
- Real local embedding vectors in product flow: BLOCKED.
- Memory vector routing and schema/index migration: BLOCKED.

### Next Hard Pause

- Do not wire helper `embed` into the provider execution path, return real
  embedding vectors to product flows, route vectors to Memory, persist vectors,
  run a Memory schema/index migration, change provider registration behavior,
  change default opt-in behavior, change UI visibility, add downloads, write
  persistent model caches, or create installer/update behavior without
  separate product and security approval for that exact implementation wave.

## Phase 7.41: Provider Execution Wiring Preflight

- Status: complete as a Core Host review-only provider execution wiring
  preflight.
- Added a fail-closed guard for future runtime-backed local embedding provider
  execution wiring.
- The preflight reserves
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION` as the future
  execution-specific opt-in, separate from provider composition opt-in and the
  Phase 7.40 diagnostic opt-in.
- The guard reviews Phase 7.38, 7.39, and 7.40 readiness, diagnostic/product
  path separation, exact Core Host diff, session factory embed wiring, digest
  verification before embed, helper load before embed, resource lease
  lifecycle, request/result schema boundaries, vector finite-value validation,
  vector redaction, timeout/cancellation/release behavior, sanitized errors,
  operation supervisor boundary, fixture fallback, and startup/restart/rollback
  smoke planning.
- Accepted preflight status is only
  `ready_for_provider_execution_approval`.
- No provider execution, session factory embed, helper `embed` product call,
  product vector return, Memory routing, vector persistence/logging, Memory
  migration, provider registration/default opt-in/UI change, download,
  persistent cache write, model artifact access, raw diagnostic exposure,
  private path exposure, or Windows/PowerShell behavior change was added.

### Current Gate

- Core Host provider execution wiring preflight normal, degraded, blocked,
  approval, provider execution, helper embed, vector, Memory, visibility,
  cache, artifact, diagnostic opt-in, shell, and sanitized-output tests: PASS,
  4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 106 test files and 525 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Provider execution helper `embed` path: BLOCKED.
- Real local embedding vectors in product flow: BLOCKED.
- Memory vector routing and schema/index migration: BLOCKED.

### Next Hard Pause

- Do not wire helper `embed` into the provider execution path, enable
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`, return real embedding
  vectors to product flows, route vectors to Memory, persist vectors, run a
  Memory schema/index migration, change provider registration behavior, change
  default opt-in behavior, change UI visibility, add downloads, write
  persistent model caches, or create installer/update behavior without
  separate product and security approval for that exact implementation wave.

## Phase 7.42: Provider Execution Wiring

- Status: complete as explicit opt-in Core Host provider execution
  wiring.
- Added `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1` as a second
  explicit opt-in for runtime-backed local embedding provider execution.
- Provider composition without the execution opt-in still fails closed before
  helper `embed`.
- The session factory now calls helper `embed` only after artifact digest
  verification, helper `load`, resource lease acquisition, and the execution
  opt-in are present.
- Embedding requests and results are schema-validated, including model ID,
  vector count, requested dimensions, input IDs, vector shape, and finite
  values.
- Runtime/helper failures, protocol failures, timeout failures, artifact/load
  failures, and invalid vector shapes are mapped to sanitized errors.
- Resource leases and helper sessions are released on success and failure.
- The local embedding provider configuration report now exposes the execution
  opt-in as a separate environment requirement.
- Fixture fallback remains unchanged when
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1` is set.
- No Memory vector routing, vector persistence/logging, Memory schema/index
  migration, default opt-in change, UI visibility change, download, persistent
  cache write, credential/signed URL persistence, raw diagnostic exposure, or
  Windows/PowerShell behavior change was added.

### Current Gate

- Core Host local embedding composition, runtime session factory, and provider
  execution wiring preflight tests: PASS, 20 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 106 test files and 528 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Memory vector routing and schema/index migration: BLOCKED.
- UI/default opt-in/provider visibility changes: BLOCKED.

### Next Hard Pause

- Do not route real embedding vectors to Memory, persist vectors, run a Memory
  schema/index migration, expose local embedding controls in UI, change
  provider default opt-in behavior, add downloads, write persistent model
  caches, create installer/update/rollback behavior, or convert model output
  into Windows/PowerShell operations without separate product and security
  approval for that exact implementation wave.

## Phase 7.43: Provider Execution Acceptance Diagnostic

- Status: complete as an explicit opt-in acceptance diagnostic
  implementation; the approved temporary runtime-backed product-path
  acceptance rerun passed.
- Adds a one-shot Core Host acceptance diagnostic for Phase 7.42 provider
  execution wiring.
- The diagnostic requires product/security approval input plus
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`, approved
  `JARVIS_K_RUNTIME_PYTHON`, and approved
  `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`.
- It verifies the approved SHA-256 artifact pin set before starting Core Host
  with temporary memory/model lifecycle paths and sending
  `agent.generateEmbeddings` through the product command path.
- The report exposes only sanitized status, fixed reason codes, vector count,
  dimension count, operation phase, and cleanup status.
- Raw vectors, raw input text, artifact paths, private paths, signed URLs,
  credentials, raw helper diagnostics, and artifact digests remain excluded.
- No Memory vector routing, vector persistence/logging, Memory schema/index
  migration, provider default opt-in change, provider visibility change, UI
  visibility change, download, persistent model cache write,
  credential/signed URL persistence, raw diagnostic exposure, or
  Windows/PowerShell behavior change is added.

### Current Gate

- Core Host provider execution acceptance diagnostic tests: PASS, 4 tests.
- Core Host local embedding composition, runtime session factory, and provider
  execution acceptance diagnostic tests: PASS, 20 tests.
- `npm.cmd run diagnostic:local-embedding:provider-execution-acceptance`
  without local opt-ins: DEGRADED safely with `acceptance_opt_in_missing`; no
  Core Host product command was called and no artifact digest verification was
  run.
- Approved temporary Python Transformers environment and temporary artifact
  run: PASS. The run created only temporary directories, installed pinned
  runtime requirements there, downloaded the approved artifact set, verified
  SHA-256 pins, and removed the temporary root after completion.
- Temporary artifact verification: PASS, 10 artifacts and 1,207,470,234 bytes.
- Runtime-backed product-path acceptance through `agent.generateEmbeddings`:
  PASS with sanitized `vectorCount: 1`, `dimensionCount: 1024`,
  `operationPhase: completed`, and `cleanupStatus: passed`.
- `npm.cmd run verify`: PASS, 107 test files and 532 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Temp cleanup check after the approved runtime-backed acceptance run: PASS,
  0 leftover Phase 7.43 temporary directories.

### Next Hard Pause

- Do not route real embedding vectors to Memory, persist vectors, run a Memory
  schema/index migration, expose local embedding controls in UI, change
  provider default opt-in behavior, add downloads, write persistent model
  caches, create installer/update/rollback behavior, or convert model output
  into Windows/PowerShell operations without separate product and security
  approval for that exact implementation wave.

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

## Phase 8.3: Memory Vector Execution Preflight

- Status: complete as a provider-neutral schema proposal, port, rollback, and
  fixture-only safety preflight wave.
- Added a Memory vector schema and index proposal for a future
  `memory_embeddings` table without executing a SQLite migration or changing
  `packages/memory-sqlite`.
- Added a provider-neutral vector write/query port shape in `@jarvis-k/memory`
  and validation helpers for existing retrieval DTOs.
- Added a fail-closed preflight whose accepted status is only
  `ready_for_migration_approval`.
- Added fixture-only safety reporting for normal, blocked, degraded, and
  sanitized-output cases. The report exposes only bounded counts and fixed
  reason codes.
- Memory schema/index migration, real vector writes, Phase 7.43 vector
  persistence, Core default retrieval changes, UI behavior changes, raw vector
  exposure, private path exposure, raw diagnostics exposure, and shell
  execution from retrieval output remain disabled.

### Current Gate

- Memory vector execution preflight tests: PASS, 6 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS.

### Next Hard Pause

- Do not execute a SQLite schema/index migration, change
  `packages/memory-sqlite`, write real Memory vectors, persist Phase 7.43
  runtime vectors, route vectors into Core retrieval/product flows, change UI
  defaults, or convert retrieval output into Windows/PowerShell operations
  without separate product and security approval.

## Phase 8.4: Memory Vector Migration Preflight

- Status: complete as a provider-neutral, review-only migration
  implementation approval handoff.
- Added a future SQLite migration review plan for the proposed
  `memory_embeddings` table and indexes without implementing or executing a
  migration.
- Added a fail-closed preflight whose accepted status is only
  `ready_for_sqlite_migration_implementation_approval`.
- Added fixture-only safety reporting for normal, blocked, degraded, and
  sanitized-output cases. The report exposes only bounded counts and fixed
  reason codes.
- SQLite migration implementation, migration execution, index creation,
  `packages/memory-sqlite` changes, vector writes, real vector persistence,
  Phase 7.43 vector persistence, Core retrieval behavior changes, UI behavior
  changes, raw vector exposure, private path exposure, raw diagnostics
  exposure, and shell execution remain disabled.

### Current Gate

- Memory vector migration preflight tests: PASS, 6 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS.

### Next Hard Pause

- Do not create/modify SQLite migrations, change `packages/memory-sqlite`,
  execute schema/index migration, persist real vectors, persist Phase 7.43
  runtime vectors, connect vector writes or queries to Core retrieval/product
  flows, change UI defaults, or convert retrieval output into
  Windows/PowerShell operations without separate product and security
  approval.

## Phase 8.5: Memory SQLite Vector Migration

- Status: complete as a SQLite schema migration implementation wave.
- Upgraded `packages/memory-sqlite` to schema version 3.
- Added the `memory_embeddings` table with guarded source type, dimensions,
  non-empty payload, and source uniqueness constraints.
- Added the approved vector indexes:
  `idx_memory_embeddings_model_conversation` and
  `idx_memory_embeddings_source`.
- Preserved existing messages, conversations, summaries, and active
  conversation state during v1/v2 upgrades.
- Snapshot export remains provider-neutral and excludes vector rows. Snapshot
  restore clears `memory_embeddings` to avoid stale or orphaned vector rows.
- Vector write APIs, vector query/retrieval APIs, Phase 7.43 vector
  persistence, Core retrieval/product flow routing, UI behavior changes, raw
  vector exposure, private path exposure, raw diagnostics exposure, and shell
  execution remain disabled.

### Current Gate

- SQLite memory repository tests: PASS, 15 tests.
- `npm run build -w @jarvis-k/memory-sqlite`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS.

### Next Hard Pause

- Do not add vector write/query repository APIs, persist Phase 7.43 runtime
  vectors, connect vector writes or queries to Core retrieval/product flows,
  change UI defaults/provider visibility, expose raw vectors/private paths/raw
  diagnostics, or convert retrieval output into Windows/PowerShell operations
  without separate product and security approval.

## Phase 8.6: Memory Vector Write Preflight

- Status: complete as a provider-neutral vector write API implementation
  approval handoff.
- Added a future vector write implementation plan, validation rule plan,
  duplicate handling plan, sanitized failure-code plan, and fixture-only
  safety report to `@jarvis-k/memory`.
- Added a fail-closed preflight whose accepted status is only
  `ready_for_vector_write_implementation_approval`.
- Added fixture-only safety reporting for normal, blocked, degraded, and
  sanitized-output cases. The report exposes only bounded counts and fixed
  reason codes.
- Vector write API implementation, vector writes, `packages/memory-sqlite`
  changes, Phase 7.43 vector persistence, real runtime vector persistence,
  Core retrieval routing, provider execution routing, UI behavior changes, raw
  vector exposure, private path exposure, raw diagnostics exposure, and shell
  execution remain disabled.

### Current Gate

- Memory vector write preflight tests: PASS, 6 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS.

### Next Hard Pause

- Do not implement vector write methods in `packages/memory-sqlite`, enable
  vector writes, persist Phase 7.43 or real runtime vectors, connect vector
  writes to Core retrieval/product flows, change provider execution behavior
  or UI defaults, expose raw vectors/private paths/raw diagnostics, or convert
  vector write/retrieval output into Windows/PowerShell operations without
  separate product and security approval.

## Phase 8.7: Memory SQLite Fixture Vector Write

- Status: complete as a fixture-only SQLite vector write implementation.
- Added `writeEmbeddingRecord(record)` to `packages/memory-sqlite` using the
  provider-neutral embedding record validation from `@jarvis-k/memory`.
- The method accepts only `fixture/` model IDs, serializes finite vector values
  into the existing schema v3 `memory_embeddings` table, and returns sanitized
  accepted/degraded result codes.
- Duplicate `(model_id, source_type, source_id)` rows fail closed with
  `VECTOR_DUPLICATE_SOURCE`; non-fixture model IDs fail closed with
  `VECTOR_NON_FIXTURE_WRITE_BLOCKED`.
- Query/retrieval API implementation, Phase 7.43 vector persistence, real
  runtime vector persistence, Core retrieval routing, provider execution
  routing, Desktop IPC, UI behavior changes, raw vector exposure, private path
  exposure, raw diagnostics exposure, and shell execution remain blocked.

### Current Gate

- SQLite memory repository tests: PASS, 18 tests.
- `npm run build -w @jarvis-k/memory-sqlite`: PASS.
- Targeted SQLite repository Vitest: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 110 test files and 557 tests.

### Next Hard Pause

- Do not add SQLite vector query/retrieval APIs, persist Phase 7.43 or real
  runtime vectors, connect provider execution output to vector writes, route
  vector retrieval into Core product behavior, change Desktop/UI behavior, or
  expose raw vectors/private paths/raw diagnostics without separate product
  and security approval.

## Phase 8.8: Memory Vector Query Preflight

- Status: complete as a SQLite vector query API implementation approval
  handoff.
- Added a provider-neutral query implementation preflight in
  `@jarvis-k/memory` for a future `packages/memory-sqlite`
  `querySimilar(query)` method.
- The preflight reviews the Phase 8.5 schema prerequisite, Phase 8.7
  fixture-only write prerequisite, provider-neutral query port, SQLite
  implementation plan, vector deserialization plan, fixture-only cosine
  scoring, bounded result ordering, sanitized failure mapping, and
  fixture-only query safety tests.
- The accepted status is only
  `ready_for_sqlite_query_implementation_approval`.
- Query API implementation, vector query execution, `packages/memory-sqlite`
  changes, Phase 7.43 vector persistence, real runtime vector persistence,
  Core retrieval routing, provider execution routing, Desktop IPC, UI behavior
  changes, raw vector exposure, raw text exposure, private path exposure, raw
  diagnostics exposure, and shell execution remain blocked.

### Current Gate

- Memory vector query preflight tests: PASS, 6 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 111 test files and 563 tests.

### Next Hard Pause

- Do not implement `querySimilar(query)` in `packages/memory-sqlite`, enable
  vector query execution, persist Phase 7.43 or real runtime vectors, connect
  provider execution output to Memory writes, route retrieval into Core
  product behavior, change Desktop/UI behavior, or expose raw vectors/raw
  text/private paths/raw diagnostics without separate product and security
  approval.

## Phase 8.9: Memory SQLite Fixture Vector Query

- Status: complete as a fixture-only SQLite vector query implementation.
- Added `querySimilar(query)` to `packages/memory-sqlite` using the
  provider-neutral query validation and retrieval result schema from
  `@jarvis-k/memory`.
- The method accepts only `fixture/` model IDs, reads bounded candidates from
  the existing schema v3 `memory_embeddings` table, deserializes vectors in
  memory, computes deterministic cosine similarity, applies optional
  conversation and `minScore` filters, and returns bounded match metadata.
- Non-fixture model IDs fail closed with
  `VECTOR_NON_FIXTURE_QUERY_BLOCKED` and a sanitized `blocked` model ID.
  Invalid queries fail closed with `VECTOR_QUERY_INVALID`.
- Core retrieval routing, provider execution routing, Phase 7.43 vector
  persistence, real runtime vector persistence, Desktop IPC, UI behavior
  changes, raw vector exposure, raw text exposure, private path exposure, raw
  diagnostics exposure, and shell execution remain blocked.

### Current Gate

- SQLite memory repository tests: PASS, 22 tests.
- `npm run build -w @jarvis-k/memory-sqlite`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 111 test files and 567 tests.

### Next Hard Pause

- Do not connect provider execution output to Memory writes, persist Phase
  7.43 or real runtime vectors, route Memory retrieval into Core product
  behavior, change Desktop/UI behavior, expose raw vectors/raw text/private
  paths/raw diagnostics, or convert retrieval output into Windows/PowerShell
  operations without separate product and security approval.

## Phase 8.10: Memory Retrieval Routing Preflight

- Status: complete as a provider-neutral Core routing implementation approval
  handoff.
- Added a provider-neutral retrieval routing preflight in `@jarvis-k/memory`
  for the future Core recall injection path.
- The preflight reviews the fixture write API, fixture query API, provider-
  neutral routing plan, bounded routing guards, fallback plan, sanitized recall
  observation shape, and fixture-only routing tests.
- The accepted status is only `ready_for_core_routing_approval`.
- Core routing implementation, provider execution routing, UI/default opt-in
  changes, provider visibility changes, Phase 7.43 vector persistence, real
  runtime vector persistence, raw vector exposure, raw text exposure, private
  path exposure, raw diagnostics exposure, and shell execution remain blocked.

### Current Gate

- Memory retrieval routing preflight tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/memory`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 112 test files and 572 tests.

### Next Hard Pause

- Do not connect Memory retrieval to Core product behavior, change Core
  runtime behavior, provider visibility, or UI defaults, connect provider
  execution output to Memory writes, persist Phase 7.43 or real runtime
  vectors, or expose raw vectors/raw text/private paths/raw diagnostics
  without separate product and security approval.

## Phase 8.11: Core Memory Retrieval Routing Approval Gate

- Status: complete as an approval-only Core read-routing implementation
  handoff.
- Added a Core-owned approval gate in `@jarvis-k/core` for the future Memory
  retrieval read-routing implementation.
- The gate reviews the Phase 8.10 prerequisite, provider-neutral retrieval
  port, Core turn assembly surface, explicit
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` opt-in, sanitized recall payload,
  bounded result behavior, fixture-only test plan, degraded fail-closed
  behavior, fixture fallback, and rollback plan.
- The accepted status is only
  `ready_for_core_retrieval_routing_implementation_approval`.
- Core runtime behavior changes, retrieval routing implementation, provider
  execution routing, Memory repository contract changes, Desktop IPC changes,
  UI/default opt-in changes, provider visibility changes, Phase 7.43 vector
  persistence, real runtime vector persistence, raw vector exposure, raw text
  exposure, private path exposure, raw diagnostics exposure, and shell
  execution remain blocked.

### Current Gate

- Core memory retrieval routing approval gate tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 113 test files and 577 tests.

### Next Hard Pause

- Do not implement Core retrieval read routing in `CoreRuntime`, inject
  Memory recall into product turn assembly, connect provider execution output
  to Memory writes, persist Phase 7.43 or real runtime vectors, change
  Desktop IPC/UI/provider visibility/default opt-in behavior, change the
  Memory repository contract, or expose raw vectors/raw text/private
  paths/raw diagnostics without separate product and security approval.

## Phase 8.12: Core Memory Retrieval Read Routing

- Status: complete as an opt-in fixture-only Core read-routing
  implementation.
- Added a disabled-by-default Memory retrieval read route to `CoreRuntime`
  after `agent.sendMessage` accepts a user message.
- The route requires an injected Core option equivalent to
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`, an injected
  `EmbeddingMemoryRetrievalPort`, and an injected fixture query vector
  resolver.
- The resolver receives only message metadata (`messageId`, `conversationId`,
  `createdAt`) and does not receive raw message text.
- The route accepts only `fixture/` model IDs, validates finite bounded query
  vectors, clamps recall to at most five matches, and returns sanitized recall
  metadata only in the command result.
- Disabled routing preserves the previous `agent.sendMessage` response shape.
- Retrieval failures, invalid vectors, non-fixture model IDs, unavailable
  ports, degraded provider-neutral results, and unexpected errors degrade to
  sanitized no-recall observations without blocking message acceptance.
- Provider execution routing, vector writes, Phase 7.43 vector persistence,
  real runtime vector persistence, SQLite schema/index changes, Memory
  repository contract changes, Core Host env wiring, Desktop IPC changes,
  UI/default opt-in changes, provider visibility changes, raw vector exposure,
  raw text exposure, private path exposure, raw diagnostics exposure, and
  shell execution remain blocked.

### Current Gate

- Core runtime Memory retrieval routing tests: PASS, 6 tests.
- Core memory retrieval approval gate regression tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 113 test files and 583 tests.

### Next Hard Pause

- Do not wire `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` from
  `apps/core-host`, add Desktop IPC or UI controls, route provider execution
  output into Memory, persist Phase 7.43 or real runtime vectors, write real
  Memory vector data, change SQLite schema/indexes, expose raw vectors/raw
  text/private paths/raw diagnostics, or convert retrieval/model output into
  Windows/PowerShell operations without separate product and security
  approval.

## Phase 8.13: Core Host Memory Retrieval Env Wiring Approval Gate

- Status: complete as an approval-only Core Host env wiring handoff.
- Added a Core Host approval gate for future
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` env wiring after the Phase 8.12
  Core read route.
- The gate reviews the env key, exact Core Host diff, CoreRuntime constructor
  wiring plan, fixture-only retrieval port plan, fixture query vector resolver
  plan, default-disabled behavior, Desktop smoke plan, rollback plan, and
  sanitized recall observation plan.
- The accepted status is only
  `ready_for_env_wiring_implementation_approval`.
- Env value reads, Core Host env wiring implementation, Core Host default
  behavior changes, CoreRuntime constructor changes, retrieval port injection,
  fixture query vector resolver injection, provider execution routing, Phase
  7.43 vector persistence, real runtime vector persistence, Memory vector
  data writes, SQLite schema/index migration, Desktop IPC changes,
  UI/default opt-in changes, provider visibility changes, raw vector exposure,
  raw text exposure, private path exposure, raw diagnostics exposure, and
  shell execution remain blocked.

### Current Gate

- Core Host Memory retrieval env wiring approval gate tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 114 test files and 588 tests.
- `npm.cmd run smoke:desktop`: PASS.

### Next Hard Pause

- Do not read `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING`, pass Memory
  retrieval options into `CoreRuntime`, inject a fixture-only
  `EmbeddingMemoryRetrievalPort`, inject a fixture query vector resolver, add
  Desktop IPC/UI controls, route provider execution output into Memory,
  persist Phase 7.43 or real runtime vectors, write Memory vector data, change
  SQLite schema/indexes, expose raw vectors/raw text/private paths/raw
  diagnostics, or convert retrieval/model output into Windows/PowerShell
  operations without separate product and security approval.

## Phase 8.14: Core Host Fixture Memory Retrieval Env Wiring

- Status: complete as an explicit opt-in fixture-only Core Host env wiring
  implementation.
- Wired `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1` in `apps/core-host` to
  the Phase 8.12 `CoreRuntime` Memory retrieval read route.
- Default behavior remains disabled when the env value is absent or not
  exactly `1`.
- Added a Core Host fixture retrieval port backed by the existing
  `SqliteMemoryRepository.querySimilar(query)` read API.
- Added a fixed fixture query vector resolver that receives no raw message
  text and does not call any embedding provider.
- The Core Host opt-in route uses only
  `fixture/core-host-memory-retrieval`, bounded recall, and sanitized
  degraded/no-recall handling.
- Provider execution routing, real embedding provider output as query vectors,
  Memory vector writes, Phase 7.43 vector persistence, real runtime vector
  persistence, SQLite schema/index changes, Desktop IPC changes, UI/default
  opt-in changes, provider visibility changes, raw vector exposure, raw text
  exposure, private path exposure, raw diagnostics exposure, and shell
  execution remain blocked.

### Current Gate

- Core Host Memory retrieval env wiring tests: PASS, 3 tests.
- Core Host Memory retrieval env wiring approval gate regression tests: PASS,
  5 tests.
- Core runtime Memory retrieval routing regression tests: PASS, 33 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 115 test files and 591 tests.
- `npm.cmd run smoke:desktop`: PASS.

### Next Hard Pause

- Do not use real embedding provider output as a query vector, write Memory
  vector data from provider execution output, persist Phase 7.43 or real
  runtime vectors, add Desktop IPC/UI controls for Memory retrieval, change
  provider visibility/default opt-in behavior, change SQLite schema/indexes,
  expose raw vectors/raw text/private paths/raw diagnostics, or convert
  retrieval/model output into Windows/PowerShell operations without separate
  product and security approval.

## Phase 8.15: Provider Query Vector Approval Gate

- Status: complete as a Core Host approval-only gate for a future
  provider-backed Memory retrieval query-vector resolver.
- Added `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR` as the
  planned future explicit opt-in key, but this gate does not read the env
  value or change Core Host startup behavior.
- The gate reviews Phase 7.42 provider execution wiring, Phase 7.43 provider
  execution acceptance, Phase 8.12 Core read routing, Phase 8.14 Core Host
  fixture env wiring, query input sanitization, provider execution preflight,
  bounded timeout/cancellation, vector shape validation, fail-closed
  no-recall behavior, no-vector-persistence behavior, UI/default behavior
  preservation, and rollback smoke planning.
- Provider query-vector implementation, provider execution routing for
  retrieval, helper `embed` calls, raw vector return/log/exposure, raw text
  exposure, private path exposure, raw diagnostics exposure, Phase 7.43 or
  real runtime vector persistence, Memory vector writes, SQLite schema/index
  migration, Desktop IPC changes, UI behavior changes, provider visibility
  changes, default opt-in changes, fixture fallback changes, and shell
  execution remain blocked.

### Current Gate

- Memory retrieval provider query-vector approval gate tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 116 test files and 596 tests.

### Next Hard Pause

- Do not read `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR`, use
  provider execution output as a Memory retrieval query vector, call helper
  `embed` for retrieval routing, return/log/expose/persist raw vectors, write
  Memory vector records from real provider output, persist Phase 7.43 or real
  runtime vectors, add Desktop IPC/UI controls for Memory retrieval, change
  provider visibility/default opt-in behavior, change SQLite schema/indexes,
  expose raw text/private paths/raw diagnostics, or convert retrieval/model
  output into Windows/PowerShell operations without separate product and
  security approval.

## Phase 8.16: Provider-Backed Query Vector

- Status: complete as an explicit opt-in Core Host implementation.
- Added `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1` as a
  separate provider-backed query-vector opt-in for Memory retrieval.
- The provider-backed resolver is available only when
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`, and
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1` are also set.
- Extended the Core retrieval resolver context with bounded sanitized
  `queryText`; raw message text still does not enter command results, events,
  snapshots, smoke reports, or docs.
- Core Host validates provider query text, uses the existing local embedding
  provider execution path, bounds provider query-vector generation with a
  timeout guard, validates a single finite vector shape, and returns only a
  copied vector to `SqliteMemoryRepository.querySimilar(query)`.
- The Memory query remains fixture-indexed under
  `fixture/core-host-memory-retrieval`; this phase does not store real
  provider vectors in Memory.
- If any opt-in, provider execution, timeout, text, vector, or retrieval
  validation fails, the route degrades to sanitized no-recall and normal
  message acceptance continues.
- Memory vector writes, Phase 7.43 vector persistence, real runtime vector
  persistence, SQLite schema/index changes, Desktop IPC changes, UI/default
  opt-in changes, provider visibility changes, fixture fallback changes, raw
  vector exposure, raw text exposure, private path exposure, raw diagnostics
  exposure, and shell execution remain blocked.

### Current Gate

- Core Host Memory retrieval env wiring and provider query-vector tests:
  PASS, 6 tests.
- Core runtime Memory retrieval routing regression tests: PASS, 33 tests.
- Memory retrieval provider query-vector approval gate regression tests:
  PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 116 test files and 599 tests.
- `npm.cmd run smoke:desktop`: PASS.

### Next Hard Pause

- Do not write Memory vector records from real provider output, persist Phase
  7.43 or real runtime vectors, use real provider vectors as stored Memory
  index data, add Desktop IPC/UI controls for Memory retrieval, change
  provider visibility/default opt-in behavior, change SQLite schema/indexes,
  expose raw vectors/raw text/private paths/raw diagnostics, or convert
  retrieval/model output into Windows/PowerShell operations without separate
  product and security approval.

## Phase 8.17: Provider Query Vector Acceptance Preflight

- Status: complete as a Core Host preflight-only diagnostic approval handoff.
- Added the planned future acceptance env key
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE`.
- The preflight reviews the future Phase 8.16 product-path diagnostic plan,
  explicit acceptance env review, approved local runtime environment plan,
  artifact digest verification plan, sanitized report shape,
  no-vector-persistence rule, no-Memory-write rule, cleanup plan, rollback
  plan, and clean verification evidence.
- The preflight does not read the acceptance env, read `JARVIS_K_RUNTIME_PYTHON`,
  read the local model artifact directory, verify artifacts, start the helper,
  call provider execution, call helper `embed`, return/log/expose raw vectors,
  expose raw text, expose private paths, expose raw diagnostics, persist signed
  URLs or credentials, persist Phase 7.43 or real runtime vectors, write Memory
  vector data, run SQLite schema/index migrations, change Desktop IPC, change
  UI behavior, change provider visibility, change default opt-in behavior, or
  enable shell execution.

### Current Gate

- Memory retrieval provider query-vector acceptance preflight tests: PASS, 5
  tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS, 117 test files and 604 tests.

### Next Hard Pause

- Do not read
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE`, read
  the local Python runtime path or model artifact directory, run SHA-256
  artifact verification for this diagnostic, start the helper, call provider
  execution or helper `embed` through the retrieval product path, return/log/
  expose/persist raw vectors, write Memory vector records from real provider
  output, change Desktop IPC/UI behavior/provider visibility/default opt-in,
  change SQLite schema/indexes, expose raw text/private paths/raw diagnostics,
  or convert retrieval/model output into Windows/PowerShell operations without
  separate product and security approval.

## Phase 8.18: Provider Query Vector Acceptance Diagnostic

- Status: complete as an explicit opt-in Core Host one-shot diagnostic runner.
- Added
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE=1` as the
  separate acceptance diagnostic opt-in after Phase 8.17 approval.
- The diagnostic also requires
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`,
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`, an approved
  `JARVIS_K_RUNTIME_PYTHON`, and an approved
  `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`.
- The runner verifies the pinned local artifact SHA-256 set before product-path
  execution, starts Core Host with temporary memory/model lifecycle paths,
  sends one fixed `agent.sendMessage`, and reads only sanitized `memoryRecall`
  metadata from the command result.
- The report exposes only status, fixed reason codes, recall status, recall
  mode, recall match count, query dimension count, cleanup status, and unsafe
  side-effect flags.
- When approval, opt-in, runtime, model, artifact, or product-path gates are
  missing, the diagnostic fails closed as `degraded` or `blocked` without raw
  diagnostics, private paths, raw text, raw vectors, or artifact digests.
- Added `npm.cmd run
  diagnostic:memory-retrieval:provider-query-vector-acceptance` as the
  sanitized local runner.
- Memory vector writes, Phase 7.43 vector persistence, real runtime vector
  persistence, SQLite schema/index changes, Desktop IPC changes, UI/default
  opt-in changes, provider visibility changes, fixture fallback changes, raw
  vector exposure, raw text exposure, private path exposure, raw diagnostics
  exposure, downloads, persistent cache writes, and shell execution remain
  blocked.

### Current Gate

- Memory retrieval provider query-vector acceptance diagnostic tests: PASS, 5
  tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run diagnostic:memory-retrieval:provider-query-vector-acceptance`
  without local opt-ins: DEGRADED safely with
  `acceptance_opt_in_missing`; no Core Host product command was called and no
  artifact digest verification was run.
- `npm.cmd run verify`: PASS, 118 test files and 609 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.

### Next Hard Pause

- Do not write Memory vector records from real provider output, persist Phase
  7.43 or real runtime vectors, run additional real-provider acceptance beyond
  this diagnostic, use real provider vectors as stored Memory index data, add
  Desktop IPC/UI controls for Memory retrieval, change provider visibility or
  default opt-in behavior, change SQLite schema/indexes, expose raw
  vectors/raw text/private paths/raw diagnostics, or convert retrieval/model
  output into Windows/PowerShell operations without separate product and
  security approval.

## Phase 8.19: Provider Vector Write Approval Gate

- Status: complete as a Core Host approval-gate-only handoff.
- Added the planned future provider-backed Memory vector write env key
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES`.
- The gate reviews Phase 7.42 provider execution wiring, Phase 7.43 provider
  execution acceptance, Phase 8.5 SQLite vector schema, Phase 8.7 fixture
  vector write, Phase 8.9 fixture vector query, Phase 8.12 Core read route,
  Phase 8.16 provider query-vector route, and Phase 8.18 provider
  query-vector acceptance prerequisites.
- The gate records review evidence for explicit opt-in behavior, source record
  selection, source text minimization, vector shape validation, model/provider
  allowlisting, duplicate and update policy, rollback deletion, sanitized
  failure mapping, UI/default behavior unchanged, and future implementation
  approval.
- The gate does not read env values, implement provider vector writes, route
  provider execution for writes, call helper `embed` for writes, return/log/
  expose raw vectors, expose raw text, expose private paths, expose raw
  diagnostics, persist signed URLs or credentials, persist Phase 7.43 or real
  runtime vectors, write Memory vector data, run SQLite schema/index
  migrations, change Desktop IPC, change UI behavior, change provider
  visibility, change default opt-in behavior, change fixture fallback, or
  enable shell execution.

### Current Gate

- Memory provider vector write approval gate tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 119 test files and 614 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.

### Next Hard Pause

- Do not read
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES`, implement
  provider-backed Memory vector writes, route provider execution for stored
  Memory vectors, call helper `embed` for stored vectors, write Memory vector
  records from real provider output, persist Phase 7.43 or real runtime
  vectors, add Desktop IPC/UI controls for Memory indexing/retrieval, change
  provider visibility/default opt-in behavior, change SQLite schema/indexes,
  expose raw vectors/raw text/private paths/raw diagnostics, or convert
  retrieval/model output into Windows/PowerShell operations without separate
  product and security approval.

## Phase 8.20: Provider Vector Write Implementation

- Status: complete as an explicit opt-in Core Host implementation.
- Added Core Host provider-backed Memory vector write wiring behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`.
- Writes require
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`,
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`,
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`, and
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.
- `CoreRuntime` remains unchanged and still depends only on the injected
  provider-neutral `MemoryRepository`; Core Host wraps SQLite at composition
  time and attempts vector writes only after `appendMessage` succeeds.
- The wrapper selects only newly accepted user messages, minimizes source text
  before embedding, bounds provider execution with a timeout, validates model
  ID, vector count, dimensions, and finite values, and writes through the
  existing SQLite vector record API.
- SQLite still blocks non-fixture model IDs by default. Core Host supplies the
  approved local embedding model allowlist only when every provider vector
  write gate is enabled.
- Provider embedding failures, invalid vectors, duplicate source rows, and
  SQLite vector write degradation do not block normal message acceptance.
- Snapshot restore/import rollback clears approved provider vector rows.
- This phase does not batch-index historical records, change default retrieval
  behavior, add Desktop IPC/UI controls, change provider visibility/default
  opt-in behavior, change fixture fallback, run SQLite schema/index
  migrations, expose raw vectors/raw text/private paths/raw diagnostics,
  download artifacts, write persistent model caches, persist signed URLs or
  credentials, or enable shell execution.

### Current Gate

- Provider vector write wiring and SQLite allowlist/rollback tests: PASS, 29
  tests.
- Provider vector write wiring, SQLite allowlist/rollback, and Phase 8.19
  approval gate regression tests: PASS, 34 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run build -w @jarvis-k/memory-sqlite`: PASS.
- `npm.cmd run verify`: PASS, 120 test files and 621 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.

### Next Hard Pause

- Do not enable provider-backed vector writes by default, batch-index
  historical Memory records, expose Desktop IPC/UI controls for indexing, route
  provider-written vectors into default recall behavior, add a real-provider
  write acceptance diagnostic, expose raw vectors/raw text/private paths/raw
  diagnostics, change SQLite schema/indexes, persist credentials or signed
  URLs, download artifacts, write persistent model caches, or convert
  retrieval/model output into Windows/PowerShell operations without separate
  product and security approval.

## Phase 8.21: Provider Vector Write Acceptance Diagnostic

- Status: complete as an explicit opt-in local acceptance diagnostic.
- Added a Core Host one-shot diagnostic runner behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE=1`.
- The diagnostic also requires the existing Memory retrieval routing,
  provider vector-write, local embedding provider, and local embedding provider
  execution opt-ins before artifact verification or Core Host startup.
- The runner verifies the pinned local artifact digest set, starts Core Host
  with a temporary Memory database, sends one fixed `agent.sendMessage`, and
  inspects only vector metadata for the newly accepted message source.
- Added SQLite metadata inspection that reads only row count and dimensions;
  it does not read vector payloads or source text.
- Reports expose only sanitized status, fixed reason codes, write status,
  record count, dimension count, cleanup status, and unsafe flags.
- No default behavior, Desktop IPC, UI behavior, provider visibility, fixture
  fallback, persistent model cache, historical batch indexing, SQLite
  schema/index migration, raw vector/text/diagnostic exposure, private path
  exposure, signed URL/credential persistence, or shell execution behavior was
  added.

### Current Gate

- Memory provider vector-write acceptance and SQLite metadata regression tests:
  PASS, 30 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run build -w @jarvis-k/memory-sqlite`: PASS.
- `npm.cmd run diagnostic:memory-retrieval:provider-vector-write-acceptance`:
  PASS with sanitized `acceptance_opt_in_missing` degradation and no
  product-path command call.
- Approved real local acceptance diagnostic: PASS with temporary Python
  runtime setup, temporary artifact fetch and SHA-256 verification,
  `writeStatus: accepted`, `recordCount: 1`, `dimensionCount: 1024`, all
  unsafe exposure flags false, and cleanup passed.
- `npm.cmd run verify`: PASS, 121 test files and 627 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

### Next Hard Pause

- Do not run the real provider vector-write acceptance diagnostic with local
  artifacts, enable provider-backed vector writes by default, route
  provider-written vectors into default recall behavior, expose Desktop/UI
  indexing controls, batch-index historical Memory records, expose raw
  vectors/raw text/private paths/raw diagnostics, change SQLite schema/indexes,
  download artifacts, write persistent model caches, or convert
  retrieval/model output into Windows/PowerShell operations without a separate
  product and security approval.

## Phase 8.22: Provider Vector Retrieval Preflight

- Status: complete as a review-only preflight preparation wave.
- Added an approval/preflight gate for future provider-written Memory vector
  retrieval behind the planned explicit opt-in
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1`.
- The preflight requires evidence from Phase 7.43, Phase 8.16, Phase 8.18,
  Phase 8.20, and the approved real Phase 8.21 diagnostic before it can become
  ready for separate implementation approval.
- The reviewed future plan requires same-model ID alignment between
  provider-backed query vectors and stored provider vectors, bounded recall
  limits, sanitized recall payloads, fail-closed fallback, no default behavior
  change, no historical batch indexing, and rollback smoke coverage.
- This phase does not read env values, change Core Host routing, change
  `CoreRuntime`, query provider-written vectors, call provider execution for
  reads, call helper `embed`, alter Memory vector writes, run SQLite
  schema/index migrations, change Desktop IPC/UI behavior, change provider
  visibility/default opt-in, expose raw vectors/raw text/private paths/raw
  diagnostics, persist signed URLs or credentials, or enable shell execution.

### Current Gate

- Memory provider vector retrieval preflight tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 122 test files and 632 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Phase 8.21 real diagnostic cleanup check: PASS, 0 leftover
  `jarvis-k-phase-8-21-real-*` temporary directories.

### Next Hard Pause

- Do not implement provider-written vector retrieval, read the new opt-in env,
  change Core Host retrieval routing, change CoreRuntime behavior, query
  provider-written vectors in product flow, call provider execution for reads,
  persist additional vectors, add Desktop/UI controls, change provider
  visibility/default opt-in, run SQLite schema/index migrations, expose raw
  vectors/raw text/private paths/raw diagnostics, download artifacts, write
  persistent model caches, or convert retrieval/model output into
  Windows/PowerShell operations without separate product and security approval.

## Phase 8.23: Provider Vector Retrieval Routing

- Status: complete as an explicit opt-in provider-vector retrieval routing
  implementation.
- Implemented
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1` in
  `apps/core-host` as a separate gate for querying provider-written Memory
  vectors.
- The provider-vector read path requires Memory retrieval routing,
  provider-backed query vectors, provider-backed vector writes, local embedding
  provider composition, local embedding provider execution, and an injected
  embedding provider to all be present. Incomplete gates fall back to the
  existing fixture-only retrieval route.
- Extended `CoreRuntime` with provider-neutral `provider_vector` recall mode
  and an exact injected `allowedModelId`. Core still imports no concrete
  provider packages and rejects non-fixture model IDs unless the injected
  provider-vector route exactly allows that model ID.
- The route uses the same approved local embedding model ID for the provider
  query vector and stored provider vector records, bounds recall matches, and
  keeps recall payloads sanitized to metadata only.
- This phase does not run a real local diagnostic, access or download
  artifacts, write persistent model caches, persist additional vectors,
  batch-index historical records, run SQLite schema/index migrations, change
  Desktop IPC/UI behavior, change provider visibility/default opt-in, expose
  raw vectors/raw text/private paths/raw diagnostics, persist signed URLs or
  credentials, or enable shell execution.

### Current Gate

- Core Host retrieval env wiring and provider-vector read tests: PASS, 8
  tests.
- Core runtime Memory retrieval routing regression tests: PASS, 35 tests.
- Targeted combined command: PASS, 2 test files and 43 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 122 test files and 636 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

### Next Hard Pause

- Do not run a real provider-vector retrieval acceptance diagnostic, access
  model artifacts, download artifacts, write persistent model caches, expose
  raw vectors/raw text/private paths/raw diagnostics, add Desktop/UI controls,
  batch-index history, change provider visibility/default opt-in, or move
  provider-written retrieval into a default product path without separate
  product and security approval.

## Phase 8.24: Provider Vector Retrieval Acceptance Preflight

- Status: complete as a preflight-only acceptance diagnostic approval
  handoff.
- Added a Core Host preflight for a future real local diagnostic behind the
  planned explicit opt-in
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1`.
- The reviewed future diagnostic plan may, only after separate approval, use a
  temporary Memory database, verify approved local artifacts, write one
  provider vector through the existing product path, send a second fixed
  diagnostic message through the Phase 8.23 provider-vector retrieval route,
  and inspect only sanitized recall metadata.
- The preflight requires Phase 7.43, Phase 8.18, Phase 8.21, and Phase 8.23
  evidence, explicit acceptance env review, temporary database scope,
  provider vector write-then-read plan, same-model read/write alignment,
  artifact digest verification plan, sanitized recall report shape, cleanup,
  rollback, and clean verification evidence.
- This phase does not read env values, read Python paths, read model artifact
  paths, verify artifacts, call provider execution, call helper `embed`, write
  temporary or persistent Memory vectors, query provider-written vectors, run
  SQLite schema/index migrations, change Desktop IPC/UI behavior, change
  provider visibility/default opt-in, expose raw vectors/raw text/private paths
  or raw diagnostics, download artifacts, write persistent model caches,
  persist signed URLs or credentials, or enable shell execution.

### Current Gate

- Memory provider vector retrieval acceptance preflight tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 123 test files and 641 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

### Next Hard Pause

- Separate product and security approval has now been granted for Phase 8.25.
- Do not enable provider-vector retrieval by default, batch-index historical
  records, expose Desktop/UI controls, change provider visibility/default
  opt-in, write persistent model caches, download artifacts, persist or expose
  raw vectors/raw text/private paths/raw diagnostics, run SQLite schema/index
  migrations, or convert retrieval/model output into Windows/PowerShell
  operations without a separate approval.

## Phase 8.25: Provider Vector Retrieval Acceptance Diagnostic

- Status: implementation complete with a safety-degraded local run; true
  artifact-backed acceptance pass remains pending because the current Codex
  process did not have the required opt-in/runtime/model environment variables
  configured.
- Added a one-shot Core Host diagnostic runner behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1`.
- The runner requires the existing Memory retrieval routing, provider
  query-vector, provider vector-write, provider vector-read, local embedding
  provider, and provider execution opt-ins before reading runtime/model env
  values.
- When all gates are configured, the diagnostic verifies the approved artifact
  SHA-256 pin set, starts Core Host with a temporary Memory database, writes
  one fixed diagnostic message through the existing provider vector-write
  product path, sends one fixed diagnostic query through the provider-vector
  retrieval route, and inspects only sanitized `memoryRecall` metadata.
- Added a sanitized report shape for write/read command status, recall
  status/mode, bounded match count, bounded query dimension count, cleanup
  status, and unsafe-exposure flags.
- The local diagnostic run in the current Codex process returned sanitized
  `degraded` with reason code `acceptance_opt_in_missing`, and did not read
  Python/model paths, verify artifacts, launch the helper, write temporary
  vectors, query provider-written vectors, or expose raw values.
- Default behavior, Desktop/UI behavior, provider visibility, default opt-in,
  historical batch indexing, downloads, persistent caches, SQLite schema/index
  migrations, raw vector/text/path/diagnostic exposure, and shell execution
  remain unchanged or blocked.

### Current Gate

- Memory provider vector retrieval acceptance diagnostic tests: PASS, 5 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run diagnostic:memory-retrieval:provider-vector-read-acceptance`:
  PASS as sanitized degraded, `acceptance_opt_in_missing`.
- `npm.cmd run verify`: PASS, 124 test files and 646 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

### Next Hard Pause

- Do not claim provider-vector retrieval acceptance is artifact-backed passed
  until the diagnostic is rerun with the approved local Python runtime,
  approved local model artifact directory, SHA-256 verification, temporary
  Memory database, provider vector write, provider-vector retrieval read,
  sanitized recall report, and cleanup all passing.
- Do not enable provider-vector retrieval by default, batch-index historical
  records, expose Desktop/UI controls, change provider visibility/default
  opt-in, write persistent model caches, download artifacts, persist or expose
  raw vectors/raw text/private paths/raw diagnostics, run SQLite schema/index
  migrations, or convert retrieval/model output into Windows/PowerShell
  operations without a separate approval.

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

## Phase 11.4: Visual Runtime Acceptance Preflight

- Status: complete as a provider-neutral aggregate preflight preparation wave.
- Added an aggregate guard for the visual fixture benchmark boundary, runtime
  isolation boundary, and deferred license, Windows packaging, native
  dependency, and screen-capture privacy/permission reviews.
- An accepted result means only
  `ready_for_runtime_backed_capture`.
- Real visual benchmark values remain pending and unexposed; network access,
  credentials, runtime dependencies, model downloads, model loading, screen
  capture, OCR execution, vision execution, provider registration, default
  opt-in, raw pixel persistence or exposure, and model-output command
  conversion remain disabled.
- Missing review evidence, captured metrics, privacy regressions, dependency
  changes, provider registration, execution enablement, or dirty verification
  fail closed.
- No runtime package, artifact, cache, screen permission, Core Host, Desktop,
  IPC, UI, or provider composition change was added.

### Current Gate

- Local visual runtime acceptance preflight tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not add real visual runtime dependencies, model artifacts, network
  downloads, screen-capture APIs or permissions, model loading, OCR/vision
  execution, provider registration, default opt-in, Core Host routing,
  Desktop IPC, or user-facing controls without separate product, privacy,
  and security approval.

## Phase 12.1: Model Lifecycle and Windows Packaging Preflight

- Status: complete as a provider-neutral, dry-run guard preparation wave.
- Added a fail-closed preflight for model manifest pinning, artifact digest
  verification, license review, sanitized operation state, and a deterministic
  fixture executor.
- Windows packaging policy, automatic update policy, and upgrade/rollback
  policy remain explicitly deferred.
- The guard keeps committed model artifacts, signed URL persistence, installer
  bundling, automatic updates, rollback execution, filesystem writes, network
  access, credentials, model loading, provider registration, default opt-in,
  and private path exposure disabled.
- No installer, runtime/model bundle, cache write, artifact download,
  filesystem lifecycle code, update/rollback execution, Core Host change,
  Desktop change, IPC command, or UI change was added.

### Current Gate

- Model lifecycle preflight normal, blocked, degraded, and sanitized-output
  tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not create an installer, add automatic update or rollback execution,
  write a model cache, access model artifacts, add filesystem/network
  lifecycle code, or make the final Windows packaging policy decision without
  explicit product, security, and release approval.

## Phase 12.2: Model Lifecycle Fixture Harness

- Status: complete as a deterministic, in-memory, fixture-only model
  management preparation wave.
- Added bounded fixture cases for install preflight, artifact verification,
  upgrade planning, and rollback planning.
- Reports expose only bounded counts, outcomes, reason codes, and a
  safety-violation flag; model IDs, revisions, digests, private paths, signed
  URLs, model values, and filesystem contents remain unpersisted and
  unexposed.
- Empty observations, failed cases, and attempted filesystem, network,
  model-loading, installer, update, or rollback side effects fail closed.
- No cache write, artifact access, installer, update, rollback execution,
  Core Host change, Desktop change, IPC command, or UI change was added.

### Current Gate

- Model lifecycle fixture normal, degraded, empty, unsafe-observation, and
  sanitized-output tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

### Next Hard Pause

- Do not add filesystem lifecycle code, model artifact access, installer
  creation, automatic updates, rollback execution, or final release policy
  without explicit product, security, and release approval.

## Phase 12.3: Developer-Alpha Hardening

- Status: complete as a provider-neutral preflight and deterministic,
  in-memory fixture guard.
- Added a developer-alpha hardening preflight for the Phase 12.1 lifecycle
  boundary, fixture harness, sanitized diagnostics, bounded operation state,
  restart recovery observation, fixture fallback, and clean verification.
- Added a fixture guard for fail-closed startup defaults, fallback
  availability, operation recovery, sanitized diagnostics, and release guard
  consistency.
- Reports expose only bounded counters, outcomes, reason codes, and safety
  flags; credentials, private paths, raw diagnostics, model values,
  filesystem contents, and runtime output remain unpersisted and unexposed.
- Packaging, automatic updates, rollback execution, filesystem writes,
  network access, credentials, model loading, provider registration, default
  opt-in, Core Host composition, Desktop IPC, UI behavior, and provider
  visibility remain disabled or unchanged.
- No installer, updater, rollback executor, model cache, artifact access,
  runtime dependency, provider registration, Core Host change, Desktop change,
  IPC command, or UI change was added.

### Current Gate

- Developer-alpha hardening preflight normal, blocked, degraded, and
  sanitized-output tests: PASS.
- Developer-alpha hardening fixture normal, degraded, empty, unsafe-observation,
  and sanitized-output tests: PASS.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run verify`: PASS.

### Next Hard Pause

- Do not add filesystem lifecycle code, model artifact access, installer
  creation, automatic updates, rollback execution, provider registration,
  execution enablement, or final Windows release policy without explicit
  product, security, and release approval.
