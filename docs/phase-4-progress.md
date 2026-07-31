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
