# Voice Mic / ASR / Local TTS Manual Acceptance Approval Request

Recorded: 2026-08-08

## Status

`REPLACEMENT_APPROVED_NOT_STARTED`

This is a one-window developer-alpha manual acceptance request for the
real voice input/output chain only: microphone capture, ASR transcript flow,
and local browser TTS playback. It does not approve cloud planner use,
model-runtime execution, Memory writes, or any new tool execution path.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window voice manual acceptance scope using the existing microphone capture, secure-store-backed ASR transcript, and local browser TTS chain only, with no cloud planner, no model runtime, no Memory write/schema migration, no browser/local-app/shell/filesystem/process action, and no new direct action behavior beyond the existing safe voice path

Security: APPROVE exactly this bounded fail-closed voice manual acceptance window with secure-store-only voice credential loading, no credential exposure, no cloud planner, no model runtime, no network/provider diagnostic outside the existing ASR provider path, no raw transcript/provider persistence, no Memory write, no browser/local-app/shell/filesystem/process action beyond the existing voice path, local browser speech-synthesis only after explicit opt-in, sanitized observation notes only, and immediate stop on any prohibited behavior

Release: APPROVE developer-alpha voice manual acceptance evidence only; no default behavior, no planner/model enablement, no persistent telemetry, installer/update, packaging, or release-channel changes
```

The exact approvals above were recorded on 2026-08-08. The window was not
started and is not consumed. Preflight verification passed, but source review
found that final ASR transcripts automatically dispatch to
`agent.runBrainCommand`, and that command persists user and assistant messages
through the active SQLite Memory repository. That conflicts with the approved
`no Memory write` scope. No desktop session, microphone capture, ASR provider
connection, TTS playback, planner, model runtime, or new credential action was
started under this approval.

Do not run the manual window under this approval. Use a replacement temporary
Memory DB approval or add a separately approved default-off transcript-dispatch
suppression gate before opening the real voice window.

## Replacement Temporary Memory Approval

```text
Product: APPROVE exactly this replacement one-window voice manual acceptance scope using the existing microphone capture, secure-store-backed ASR transcript, automatic final transcript BrainCommand dispatch into one newly created temporary local Memory DB only, and local browser TTS chain only, with no cloud planner, no model runtime, no vector/provider Memory retrieval, no browser/local-app/shell/filesystem/process action beyond that temporary DB, and no new direct action behavior beyond the existing safe voice path

Security: APPROVE exactly this bounded fail-closed replacement voice manual acceptance window with secure-store-only voice credential loading, no credential exposure, one temporary Memory DB for automatic final transcript BrainCommand records only, no raw transcript/provider evidence persistence, no cloud planner, no model runtime, no provider diagnostic outside the existing ASR provider path, no vector/provider Memory retrieval, verified temporary DB cleanup, local browser speech-synthesis only after explicit opt-in, sanitized observation notes only, and immediate stop on any prohibited behavior

Release: APPROVE developer-alpha replacement voice manual acceptance evidence only; no default behavior, no planner/model enablement, no persistent Memory retention, no persistent telemetry, installer/update, packaging, or release-channel changes
```

The replacement approval was recorded on 2026-08-08. It authorizes exactly one
desktop session with one temporary local Memory DB to absorb the existing
automatic final-transcript BrainCommand records. It does not authorize
provider/vector retrieval, cloud planner use, model runtime activation, or
direct action execution.

## Window Outcome

The replacement window was opened once and then closed cleanly.

- microphone capture: `started`
- ASR transcript: `finalized`
- local TTS: `enabled_but_silent`
- temporary Memory DB cleanup: `verified`
- planner/model runtime: `not_used`
- direct action: `not_attempted`

## Fixed Window

- One developer machine and one desktop session.
- Use the existing voice settings and push-to-talk controls only.
- Start with local TTS disabled.
- Use one benign spoken phrase to verify microphone capture and ASR transcript
  flow.
- Verify the transcript reaches the UI and finalizes.
- If a completed safe result is visible, enable local browser TTS from the UI
  and play it once, then stop playback.
- Close the desktop session after the window.

## Required Preconditions

Before opening the window:

- Desktop build and focused voice/UI checks remain green.
- No heavy-planner, Qwen, or local model runtime flags are set.
- No planner/provider diagnostic is active.
- The existing voice provider status is configured and visible in the UI, with
  secure-store-backed loading only.
- Local browser TTS is initially disabled and inactive.
- No Memory write, import/export, or schema change is part of the window.

## Prohibited Actions

Do not:

- expose any credential or export secure-store contents;
- call cloud planner, model runtime, or any provider diagnostic outside the
  existing ASR path;
- run a model artifact, lifecycle/cache operation, planner acceptance, or
  runtime helper;
- invoke browser/local-app/shell/filesystem/process actions;
- import/export Memory, create Memory content, write a vector, change a
  Memory schema, or retain raw history data;
- enable telemetry, packaging, installer, updater, or release behavior.

## Stop Conditions

Stop the window immediately, disable local TTS, close the desktop, and record
only a sanitized failure category if:

- microphone capture does not start or cannot be stopped cleanly;
- ASR transcript does not appear or finalizes invalidly;
- the voice path would reach cloud planner or model runtime;
- raw transcript/provider content would be persisted or collected;
- local TTS starts without explicit opt-in, cannot be canceled, or tries to
  use anything other than local browser speech synthesis;
- any default, UI/IPC contract, telemetry, installer/update, packaging, or
  release behavior changes.

This window is consumed after one session. Any rerun or expansion requires a
new exact-scope Product/Security/Release approval.

## Accepted Evidence

Record only:

- `accepted`, `blocked`, or `degraded` window status;
- microphone capture started / stopped classification;
- ASR transcript appeared / finalized classification;
- local TTS eligible / played / cancelled / unavailable classification;
- sanitized count metadata for capture frames, transcript updates, and TTS
  playback attempts;
- false flags for credential exposure, cloud planner, model runtime, Memory
  write, direct action, telemetry, default, and release changes.

## Controlled Procedure After Approval

1. Run the existing local verification before opening the desktop:

   ```powershell
   npm.cmd run build:contracts
   npm.cmd run build:core
   npm.cmd run build:core-host
   npm.cmd run build:ui
   npm.cmd run build:desktop
   npx.cmd vitest run packages/contracts/test/protocol.test.ts packages/voice/test/engine.test.ts apps/ui/test/app-voice-ui-source.test.ts
   npm.cmd run check:boundaries
   npm.cmd run check:sensitive-artifacts
   git diff --check
   ```

2. Start the desktop developer session without planner or model flags:

   ```powershell
   npm.cmd run start
   ```

3. In the desktop, open Voice Settings if needed, verify the provider status,
   press and hold Push to Talk, speak one benign phrase, and release.

4. Verify microphone capture, ASR transcript, and final transcript state. If
   a completed safe result is visible and local TTS is still disabled, enable
   it locally and play the result once, then stop playback.

5. Close the desktop session and record only the sanitized evidence listed
   above. Do not rerun the window under this approval.
