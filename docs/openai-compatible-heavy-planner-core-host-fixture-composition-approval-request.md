# OpenAI-Compatible Heavy Planner Core Host Fixture Composition Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTED_VERIFIED_FIXTURE_ONLY`

The required Product, Security, and Release approvals were recorded on
2026-08-08. Core Host fixture-only composition of the provider-neutral
OpenAI-compatible Heavy Planner layer is implemented and verified.

The OpenAI-compatible fixture layer is already implemented in
`packages/inference-adapter-openai-planner/src/openai-compatible.ts`. It
contains default-off profile metadata and fixture-only request/response
normalization for OpenAI, DeepSeek, Qwen/DashScope, and GLM-compatible
profiles. This request would allow Core Host to select and compose that layer
in fixture-only tests while preserving Qwen/rules fallback and without
activating any real provider.

## Exact Approval Text

```text
Product: APPROVE exactly this Core Host fixture-only OpenAI-compatible Heavy Planner composition scope with default-off profile selection for openai/deepseek/qwen/glm candidates, bounded BrainPlan output only, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded fail-closed Core Host OpenAI-compatible Heavy Planner fixture composition scope with no credential, secure-store, network, endpoint request, model runtime, raw provider diagnostic, UI/IPC, telemetry, persistence, or side-effect access; sanitized composition reports and tests only

Release: APPROVE implementation and fixture evidence only; no real API/runtime/cache/provider activation/default/UI/IPC/telemetry/installer/update/packaging/release-channel changes
```

The approval was recorded exactly as above before implementation. The
implementation remains fixture-only and does not authorize a runtime provider.

## Fixed Scope

Allowed fixture-only implementation:

- add a Core Host composition helper for OpenAI-compatible fixture profiles;
- accept only fixed profile ids already defined in the fixture registry;
- build a sanitized composition report with:
  - provider id;
  - profile id;
  - provider family;
  - selected model id;
  - default-off status;
  - exact-approval-required status;
  - credential/network/runtime flags all false;
  - fallback-preserved status;
  - fixed reason codes;
- optionally return a fixture provider only when explicitly enabled through
  fixture-only function arguments in tests;
- add tests proving:
  - profile selection works for DeepSeek/Qwen/OpenAI/GLM fixture profiles;
  - all profiles remain default-off and exact-approval gated;
  - no secure-store, env, fetch, IPC, telemetry, or runtime path is imported;
  - Qwen/rules fallback remains preserved when composition is disabled,
    unsupported, or unavailable;
  - direct action attempted remains false.

## Explicit Non-Goals

This scope must not:

- configure, store, load, validate, migrate, or expose real credentials;
- access Electron `safeStorage` or any OS credential store;
- call any network/API endpoint;
- instantiate fetch transports;
- run health diagnostics, planner acceptance, runtime windows, or provider
  probes;
- activate DeepSeek, Qwen, OpenAI, GLM, or any cloud provider in normal Core
  Host startup;
- add or change env gates for real provider windows;
- expose UI/IPC/settings/preload surfaces;
- add telemetry, analytics, installer/update, packaging, release-channel, or
  default behavior changes;
- execute tools or permit planner output to bypass executor safety gates;
- persist raw prompts, raw responses, credentials, headers, endpoint overrides,
  private paths, stack traces, user-private data, hidden reasoning, vectors,
  logits, or model internals.

## Stop Conditions

Stop immediately if implementation would require:

- credential or secure-store access;
- fetch/network/API calls;
- real provider activation;
- diagnostic runner execution;
- UI/IPC/settings changes;
- telemetry or release behavior;
- direct tool execution;
- raw prompt/response persistence;
- broad provider expansion beyond fixed fixture metadata.

## Expected Evidence

Final fixture evidence should include only:

- scope id;
- status;
- selected fixture profile ids;
- profile count;
- provider ids;
- model ids;
- default-off booleans;
- exact-approval-required booleans;
- credential/network/runtime flags all false;
- fallback-preserved flag;
- direct-action-attempted flag false;
- focused test count;
- fixed reason codes.

## Implementation Evidence

Implemented:

- `apps/core-host/src/openai-compatible-heavy-planner-composition.ts`;
- `apps/core-host/test/openai-compatible-heavy-planner-composition.test.ts`.

The helper selects only the fixed registry profiles, defaults to
`deepseek.v4-flash` when no test profile is supplied, emits a sanitized
composition report, and constructs a provider only when every fixture-only
gate passes and an injected fixture transport is present. It has no
credential, secure-store, environment, network, endpoint, runtime, UI/IPC,
telemetry, persistence, or direct-action path.

Focused verification passed on 2026-08-08:

```powershell
npm.cmd run build:core-host
npx.cmd vitest run apps/core-host/test/openai-compatible-heavy-planner-composition.test.ts apps/core-host/test/openai-heavy-planner-composition.test.ts apps/core-host/test/glm-heavy-planner-composition.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results: Core Host build passed; 3 test files and 9 tests passed; dependency
boundaries, sensitive-artifact guard, and whitespace validation passed.

## Next Step

Keep all OpenAI-compatible provider profiles default-off. Any credential,
secure-store, network/API, health diagnostic, provider activation, or
runtime composition requires a new exact-scope Product/Security/Release
approval.
