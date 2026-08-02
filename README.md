# Jarvis-K

Jarvis-K is an Electron, React, and TypeScript desktop agent runtime. The
current baseline is **Phase 12.3 Developer-Alpha Hardening plus Phase 7.37
Model Artifact Path Handoff and Helper Load plus Phase 7.38 Helper Embed
Preflight plus Phase 7.39 Diagnostic Harness Preflight**: the
supervised runtime, React HUD, provider-neutral Voice Engine, browser
microphone capture, Xunfei RTASR adapter, encrypted local voice settings,
SQLite memory persistence, device capability inspection, model governance
ports, installability policy, resource diagnostics, dry-run model install
  preparation, deterministic fixture providers, provider-neutral
  developer-alpha guards, and the isolated Python Transformers helper are in
  place. The approved Phase 7.26 acceptance runner has verified a temporary
  real artifact load and benchmark; Phase 7.35 adds only explicit opt-in Core
  Host session factory wiring and supervised Python helper lifecycle health.
  Phase 7.36 adds a review-only preflight for future artifact path, helper
  load, and helper embed work. Phase 7.37 adds explicit opt-in Core Host
  artifact path handoff, SHA-256 verification, and helper `load` only. Product
  downloads, persistent model cache writes, helper `embed`, real provider
  execution, default opt-in, installers, updates, and rollback side effects
  remain disabled. Phase 7.38 adds only a preflight for a future helper
  `embed` implementation. Phase 7.39 adds only a fixture-transport diagnostic
  harness preflight and sanitized report shape.

The Bailongma and Jarvis-ui source projects were migration references only.
They are not runtime dependencies.

## Status

- Phase 0/1 rollback reference: commit `1f3376a`
- Phase 2 voice baseline reference: commit `5d195ee`
- Current branch: `main`
- Phase 3 local memory persistence: complete
- Phase 4 local capability and model governance foundation: complete through
  inference preflight and provider configuration requirement reporting
- Phase 4.5 inference readiness and safety gates: complete
- Phase 5 fixture-backed inference execution: complete for embedding, intent
  routing, OCR, and reranking
- Phase 5 fixture-backed inference foundation: complete and ready for Phase 6
  real-provider planning
- Phase 6 local embedding provider readiness: started with fail-closed
  descriptor and configuration gates
- Phase 7 local embedding readiness guards: complete through the composition
  preflight; runtime execution remains disabled
- Phase 7 real Python Transformers helper: implemented inside the dedicated
  runtime package with offline local-file loading, CPU embedding execution,
  and child-process JSONL transport; provider composition remains disabled
- Phase 7.25 real artifact access approval: review-only handoff guard complete;
  real artifact access and runtime-backed benchmark capture remain blocked
- Phase 7.26 approved artifact benchmark: temporary artifact verification,
  real model load/embed, latency, quality, and cleanup passed; peak memory
  capture remains deferred
- Phase 7.27 peak memory sampling diagnostic: provider-local probe hardened
  and verified against a temporary non-model child; real artifact-backed
  memory capture remains deferred
- Phase 7.28 provider composition approval gate: review-only handoff entered;
  local resource readiness remains deferred and provider composition remains
  disabled
- Phase 7.29 resource profile approval: product and security approvals granted
  for one acceptance diagnostic only; artifact/runtime rerun passed, but the
  valid real-model memory sample remains deferred
- Phase 7.30 memory sampling gap disposition: known diagnostic gap formally
  recorded; resource profile remains incomplete and provider composition
  remains blocked
- Phase 7.31 alternative resource evidence: approved diagnostic evidence now
  satisfies local resource readiness for composition review only; provider
  composition and execution remain disabled
- Phase 7.32 provider composition implementation review: exact composition
  review materials are ready for separate product and security approval;
  provider registration, visibility, execution, and default opt-in remain
  disabled
- Phase 7.33 provider composition implementation: runtime-backed local
  embedding is composed only behind `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`;
  default behavior, fixture fallback, model artifact access, model loading,
  and real local inference remain disabled
- Phase 7.34 runtime session factory preflight: Core Host review-only guard
  complete; real session factory implementation, Python helper launch,
  runtime Python environment reads, artifact access, cache writes, model
  loading, and real inference remain blocked pending separate product and
  security approval
