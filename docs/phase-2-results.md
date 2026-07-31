# Phase 2 Voice Engine Results

Completed offline acceptance on 2026-07-29, real-provider connectivity
acceptance on 2026-07-30, and spoken microphone PTT confirmation after audio
quality tuning. This document contains no provider credentials, signed URLs, or
secret configuration values.

## Scope

Phase 2 delivers the provider-neutral Voice Engine, one browser capture owner,
one active ASR session owner, the isolated Xunfei RTASR adapter, continuous
listening and TTS coordination, and deterministic Electron voice acceptance.
The real Xunfei composition path is wired through Electron encrypted local
settings and private Core Host IPC. Live provider connectivity acceptance has
passed with locally entered rotated credentials and redacted output.

SQLite, model routing, capability execution, wake-word workers, and phase 3
features remain out of scope.

## Delivered

- protocol v1 voice commands, events, snapshots, diagnostics, and binary frame
  contracts
- deterministic Voice Engine state machine with injected ports, clock, and
  scheduler
- AudioWorklet-first 16 kHz PCM capture with an explicit ScriptProcessor
  compatibility fallback
- one microphone, MediaStream, AudioContext, capture controller, ASR session,
  and provider socket owner
- bounded binary renderer-to-main-to-Core audio transport with backpressure and
  stale-frame rejection
- Xunfei signing, parsing, connection reservation, `10800` retry, segment
  silence finalization, duplicate suppression, and disconnect recovery isolated
  in `packages/voice-adapter-xunfei`
- continuous listening, inactivity recovery, TTS suspend/resume, barge-in, and
  PTT overlay policies in Voice Engine
- Electron permission, keyboard, renderer reload, provider fault, Core restart,
  deterministic PCM, and 100-cycle PTT acceptance
- Electron `safeStorage` voice service settings window, encrypted local
  credential persistence, and private Core Host provider configuration
- browser capture quality tuning: 40 ms / 1,280 byte PCM frame aggregation,
  partial-tail flush on stop/dispose, browser echo cancellation, noise
  suppression, automatic gain control, mono input, and visible capture metrics

## Dependency Result

| Rule | Result |
| --- | --- |
| Contracts contains transport DTOs only | PASS |
| Voice Engine contains platform-neutral session policy only | PASS |
| Browser capture exclusively owns microphone and AudioContext | PASS |
| Xunfei details remain inside the adapter package | PASS |
| Core uses only injected Voice Engine interfaces | PASS |
| `apps/core-host` is the concrete composition root | PASS |
| Desktop contains only IPC, security boundary, and supervision | PASS |
| UI sends intents and renders contract state | PASS |
| Provider credentials bypass React state and public command IPC | PASS |

## Acceptance Result

| Condition | Result |
| --- | --- |
| 100 consecutive deterministic PTT cycles | PASS: 100/100 |
| Application failures during soak | PASS: 0 |
| Provider connection count | PASS: 1 |
| Maximum active provider sessions | PASS: 1 |
| Connect-limit errors | PASS: 0 |
| Provider disconnect recovery without Electron/Core restart | PASS |
| Renderer reload releases microphone tracks | PASS |
| Core restart leaves the main window alive | PASS |
| Granted and denied microphone paths | PASS |
| Repeated keyboard start creates one capture request | PASS |
| Deterministic binary PCM reaches the provider | PASS: 3 frames |
| Real Xunfei provider connection | PASS: 1,528 ms |
| Real Xunfei PTT lifecycle cycles | PASS: 3/3 |
| Real provider final state | PASS: ready |
| Spoken microphone PTT recognition | PASS: user confirmed usable |

## Measurements

Recorded by `tests/desktop-smoke.mjs` in
`artifacts/jarvis-k-phase-2-wave-2-5-metrics.json`:

- launch to interactive Core online: 1,410 ms
- provider fault recovery: 34 ms
- 100-cycle soak duration: 1,116 ms
- Electron main RSS before soak: 145,870,848 bytes
- Electron main RSS after soak: 163,880,960 bytes
- Electron main RSS delta: 18,010,112 bytes
- Core working set before soak: 51,142,656 bytes
- Core working set after soak: 55,148,544 bytes
- Core working-set delta: 4,005,888 bytes

The deterministic soak stayed below the acceptance thresholds of 32 MiB main
RSS growth and 16 MiB Core working-set growth.

Real provider connectivity metrics were recorded by
`tests/real-xunfei-acceptance.mjs` in
`artifacts/jarvis-k-phase-2-real-xunfei-metrics.json`:

- launch to interactive Core online: 11,524 ms
- Xunfei connection establishment: 1,528 ms
- PTT lifecycle cycles: 3/3
- final Voice Engine state: ready
- transcript length: 0 characters, because the automated real-provider test
  sends synthetic silence rather than spoken microphone audio
- manual spoken PTT check: passed after PCM aggregation and microphone quality
  constraints were added

## Verification

The final gate runs:

```text
npm run typecheck
npm test
npm run check:boundaries
npm run build
npm run smoke:desktop
```

Targeted verification before the final gate covered 18 test files and 83 unit
and integration tests. Electron acceptance uses fake media and fake provider
faults; it never connects to a real provider.

## Evidence

- tested Electron UI:
  `artifacts/jarvis-k-phase-2-wave-2-5-desktop.png`
- machine-readable metrics:
  `artifacts/jarvis-k-phase-2-wave-2-5-metrics.json`
- voice service settings screenshot:
  `artifacts/jarvis-k-voice-settings.png`
- real provider connectivity screenshot:
  `artifacts/jarvis-k-phase-2-real-xunfei.png`
- upgrade plan: `docs/phase-2-upgrade-plan.md`
- execution log: `docs/phase-2-progress.md`
- rollback marker: Git tag `phase-1-baseline`

## Security And Source Safety

- `E:\bailongma` and `C:\Users\Administrator\Jarvis-ui` were not modified.
- No credentials, signed provider URLs, query strings, or secret values were
  written to source, logs, screenshots, fixtures, or documents.
- Real-provider testing uses locally entered rotated credentials and redacted
  output.
- Provider-specific behavior is absent from Contracts, Core, Desktop, and UI.

## Remaining Authorization Gate

Offline phase 2 implementation, deterministic acceptance, real-provider
connectivity acceptance, and manual spoken microphone PTT confirmation are
complete. Phase 3 has not started.
