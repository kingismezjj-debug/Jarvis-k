# Phase 4 Progress

## 2026-07-31

### Wave 4.1: Local Capability Runtime Foundation

- Status: complete.
- Added `@jarvis-k/capabilities` as the provider-neutral home for device
  capability ports and provider-selection policy.
- Added contracts DTOs for capability snapshots, runtime modes, model
  manifests, model inventory items, and provider plans.
- Added `agent.getCapabilities` so the renderer can refresh local capability
  state through the existing validated command IPC.
- Added a concrete Node/Windows capability probe in `apps/core-host`; it uses
  OS memory/CPU data and best-effort Windows GPU inspection, falling back to
  CPU-only data when probing is unavailable.
- Updated Core to hydrate optional capabilities at startup and expose them in
  `CoreSnapshot` without depending on Node, Electron, GPU, or model libraries.
- Updated the React HUD to show runtime mode, GPU count, and acceleration
  backend hints.
- Did not download models, install Python runtimes, add CUDA/ONNX dependencies,
  or connect any Hugging Face model implementation.

### Current Gate

- Targeted capability/contracts/core/UI tests: PASS, 4 test files and 34 tests.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 21 test files and 117 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS, includes capability snapshot smoke.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.2: Model Governance Ports

- Status: complete.
- Added provider-neutral ports for model registry, download management,
  lifecycle management, and resource scheduling.
- Added `StaticModelRegistry` for pinned manifest lists that can be used by
  future model providers without pulling in model runtime dependencies.
- Added default filtering so red-risk model manifests are hidden unless a caller
  explicitly asks to include them.
- Kept real downloads, model loading, CUDA/ONNX runtimes, and Hugging Face
  access out of this wave.

### Current Gate

- Targeted capabilities tests: PASS, 2 test files and 6 tests.
- `npm run verify`: PASS, 22 test files and 120 tests.
- `npm run smoke:desktop`: PASS.

## 2026-07-31

### Wave 4.3: File-System Model Lifecycle Skeleton

- Status: complete.
- Added a concrete file-system model lifecycle manager in `apps/core-host` so
  Node-specific model storage remains outside Core and contracts.
- Added deterministic model directories, pinned manifest persistence, local
  inventory files, `.part` temporary artifacts, SHA-256 verification, remove,
  load, and release state transitions.
- Added an injected artifact fetcher seam so future Hugging Face/CDN download
  logic can be implemented without changing lifecycle state management.
- Added resume-aware download behavior by passing existing partial artifact
  size into the fetcher and emitting progress phases.
- Kept real network download, model runtime loading, Python, CUDA, ONNX, and
  Hugging Face access out of this wave.

### Current Gate

- Targeted model lifecycle tests: PASS, 2 test files and 6 tests.
- `npm run verify`: PASS, 23 test files and 123 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

### Wave 4.4: Model Governance Query Surface

- Status: complete.
- Added `agent.listModelManifests` and `agent.listModelInventory` commands.
- Updated Core to query model manifests and local model inventory through
  injected `ModelRegistry` and `ModelLifecycleManager` ports.
- Composed an empty `StaticModelRegistry` and file-system lifecycle manager in
  `apps/core-host`, keeping model storage implementation details out of Core.
- Added a compact React HUD model governance panel that shows manifest count,
  local inventory count, and loaded model count.
- Extended desktop smoke coverage to call the model governance commands through
  the existing renderer bridge using an isolated temporary model directory.
- Kept real model download, install, update, delete, and Hugging Face/CDN access
  out of this wave.

### Current Gate

- Targeted contracts/core/UI/core-host tests: PASS, 4 test files and 37 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 23 test files and 126 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.5: Model Candidate Seed And License Audit

- Status: complete.
- Added provider-neutral model candidate DTOs separate from installable model
  manifests.
- Added a static model candidate registry seeded with conservative candidates
  for local STT, OCR, embedding, and rules-first intent routing.
- Marked every seeded candidate as `downloadEnabled: false` with
  `pending_pin` audit status so none can be treated as installable artifacts.
- Added model candidate query support through Core and the existing renderer
  bridge.
- Added a model candidate audit document with evidence links and blockers
  before any future download can be enabled.
- Kept real model downloads, Python runtimes, CUDA/ONNX dependencies, and
  Hugging Face/CDN access out of this wave.

