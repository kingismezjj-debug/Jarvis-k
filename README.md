# Jarvis-K

Jarvis-K is an Electron, React, and TypeScript desktop agent runtime. The
current baseline is **Phase 4 Local Capability And Model Governance
Foundation**: the supervised runtime, React HUD, provider-neutral Voice Engine,
browser microphone capture, Xunfei RTASR adapter, encrypted local voice
settings, SQLite memory persistence, device capability inspection, model
governance ports, installability policy, resource diagnostics, and dry-run
model install preparation are in place.

The Bailongma and Jarvis-ui source projects were migration references only.
They are not runtime dependencies.

## Status

- Phase 0/1 rollback tag: `phase-1-baseline`
- Phase 2 voice baseline tag: `phase-2-voice-baseline`
- Current branch: `main`
- Phase 3 local memory persistence: complete
- Phase 4 local capability and model governance foundation: complete through
  inference preflight and provider configuration requirement reporting
- Phase 4.5 inference readiness gates: documented
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
npm run build
npm run verify
npm run smoke:desktop
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
- [Phase 4 progress](docs/phase-4-progress.md)
- [Phase 4.5 inference readiness](docs/phase-4.5-inference-readiness.md)
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
