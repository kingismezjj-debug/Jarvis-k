# Provider-Backed Chat Answer DeepSeek Product Manual Acceptance Approval Request

Recorded: 2026-08-09

## Status

`DRAFT_PENDING_EXACT_APPROVAL`

This draft requests one separate developer-alpha desktop manual acceptance
window for the already accepted DeepSeek provider-backed Chat Answer runtime.
It is intended to validate the real desktop text interaction path on top of
the fixed accepted runtime without broadening provider scope or enabling any
new side effects.

## Exact Scope

- one Jarvis-K desktop session;
- the already accepted provider `chat-answer.openai-compatible.deepseek` only;
- fixed profile `deepseek.v4-flash.compact_json_object_256` only;
- one freshly configured secure-store credential for that provider only;
- existing text BrainCommand input only;
- one newly created temporary file-backed local Memory DB for bounded ordinary
  conversation records only;
- at most three fixed text inputs:
  - one benign product explanation question expecting `answered`;
  - one underspecified question expecting `clarify`;
  - one unsafe destructive request expecting `blocked`;
- existing BrainCommand result, safety, retry, rollback-view, and session
  projection only;
- optional local TTS playback only after a completed safe `answered` result;
- sanitized observation notes only; and
- verified credential cleanup and temporary DB cleanup before window close.

## Explicit Exclusions

The window must not:

- change provider, profile, model, endpoint, timeout, retry count, output
  bound, or prompt strategy;
- broaden beyond the accepted DeepSeek Chat Answer runtime into GLM, OpenAI,
  Qwen, planner, tool registry, browser, shell, local app, Memory vector,
  ASR, microphone, or model-lifecycle scope;
- persist raw prompt text, raw provider responses, hidden reasoning,
  credentials, headers, transport diagnostics, transcripts, screenshots, or
  private user content;
- enable direct action execution, tool dispatch, filesystem/process side
  effects beyond the temporary DB lifecycle, or any release behavior change;
- expose new UI/IPC, settings, telemetry, installer, update, packaging, or
  release-channel behavior; or
- consume more than one desktop window for this acceptance.

## Preconditions

Before opening the window:

- the accepted DeepSeek runtime closeout remains the active source of truth;
- the DeepSeek Chat Answer runtime build, Core Host build, and desktop build
  are current;
- no planner, voice, ASR, or unrelated provider flags are enabled;
- the temporary DB path is newly created and outside the repository;
- local TTS starts disabled;
- only the fixed DeepSeek provider credential is configured for this window;
- no previous acceptance process is still running; and
- stop conditions are understood before starting the session.

## Controlled Procedure After Approval

From the repository root, use one attached terminal:

```powershell
npm.cmd run configure:chat-answer:deepseek-credential

$env:JARVIS_K_ENABLE_CHAT_ANSWER_DEEPSEEK = "1"
$env:JARVIS_K_ENABLE_PROVIDER_BACKED_CHAT_ANSWER_PRODUCT_MANUAL_ACCEPTANCE = "1"
npm.cmd run build
npm.cmd run start
```

In the single desktop session:

1. Submit one benign product explanation question and verify an `answered`
   result through the provider-backed DeepSeek path.
2. Submit one underspecified text question and verify a bounded `clarify`
   result with no answer content.
3. Submit one unsafe destructive request and verify `blocked`, no direct
   action, and the existing safety/rollback projection.
4. Optionally enable local TTS and play only the completed safe `answered`
   result.
5. Close the session, clear the temporary DB, clear the DeepSeek credential,
   unset acceptance flags, and verify cleanup.

Stop immediately if any prohibited behavior, raw persistence, credential
exposure, provider-scope expansion, or unexpected side effect is observed.
This one window is consumed once opened. Any rerun or scope change requires a
fresh exact approval.

## Accepted Evidence

Retain only:

- window status and accepted boolean;
- the fixed three-input result summary;
- `answered`, `clarify`, and `blocked` classifications;
- `directActionAttempted=false`;
- `credentialExposed=false`;
- `rawProviderResponsePersisted=false`;
- `defaultBehaviorChanged=false`;
- `uiIpcBehaviorChanged=false`;
- `telemetryChanged=false`;
- `releaseBehaviorChanged=false`;
- temporary DB created/cleared/removed status;
- secure-store credential configured/cleared status; and
- local TTS disabled/played/unavailable classification.

## Role Approval Request

**Product:** Approve exactly this one-window provider-backed Chat Answer
DeepSeek product manual acceptance scope using the existing text BrainCommand
path, the already accepted `chat-answer.openai-compatible.deepseek /
deepseek.v4-flash.compact_json_object_256` runtime, one temporary file-backed
local Memory DB, existing safety/result projection, and optional local TTS
only after a completed safe answered result; no planner or direct action
behavior.

**Security:** Approve exactly this bounded fail-closed DeepSeek Chat Answer
manual acceptance window with secure-store-only credential loading for the
accepted provider, no raw prompt/response/reasoning persistence, no voice/ASR,
no planner, no tool execution, no Memory vector retrieval, no browser/local
app/shell/filesystem/process side effect beyond the temporary DB lifecycle,
sanitized observation evidence only, and verified credential plus DB cleanup.

**Release:** Approve developer-alpha DeepSeek Chat Answer manual acceptance
evidence only; no default provider enablement, no new UI/IPC or settings
surface, no telemetry, installer/update, packaging, or release-channel
changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this one-window provider-backed Chat Answer DeepSeek product manual acceptance scope using the existing text BrainCommand path, the already accepted chat-answer.openai-compatible.deepseek / deepseek.v4-flash.compact_json_object_256 runtime, one temporary file-backed local Memory DB, existing safety/result projection, and optional local TTS only after a completed safe answered result; no planner or direct action behavior

Security: APPROVE exactly this bounded fail-closed DeepSeek Chat Answer manual acceptance window with secure-store-only credential loading for the accepted provider, no raw prompt/response/reasoning persistence, no voice/ASR, no planner, no tool execution, no Memory vector retrieval, no browser/local app/shell/filesystem/process side effect beyond the temporary DB lifecycle, sanitized observation evidence only, and verified credential plus DB cleanup

Release: APPROVE developer-alpha DeepSeek Chat Answer manual acceptance evidence only; no default provider enablement, no new UI/IPC or settings surface, no telemetry, installer/update, packaging, or release-channel changes
```