- Phase 7.35 runtime session factory lifecycle: explicit opt-in Core Host
  wiring reads `JARVIS_K_RUNTIME_PYTHON`, starts the supervised Python helper
  for health, and shuts it down on release; model artifact path reads, helper
  load/embed calls, model loading, and real inference remain blocked
- Phase 7.36 model load and inference preflight: Core Host review-only guard
  complete; model artifact path reads, model directory handoff, helper
  load/embed calls, model loading, raw vector exposure, and real inference
  remain blocked pending separate product and security approval
- Phase 7.37 model artifact path handoff and helper load: explicit opt-in Core
  Host implementation reads the approved local model directory, verifies the
  pinned artifact digests, and calls helper `load`; helper `embed`, real
  vectors, default opt-in changes, UI visibility changes, downloads, and
  persistent cache writes remain blocked
- Phase 7.38 helper embed implementation preflight: Core Host review-only
  guard complete; helper `embed`, real vectors, Memory routing, vector
  persistence, product inference, default opt-in changes, UI visibility
  changes, downloads, and persistent cache writes remain blocked pending
  separate product and security approval
- Phase 7.39 helper embed diagnostic harness preflight: Core Host review-only
  guard and sanitized report shape complete; helper `embed`, real vectors,
  model artifact access, Memory routing, vector persistence, product
  inference, default opt-in changes, UI visibility changes, downloads, and
  persistent cache writes remain blocked pending separate product and security
  approval
- Phase 8.1 embedding memory retrieval: provider-neutral contract and fixture
  preflight complete; production indexing and retrieval remain disabled
- Phase 8.2 retrieval benchmark harness: fixture-only measurement complete;
  real-provider metrics remain deferred
- Phase 9.1 tool governance: provider-neutral contract and fixture executor
  complete; real OS execution remains disabled
- Phase 10.1 local voice capability contract: provider-neutral preflight and
  fixture preparation complete; real local STT/TTS execution remains disabled
- Phase 10.2 local voice fixture benchmark harness: deterministic fixture
  measurements complete; real speech metrics and execution remain deferred
- Phase 10.3 local voice runtime isolation: pending adapter boundary and
  fail-closed approval guard complete; runtime dependencies remain deferred
- Phase 10.4 local voice runtime acceptance preflight: deferred review
  aggregate complete; runtime-backed capture remains blocked
- Phase 11.1 OCR, screen, and vision contract guards: provider-neutral
  fixture preparation complete; real visual capture and model execution remain
  disabled
- Phase 11.2 visual fixture benchmark harness: deterministic fixture
  measurement complete; real visual metrics and execution remain deferred
- Phase 11.3 visual runtime isolation: pending adapter boundary complete;
  runtime dependencies, screen capture, and model execution remain deferred
- Phase 11.4 visual runtime acceptance preflight: deferred review aggregate
  complete; runtime-backed capture remains blocked
- Phase 12.1 model lifecycle and Windows packaging preflight: dry-run guard
  complete; installer, update, and rollback decisions remain deferred
- Phase 12.2 model lifecycle fixture harness: in-memory install, upgrade, and
  rollback planning complete; side effects remain disabled
- Phase 12.3 developer-alpha hardening: provider-neutral preflight and
  deterministic fixture guard complete; release side effects remain disabled
- Real local model downloads and model runtime execution are not enabled yet

## Requirements

- Windows 10/11 for the desktop app and microphone testing
- Node.js `>=22.12.0`
- npm
- Git

## Quick Start

```powershell
npm install
npm run verify
npm run start
```

`npm run start` launches the built Electron app. Use `npm run dev` when you
want to build and launch in one command.

## Voice Setup

1. Launch Jarvis-K with `npm run start`.
2. Open the voice service settings from the left sidebar settings button.
3. Enter Xunfei RTASR `AppID` and a rotated `APIKey`.
4. Save. Electron stores the configuration with `safeStorage`; credentials are
   sent to Core Host through private child-process IPC.
5. Press and hold the microphone button, speak for at least one second, then
   release.

The UI shows `VOICE FRAMES`, `VOICE RMS`, `VOICE PEAK`, and
`VOICE TRANSCRIPT` to help distinguish microphone capture issues from provider
recognition issues.

Never put real provider credentials in source, `.env`, Git history, issue
comments, screenshots, or chat logs.

## Commands

