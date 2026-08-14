# Second GLM Chat Answer One-Window API Acceptance Approval Request

Recorded: 2026-08-09

## Status

`APPROVED_FOR_ONE_WINDOW`

This request opens one second and final currently proposed developer-alpha
Chat Answer API window. It follows the first fixed three-call window, which
verified credential handling, exact provider composition, network access,
blocked-result parsing, and cleanup, but degraded because two
ordinary/underspecified samples reached the fixed 20-second timeout.

The only runtime request-shaping change is the already verified offline
`compact_json_object_128` strategy. This request does not authorize a provider
change, model change, endpoint change, timeout increase, retry, wider prompt
set, UI/IPC change, default enablement, tool execution, Memory access, or
release behavior.

## Exact Runtime Scope

- provider: `chat-answer.openai-compatible.glm`;
- model: `glm-4.7`;
- endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- strategy: `compact_json_object_128`;
- one freshly configured developer credential loaded only from the dedicated
  OS-backed secure-store record;
- exactly three fixed sanitized prompt categories: specific benign answer,
  underspecified clarification, and unsafe execution request;
- at most three sequential, non-streaming provider calls;
- one attempt per prompt, with no retries;
- timeout: 20 seconds per call;
- response format: JSON object;
- temperature: `0`;
- maximum output: 128 tokens;
- output: bounded `ChatAnswerResult` only; and
- fixture fallback remains preserved with no direct action execution.

No additional provider, origin, model, profile, health diagnostic, cloud
planner, local model runtime, voice/ASR, TTS, Memory/vector access, browser,
local-app, shell, filesystem, process, tool, UI/IPC, telemetry, installer,
update, packaging, or release behavior is in scope.

## Prerequisite Evidence

- The first Chat Answer GLM window loaded its credential from the dedicated
  secure store without exposure and verified credential cleanup.
- All composition gates passed for the fixed provider, model, endpoint,
  parser, timeout/output bounds, default-off behavior, fixture fallback, and
  executor-only side effects.
- The first window made three calls; two sanitized transport timeouts were
  recorded, and the unsafe category returned a correctly parsed blocked
  result.
- The offline `compact_json_object_128` strategy reduces the output budget
  from 350 to 128 tokens and reduces the provider payload to the sanitized
  utterance only.
- Local verification passed focused runtime/composition/secure-store tests,
  builds, dependency-boundary checks, sensitive-artifact checks, and
  fail-closed preflight.

## Required Gates

Before any network call, all three temporary environment approvals must equal
`1`, and all of the following must pass:

- explicit Chat Answer GLM enablement;
- exact approved provider, model, endpoint, and strategy;
- available secure store;
- configured non-exposed credential;
- approved one-window network access;
- contract and parser readiness;
- 20-second/128-token bound readiness;
- default-off behavior preserved;
- fixture fallback preserved; and
- executor-only side effects preserved.

Any failed gate must produce sanitized blocked/unconfigured evidence with zero
provider calls and zero network access.

## Stop and Cleanup Conditions

The window is consumed after this one command, whether the outcome is passed,
degraded, or blocked. Do not continue to a third Chat Answer API attempt
without a new exact-scope approval.

Stop and mark the window degraded or blocked if:

- a gate fails;
- a credential would be exposed;
- any call exceeds its timeout;
- a response is invalid, unsafe, tool/function-shaped, execution-shaped, or
  cannot be normalized into the bounded result contract;
- a provider/model/endpoint/strategy mismatch occurs;
- the provider-call limit would be exceeded;
- fixture fallback or executor-only gates are not preserved;
- a prohibited surface would be accessed; or
- credential cleanup cannot be verified.

The runner must clear the temporary credential record after the window and
retain only sanitized counts, status labels, failure classes, gate booleans,
and cleanup state. It must not retain raw prompts, requests, responses,
headers, credentials, request IDs, stack traces, account metadata, or
transport details.

## Controlled Procedure After Approval

1. Configure one fresh credential from an attached terminal:

   ```powershell
   npm.cmd run configure:chat-answer:glm-credential
   ```

2. Run the approved window once:

   ```powershell
   $env:JARVIS_K_ENABLE_CHAT_ANSWER_GLM = "1"
   $env:JARVIS_K_CHAT_ANSWER_GLM_ONE_WINDOW_APPROVED = "1"
   $env:JARVIS_K_CHAT_ANSWER_GLM_ACCEPTANCE_APPROVED = "1"
   npm.cmd run acceptance:chat-answer:glm
   Remove-Item Env:JARVIS_K_ENABLE_CHAT_ANSWER_GLM
   Remove-Item Env:JARVIS_K_CHAT_ANSWER_GLM_ONE_WINDOW_APPROVED
   Remove-Item Env:JARVIS_K_CHAT_ANSWER_GLM_ACCEPTANCE_APPROVED
   ```

Do not paste a credential into chat, a command line, an environment variable,
or a file.

## Approval Lines To Record

```text
Product: APPROVE exactly this second one-window GLM Chat Answer API acceptance scope using fixed chat-answer.openai-compatible.glm / glm-4.7, fixed standard_paas_v4 Chat Completions origin, the offline-verified compact_json_object_128 strategy, the same fixed three sanitized prompt categories, bounded ChatAnswerResult output, fixture fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded chat-answer.openai-compatible.glm API window with secure-store-only fresh credential loading, fixed provider/model/origin/strategy, at most three non-streaming calls, one attempt per prompt, no retries, 20-second timeout, 128 max output tokens, no raw prompt/request/response/header/credential/transport persistence, sanitized evidence only, verified credential cleanup, fail-closed unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha second GLM Chat Answer runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/packaging/release changes
```

## Recorded Approval

Recorded: 2026-08-09

```text
Product: APPROVE exactly this second one-window GLM Chat Answer API acceptance scope using fixed chat-answer.openai-compatible.glm / glm-4.7, fixed standard_paas_v4 Chat Completions origin, the offline-verified compact_json_object_128 strategy, the same fixed three sanitized prompt categories, bounded ChatAnswerResult output, fixture fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded chat-answer.openai-compatible.glm API window with secure-store-only fresh credential loading, fixed provider/model/origin/strategy, at most three non-streaming calls, one attempt per prompt, no retries, 20-second timeout, 128 max output tokens, no raw prompt/request/response/header/credential/transport persistence, sanitized evidence only, verified credential cleanup, fail-closed unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha second GLM Chat Answer runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/packaging/release changes
```