### Current Gate

- Targeted capabilities/contracts/core/UI tests: PASS, 4 test files and 39 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 23 test files and 128 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.6: Installable Manifest Safety Gate

- Status: complete.
- Added a pure installability policy that blocks floating revisions, missing
  SHA-256 digests, red or unknown license risk, yellow risk without explicit
  approval, and devices below declared memory or VRAM minimums.
- Updated the file-system model lifecycle manager so future downloads require
  a device capability snapshot and must pass the installability policy before
  any artifact fetch is attempted.
- Kept the existing model candidates non-installable; no candidate is promoted
  to a manifest in this wave.
- Kept real network download, Hugging Face/CDN access, Python runtimes, CUDA,
  ONNX, and model libraries out of this wave.

### Current Gate

- Targeted manifest policy and lifecycle tests: PASS, 2 test files and 8 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 24 test files and 133 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.7: Model Installability Preview Surface

- Status: complete.
- Added a provider-neutral installability report DTO and
  `agent.previewModelInstallability` command so callers can inspect why a
  manifest is or is not currently installable before any download path exists.
- Added a `ModelInstallationPlanner` port in `@jarvis-k/capabilities` and a
  default policy-backed planner that adapts the existing installability safety
  gate into transport-safe reports.
- Updated Core to resolve manifests and device capability snapshots through
  injected ports before delegating preview decisions to the planner.
- Composed the policy-backed planner in `apps/core-host`, keeping the concrete
  wiring in the existing composition root.
- Updated the React HUD model governance panel to show installable and blocked
  manifest counts from DTOs only.
- Kept real model downloads, install actions, Hugging Face/CDN access, Python
  runtimes, CUDA, ONNX, and model libraries out of this wave.

### Current Gate

- Targeted contracts/capabilities/core/UI tests: PASS, 4 test files and 40 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 24 test files and 135 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.8: Model Operation Supervision Skeleton

- Status: complete.
- Added provider-neutral model operation phase, progress, and snapshot DTOs so
  future install/load/remove flows can report supervised state without leaking
  model runtime details.
- Added a `model.operation.updated` event contract for future Core-published
  model operation telemetry.
- Added a `ModelOperationSupervisor` port and an in-memory implementation in
  `@jarvis-k/capabilities` for queued, progressing, terminal, cancelled, and
  failed operation state.
- Updated the React activity stream labeler to understand model operation
  events.
- Kept real model downloads, install commands, Hugging Face/CDN access, Python
  runtimes, CUDA, ONNX, and model libraries out of this wave.

### Current Gate

- Targeted contracts/capabilities/UI tests: PASS, 3 test files and 25 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 25 test files and 140 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.9: Model Operation Query Surface

- Status: complete.
- Added `agent.listModelOperations` and a `modelOperations` snapshot field so
  model operation state can be queried and observed before install execution
  exists.
- Updated Core to read model operations through an injected
  `ModelOperationSupervisor`, cache validated snapshots, and publish standard
  model operation update events through a provider-neutral entry point.
- Composed the in-memory model operation supervisor in `apps/core-host`.
- Updated the React HUD model governance panel to show total and active model
  operation counts from DTOs only.
- Extended desktop smoke coverage to call the model operation query through
  the existing renderer bridge.
- Kept real model downloads, install commands, Hugging Face/CDN access, Python
  runtimes, CUDA, ONNX, and model libraries out of this wave.

### Current Gate

- Targeted contracts/core/UI tests: PASS, 3 test files and 38 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 25 test files and 141 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.10: Local Resource Scheduler Skeleton

- Status: complete.
- Added an in-memory `ResourceScheduler` implementation in
  `@jarvis-k/capabilities` that grants conservative leases from a
  provider-neutral `DeviceCapability` snapshot.
- Added memory, VRAM, and exclusive GPU conflict checks so future local model
  load/execute paths can avoid obvious resource overcommit before invoking any
  runtime.
- Added idempotent lease release behavior and defensive resource accounting.
- Kept the scheduler implementation provider-neutral; it does not inspect the
  host OS directly and does not depend on Electron, Node APIs, model runtimes,
  CUDA, ONNX, Python, or Hugging Face/CDN access.
- Kept real model downloads, install commands, model execution, and runtime
  loading out of this wave.

### Current Gate

