# Chat Answer Product Manual Acceptance Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_STOPPED_SCOPE_EXIT_CLEANUP_COMPLETE`

This was a single developer-alpha desktop acceptance window for the completed
Chat Answer fixture-only product loop. All three exact approvals were recorded
on 2026-08-08.

The desktop session started with the approved fixture-only environment and a
fresh temporary local Memory DB. Before any fixed text input was accepted, a
voice input attempt reached the intentionally unconfigured ASR boundary. Voice
capture was explicitly outside this text-only window, so the window was
stopped immediately. No ASR provider configuration, credential, secure-store,
network, model, planner, vector retrieval, or direct action path was used.
The desktop process exited and the temporary DB was removed.

The purpose is to verify that a normal text input can travel through the
existing desktop UI, BrainCommand spine, bounded fixture answer provider, and
existing result projection without activating a real provider or any direct
action path.

## Exact Scope

- one Jarvis-K desktop session;
- explicit `JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER=1` opt-in;
- existing text BrainCommand input only;
- one newly created temporary file-backed local Memory DB for the session's
  bounded ordinary conversation records;
- at most three fixed benign inputs:
  - one ordinary question expecting `answered`;
  - one underspecified question expecting `clarify`;
  - one blocked question expecting `blocked`;
- existing BrainCommand result, safety, session-history, and rollback-view
  projection only;
- optional local browser speech-synthesis playback after an `answered` result,
  only after explicit user opt-in;
- sanitized visible observation notes only; and
- verified temporary DB cleanup before the window closes.

## Explicit Exclusions

The window must not:

- configure, load, inspect, copy, or expose any credential or secure-store
  record;
- call OpenAI, DeepSeek, Qwen, GLM, Volcengine, Xunfei, or any network
  endpoint;
- enable Heavy Planner, Qwen runtime, model lifecycle, helper, cache, or
  inference runtime;
- activate ASR or microphone capture;
- perform Memory vector/provider retrieval, Memory schema migration, or
  persistent Memory retention;
- open a browser, local application, shell, PowerShell process, filesystem
  target, or other tool side effect outside the temporary DB lifecycle;
- collect raw prompt, raw answer, raw provider diagnostic, transcript,
  credentials, private paths, or screenshots as evidence;
- add UI/IPC, telemetry, default, installer, update, packaging, or release
  behavior; or
- treat fixture output as a real model answer.

## Preconditions

Before opening the session:

- the fixture-only implementation evidence remains green;
- no provider, planner, model, ASR, or diagnostic environment flags are set;
- the temporary Memory DB path is newly created and outside the repository;
- the desktop build is current;
- local TTS is initially disabled; and
- the session starts with no prior acceptance records.

## Controlled Procedure After Approval

From the repository root, use one attached terminal:

```powershell
$env:JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER = "1"
npm.cmd run build
npm.cmd run start
```

In the single desktop session:

1. Submit one ordinary text question and verify a bounded `answered` result.
2. Submit one underspecified text question and verify a bounded
   `clarify` result with no answer content.
3. Submit one blocked text question and verify blocked status, no direct action,
   and the existing safety/rollback projection.
4. Optionally enable local result TTS and play only the completed safe result.
5. Clear the temporary session/Memory state, close the desktop, remove the
   temporary DB, and unset the environment variable.

Stop immediately if any provider, credential, network, model, tool, raw
persistence, or prohibited side effect is observed. The window is consumed
after this one session. A rerun or any scope expansion requires a new
exact-scope approval.

## Accepted Evidence

Retain only:

- window status and accepted boolean;
- fixed input count and result-label counts;
- `answered`, `clarify`, and `blocked` classifications;
- temporary DB created/cleared/removed status;
- local TTS disabled/played/unavailable classification;
- `directActionAttempted=false`;
- `credentialExposed=false`;
- `networkAccessed=false`;
- `modelRuntimeAccessed=false`;
- `memoryVectorAccessed=false`;
- `rawProviderResponsePersisted=false`;
- `defaultBehaviorChanged=false`;
- `uiIpcBehaviorChanged=false`;
- `telemetryChanged=false`; and
- `releaseBehaviorChanged=false`.

## Role Approval Request

**Product:** Approve exactly this one-window Chat Answer Product local manual
acceptance scope using the existing text BrainCommand path, one temporary
file-backed local Memory DB, bounded fixture answers for answered/clarify/blocked
cases, existing safety/result projection, and explicitly enabled local result
TTS only after a completed safe result; no real provider or direct action
behavior.

**Security:** Approve exactly this bounded fail-closed Chat Answer manual
acceptance window with no credential or secure-store access, no network,
provider, planner, model, ASR, vector retrieval, tool, or external side
effect; at most three fixed benign BrainCommand inputs, one temporary local
Memory DB with verified cleanup, no raw prompt/answer/provider evidence, and
local speech synthesis only after explicit opt-in.

**Release:** Approve developer-alpha Chat Answer manual acceptance evidence
only; no real provider runtime, credential UI/storage, default behavior,
UI/IPC expansion, telemetry, installer/update, packaging, or release-channel
changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window Chat Answer Product local manual acceptance scope using the existing text BrainCommand path, one temporary file-backed local Memory DB, bounded fixture answers for answered/clarify/blocked cases, existing safety/result projection, and explicitly enabled local result TTS only after a completed safe result; no real provider or direct action behavior

Security: APPROVE exactly this bounded fail-closed Chat Answer manual acceptance window with no credential or secure-store access, no network, provider, planner, model, ASR, vector retrieval, tool, or external side effect; at most three fixed benign BrainCommand inputs, one temporary local Memory DB with verified cleanup, no raw prompt/answer/provider evidence, and local speech synthesis only after explicit opt-in

Release: APPROVE developer-alpha Chat Answer manual acceptance evidence only; no real provider runtime, credential UI/storage, default behavior, UI/IPC expansion, telemetry, installer/update, packaging, or release-channel changes
```
