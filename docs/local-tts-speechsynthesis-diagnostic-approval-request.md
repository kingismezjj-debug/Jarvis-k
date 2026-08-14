# Local TTS SpeechSynthesis Diagnostic Approval Request

Recorded: 2026-08-08

## Status

`REPLACEMENT_APPROVED_NOT_STARTED`

This is a one-window developer-alpha diagnostic request for local browser TTS
only. It is intended to diagnose `window.speechSynthesis`,
`SpeechSynthesisUtterance`, the playback event chain, and manual audible output.
It does not approve microphone capture, ASR provider use, cloud planner use,
model runtime execution, Memory writes, or tool execution.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window local TTS speechSynthesis diagnostic scope using one visible Jarvis-K desktop session, one fixed benign local utterance, browser speechSynthesis/SpeechSynthesisUtterance availability checks, sanitized voice-count and event-chain observation, and manual audible-output confirmation only, with no microphone, no ASR, no cloud planner, no model runtime, no Memory write/schema migration, no browser/local-app/shell/filesystem/process action beyond launching and closing this diagnostic desktop session, and no new direct action behavior

Security: APPROVE exactly this bounded fail-closed local TTS diagnostic window with no credential, secure-store, microphone, ASR provider, network, model runtime, raw provider diagnostic, raw transcript, Memory write, vector retrieval, telemetry, or tool side-effect access; use one fixed benign utterance only, retain only sanitized speechSynthesis capability/event/status categories and manual heard/not-heard output classification, and stop immediately on any prohibited behavior

Release: APPROVE developer-alpha local TTS diagnostic evidence only; no default behavior, no planner/model/voice-provider enablement, no persistent telemetry, installer/update, packaging, or release-channel changes
```

The exact approvals above were recorded on 2026-08-08. The intended Jarvis-K
desktop diagnostic window was not started and is not consumed. Preflight found
that a full Jarvis-K desktop launch hydrates SQLite Memory through Core Host,
which may initialize schema and conflicts with the approved no Memory
write/schema scope. A separate renderer-only diagnostic approval is required to
test browser `speechSynthesis` without loading Core, Memory, secure-store,
voice, planner, or model runtime.

## Replacement Renderer-Only Approval

```text
Product: APPROVE exactly this replacement one-window renderer-only local TTS diagnostic scope using one temporary Electron renderer page under the Jarvis-K workspace, one fixed benign local utterance, speechSynthesis/SpeechSynthesisUtterance availability checks, sanitized voice-count and event-chain observation, manual audible-output confirmation, and verified temporary diagnostic-file cleanup only, with no Jarvis-K Core Host, no Memory, no secure-store, no microphone, no ASR, no cloud planner, no model runtime, and no new direct action behavior

Security: APPROVE exactly this bounded fail-closed renderer-only local TTS diagnostic window with one temporary diagnostic file, no credential, secure-store, microphone, ASR provider, network, model runtime, Memory, vector retrieval, telemetry, raw transcript, or tool side-effect access; retain only sanitized speechSynthesis capability/event/status categories and manual heard/not-heard output classification, then verify cleanup

Release: APPROVE developer-alpha renderer-only local TTS diagnostic evidence only; no default behavior, no app UI/IPC changes, no planner/model/voice-provider enablement, no persistent telemetry, installer/update, packaging, or release-channel changes
```

The replacement approval was recorded on 2026-08-08. The renderer-only window
was opened once and closed cleanly.

## Replacement Window Outcome

- `speechSynthesis`: `available`
- `SpeechSynthesisUtterance`: `available`
- audible output: `heard`
- temporary diagnostic file cleanup: `verified`
- Jarvis-K Core Host: `not_loaded`
- Memory: `not_used`
- secure-store: `not_used`
- microphone / ASR: `not_used`
- planner / model runtime: `not_used`

## Fixed Window

- One visible desktop session.
- One fixed benign utterance such as `Jarvis-K local TTS diagnostic`.
- Check only:
  - `window.speechSynthesis` availability;
  - `SpeechSynthesisUtterance` availability;
  - available voice count bucket;
  - `speaking` / `pending` state transitions;
  - `onstart`, `onend`, and `onerror` event categories;
  - manual heard / not heard output classification.
- Output-device diagnosis is manual because browser speech synthesis does not
  expose a reliable app-level output-device routing API. Verify Windows default
  output device and app volume mixer separately without collecting device names
  as evidence.

## Prohibited Actions

Do not:

- start microphone capture or connect ASR;
- read, configure, rotate, inspect, paste, or expose credentials;
- call cloud planner, model runtime, provider diagnostics, or network APIs;
- write Memory, import/export Memory, activate vector/provider retrieval, or
  change any schema;
- invoke browser/local-app/shell/filesystem/process actions beyond opening and
  closing this diagnostic desktop session;
- persist raw utterance text beyond the fixed benign phrase or collect private
  device names, paths, credentials, transcripts, logs, or stack traces.

## Stop Conditions

Stop immediately, close the desktop session, and record only sanitized failure
categories if:

- `speechSynthesis` or `SpeechSynthesisUtterance` is unavailable;
- the event chain enters `error` or never leaves `speaking/pending`;
- playback cannot be canceled;
- the diagnostic would touch microphone, ASR, secure-store, planner, model,
  Memory write, network, telemetry, or a tool side effect;
- any default, installer/update, packaging, or release behavior would change.

## Accepted Evidence

Record only:

- `accepted`, `blocked`, or `degraded` window status;
- `speechSynthesis`: available/unavailable;
- `SpeechSynthesisUtterance`: available/unavailable;
- voice count bucket: zero/one/few/many;
- event chain: started/ended/error/timeout;
- audible output: heard/not_heard/not_tested;
- cancellation: available/unavailable;
- false flags for credential exposure, microphone, ASR, network, model runtime,
  Memory write, direct action, telemetry, default, and release changes.