- Targeted resource scheduler tests: PASS, 1 test file and 3 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 26 test files and 144 tests.

## 2026-07-31

### Wave 4.11: Resource Diagnostics Query Surface

- Status: complete.
- Added provider-neutral resource scheduler diagnostics DTOs for available and
  leased memory, available and leased VRAM, active lease count, and exclusive
  GPU lock state.
- Added `agent.getResourceDiagnostics` so Core and the renderer can query
  resource pressure before any model runtime or install command exists.
- Extended `ResourceScheduler` with a read-only `diagnostics()` method and
  implemented diagnostics in the in-memory scheduler.
- Composed the scheduler in `apps/core-host` using the existing device
  capability provider as a dynamic device snapshot source.
- Updated the React HUD model governance panel to show resource memory, VRAM,
  and lease counts from DTOs only.
- Extended desktop smoke coverage to query resource diagnostics through the
  existing renderer bridge.
- Kept real model downloads, install commands, model execution, runtime
  loading, Python, CUDA, ONNX, and Hugging Face/CDN access out of this wave.

### Current Gate

- Targeted contracts/capabilities/core/UI tests: PASS, 4 test files and 44 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 26 test files and 147 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Wave 4.12: Model Install Workflow Orchestrator Skeleton

- Status: complete.
- Added a provider-neutral `ModelInstallWorkflowOrchestrator` port and a
  policy-backed implementation in `@jarvis-k/capabilities`.
- The workflow skeleton starts a supervised model operation, runs installability
  policy, attempts a conservative resource lease, immediately releases that
  lease, and stops at `queued`, `blocked`, or `failed`.
- Kept the workflow dry-run only; it does not call `ModelDownloadManager`,
  fetch artifacts, write files, load models, or expose install commands.
- Reused existing `ModelInstallationPlanner`, `ModelOperationSupervisor`, and
  `ResourceScheduler` ports instead of crossing package boundaries.
- Kept real model downloads, install commands, model execution, runtime
  loading, Python, CUDA, ONNX, and Hugging Face/CDN access out of this wave.

### Current Gate

- Targeted capabilities workflow/resource/policy tests: PASS, 3 test files and
  12 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 27 test files and 150 tests.

### Wave 4.13: Fixture Installable Manifest Seed

- Status: complete.
- Added Jarvis-owned fixture model manifests for local STT and embedding smoke
  paths.
- The fixtures are pinned, SHA-256 guarded, green license-risk, and use the
  `system` runtime so they can exercise governance and installability surfaces
  without implying a real model runtime dependency.
- Composed the fixture manifests in `apps/core-host` through the existing
  `StaticModelRegistry`.
- Kept all real Hugging Face candidates disabled and did not add network
  downloads, model artifacts, Python, CUDA, ONNX, or model execution paths.

### Current Gate

- Targeted capabilities fixture/policy/workflow tests: PASS, 3 test files and
  15 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 27 test files and 152 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

### Wave 4.14: End-To-End Governance Dry-Run Smoke

- Status: complete.
- Added `agent.prepareModelInstall` as a provider-neutral dry-run command for
  preparing model installs without enabling artifact fetch or model execution.
- Core resolves manifests and device capabilities through injected ports, then
  delegates install preparation to the injected
  `ModelInstallWorkflowOrchestrator`.
- Composed the policy-backed workflow orchestrator in `apps/core-host` using
  the existing installability planner, operation supervisor, and resource
  scheduler.
- Extended desktop smoke coverage across manifest listing, installability
  preview, dry-run workflow preparation, operation query, and resource
  diagnostics.
- Kept the command deliberately scoped to preparation; no download command,
  artifact fetch, model loading, Python, CUDA, ONNX, or Hugging Face access was
  added.

### Current Gate

- Targeted contracts/core/workflow tests: PASS, 3 test files and 36 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 27 test files and 153 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

### Wave 4.15: Runtime Adapter Boundary Seed

- Status: complete.
- Added provider-neutral runtime adapter ports for future local model loading:
  registry descriptors, adapter lookup, load input, and loaded session release.
- Added an unavailable runtime registry that advertises no adapters until a real
  runtime package is deliberately composed.
- Kept capability-specific inference interfaces out of this wave so STT, OCR,
  embedding, and routing contracts can stay separate instead of being forced
  through a generic invoke shape.
