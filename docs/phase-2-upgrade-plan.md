# Phase 2 Voice Engine Upgrade Plan

Planned on 2026-07-29. Phase 2 must not begin until the phase 0/1 baseline is
committed or otherwise explicitly approved as the rollback point.

## Goal

Migrate the verified Bailongma voice behavior into Jarvis-K without copying its
UI-owned session policy or provider-specific implementation into Core.

Phase 2 delivers:

- one Voice Engine state machine
- one browser microphone capture owner
- one active ASR session owner
- one provider-neutral Core integration
- one concrete Xunfei adapter for the first acceptance baseline
- repeatable unit, integration, Electron, and long-run voice tests

Phase 2 does not deliver SQLite, model routing, capability execution, wake-word
workers, multiple simultaneous ASR providers, or the full Jarvis-ui voice panel.

## Required Dependency Direction

```text
@jarvis-k/contracts
        ^
        |
@jarvis-k/voice <----- @jarvis-k/voice-adapter-xunfei
        ^                         ^
        |                         |
@jarvis-k/core              apps/core-host
        ^                         ^
        +-------------------------+

@jarvis-k/contracts <----- @jarvis-k/voice-capture-browser
        ^                              ^
        |                              |
     apps/ui --------------------------+

@jarvis-k/contracts <----- apps/desktop
```

The composition root is `apps/core-host`. It is the only Jarvis-K module that
may construct a concrete provider adapter.

## Package Responsibilities

### `packages/contracts`

Owns transport DTOs and runtime schemas only:

- voice commands
- state, transcript, diagnostics, and error events
- voice snapshot fields
- binary audio-frame metadata
- protocol versioning and compatibility rules

It must not import Voice Engine, Core, Electron, browser APIs, or a provider.

### `packages/voice`

Owns platform-neutral voice behavior:

- Voice Engine state machine
- PTT session policy
- continuous-mode policy
- transcript accumulation and finalization
- connection reuse and recovery policy
- TTS suspend, resume, and interruption coordination
- injected clock and scheduler for deterministic tests

It may depend on Contracts. It must not import Electron, DOM APIs, Node
WebSocket implementations, credentials, Core, UI, or a concrete provider.

Required ports:

```text
AsrProviderPort
AsrSessionPort
TtsPlaybackPort
VoiceEventSink
Clock
Scheduler
```

### `packages/voice-capture-browser`

Owns the physical browser microphone resource:

- `getUserMedia`
- selected microphone device
- AudioContext and AudioWorklet lifecycle
- Float32 to 16 kHz Int16 PCM conversion
- bounded audio-frame buffering
- start, stop, suspend, resume, and dispose

It receives callbacks for frames and capture errors. It does not decide when a
sentence is final, when a transcript is sent, or when an ASR session reconnects.

### `packages/voice-adapter-xunfei`

Owns Xunfei protocol details:

- signed WebSocket URL creation
- connection reservation and release grace period
- the `10800` connect-limit recovery policy
- audio frame delivery
- segment silence finalization
- provider result parsing and normalization

It implements Voice Engine ports and must not import Core, UI, Electron, or
browser APIs.

### `packages/core`

Owns application-level command handling and snapshots. It receives an injected
Voice Engine interface and:

- forwards voice commands
- maps Voice Engine events into Contracts events
- includes the latest voice state in Core snapshots
- never imports provider brands or microphone APIs

The current placeholder voice transitions in `CoreRuntime` must be removed only
after the injected Voice Engine passes its contract tests.

### `apps/core-host`

Owns process composition:

- creates CoreRuntime
- creates VoiceEngine
- selects a configured provider adapter
- receives secrets over private process IPC
- connects event and binary audio transports
- performs deterministic startup and shutdown

Provider selection, secrets, and construction stay here instead of Core.

### `apps/desktop`

Owns process and security boundaries:

- supervises `apps/core-host`
- exposes control commands through the existing preload bridge
- exposes a dedicated one-way binary audio IPC channel
- validates frame metadata and applies backpressure limits
- retrieves encrypted provider configuration
- sends secrets to Core Host through private child IPC, never argv or logs

It must not implement recognition, transcript policy, or provider reconnection.

### `apps/ui`

Owns interaction and display only:

- PTT press, release, keyboard, blur, and cancellation intents
- microphone permission prompts
- voice state and transcript rendering
- mode selector
- calls into `voice-capture-browser`

It must not contain provider URLs, credentials, transcript-finalization timers,
reconnection logic, or its own Voice Engine state.

## Resource Ownership

| Resource | Single owner |
| --- | --- |
| Microphone MediaStream | `voice-capture-browser` |
| AudioContext and AudioWorklet | `voice-capture-browser` |
| PTT and continuous session policy | `VoiceEngine` |
| Active ASR session | `VoiceEngine` |
| Provider WebSocket | active provider adapter |
| Transcript accumulation | `VoiceEngine` |
| Application voice snapshot | `CoreRuntime` |
| Provider credentials at rest | Electron secure configuration adapter |
| Window and child processes | Electron Supervisor |

No other module may create or retain these resources.

## State Machine

```text
disabled -> idle
idle -> connecting -> ready
ready -> recording -> finalizing -> ready
ready -> speaking -> interrupted -> ready
connecting|ready|recording|finalizing|speaking -> recovering -> ready
any active state -> error
any state -> disabled
```

