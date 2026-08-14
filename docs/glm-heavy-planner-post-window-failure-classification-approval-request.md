# GLM Heavy Planner Post-Window Sanitized Failure Classification Approval Request

Recorded: 2026-08-07

## Status

`COMPLETED_FIXTURE_ONLY_NO_RUNTIME`

The second approved GLM runtime window is consumed. It made three bounded
provider calls, returned `degraded`, and completed credential cleanup. This
fixture-only diagnostic hardening is complete. It did not configure or load a
credential, start Electron, access a network, or authorize a third runtime
window.

## Requested Approval Text

```text
Product: APPROVE exactly this GLM Heavy Planner post-window sanitized failure-classification implementation scope, with no runtime rerun, fixed provider/model preserved, bounded evidence only, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this fixture-only, fail-closed GLM failure-classification scope with no credential, secure-store, Electron, network, endpoint, model, raw provider diagnostic, persistence, or side-effect access; retain only fixed sanitized categories and counts

Release: APPROVE implementation and fixture evidence only; no runtime, default/UI/IPC/telemetry/installer/update/release changes
```

## Recorded Approvals

```text
Product: APPROVE exactly this GLM Heavy Planner post-window sanitized failure-classification implementation scope, with no runtime rerun, fixed provider/model preserved, bounded evidence only, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this fixture-only, fail-closed GLM failure-classification scope with no credential, secure-store, Electron, network, endpoint, model, raw provider diagnostic, persistence, or side-effect access; retain only fixed sanitized categories and counts

Release: APPROVE implementation and fixture evidence only; no runtime, default/UI/IPC/telemetry/installer/update/release changes
```

## Exact Implementation Scope

Implement only offline, fixture-backed changes in the GLM runtime adapter,
acceptance-runner evidence path, and their focused tests:

- classify a rejected fetch operation into fixed sanitized transport categories
  using only non-secret error shape, never message text, stack, URL, header,
  request id, account detail, or provider body;
- retain `PROVIDER_FAILED` and `PROVIDER_EXECUTION_FAILED` at the existing
  `BrainPlannerResult` contract boundary, preserving current Core Host
  fallback behavior;
- add acceptance-evidence-only counters and categories for bounded transport
  observations such as timeout, connection failure, and unknown transport
  failure;
- preserve the existing fixed HTTP status categories without exposing response
  bodies;
- make the runner distinguish a missing planner result, an unavailable planner
  result, an invalid result, and a blocked unsafe result with fixed reason
  labels instead of `PLANNER_RESULT_UNCLASSIFIED` where enough bounded state is
  available;
- add fixture-only regressions for timeout, connection, unknown transport,
  HTTP classification, invalid/unsafe result aggregation, no raw diagnostic
  leakage, maximum three-call accounting, and default-off/Qwen-rules fallback
  preservation; and
- update the consumed-window evidence documentation with the new diagnostic
  vocabulary and explicit non-retroactive limitation.

## Required Boundaries

This work must not:

- load, configure, clear, migrate, inspect, or expose a GLM or OpenAI
  credential;
- start Electron or access `safeStorage`;
- make a fetch, socket, DNS, HTTP, endpoint, model, or provider request;
- change `heavy-planner.glm`, `glm-4.7`, origin, request payload, timeout,
  output bound, prompt set, fallback policy, or Core Host product wiring;
- persist diagnostics, raw prompts, request bodies, responses, headers,
  error messages, stack traces, private paths, account data, or user data;
- execute a tool, browser, app, shell, filesystem operation, Memory write, or
  any planner result;
- alter UI/IPC, telemetry, defaults, installer, update, packaging, release,
  or tester count; or
- authorize a third runtime attempt.

## Acceptance Evidence

The implementation may report only fixed category labels, booleans, and
bounded counters. It must prove:

- `credentialExposed=false`;
- `networkAccessed=false`;
- `realApiCalled=false`;
- `directActionAttempted=false`;
- Qwen/rules fallback remains enabled for unavailable, invalid, unsafe, and
  failed planner results; and
- sensitive-artifact and dependency-boundary guards remain green.

After this fixture-only scope is approved and verified, any third GLM API
window requires a separate exact-scope Product, Security, and Release
approval that fixes the same provider/model and incorporates the new
sanitized diagnostic evidence.

## Implementation Evidence

Implemented without a real provider call:

- `FetchGlmRuntimeHeavyPlannerTransport` now replaces rejected fetch errors
  with a fixed-message transport error carrying only `timeout`, `connection`,
  or `unknown`;
- the GLM provider still maps every transport rejection to the existing
  bounded `PROVIDER_FAILED` / `PROVIDER_EXECUTION_FAILED` planner contract;
- the one-window runner now reports only bounded transport counts
  (`timeout`, `connection`, `unknown`) and fixed HTTP category counts
  (`authenticationRejected`, `rateLimited`, `modelUnavailable`,
  `providerUnavailable`);
- acceptance sample evidence now distinguishes `missing`, `unavailable`,
  `blocked_unsafe`, and `other` planner-result states with fixed reason and
  failure labels; and
- no raw fetch error, response, header, endpoint, request id, credential, or
  provider diagnostic is recorded.

Verification passed in `C:\Users\Administrator\Documents\Jarvis-k`:

- `npm.cmd run build:inference-adapter-glm-runtime`;
- `npm.cmd run build:core-host`;
- `npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts`:
  `13 passed`;
- `npx.cmd vitest run apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts`:
  `1 passed`;
- `npm.cmd run smoke:acceptance:heavy-planner:glm`;
- `npm.cmd run check:boundaries`;
- `npm.cmd run check:sensitive-artifacts`; and
- `git diff --check`.

No credential, secure store, Electron process, network request, endpoint,
model runtime, direct action, UI/IPC, telemetry, default, or release surface
was used or changed. A third runtime attempt remains explicitly unauthorized
until new exact-scope Product, Security, and Release approval is recorded.
