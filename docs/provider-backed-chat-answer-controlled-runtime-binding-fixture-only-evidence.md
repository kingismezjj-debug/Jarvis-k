# Provider-Backed Chat Answer Controlled Runtime Binding Fixture-Only Evidence

Recorded: 2026-08-09

## Status

`IMPLEMENTED_FIXTURE_ONLY_RUNTIME_BINDING`

The default-off Settings product-mode control now connects to the Core Host
Chat Answer runtime selection path. The binding is intentionally fixture-only:
it can switch the in-memory Chat Answer provider id to the already accepted
DeepSeek profile, but the real runtime provider remains locked and no
credential is sent.

Accepted profile surfaced by the binding:

- provider: `chat-answer.openai-compatible.deepseek`;
- profile: `deepseek.v4-flash.compact_json_object_256`;
- model: `deepseek-v4-flash`; and
- endpoint: `https://api.deepseek.com/chat/completions`.

## Implemented Scope

- Added `CoreRuntime.configureChatAnswerProductMode(...)` for in-memory
  Chat Answer binding updates.
- Added a Desktop supervisor message:
  `chat-answer-product-mode.configure`.
- The supervisor message includes only sanitized control metadata:
  - product-mode enabled/disabled;
  - fixed provider id;
  - fixed profile id;
  - `runtimeLocked: true`; and
  - `credentialIncluded: false`.
- The Settings toggle now sends product-mode changes to Core through the
  supervisor.
- Core Host parses the product-mode message before ordinary command handling.
- When enabled, Core Host selects the DeepSeek Chat Answer provider id through
  the existing OpenAI-compatible runtime composition path while deliberately
  omitting credential and network approval.
- When disabled, Core Host restores the initial Chat Answer binding.

## Safety Disposition

The fixture-only binding keeps these invariants:

```json
{
  "credentialIncluded": false,
  "runtimeLocked": true,
  "networkWindowApproved": false,
  "realProviderRuntimeEnabled": false,
  "directActionAttempted": false,
  "fallbackPreserved": true
}
```

With product mode enabled but no runtime provider configured, `chat.answer`
fails closed as an unavailable DeepSeek Chat Answer result with fallback
preserved. No provider request is made, no endpoint is called, no raw prompt or
response is persisted, and no credential is exposed to the renderer or Core.

## Verification

Executed in `C:\Users\Administrator\Documents\Jarvis-k`:

```powershell
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
npx.cmd vitest run packages/core/test/runtime.test.ts apps/desktop/test/supervisor.test.ts apps/desktop/test/chat-answer-product-mode-source.test.ts apps/core-host/test/provider-backed-chat-answer-manual-acceptance-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts
```

Results:

- core build passed;
- core-host build passed;
- desktop build passed; and
- focused tests passed: `6` test files, `104` tests.

## Release Disposition

This is developer-alpha fixture-only implementation evidence. It does not
approve default provider enablement, real provider runtime activation,
network access, credential loading into Core, planner behavior, voice/ASR,
Memory vector retrieval, tool execution, telemetry, installer/update,
packaging, or release-channel changes.

## Next Step

The next step is a separate one-window manual acceptance request for the
controlled product-mode UI behavior. That window should verify that toggling
the Settings control changes the visible Chat Answer mode and preserves
fail-closed fallback without running the real provider.