Every transition must be implemented as an explicit event-driven transition.
UI conditionals and provider callbacks may request transitions but cannot mutate
state directly.

## Delivery Waves

### Wave 2.0: Freeze and Guardrails

Tasks:

- create the phase 0/1 baseline commit or explicit rollback marker
- add new workspace package placeholders
- extend the dependency-boundary checker before implementations are added
- add a phase 2 progress document
- verify Bailongma voice tests still pass without modifying its files

Exit gate:

- phase 0/1 remains fully green
- forbidden imports fail the boundary checker
- no provider code exists in Core, Desktop, or UI

### Wave 2.1: Contracts and Mock Voice Engine

Tasks:

- extend voice commands and events without breaking protocol version 1
- add transcript, permission, diagnostics, and structured voice errors
- implement the Voice Engine state machine using mock ports
- replace Core placeholder transitions with injected Voice Engine behavior

Required tests:

- every allowed transition
- every rejected transition
- duplicate start and stop commands
- cancellation during connecting, recording, and finalizing
- event ordering and correlation IDs
- snapshot consistency after every transition

Exit gate:

- no real microphone or provider dependency
- all state-machine tests deterministic
- Core tests use only a fake Voice Engine

### Wave 2.2: Browser Capture and Binary Transport

Tasks:

- implement a single AudioWorklet capture path
- keep ScriptProcessor only as a separately tested compatibility fallback
- add bounded renderer-to-main and main-to-Core audio transport
- implement backpressure, stale-frame rejection, and capture disposal
- converge keyup, window blur, and explicit cancel into one stop intent

Required tests:

- repeated keydown does not start capture twice
- stop and dispose release every audio resource
- renderer reload releases the previous capture owner
- queue limits prevent unbounded memory growth
- no audio frame uses the request-response command channel

Exit gate:

- only one live MediaStream and AudioContext
- no provider or transcript policy in the renderer

### Wave 2.3: Xunfei PTT Adapter

Tasks:

- migrate only the verified Xunfei signing, parsing, reservation, and segment
  behavior
- keep one reusable RTASR connection for repeated PTT cycles
- stop real microphone upload on release
- send bounded silence frames to finalize a segment
- wait for final or stable transcript before accepting text
- keep the session for 30 seconds before idle shutdown

Required tests:

- provider parser fixtures
- connection reservation and release grace
- `10800` retry timing
- audio buffering before connection readiness
- PTT segment finalization
- duplicate final-result suppression
- disconnect and reconnect with bounded buffered audio

Exit gate:

- repeated PTT uses one expected provider connection
- second and later PTT cycles remain valid
- provider details exist only in the adapter package

### Wave 2.4: Continuous Mode and TTS Coordination

Tasks:

- add continuous listening policy as a Voice Engine strategy
- suspend ASR upload during TTS without releasing the microphone unnecessarily
- resume the existing capture resource after TTS
- implement interruption and barge-in through Voice Engine events
- share no mutable flags between PTT and continuous strategies

Required tests:

- mode switching while idle and active
- TTS suspend and resume
- barge-in interruption
- continuous-mode inactivity and reconnection
- PTT overlay on an already-running continuous session

Exit gate:

- PTT and continuous mode share one engine and one capture owner
- no duplicate connection or microphone owners

### Wave 2.5: Electron Acceptance and Stability

Tasks:

- add Playwright microphone-permission and keyboard scenarios
- add deterministic audio fixture playback
- add provider fault injection
- record connection counts, startup time, memory, and recovery time
- update phase 2 result documentation and actual UI screenshot

Required acceptance:

- 100 consecutive PTT cycles with zero application failures
- no Xunfei `10800 over max connect limit`
- expected ASR WebSocket count throughout the run
- renderer reload does not leave a microphone owner behind
- provider disconnect recovers without restarting Electron
- Core or Core Host restart leaves the main window alive
- no sustained memory growth beyond the agreed soak threshold

## Test Pyramid

```text
State machine and parser unit tests
          |
Mock capture/provider integration tests
          |
Core Host and Supervisor process tests
          |
Electron Playwright voice workflows
          |
100-cycle PTT and long-run stability tests
```

Real provider tests must be opt-in and must redact all URLs, query strings,
headers, IDs, and credentials from output.

## Automation Policy

The phase 2 automation runs one bounded change set per wake:

1. Read this plan, `phase-2-progress.md`, Git status, and the latest test result.
2. Select only the first incomplete task in the active wave.
3. Make a narrowly scoped implementation or test change.
4. Run targeted tests plus dependency boundaries.
5. Update `phase-2-progress.md` with evidence and the next task.
6. Notify only on a wave gate, a blocker, a security concern, or completion.

The automation must pause when:

- the phase 0/1 rollback point is missing
- an operation would modify Bailongma or Jarvis-ui
- credentials appear in output or a tracked file
- a dependency boundary would be crossed
- a test remains failing after the current repair attempt
- a real provider test needs user permission
- phase 2 exit conditions are complete

The automation must never enter phase 3.

## Recommended Schedule

Use a heartbeat every two minutes. Voice builds and Electron tests commonly
take longer than 30 seconds, so a two-minute interval reduces duplicate wakeups
while keeping the project moving.

Keep the automation paused until the baseline rollback marker is approved.
