# GLM Provider Latency/Health Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`BLOCKED_PREFLIGHT_CONSUMED_NO_NETWORK`

This request is separate from GLM Heavy Planner acceptance. It exists only to
diagnose whether the fixed GLM provider path can return a minimal health
response within a bounded latency window.

This request does not authorize a fifth GLM Heavy Planner acceptance rerun,
planner output evaluation, CoreRuntime planning, tool execution, product
enablement, provider expansion, UI/IPC changes, telemetry, or release behavior.

## Background

The fourth GLM Heavy Planner diagnostic window was consumed with
`status=degraded`: three approved provider calls were made and all three timed
out. Offline fixture-only analysis then reduced the future GLM planner request
shape:

- `max_tokens`: `1024 -> 512`;
- largest fixed request body: `1009 -> 898` bytes;
- total fixed request body bytes across three prompts: `2946 -> 2613`;
- system prompt chars: `494 -> 384`.

The remaining unresolved question is provider/endpoint latency or health, not
BrainPlan parsing. This diagnostic window answers only that narrow question.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window GLM provider latency/health diagnostic scope using fixed heavy-planner.glm / glm-4.7 and one minimal non-planning JSON health prompt only, with no Heavy Planner acceptance, no BrainPlan evaluation, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded GLM provider latency/health diagnostic window with secure-store-only fresh credential loading, one fixed origin/model, at most one non-streaming network call, no retries, 20-second timeout, no raw request/response/header/credential/transport diagnostic persistence, sanitized latency/category output only, verified credential cleanup, and executor-only side effects

Release: APPROVE developer-alpha GLM provider latency/health evidence only; no provider expansion, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. The diagnostic runner and fixture/smoke
coverage exist. The approved one-window health attempt was started once, but it
blocked during preflight because no GLM secure-store credential was configured.
No network request was made.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- fixed GLM Chat Completions origin/profile only;
- one fresh masked terminal credential loaded only from secure storage;
- exactly one minimal non-planning JSON health prompt;
- at most one non-streaming provider call;
- no retries;
- timeout: `20000ms`;
- response format: JSON object;
- temperature: `0`;
- max output tokens: `64`;
- accepted diagnostic statuses only:
  - `healthy`;
  - `timeout`;
  - `connection_failed`;
  - `http_authentication_rejected`;
  - `http_rate_limited`;
  - `http_model_unavailable`;
  - `http_provider_unavailable`;
  - `invalid_minimal_response`;
  - `unavailable`;
  - `blocked_preflight`.

The fixed prompt must not ask for a plan, tool selection, command execution,
Memory access, browser/local-app use, filesystem/process/shell access, or
private diagnostics. It should ask only for a tiny JSON object proving the
provider can return a response.

## Explicit Non-Goals

This window must not:

- run `npm.cmd run acceptance:heavy-planner:glm`;
- enter `CoreRuntime` Heavy Planner acceptance;
- evaluate `planned`, `clarify`, or `blocked` BrainPlannerResult samples;
- parse or normalize a BrainPlan;
- use tools, functions, streaming, retries, browser/local app/shell/filesystem,
  Memory write, model lifecycle activation, Qwen runtime, or any executor;
- persist raw prompts, raw responses, request headers, credential material,
  provider messages, stack traces, private paths, or transport diagnostics;
- expose UI/IPC/telemetry/product defaults;
- change installer, update, packaging, release channel, or release behavior.

## Sanitized Evidence

The diagnostic may retain only:

- provider id and model id;
- whether all approval/preflight gates passed;
- secure store availability;
- credential configured: boolean;
- credential exposed: always `false`;
- credential cleared: boolean;
- request count: `0` or `1`;
- network attempted: boolean;
- elapsed milliseconds bucketed or exact local duration;
- timeout category count;
- connection category count;
- fixed HTTP category count;
- final sanitized status label;
- cleanup status;
- prohibited-surface booleans:
  - direct action;
  - default behavior;
  - CoreRuntime planner activation;
  - UI/IPC;
  - telemetry;
  - release behavior.

No raw request or response content may be retained, even if the provider returns
a valid JSON object.

## Gates

All of these must pass before the one network call:

- exact Product/Security/Release approval text is recorded;
- GLM provider id is exactly `heavy-planner.glm`;
- GLM model id is exactly `glm-4.7`;
- fixed GLM origin/profile is selected;
- secure storage is available;
- fresh credential is configured and not exposed;
- one-window network access is explicitly approved;
- request count is zero;
- timeout is exactly `20000ms`;
- max output tokens is exactly `64`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat the window as consumed if:

