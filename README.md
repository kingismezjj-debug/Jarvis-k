# Jarvis-K

Jarvis-K is an Electron, React, and TypeScript desktop agent runtime. The
current baseline is **Phase 6 Local Provider Readiness**: the
supervised runtime, React HUD, provider-neutral Voice Engine, browser
microphone capture, Xunfei RTASR adapter, encrypted local voice settings,
SQLite memory persistence, device capability inspection, model governance
ports, installability policy, resource diagnostics, dry-run model install
preparation, and deterministic fixture providers for embedding, intent
routing, OCR, and reranking are in place. Phase 6 has started with a
fail-closed local embedding provider readiness package; real local model
downloads and runtime execution remain disabled.

The Bailongma and Jarvis-ui source projects were migration references only.
They are not runtime dependencies.

## Status

- Phase 0/1 rollback tag: `phase-1-baseline`
- Phase 2 voice baseline tag: `phase-2-voice-baseline`
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
```

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
