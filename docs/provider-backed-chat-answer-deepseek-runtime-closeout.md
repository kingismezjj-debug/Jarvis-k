# Provider-Backed Chat Answer DeepSeek Runtime Closeout

Recorded on 2026-08-09 after the approved developer-alpha one-window DeepSeek
Chat Answer runtime acceptance passed.

## Status

`DEVELOPER_ALPHA_RUNTIME_ACCEPTED`

The provider-backed DeepSeek Chat Answer runtime scope is closed for the
current approved developer-alpha window. The guarded OpenAI-compatible runtime
path, secure-store credential loading, bounded `ChatAnswerResult`
normalization, and one-window DeepSeek acceptance are now evidence-complete.

This closeout does not make DeepSeek Chat Answer default-on. It does not
authorize broader runtime windows, UI exposure, persistent telemetry,
installer/update changes, packaging changes, release-channel changes, or tool
execution.

## Closed Runtime Scope

The accepted scope included:

- provider `chat-answer.openai-compatible.deepseek`;
- fixed profile `deepseek.v4-flash.compact_json_object_256`;
- model `deepseek-v4-flash`;
- endpoint `https://api.deepseek.com/chat/completions`;
- secure-store-only credential loading with verified cleanup;
- one-window runtime gating through the Core Host composition helper;
- bounded JSON-only `ChatAnswerResult` output;
- fixture fallback preservation;
- no direct action, tool execution, Memory/vector, voice/ASR, telemetry, or
  release-behavior changes; and
- exactly three fixed acceptance prompts for `answered`, `clarify`, and
  `blocked`.

## Implementation Notes

The final accepted runtime path depended on:

- provider-neutral OpenAI-compatible Chat Answer parsing and normalization in
  `packages/inference-adapter-openai-chat-answer/src/openai-compatible.ts`;
- object/array/reasoning-content-safe fallback parsing for unstable provider
  response shapes;
- explicit fail-closed unsafe-output rejection and direct-action rejection;
- DeepSeek runtime request shaping and fixed prompt strategy in
  `packages/inference-adapter-glm-chat-answer-runtime/src/provider.ts`;
- few-shot runtime prompt examples that anchor benign answered, target-missing
  clarify, and destructive blocked behavior;
- Core Host runtime composition in
  `apps/core-host/src/openai-compatible-chat-answer-runtime-composition.ts`;
- secure credential storage in
  `apps/desktop/src/secure-chat-answer-provider-store.ts`; and
- one-window acceptance coverage in
  `tests/chat-answer-deepseek-one-window-api-acceptance.cjs`.

## Accepted Evidence

The final accepted DeepSeek runtime result was:

```json
{
  "scopeId": "deepseek-chat-answer-one-window-api-acceptance",
  "status": "passed",
  "accepted": true,
  "providerId": "chat-answer.openai-compatible.deepseek",
  "modelId": "deepseek-v4-flash",
  "profileId": "deepseek.v4-flash.compact_json_object_256",
  "strategyId": "compact_json_object_256",
  "promptCount": 3,
  "providerCallCount": 3,
  "networkApiCalled": true,
  "transportFailureCounts": {
    "timeout": 0,
    "connection": 0,
    "unknown": 0
  },
  "samples": [
    { "expectedStatus": "answered", "actualStatus": "answered", "passed": true },
    { "expectedStatus": "clarify", "actualStatus": "clarify", "passed": true },
    { "expectedStatus": "blocked", "actualStatus": "blocked", "passed": true }
  ],
  "cleanup": "complete",
  "reasonCodes": ["DEEPSEEK_CHAT_ANSWER_ACCEPTANCE_PASSED"]
}
```

Sanitized runtime timing from the accepted window:

- `answered`: 2986 ms;
- `clarify`: 1475 ms; and
- `blocked`: 1428 ms.

## Verification Summary

Implementation verification passed in
`C:\Users\Administrator\Documents\Jarvis-k`:

- `npx vitest run packages/inference-adapter-openai-chat-answer/test/openai-compatible.test.ts packages/inference-adapter-glm-chat-answer-runtime/test/provider.test.ts apps/core-host/test/openai-compatible-chat-answer-runtime-composition.test.ts apps/core-host/test/glm-chat-answer-runtime-composition.test.ts apps/desktop/test/secure-chat-answer-provider-store.test.ts`;
- `npm.cmd run build:inference-adapter-openai-chat-answer`;
- `npm.cmd run build:inference-adapter-glm-chat-answer-runtime`;
- `npm.cmd run build:core-host`; and
- `npm.cmd run build:desktop`.

The focused verification set reached 32 passing tests after the final parser
and runtime prompt hardening.

## Freeze Rules

After this closeout, do not:

- broaden the DeepSeek runtime beyond the fixed accepted profile;
- enable provider-backed Chat Answer by default in product traffic;
- expose the runtime through new UI/IPC or settings behavior without a fresh
  scoped approval;
- persist raw prompts, raw responses, hidden reasoning, headers, credentials,
  or provider diagnostics;
- add retries, streaming, tool execution, Memory/vector behavior, or release
  changes under this closeout; or
- treat this acceptance as approval for OpenAI, GLM, Qwen, or any other
  provider family.

## Next Route

The next reasonable product step is a separate product-facing manual
acceptance window that uses this already-accepted DeepSeek Chat Answer runtime
inside the desktop interaction path without expanding the provider scope.

Any broader runtime, UI, release, or additional provider work still requires a
fresh exact-scope approval.