- any gate fails;
- secure-store setup or cleanup is uncertain;
- request count would exceed one;
- timeout would exceed `20000ms`;
- a retry would be attempted;
- a raw prompt/response/header/credential/diagnostic would be retained;
- a BrainPlan or Heavy Planner acceptance path would be touched;
- direct action/tool execution/default/UI/IPC/telemetry/release behavior would
  change;
- output is unsafe or contains credential-like material;
- final status cannot be reduced to one of the fixed sanitized labels.

## Controlled Procedure After Approval

Do not run these commands until the exact three approval lines above are
recorded and the diagnostic runner exists with fixture/smoke verification.

Configure a fresh credential only from an attached terminal:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

Run exactly one latency/health diagnostic window:

```powershell
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_HEALTH_ONE_WINDOW_APPROVED = "1"
npm.cmd run diagnostic:heavy-planner:glm-health
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_HEALTH_ONE_WINDOW_APPROVED
```

The GLM API key must be entered only into the masked local terminal prompt.
Never paste it into chat, command arguments, environment variables, files,
logs, docs, or UI fields.

## Expected Interpretation

- `healthy` within 20 seconds means the provider path is reachable, but it does
  not prove Heavy Planner acceptance will pass.
- `timeout` means the timeout bottleneck is present even for a tiny response;
  do not request another planner acceptance window without changing provider,
  model, origin, or timeout strategy under a separate approval.
- HTTP auth/rate/model/provider categories should guide credential/account/model
  remediation without retaining provider body text.
- Any `invalid_minimal_response` result means transport returned, but the
  minimal parser contract still needs fixture-only hardening before another
  health window.

## Pre-Implementation Verification Target

Before any real diagnostic run, implement and verify fixture/smoke coverage for:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core-host
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential configuration and no real GLM API/network call are authorized by
this draft or by fixture/smoke verification.

## Fixture/Smoke Implementation

Implemented:

- minimal health diagnostic request/result code:
  `packages/inference-adapter-glm-runtime/src/health-diagnostic.ts`;
- package export:
  `packages/inference-adapter-glm-runtime/src/index.ts`;
- fixture tests:
  `packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts`;
- Electron diagnostic runner:
  `tests/glm-provider-latency-health-diagnostic.cjs`;
- source-level smoke guard:
  `tests/glm-provider-latency-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-health`;
  - `smoke:diagnostic:heavy-planner:glm-health`.

The runner is separate from `acceptance:heavy-planner:glm` and does not import
CoreRuntime, BrainPlan, BrainPlannerResult, browser/local app/shell/filesystem
tool paths, UI/IPC, or telemetry surfaces.

The diagnostic runner is gated by:

- `JARVIS_K_ENABLE_HEAVY_PLANNER_GLM=1`;
- `JARVIS_K_HEAVY_PLANNER_GLM_HEALTH_ONE_WINDOW_APPROVED=1`.

Without those gates, it returns a sanitized blocked preflight result before a
network call.

## Fixture/Smoke Verification

Executed before any real health run:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-health
npm.cmd run build:core-host
npm.cmd run build:desktop
npm.cmd run check:sensitive-artifacts
npm.cmd run check:boundaries
```

Results:

- GLM runtime adapter build passed;
- focused GLM provider/offline/health tests passed: `33`;
- GLM health smoke passed with `acceptanceRunnerUsed=false`,
  `coreRuntimePlannerActivated=false`, `credentialExposed=false`, and
  `networkAccessApproved=false`;
- Core Host build passed;
- desktop build passed;
- sensitive artifact guard passed;
- dependency boundary guard passed.

No credential was configured and no real GLM API/network call was made during
implementation or fixture/smoke verification.

## One-Window Result

The approved GLM provider latency/health diagnostic was attempted once and
blocked before network access.

Sanitized result summary:

- final status: `blocked`;
- accepted: `false`;
- diagnostic status: `blocked_preflight`;
- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- timeout: `20000ms`;
- max output tokens: `64`;
- secure store available: `true`;
- credential configured: `false`;
- credential exposed: `false`;
- credential cleared: `false`;
- request count: `0`;
- network attempted: `false`;
- elapsed milliseconds: `0`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP auth/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: `false`;
- cleanup: `not_needed`;
- reason code: `GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING`.

Interpretation:

- the GLM provider latency/health path was not tested against the provider;
- this result does not say anything about GLM endpoint latency, authentication,
  rate limits, model availability, or response validity;
- the failure was local preflight only: secure storage was available, but no
  GLM credential was configured in it;
- according to the stop conditions in this approval, a gate failure stops the
  run and treats the one-window attempt as consumed;
- do not rerun the health diagnostic under this approval. A fresh exact-scope
  approval is required before another real GLM health/API attempt.
