# Provider-backed Chat Answer GLM Runtime Implementation Evidence

Date: 2026-08-08

## Approved Boundary

- provider: `chat-answer.openai-compatible.glm`;
- model: `glm-4.7`;
- endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- secure-store-only API credential loading;
- one explicitly approved network window;
- at most three fixed non-streaming calls;
- no retries;
- 20-second timeout per call;
- bounded JSON-only `ChatAnswerResult`;
- fixture fallback preserved;
- no direct action, tool, Memory, UI/IPC, telemetry, installer, update,
  packaging, or release behavior.

## Implemented

- Added `@jarvis-k/inference-adapter-glm-chat-answer-runtime` as a separate
  runtime package.
- Enforced the exact provider, model, and endpoint in the runtime transport.
- Reused the existing bounded Chat Answer parser and fail-closed unsafe-output
  normalization.
- Rejected tool/function-shaped responses and execution-shaped answer content.
- Added a separate encrypted desktop record:
  `jarvis-k-chat-answer-glm-provider.json`.
- Added an interactive-only credential configuration bridge:
  `configure:chat-answer:glm-credential`.
- Added a gated Core Host composition that creates the provider only after all
  explicit approval, credential, parser, bounds, fallback, and side-effect
  gates pass.
- Added the one-window runner:
  `acceptance:chat-answer:glm`.

## Verification

Passed:

- GLM Chat Answer runtime build;
- Core Host build;
- desktop build;
- 7 focused runtime/composition/secure-store tests;
- 17 boundary-script tests;
- dependency boundary guard;
- sensitive-artifact guard;
- non-interactive credential configuration rejection;
- acceptance preflight with missing approval gates.

The sanitized preflight result was blocked before credential access or network:

```json
{
  "status": "blocked",
  "accepted": false,
  "providerCallCount": 0,
  "networkApiCalled": false,
  "reasonCodes": [
    "GLM_CHAT_ANSWER_API_ACCEPTANCE_APPROVAL_GATE_MISSING"
  ]
}
```

No real Chat Answer API acceptance window was started by implementation
verification.
