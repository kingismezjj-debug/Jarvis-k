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