```powershell
npm run typecheck
npm test
npm run check:boundaries
npm run check:sensitive-artifacts
npm run build
npm run verify
npm run smoke:desktop
npm run smoke:desktop:fixture-inference
npm run smoke:desktop:local-embedding-composition
npm run smoke:runtime-transformers
npm run smoke:runtime-transformers:fixture
npm run acceptance:runtime-transformers:approved-artifact
```

The Transformers runtime smoke requires an approved Python environment path:

```powershell
$env:JARVIS_K_RUNTIME_PYTHON='C:\path\to\python.exe'
npm run smoke:runtime-transformers
```

The runtime-backed local embedding provider remains explicit opt-in. The
Phase 7.37 model-load-only path also requires a separately approved local
artifact directory:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
```

The fixture smoke creates only a temporary random model outside the repository
and removes it after the run. It does not download or access a real model.

Real Xunfei connectivity acceptance is opt-in:

```powershell
$env:JARVIS_K_REAL_PROVIDER_ACCEPTANCE='1'
npm run acceptance:xunfei
```

The real-provider acceptance script requires credentials to be saved through
the local settings window first. It must not be enabled in default CI.

## Workspace

- `packages/contracts`: protocol DTOs, schemas, IPC channel names, and bridge
  types only.
- `packages/capabilities`: provider-neutral device capability, model
  governance, installability, operation supervision, and resource scheduling
  ports.
- `packages/inference-adapter-fixture`: deterministic test-only embedding,
  intent routing, OCR, and reranking providers with no downloads, native
  runtime, or network access.
- `packages/inference-adapter-embedding-local`: Phase 6 fail-closed local
  embedding provider readiness descriptor and configuration gate reports.
- `packages/inference-runtime-transformers-local`: provider-local artifact
  guards, Python Transformers helper, and supervised child-process transport.
- `packages/memory`: provider-neutral memory ports and schemas.
- `packages/memory-sqlite`: SQLite-backed message, conversation, summary,
  health, export, and import persistence.
- `packages/voice`: platform-neutral Voice Engine state machine and session
  policies.
- `packages/voice-capture-browser`: browser microphone, AudioContext,
  AudioWorklet, PCM conversion, frame aggregation, and capture diagnostics.
- `packages/voice-adapter-xunfei`: Xunfei signing, RTASR WebSocket behavior,
  parsing, retry, buffering, and finalization.
- `packages/core`: application runtime and snapshots using injected memory,
  voice, capability, and model governance interfaces.
- `apps/core-host`: concrete composition root for Core, Voice Engine, memory,
  device capability, and model governance adapters.
- `apps/desktop`: Electron security boundary, supervision, safeStorage
  settings, and IPC.
- `apps/ui`: React display state and user intents.

## Documentation

- [Architecture](docs/architecture.md)
- [Developer onboarding](docs/developer-onboarding.md)
- [Security](SECURITY.md)
- [Phase 4 completion](docs/phase-4-completion.md)
- [Phase 4 progress](docs/phase-4-progress.md)
- [Phase 4.5 inference readiness](docs/phase-4.5-inference-readiness.md)
- [Phase 5 completion](docs/phase-5-completion.md)
- [Phase 5 progress](docs/phase-5-progress.md)
- [Phase 6 progress](docs/phase-6-progress.md)
- [Phase 7 progress](docs/phase-7-progress.md)
- [Phase 7.18 tokenizer/config integration review](docs/phase-7-18-tokenizer-config-integration-review.md)
- [Phase 7.19 runtime helper protocol](docs/phase-7-19-runtime-helper-protocol.md)
- [Real Python Transformers runtime](docs/phase-7-24-real-python-transformers-runtime.md)
- [Phase 7.25 real artifact access approval](docs/phase-7-25-real-artifact-access-approval.md)
- [Phase 7.26 real artifact benchmark](docs/phase-7-26-real-artifact-benchmark.md)
- [Phase 7.27 peak memory sampling diagnostic](docs/phase-7-27-memory-sampling-diagnostic.md)
- [Phase 7.28 provider composition approval gate](docs/phase-7-28-provider-composition-approval-gate.md)
- [Phase 7.29 resource profile product and security approval](docs/phase-7-29-resource-profile-product-security-approval.md)
- [Phase 7.30 memory sampling gap disposition](docs/phase-7-30-memory-sampling-gap-disposition.md)
- [Phase 7.31 alternative resource evidence](docs/phase-7-31-alternative-resource-evidence.md)
- [Phase 7.32 provider composition implementation review](docs/phase-7-32-provider-composition-implementation-review.md)
- [Phase 7.33 provider composition implementation](docs/phase-7-33-provider-composition-implementation.md)
- [Phase 7.34 runtime session factory preflight](docs/phase-7-34-runtime-session-factory-preflight.md)
- [Phase 7.35 runtime session factory lifecycle](docs/phase-7-35-runtime-session-factory-lifecycle.md)
- [Phase 7.36 model load and inference preflight](docs/phase-7-36-model-load-inference-preflight.md)
- [Phase 7.37 model artifact path handoff and helper load](docs/phase-7-37-model-artifact-load.md)
- [Phase 7.38 helper embed implementation preflight](docs/phase-7-38-helper-embed-preflight.md)
- [Phase 7.39 helper embed diagnostic harness preflight](docs/phase-7-39-helper-embed-diagnostic-harness-preflight.md)
- [Phase 7.20 controlled artifact cache executor](docs/phase-7-20-controlled-artifact-cache-executor.md)
- [Phase 7.21 runtime adapter isolation guard](docs/phase-7-21-runtime-adapter-isolation-guard.md)
- [Phase 7.22 runtime acceptance preflight](docs/phase-7-22-runtime-acceptance-preflight.md)
- [Phase 7.23 composition preflight](docs/phase-7-23-composition-preflight.md)
- [Phase 8.1 embedding retrieval contract](docs/phase-8-1-embedding-retrieval-contract.md)
- [Phase 8.2 retrieval benchmark harness](docs/phase-8-2-retrieval-benchmark-harness.md)
- [Phase 9.1 tool governance contract](docs/phase-9-1-tool-governance-contract.md)
- [Phase 10.1 local voice capability contract](docs/phase-10-1-local-voice-contract.md)
- [Phase 10.2 local voice fixture benchmark harness](docs/phase-10-2-local-voice-benchmark-harness.md)
- [Phase 10.3 local voice runtime isolation](docs/phase-10-3-local-voice-runtime-isolation.md)
- [Phase 10.4 local voice runtime acceptance preflight](docs/phase-10-4-local-voice-runtime-acceptance-preflight.md)
- [Phase 11.1 OCR, screen, and vision contract guards](docs/phase-11-1-visual-contract-guards.md)
- [Phase 11.2 visual fixture benchmark harness](docs/phase-11-2-visual-fixture-benchmark-harness.md)
- [Phase 11.3 visual runtime isolation](docs/phase-11-3-visual-runtime-isolation.md)
- [Phase 11.4 visual runtime acceptance preflight](docs/phase-11-4-visual-runtime-acceptance-preflight.md)
- [Phase 12.1 model lifecycle and Windows packaging preflight](docs/phase-12-1-model-lifecycle-preflight.md)
- [Phase 12.2 model lifecycle fixture harness](docs/phase-12-2-model-lifecycle-fixture-harness.md)
- [Phase 12.3 developer-alpha hardening](docs/phase-12-3-developer-alpha-hardening.md)
- [Phase 4 model candidate audit](docs/phase-4-model-candidate-audit.md)
- [Phase 3 progress](docs/phase-3-progress.md)
- [Phase 2 results](docs/phase-2-results.md)
- [Phase 2 progress](docs/phase-2-progress.md)

## Boundaries

Run `npm run check:boundaries` before committing. Important rules:

- Contracts must not import runtime packages.
- Capabilities must stay provider-neutral and must not import Electron, React,
  SQLite, WebSocket, Python, CUDA, ONNX, or concrete model runtimes.
- Memory interfaces must stay provider-neutral; SQLite implementation details
  stay inside `packages/memory-sqlite`.
- Voice Engine must not import Electron, browser APIs, WebSocket libraries,
  credentials, Core, UI, or concrete providers.
- Xunfei-specific behavior must stay inside `packages/voice-adapter-xunfei`.
- Core must use injected interfaces for voice, memory, capabilities, and model
  governance.
- `apps/core-host` is the only concrete provider composition root.
- Desktop owns IPC, supervision, and security boundaries.
- UI sends intents and renders state; it must not own provider policy.
