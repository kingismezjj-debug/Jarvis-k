# Provider-Backed Chat Answer Controlled Real Runtime Activation Evidence

Recorded: 2026-08-09

## Status

`ACCEPTED_ONE_FIXED_ANSWERED_CALL`

The one-window provider-backed Chat Answer controlled real runtime activation
completed successfully. The existing default-off Settings Chat Answer control
was enabled after the DeepSeek credential was configured in secure storage.
The fixed benign text BrainCommand produced a bounded answered result through
the accepted DeepSeek Chat Answer runtime.

Accepted runtime:

- provider: `chat-answer.openai-compatible.deepseek`;
- profile: `deepseek.v4-flash.compact_json_object_256`;
- model: `deepseek-v4-flash`;
- endpoint: `https://api.deepseek.com/chat/completions`;
- timeout: `30000` ms;
- max output tokens: `256`; and
- max provider calls in this window: `1`.

## Sanitized Result

```json
{
  "scopeId": "provider-backed-chat-answer-controlled-real-runtime-activation",
  "status": "accepted_one_fixed_answered_call",
  "accepted": true,
  "providerId": "chat-answer.openai-compatible.deepseek",
  "profileId": "deepseek.v4-flash.compact_json_object_256",
  "fixedInputCount": 1,
  "providerCallCount": 1,
  "expectedStatus": "answered",
  "actualStatus": "answered",
  "answerCategory": "bounded_jarvis_k_product_explanation",
  "settingsControlState": "enabled_runtime_armed",
  "textBrainCommandUsed": true,
  "credentialLoadedFromSecureStore": true,
  "credentialExposed": false,
  "networkAccessed": true,
  "plannerUsed": false,
  "voiceAsrUsed": false,
  "memoryVectorRetrievalUsed": false,
  "toolExecutionUsed": false,
  "directActionAttempted": false,
  "rawPromptPersisted": false,
  "rawRequestPersisted": false,
  "rawProviderResponsePersisted": false,
  "rawReasoningPersisted": false,
  "rawHeaderPersisted": false,
  "fallbackPreserved": true,
  "reasonCodes": [
    "CHAT_ANSWER_CONTROLLED_REAL_RUNTIME_ACTIVATION_ACCEPTED",
    "CHAT_ANSWER_DEEPSEEK_ONE_FIXED_ANSWERED_CALL"
  ]
}
```

Fixed input:

```text
Answer in one short sentence: what is Jarvis-K?
```

Sanitized visible answered result category:

```text
Jarvis-K supervised local assistant runtime for bounded approval-gated desktop assistance.
```

## Environment Verification

Read-only verification after the accepted result showed the old provider
acceptance environment gates were still disabled:

```json
{
  "providerFileExists": true,
  "realRuntimeEnv": false,
  "productManualEnv": false,
  "expandedLoopEnv": false
}
```

`providerFileExists=true` reflects the user-configured secure-store credential
record required for this controlled Settings activation. The credential value
was not exposed or persisted in evidence.

## Implementation Verification

Before the manual window, these checks passed:

```powershell
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/desktop/test/supervisor.test.ts apps/desktop/test/chat-answer-product-mode-source.test.ts apps/core-host/test/provider-backed-chat-answer-manual-acceptance-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts
```

Results:

- contracts build passed;
- core build passed;
- core-host build passed;
- UI build passed;
- desktop build passed; and
- focused tests passed: `7` test files, `136` tests.

## Disposition

This one-window controlled real runtime activation is consumed and accepted
for developer-alpha evidence. It does not approve default provider enablement,
production settings behavior, planner behavior, voice/ASR, Memory vector
retrieval, tool execution, persistent telemetry, installer/update, packaging,
or release-channel changes.
