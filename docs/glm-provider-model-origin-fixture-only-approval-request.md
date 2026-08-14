# GLM Provider/Model/Origin Fixture-Only Strategy Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTED_FIXTURE_ONLY`

This request covers fixture-only implementation of GLM provider/model/origin
strategy metadata after repeated timeout evidence on the current fixed
`heavy-planner.glm / glm-4.7 / api/coding/paas/v4` path.

It does not authorize credential configuration, secure-store access, network or
API calls, model runtime access, Heavy Planner acceptance, health diagnostic
execution, UI/IPC changes, telemetry, default behavior changes, packaging, or
release behavior.

## Background

Current evidence:

- fourth Heavy Planner diagnostic timed out on all three provider calls;
- second minimal health diagnostic reached the network once and timed out after
  `20007ms`;
- no raw request/response was retained;
- credential cleanup completed;
- no direct action/default/UI/IPC/telemetry/release behavior changed.

Public provider documentation indicates the standard Chat Completions endpoint
uses:

`https://open.bigmodel.cn/api/paas/v4/chat/completions`

Current Jarvis-K code uses:

`https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`

The next safe step is to separate GLM origin/model profiles in fixture-only
code before any further real GLM attempt.

## Exact Approval Text

```text
Product: APPROVE exactly this GLM provider/model/origin fixture-only strategy implementation scope with default-off profile metadata for current coding_paas_v4 evidence, standard_paas_v4 candidate origin, fixed GLM model candidates, and no runtime/API/health/Heavy Planner execution

Security: APPROVE exactly this bounded fail-closed GLM provider/model/origin fixture-only scope with no credential, secure-store, network, endpoint request, model runtime, raw provider diagnostic, UI/IPC, telemetry, persistence, or side-effect access; fixed sanitized profile metadata and tests only

Release: APPROVE implementation and fixture evidence only; no provider runtime enablement, default behavior, installer/update, packaging, telemetry, UI/IPC, or release-channel changes
```

Approval was recorded exactly as above. This approval authorizes fixture-only
profile metadata and tests. It does not authorize any credential, secure-store,
network/API, health diagnostic, Heavy Planner acceptance, runtime default, UI,
IPC, telemetry, packaging, or release behavior.

## Fixed Scope

Allowed:

- add fixture-only GLM profile metadata;
- record current prior-evidence profile:
  - `coding_paas_v4`;
  - `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`;
  - model `glm-4.7`;
- add candidate profile:
  - `standard_paas_v4`;
  - `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
  - model `glm-4.7`;
- add candidate model metadata for later approvals, such as
  `glm-4.7-flash`, `glm-4.7-flashx`, `glm-5-turbo`, and `glm-5.2`;
- add deterministic fixture tests for profile resolution and forbidden
  surfaces;
- update documentation and handoff.

Prohibited:

- no credential configuration;
- no secure-store load/save/clear;
- no fetch/socket/DNS/HTTP/network request;
- no health diagnostic execution;
- no Heavy Planner acceptance;
- no CoreRuntime planner activation;
- no model runtime/helper/cache/artifact access;
- no UI/IPC/telemetry/default/release behavior;
- no user-supplied endpoint or model override;
- no runtime fallback, failover, or automatic provider selection.

## Acceptance Criteria

- Current timeout evidence remains traceable to `coding_paas_v4 / glm-4.7`.
- The next candidate profile resolves to the documented standard origin:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`.
- Candidate model ids are fixed allowlisted strings.
- Runtime provider defaults remain unchanged until a separate exact runtime
  approval.
- Smoke/source tests prove the fixture-only strategy code does not call fetch,
  secure storage, Electron, CoreRuntime, or acceptance/diagnostic runners.

## Verification Target

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No real GLM/API/runtime/cache/artifact action is authorized by this approval
request.

## Implementation Evidence

Implemented fixture-only metadata:

- source:
  `packages/inference-adapter-glm-runtime/src/model-origin-strategy.ts`;
- export:
  `packages/inference-adapter-glm-runtime/src/index.ts`;
- tests:
  `packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts`.

Profiles:

- `coding_paas_v4`
  - status: `prior_timeout_evidence`;
  - endpoint:
    `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`;
  - model: `glm-4.7`;
  - runtime/network/credential/health/acceptance approvals: all `false`.
- `standard_paas_v4`
  - status: `candidate`;
  - endpoint:
    `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
  - default candidate model: `glm-4.7`;
  - additional fixed candidates:
    `glm-4.7-flash`, `glm-4.7-flashx`, `glm-5-turbo`, `glm-5.2`;
  - runtime/network/credential/health/acceptance approvals: all `false`.

No runtime provider default was changed. The existing runtime constants remain
the prior-evidence `coding_paas_v4 / glm-4.7` path until a separate exact
runtime approval explicitly changes them.

## Verification Evidence

Executed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Results:

- GLM runtime adapter build passed;
- model/origin strategy tests passed: `5`;
- focused GLM provider/health/offline/model-origin tests passed: `38`;
- dependency boundary guard passed;
- sensitive artifact guard passed.

No credential, secure store, network/API request, model runtime, health
diagnostic execution, Heavy Planner acceptance, UI/IPC, telemetry, persistence,
or release behavior was touched.
