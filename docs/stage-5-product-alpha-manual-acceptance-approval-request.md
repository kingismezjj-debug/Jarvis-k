# Stage 5 Product Alpha Manual Acceptance Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_NOT_STARTED_PRECHECK_SCOPE_CONFLICT`

This is a one-window developer-alpha manual acceptance request for the
implemented Stage 5 product hardening surface. It is not a provider,
model-runtime, Memory-write, or real-tool-execution approval.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window Stage 5 Product Alpha local manual acceptance scope using the implemented text BrainCommand path only, bounded read-only Memory context projection, in-memory sanitized session history, blocked/degraded retry through the existing BrainCommand safety path, rollback-view clearing only, and explicitly enabled local result TTS only after a completed safe result; dangerous tools remain default-off and no new direct action behavior is introduced

Security: APPROVE exactly this bounded fail-closed Stage 5 local manual acceptance window with no credential or secure-store access, no cloud/model runtime/network path, no Memory write/schema migration, no raw provider prompt/response/session-history persistence, no browser/local-app/shell/filesystem/process action beyond existing safe fixture/replay behavior, local browser speech-synthesis only after explicit opt-in, sanitized observation notes only, and immediate stop on any prohibited behavior

Release: APPROVE developer-alpha local manual acceptance evidence only; no default behavior, real cloud provider or tool execution, persistent telemetry, installer/update, packaging, or release-channel changes
```

The exact approvals were recorded on 2026-08-08. The window has not started
and is not consumed: preflight found that ordinary `agent.runBrainCommand`
persists accepted user and assistant messages through the existing SQLite
Memory repository, which the recorded Security scope prohibits. No desktop
session, manual input, voice capture, TTS playback, provider/model runtime,
credential, or network path was started.

Do not run the manual window under this approval. Use the replacement
temporary-Memory approval request instead.

## Fixed Window

- One developer machine and one desktop session.
- Start with TTS disabled. Enable it only from General Settings after the
  non-TTS checks have passed.
- Use at most five manual inputs:
  1. one benign text status command;
  2. one read-only Memory recall/status command;
  3. one blocked or confirmation-required command;
  4. one retry of that blocked/degraded result through the Stage 5 retry
     control;
  5. one completed safe result with explicitly enabled local TTS playback,
     then stop playback or let the bounded playback finish.
- Clear the Stage 5 session history once and verify that only the in-memory
  structured history is removed.
- Observe only visible/sanitized UI state and existing local smoke/test
  output. Do not collect screenshots, recordings, raw transcripts, raw
  Memory content, provider output, credentials, logs, or private paths for
  evidence.
- Close the desktop session after the window. No persistence behavior is
  authorized beyond existing product behavior.

## Required Preconditions

Before opening the window:

- Stage 5 implementation and focused verification remain green.
- No heavy planner provider flag, credential configuration command, or
  provider diagnostic is active.
- Qwen/local-model runtime flags are unset.
- Do not start microphone capture, connect an ASR provider, or dispatch a
  final voice transcript. Live voice acceptance is outside this window and
  requires its own exact-scope approval.
- Browser/local-app action execution remains disabled or is demonstrably
  limited to existing fixture/replay behavior; this window must not approve an
  external browser/app launch.
- TTS is initially disabled and no speech synthesis is active.
- Session history is empty or explicitly cleared before the first input.
- Memory is treated read-only; no import/export/disable/rollback/write
  control is used in the window.

## Prohibited Actions

Do not:

- configure, load, inspect, copy, paste, rotate, or expose any credential;
- call OpenAI, DeepSeek, Qwen/DashScope, GLM, Volcengine, Xunfei, or another
  network/provider endpoint;
- run a model artifact, lifecycle/cache operation, provider health diagnostic,
  planner acceptance, or runtime helper;
- invoke browser/local-app/shell/filesystem/process actions, even if a visible
  command resembles one;
- import/export Memory, create Memory content, write a vector, change a
  Memory schema, or retain raw history data;
- enable telemetry, packaging, installer, updater, or release behavior.

## Stop Conditions

Stop the window immediately, disable local TTS, clear the in-memory session
history, and record only a sanitized failure category if:

- an action would leave fixture/replay or an existing explicitly safe local
  path;
- a cloud/provider, model, credential, secure-store, network, filesystem,
  process, or Memory-write path would be reached;
- raw text/transcript/Memory/provider content would be persisted or collected;
- retry does not re-enter the existing BrainCommand safety path;
- TTS starts without explicit opt-in, tries to use a cloud service, cannot be
  canceled, or occurs after a blocked/degraded result;
- any default, UI/IPC contract, telemetry, installer/update, packaging, or
  release behavior changes.

This window is consumed after one session. Any rerun, scope expansion, real
tool execution, cloud planner use, or model/provider runtime requires a new
exact-scope Product/Security/Release approval.

## Accepted Evidence

Record only:

- `accepted`, `blocked`, or `degraded` window status;
- completed/manual-step counts, capped at five inputs;
- confirmation that live voice capture/provider connection was not used;
- Memory context available/unavailable/not-requested classification and count;
- session-history count before and after clear;
- retry safety-path classification;
- rollback-view classification;
- TTS disabled/eligible/played/cancelled/unavailable classification;
- false flags for credential exposure, cloud/provider/model runtime, network,
  Memory write, direct action, telemetry, default, and release changes.

## Controlled Procedure After Approval

1. Run the existing local verification before opening the desktop:

   ```powershell
   npm.cmd run build:contracts
   npm.cmd run build:core
   npm.cmd run build:core-host
   npm.cmd run build:ui
   npm.cmd run build:desktop
   npx.cmd vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts
   npm.cmd run check:boundaries
   npm.cmd run check:sensitive-artifacts
   git diff --check
   ```

2. Start the existing desktop developer session without provider/model flags:

   ```powershell
   npm.cmd run start
   ```

3. Execute only the five fixed manual steps above. Keep TTS off until the final
   safe completed-result step, then turn it on locally and use only the
   displayed playback control.

4. Clear session history once, stop any playback, and close the desktop.

5. Record only the accepted sanitized evidence. Do not rerun the window under
   this approval.
