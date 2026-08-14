# OpenAI-Compatible Heavy Planner Fixture-Only Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED`

This is a new exact-scope approval request for a provider-neutral
OpenAI-compatible Heavy Planner fixture-only implementation.

The goal is to stop building one-off GLM-specific runtime paths and introduce
a shared adapter/profile layer for OpenAI-compatible Chat Completions
providers such as OpenAI, DeepSeek, Qwen/DashScope, and GLM. This scope is
implementation and fixture evidence only. It does not authorize real API
calls, network access, credential configuration, secure-store access, provider
runtime activation, UI/IPC exposure, telemetry, installer/update, packaging,
release-channel, or default behavior changes.

## Background

GLM evidence is now sufficient to stop rerunning the same path:

- `coding_paas_v4 / glm-4.7` Heavy Planner diagnostics timed out;
- `standard_paas_v4 / glm-4.7` health reached provider quickly but returned
  `finishReasonShape=length` and `contentShape=empty_string`;
- compact `standard_paas_v4 / glm-4.7 / 128` health timed out;
- fixture-only provider/model strategy deprioritized `glm-4.7` and selected
  `glm-4.7-flash` only as a future exact-approved low-latency candidate.

The better product direction is a provider-neutral OpenAI-compatible planner
layer so Jarvis-K can add DeepSeek, Qwen, OpenAI, or GLM profiles behind one
bounded contract instead of copying one-off provider logic.

## Exact Approval Text

```text
Product: APPROVE exactly this provider-neutral OpenAI-compatible Heavy Planner fixture-only implementation scope with default-off fixed provider profiles for openai, deepseek, qwen, and glm candidates, bounded BrainPlan output only, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded fail-closed OpenAI-compatible Heavy Planner fixture-only scope with no credential, secure-store, network, endpoint request, model runtime, raw provider diagnostic, UI/IPC, telemetry, persistence, or side-effect access; sanitized profile metadata, schema validation, and tests only

Release: APPROVE implementation and fixture evidence only; no real API/runtime/cache/provider activation/default/UI/IPC/telemetry/installer/update/packaging/release-channel changes
```

Approval was recorded exactly as above. The fixture-only implementation passed
under this scope. It does not authorize provider runtime behavior, credential
handling, secure-store access, network/API calls, UI/IPC, telemetry, defaults,
installer/update, packaging, release-channel, or release behavior.

## Fixed Scope

Allowed fixture-only implementation:

- add a provider-neutral OpenAI-compatible planner profile registry;
- add fixed default-off provider profile metadata for:
  - `heavy-planner.openai-compatible.openai`;
  - `heavy-planner.openai-compatible.deepseek`;
  - `heavy-planner.openai-compatible.qwen`;
  - `heavy-planner.openai-compatible.glm`;
- record sanitized profile fields only:
  - provider id;
  - provider family;
  - profile id;
  - approved status: false;
  - default enabled: false;
  - credential configured: false;
  - network approved: false;
  - model candidates as fixed strings;
  - endpoint origin labels or fixed public base URLs only when already
    public/provider-documented;
- add fixture-only request/response normalization contracts for
  OpenAI-compatible Chat Completions;
- add fail-closed JSON extraction and BrainPlan validation boundaries;
- add provider-neutral failure classes for unavailable, timeout, auth/rate,
  invalid JSON, invalid BrainPlan, unsafe plan, and unsupported output shape;
- add fixture provider tests proving:
  - no real network/API call;
  - no credential/secure-store access;
  - no raw prompt/provider response persistence;
  - direct action execution remains false;
  - Qwen/rules fallback remains preserved;
  - every profile remains default-off and exact-approval gated.

## Explicit Non-Goals

This scope must not:

- configure, store, read, validate, migrate, or expose real API credentials;
- access Electron `safeStorage` or any OS credential store;
- call OpenAI, DeepSeek, Qwen/DashScope, GLM, Anthropic, Volcengine, or any
  other network/API endpoint;
- start model runtimes, helpers, caches, lifecycle activation, or background
  sessions;
- run health diagnostics, planner acceptance, runtime windows, or real
  provider probes;
- add provider settings UI, IPC, preload APIs, telemetry, analytics, installer,
  updater, packaging, release-channel, or product-default changes;
- execute tools, browser actions, local apps, shell/process actions,
  filesystem actions, Memory writes, vector writes, OCR, voice, or any side
  effect;
- make DeepSeek, Qwen, OpenAI, GLM, or any cloud provider the default planner;
- persist raw prompts, raw responses, request headers, credentials, tokens,
  endpoint overrides, private paths, stack traces, user-private data, hidden
  reasoning, vectors, logits, or model internals.

## Gates

Before any implementation is considered complete:

- exact Product/Security/Release approval is recorded in this document;
- implementation touches only fixture/provider-neutral planner surfaces;
- no credential/secure-store/network/runtime import path is introduced;
- package boundaries remain green;
- sensitive artifact guard remains green;
- focused fixture tests prove all providers are default-off and gated;
- Core Host behavior remains unchanged unless fixture-only composition tests
  explicitly prove Qwen/rules fallback preservation without runtime execution;
- `git diff --check` passes.

## Stop Conditions

Stop immediately if implementation would require:

- real credentials or secure storage;
- a real HTTP/network call;
- endpoint probing;
- provider activation;
- a diagnostic runner;
- a UI/IPC/settings surface;
- direct action execution;
- Memory/vector writes;
- telemetry or release behavior changes;
- raw prompt/response persistence;
- broad provider expansion beyond fixed fixture metadata.

## Expected Fixture Evidence

The final evidence should include only:

- scope id;
- status: `passed`, `blocked`, or `degraded`;
- provider profile count;
- fixed provider ids;
- fixed model candidate counts;
- default-off booleans;
- real API/network/credential flags all false;
- raw prompt/response persistence flags false;
- fallback-preserved flag;
- focused test count;
- fixed reason codes.

## Next Step After Approval

After all three exact approval lines are recorded, implement the fixture-only
OpenAI-compatible profile registry, request/response normalization contracts,
fixture planner adapter, and focused tests. Do not add real API calls,
credential storage, runtime diagnostics, UI/IPC, telemetry, defaults, or
release behavior.

## Implementation Evidence

Implemented:

- `packages/inference-adapter-openai-planner/src/openai-compatible.ts`;
- `packages/inference-adapter-openai-planner/test/openai-compatible.test.ts`;
- package export in `packages/inference-adapter-openai-planner/src/index.ts`;
- implementation evidence document:
  `docs/openai-compatible-heavy-planner-fixture-only-implementation.md`.

Verification:

```powershell
npm.cmd run build:inference-adapter-openai-planner
npx.cmd vitest run packages/inference-adapter-openai-planner/test/openai-compatible.test.ts packages/inference-adapter-openai-planner/test/provider.test.ts
```

Results:

- OpenAI planner adapter build passed;
- focused OpenAI-compatible fixture and existing OpenAI provider tests passed:
  `15`.

No credential, secure-store, network/API call, runtime activation, UI/IPC,
telemetry, default behavior, installer/update, packaging, release behavior, or
direct action execution was added.