- Kept real model runtime dependencies, downloads, artifact fetch, Python,
  CUDA, ONNX, and Hugging Face access out of this wave.

### Current Gate

- Targeted runtime boundary tests: PASS, 3 test files and 12 tests.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS, 28 test files and 155 tests.

### Wave 4.16: Runtime Adapter Query Surface

- Status: complete.
- Added a provider-neutral runtime adapter descriptor DTO and
  `agent.listModelRuntimeAdapters` command.
- Core lists runtime adapter descriptors only through an injected
  `ModelRuntimeRegistry` port and validates returned descriptors with
  `packages/contracts` schemas.
- Composed an `UnavailableModelRuntimeRegistry` in `apps/core-host` so desktop
  callers can observe that no real local runtime adapters are currently
  configured.
- Extended desktop smoke coverage to query runtime adapter descriptors and
  assert that the current baseline does not advertise real runtimes.
- Kept real model runtime dependencies, model execution, artifact downloads,
  Python, CUDA, ONNX, and Hugging Face access out of this wave.

### Current Gate

- Targeted contracts/core/runtime registry tests: PASS, 3 test files and
  37 tests.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 28 test files and 157 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

### Wave 4.17: Embedding Inference Port Boundary

- Status: complete.
- Added provider-neutral embedding request/result/vector DTOs with schema
  validation for text input size, batch size, finite vector values, and vector
  dimensionality.
- Added an `EmbeddingInferenceProvider` port in `@jarvis-k/capabilities` so
  future local or remote embedding providers can be injected without Core
  importing runtime implementations.
- Added an unavailable embedding provider that fails closed until a real
  embedding provider is deliberately composed.
- Kept vector storage, retrieval policy, real model execution, model downloads,
  Python, CUDA, ONNX, and Hugging Face access out of this wave.

### Current Gate

- Targeted contracts/embedding/runtime tests: PASS, 3 test files and 21 tests.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS, 29 test files and 160 tests.

### Wave 4.18: OCR Recognition Port Boundary

- Status: complete.
- Added provider-neutral OCR request/result/block DTOs with image byte limits,
  supported image MIME types, optional language hints, confidence values, and
  normalized bounding boxes.
- Added an `OcrRecognitionProvider` port in `@jarvis-k/capabilities` for future
  local OCR providers without binding Core to Paddle, ONNX, Python, or another
  runtime.
- Added an unavailable OCR provider that fails closed until a real provider is
  deliberately composed.
- Kept screenshot/file capture policy, arbitrary file path access, real OCR
  execution, model downloads, Python, CUDA, ONNX, Paddle, and Hugging Face
  access out of this wave.

### Current Gate

- Targeted contracts/OCR/embedding tests: PASS, 3 test files and 22 tests.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS, 30 test files and 163 tests.

### Wave 4.19: Intent Routing Port Boundary

- Status: complete.
- Added provider-neutral intent routing request/result/candidate DTOs with
  utterance limits, optional locale/conversation context, allow-listed intent
  hints, confidence values, slots, and routing reasons.
- Added an `IntentRoutingProvider` port in `@jarvis-k/capabilities` so future
  rules-first or model-assisted routers can be injected without Core importing
  a concrete implementation.
- Added an unavailable intent routing provider that fails closed until a real
  router is deliberately composed.
- Kept command execution, tool invocation, LLM calls, real model execution,
  Python, CUDA, ONNX, and Hugging Face access out of this wave.

### Current Gate

- Targeted contracts/intent/OCR/embedding tests: PASS, 4 test files and
  25 tests.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS, 31 test files and 166 tests.

### Wave 4.20: Reranking Port Boundary

- Status: complete.
- Added provider-neutral rerank request/result/document DTOs with query limits,
  candidate document limits, optional metadata, top-K hints, finite scores, and
  rank values.
- Added a `RerankingProvider` port in `@jarvis-k/capabilities` so future
  reranking implementations can be injected independently from memory storage
  and recall policy.
- Added an unavailable reranking provider that fails closed until a real
  provider is deliberately composed.
- Kept vector storage, memory retrieval policy, command execution, real model
  execution, Python, CUDA, ONNX, and Hugging Face access out of this wave.

### Current Gate

- Targeted contracts/reranking/intent/embedding tests: PASS, 4 test files and
  26 tests.
- `npm run typecheck`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS, 32 test files and 169 tests.
