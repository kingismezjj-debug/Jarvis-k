# Chat Answer Product Manual Acceptance Second Window Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_STOPPED_SCOPE_EXIT_CLEANUP_COMPLETE`

The first Chat Answer manual acceptance window was consumed and stopped after
an out-of-scope voice/ASR attempt. This second approved window was also
stopped before any fixed text input was accepted after the same excluded ASR
path was triggered.

The window used the approved fixture-only environment and a fresh temporary
local Memory DB. No voice provider configuration, credential, secure-store,
network, model, planner, vector retrieval, direct action, or raw provider
content was used. The desktop process exited and the temporary DB was removed.

## Exact Scope

This window covers only:

- one Jarvis-K desktop session;
- the existing text input and `agent.runBrainCommand` path;
- explicit opt-in fixture Chat Answer provider:
  `JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER=1`;
- one newly created temporary file-backed local Memory DB;
- exactly three fixed text inputs:
  1. ordinary question -> `answered`;
  2. underspecified question -> `clarify`;
  3. blocked/action-shaped question -> `blocked`;
- existing BrainCommand safety, result, rollback, and UI projection;
- optional local browser speech-synthesis playback only after the completed
  `answered` result and explicit user opt-in; and
- verified temporary DB cleanup and process shutdown.

## Fixed Inputs

Use only these inputs, in this order:

1. `Explain the purpose of this project.`
2. `Why`
3. `Open PowerShell`

Expected labels:

- first: bounded fixture `answered`;
- second: bounded fixture `clarify`;
- third: existing safety-gated browser/local-app route blocked because the
  target is not allowlisted, with no process launch.

Do not use microphone capture, ASR, voice commands, planner prompts, Memory
recall prompts, browser actions, local-app actions, shell commands, or other
text.

## Security and Release Bounds

The window must not:

- access, configure, expose, or load credentials or secure-store records;
- call any network/provider endpoint;
- start Qwen, Heavy Planner, model lifecycle, helper, cache, or inference
  runtime;
- activate ASR or microphone capture;
- perform Memory vector/provider retrieval or any persistent Memory retention
  beyond the temporary DB's normal conversation records;
- execute browser, local-app, shell, PowerShell, filesystem, process, or
  network side effects;
- retain raw prompt, answer, provider diagnostic, transcript, private path, or
  screenshot evidence;
- add UI/IPC, telemetry, default, installer, update, packaging, or release
  behavior; or
- claim that the fixture result came from a real model.

Stop immediately if any prohibited path is reached. This window is consumed
after one session. Any rerun or scope expansion requires another exact-scope
Product/Security/Release approval.

## Controlled Procedure After Approval

From the repository root, use one attached terminal:

```powershell
Get-ChildItem Env:JARVIS_K_* -ErrorAction SilentlyContinue |
  Remove-Item -ErrorAction SilentlyContinue
$env:JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER = "1"
$env:JARVIS_K_MEMORY_DB_PATH = "$env:TEMP\jarvis-k-chat-answer-acceptance-second-20260808.sqlite"
$env:JARVIS_K_STAGE5_LOCAL_ACCEPTANCE_NO_SECURE_STORE = "1"
$env:JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS = "1"
npm.cmd run build
npm.cmd run start
```

The environment must remain limited to this window. After the three inputs and
optional TTS observation:

```powershell
Get-Process electron -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "*\Jarvis-k\node_modules\electron\dist\electron.exe" } |
  Stop-Process
[System.IO.File]::Delete("$env:TEMP\jarvis-k-chat-answer-acceptance-second-20260808.sqlite")
Get-ChildItem Env:JARVIS_K_* -ErrorAction SilentlyContinue |
  Remove-Item -ErrorAction SilentlyContinue
```

## Accepted Sanitized Evidence

Retain only:

- scope id, status, and accepted boolean;
- fixed input count and result-label counts;
- temporary DB created/removed status;
- local TTS `disabled`, `played`, or `unavailable`;
- `directActionAttempted=false`;
- `credentialExposed=false`;
- `secureStoreAccessed=false`;
- `networkAccessed=false`;
- `modelRuntimeAccessed=false`;
- `memoryVectorAccessed=false`;
- `rawProviderResponsePersisted=false`;
- `defaultBehaviorChanged=false`;
- `uiIpcBehaviorChanged=false`;
- `telemetryChanged=false`; and
- `releaseBehaviorChanged=false`.

## Exact Approval Lines

```text
Product: APPROVE exactly this second one-window Chat Answer Product local manual acceptance scope using the existing text BrainCommand path, one temporary file-backed local Memory DB, exactly the three fixed text inputs with bounded fixture answered/clarify/blocked results, existing safety/result projection, and explicitly enabled local result TTS only after a completed safe answered result; no voice/ASR, real provider, or direct action behavior

Security: APPROVE exactly this second bounded fail-closed Chat Answer manual acceptance window with no credential or secure-store access, no voice/ASR, network, provider, planner, model, vector retrieval, or external side effect; exactly three fixed text BrainCommand inputs, one temporary local Memory DB with verified cleanup, no raw prompt/answer/provider evidence, and local speech synthesis only after explicit opt-in

Release: APPROVE developer-alpha second Chat Answer manual acceptance evidence only; no real provider runtime, credential UI/storage, voice/ASR enablement, default behavior, UI/IPC expansion, telemetry, installer/update, packaging, or release-channel changes
```
