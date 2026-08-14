# OpenAI-Compatible Heavy Planner Fixture-Only Implementation

Recorded: 2026-08-07

## Status

`FIXTURE_ONLY_IMPLEMENTED`

This implements the approved provider-neutral OpenAI-compatible Heavy Planner
fixture layer. It does not authorize or perform credential configuration,
secure-store access, network/API calls, provider runtime activation, UI/IPC,
telemetry, defaults, installer/update, packaging, release behavior, or direct
action execution.

## Implementation

Added:

- `packages/inference-adapter-openai-planner/src/openai-compatible.ts`;
- `packages/inference-adapter-openai-planner/test/openai-compatible.test.ts`.

Updated:

- `packages/inference-adapter-openai-planner/src/index.ts`.

## Fixed Default-Off Profiles

The registry contains fixed default-off OpenAI-compatible profiles:

- `heavy-planner.openai-compatible.openai`
  - profile: `openai.gpt-4.1-mini`;
  - model candidates: `gpt-4.1-mini`.
- `heavy-planner.openai-compatible.deepseek`
  - profile: `deepseek.v4-flash`;
  - model candidates: `deepseek-v4-flash`, `deepseek-v4-pro`.
- `heavy-planner.openai-compatible.qwen`
  - profile: `qwen.flash`;
  - model candidates: `qwen-flash`, `qwen-plus`, `qwen-turbo`.
- `heavy-planner.openai-compatible.glm`
  - profile: `glm.4.7-flash`;
  - model candidates: `glm-4.7-flash`, `glm-4.7-flashx`.

All profiles record:

- runtime default enabled: `false`;
- exact runtime approval required: `true`;
- credential configured: `false`;
- credential access approved: `false`;
- network access approved: `false`;
- health diagnostic approved: `false`;
- Heavy Planner acceptance approved: `false`.

## Fixture Contracts

The fixture layer adds:

- OpenAI-compatible Chat Completions request normalization;
- JSON-object response mode;
- bounded output token metadata;
- fixture-only transport interface;
- bounded BrainPlannerResult parsing;
- null-to-undefined normalization for optional `plan` and `clarifyQuestion`;
- provider-id matching;
- direct action rejection;
- allowed-tool validation against both global and request-local tool lists;
- sanitized HTTP, transport, invalid-output, and unsafe-output classifications.

The implementation does not include a fetch transport, credential object,
secure-store path, environment variable gate, runner, health diagnostic, or
acceptance window.

## Verification

Executed locally with no credential, secure-store, network, runtime, Electron,
UI/IPC, telemetry, or provider API access:

```powershell
npm.cmd run build:inference-adapter-openai-planner
npx.cmd vitest run packages/inference-adapter-openai-planner/test/openai-compatible.test.ts packages/inference-adapter-openai-planner/test/provider.test.ts
```

Results:

- OpenAI planner adapter build passed;
- focused OpenAI-compatible fixture and existing OpenAI provider tests passed:
  `15`.

## Next Boundary

The next implementation wave may optionally add Core Host fixture-only
composition for this registry. It still must not add credentials,
secure-store, network/API calls, provider activation, UI/IPC, telemetry,
defaults, installer/update, packaging, release behavior, or real diagnostics
without a new exact-scope approval.
