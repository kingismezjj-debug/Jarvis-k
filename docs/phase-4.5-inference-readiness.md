# Phase 4.5 Inference Readiness

This document defines the stable handoff from Phase 4 model governance to a
future Phase 5 real-provider integration. Phase 4.5 is a readiness layer, not
an execution layer.

## Current Baseline

- Device capability inspection is available through provider-neutral contracts.
- Model candidates are documented but remain non-downloadable.
- Fixture manifests are installable only for governance and smoke coverage.
- Model lifecycle storage exists, but artifact fetching is intentionally
  unconfigured.
- Install preparation is a dry-run workflow with operation supervision and
  resource lease checks.
- Runtime adapters are discoverable, but the current registry advertises no
  real adapters.
- Embedding, OCR, intent routing, and reranking have typed inference ports and
  unavailable providers that fail closed.
- Inference provider availability, configuration requirements, and execution
  preflight can be queried without invoking a provider.

## Boundary Contract

Future real inference work must preserve these boundaries:

- `packages/contracts` defines DTOs, schemas, and command/event envelopes only.
- `packages/capabilities` defines provider-neutral ports, policy, and in-memory
  or static helpers only.
- `packages/core` resolves commands through injected ports and validates DTOs.
  It must not import concrete model runtimes, Electron, React, WebSocket
  libraries, SQLite, Python tooling, CUDA, ONNX, Paddle, or Hugging Face SDKs.
- `apps/core-host` is the only place where concrete local or cloud inference
  providers are composed.
- `apps/desktop` owns IPC, supervision, safeStorage, and process boundaries.
- `apps/ui` consumes DTOs and sends intents; it must not own provider policy,
  credential policy, or model execution policy.

## Phase 5 Entry Gates

A real provider or runtime may be introduced only after all gates are met:

1. The provider has a dedicated package or adapter module with no credentials
   committed to source.
2. The provider is wired through existing ports or a new provider-neutral port.
3. The provider publishes a descriptor and configuration requirement report
   before any execution command is exposed.
4. Installable manifests are pinned to immutable revisions and SHA-256 digests.
5. License, distribution, native dependency, and runtime packaging risks are
   documented before `downloadEnabled` or real fetch paths are enabled.
6. Resource requirements are declared and checked before model load or
   execution.
7. Execution has preflight coverage that explains blocked states without
   calling the provider.
8. Tests cover unavailable, degraded, and available-but-blocked states before
   happy-path execution is enabled.

## Explicit Non-Goals

- Do not add real model downloads in Phase 4.5.
- Do not add Python, CUDA, ONNX, Paddle, transformers, ctranslate2, llama.cpp,
  tokenizer, or Hugging Face SDK runtime dependencies in Phase 4.5.
- Do not store provider credentials in repository files, fixtures, docs,
  screenshots, logs, or test artifacts.
- Do not expose provider URLs, signed URLs, tokens, or secret-derived values in
  contracts, Core snapshots, events, UI state, or smoke metrics.
- Do not add user-facing execution buttons until unavailable and preflight
  states are covered end to end.

## Recommended First Phase 5 Slice

The safest first real slice is a fixture-backed local provider package that
implements one capability port without network access or native runtime
dependencies. It should:

- report `available` only under an explicit test flag;
- satisfy `agent.listInferenceProviders`;
- satisfy `agent.listInferenceProviderRequirements`;
- pass `agent.previewInferenceExecution` for a fixture manifest;
- return deterministic fixture output through a capability-specific command;
- remain isolated from Core, Desktop, and UI policy.

After that, a real runtime adapter can replace only the provider package and
the `apps/core-host` composition, leaving contracts, Core, Desktop, and UI
control flow intact.
