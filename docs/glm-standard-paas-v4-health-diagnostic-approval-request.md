# GLM Standard PAAS v4 Health Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`DEGRADED_INVALID_MINIMAL_RESPONSE_CONSUMED`

This request covers one minimal GLM provider latency/health diagnostic window
for Candidate A only:

- profile: `standard_paas_v4`;
- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model: `glm-4.7`.

It is separate from the prior `coding_paas_v4 / glm-4.7` timeout evidence. It
does not authorize GLM Heavy Planner acceptance, BrainPlan evaluation, flash
model testing, GLM-5-family testing, provider expansion beyond this fixed
profile, default changes, UI/IPC changes, telemetry, packaging, or release
behavior.

## Background

Prior evidence on the current `coding_paas_v4 / glm-4.7` path:

- fourth Heavy Planner diagnostic timed out on all three provider calls at
  `45000ms`;
- second minimal health diagnostic reached the provider network path once and
  timed out at `20007ms`;
- credential was loaded from secure storage and cleared;
- no raw request/response was retained;
- no direct action/default/UI/IPC/telemetry/release behavior changed.

Fixture-only strategy work then separated GLM profiles:

- `coding_paas_v4`: prior timeout evidence;
- `standard_paas_v4`: candidate profile using the documented Chat Completions
  endpoint.

The purpose of this window is to isolate origin behavior while preserving the
same model `glm-4.7`.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window GLM standard_paas_v4 provider latency/health diagnostic scope using fixed heavy-planner.glm / glm-4.7, fixed endpoint https://open.bigmodel.cn/api/paas/v4/chat/completions, one freshly configured secure-store credential, and one minimal non-planning JSON health prompt only, with no Heavy Planner acceptance, no BrainPlan evaluation, no flash/GLM-5 model testing, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded GLM standard_paas_v4 health diagnostic window with secure-store-only fresh credential loading, fixed standard_paas_v4 origin/model, at most one non-streaming network call, no retries, 20-second timeout, 64 max output tokens, no raw request/response/header/credential/transport diagnostic persistence, sanitized latency/category output only, verified credential cleanup, and executor-only side effects

Release: APPROVE developer-alpha GLM standard_paas_v4 health evidence only; no provider expansion, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. This authorizes the fixture/smoke
profile wiring, pre-run verification, fresh masked-terminal credential
configuration, and exactly one standard-origin health diagnostic window. It
does not authorize Heavy Planner acceptance, flash/GLM-5 model testing, or any
other GLM/API runtime attempt.

The approved standard-origin health diagnostic has now been consumed. It
reached the fixed standard endpoint once and returned before timeout, but the
sanitized local health parser classified the response as
`invalid_minimal_response`.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- one fresh masked terminal credential configured before the run and loaded
  only from secure storage;
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

## Explicit Non-Goals

This window must not:

- run `npm.cmd run acceptance:heavy-planner:glm`;
- use the prior `coding_paas_v4` endpoint;
- test `glm-4.7-flash`, `glm-4.7-flashx`, `glm-5-turbo`, `glm-5.2`, or any
  user-supplied model;
- enter `CoreRuntime` Heavy Planner acceptance;
- evaluate fixed Heavy Planner samples;
- parse, normalize, or accept a BrainPlan;
- use tools, functions, streaming, retries, browser/local app/shell/filesystem,
  Memory write, model lifecycle activation, Qwen runtime, or any executor;
- persist raw prompts, raw responses, request headers, credential material,
  provider messages, stack traces, private paths, endpoint override data, or
  transport diagnostics;
- expose UI/IPC/telemetry/product defaults;
- change installer, update, packaging, release channel, or release behavior.

## Required Fixture/Smoke Implementation Before Runtime

The existing health diagnostic runner currently uses the prior fixed runtime
endpoint. Before any real `standard_paas_v4` health run, implement
fixture/smoke-only profile wiring that proves:

- the `standard_paas_v4` endpoint resolves to exactly
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model is exactly `glm-4.7`;
- max output tokens is exactly `64`;
- timeout is exactly `20000ms`;
- the runner is still separate from Heavy Planner acceptance and CoreRuntime;
- no credential, secure-store, network/API request, UI/IPC, telemetry, or
  release behavior occurs during fixture/smoke verification;
- the prior `coding_paas_v4` profile remains recorded as evidence but is not
  used by this standard-origin diagnostic.

## Gates

All of these must pass before the one network call:

- exact Product/Security/Release approval text is recorded in this document;
- fixture/smoke profile wiring has passed;
- provider id is exactly `heavy-planner.glm`;
- profile id is exactly `standard_paas_v4`;
- endpoint is exactly
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id is exactly `glm-4.7`;
- secure storage is available;
- fresh credential is configured through the masked local terminal script;
- credential is loaded only from secure storage and not exposed;
- standard-origin one-window network access is explicitly approved;
- request count is zero;
- timeout is exactly `20000ms`;
- max output tokens is exactly `64`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat this standard-origin window
as consumed if:

- any gate fails;
- fixture/smoke profile wiring is not green;
- secure-store setup or cleanup is uncertain;
- request count would exceed one;
- endpoint differs from the fixed standard endpoint;
- model differs from `glm-4.7`;
- timeout would exceed `20000ms`;
- a retry would be attempted;
- a raw prompt/response/header/credential/diagnostic would be retained;
- a BrainPlan or Heavy Planner acceptance path would be touched;
- direct action/tool execution/default/UI/IPC/telemetry/release behavior would
  change;
- output is unsafe or contains credential-like material;
- final status cannot be reduced to one of the fixed sanitized labels.

## Controlled Procedure After Approval And Fixture/Smoke Wiring

Do not run these commands until the exact three approval lines above are
recorded and standard-origin fixture/smoke wiring passes.

Configure a fresh credential only from an attached terminal:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

Then run exactly one standard-origin latency/health diagnostic window:

```powershell
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_HEALTH_ONE_WINDOW_APPROVED = "1"
npm.cmd run diagnostic:heavy-planner:glm-standard-health
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_HEALTH_ONE_WINDOW_APPROVED
```

The GLM API key must be entered only into the masked local terminal prompt.
Never paste it into chat, command arguments, environment variables, files,
logs, docs, or UI fields.

## Pre-Run Verification Target

Before configuring the fresh credential or starting the real standard-origin
health window, run:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential configuration and no real GLM API/network call are authorized by
pre-run verification alone.

## Fixture/Smoke Implementation Evidence

Implemented standard-origin fixture/smoke wiring:

- health diagnostic profile selection:
  `packages/inference-adapter-glm-runtime/src/health-diagnostic.ts`;
- standard profile metadata:
  `packages/inference-adapter-glm-runtime/src/model-origin-strategy.ts`;
- health diagnostic tests:
  `packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts`;
- standard-origin runner:
  `tests/glm-standard-paas-v4-health-diagnostic.cjs`;
- standard-origin smoke:
  `tests/glm-standard-paas-v4-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-standard-health`;
  - `smoke:diagnostic:heavy-planner:glm-standard-health`.

The standard-origin runner is gated by:

- `JARVIS_K_ENABLE_HEAVY_PLANNER_GLM=1`;
- `JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_HEALTH_ONE_WINDOW_APPROVED=1`.

The runner uses the fixed `standard_paas_v4` endpoint and rejects any request
whose URL differs from:

`https://open.bigmodel.cn/api/paas/v4/chat/completions`

It remains separate from Heavy Planner acceptance and CoreRuntime.

## Pre-Run Evidence

Executed before fresh credential configuration or any standard-origin real
health/API call:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- GLM runtime adapter build passed;
- desktop build passed;
- focused GLM provider/health/model-origin tests passed: `37`;
- standard-origin health smoke passed with `acceptanceRunnerUsed=false`,
  `coreRuntimePlannerActivated=false`, `credentialExposed=false`, and
  `networkAccessApproved=false`;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- whitespace diff check passed.

No credential was configured and no real GLM API/network call was made during
fixture/smoke wiring or pre-run verification.

## One-Window Result

The approved `standard_paas_v4 / glm-4.7` health diagnostic was executed once
with a freshly configured secure-store credential and the fixed minimal
non-planning health request.

Sanitized result summary:

- final status: `degraded`;
- accepted: `false`;
- diagnostic status: `invalid_minimal_response`;
- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- model id: `glm-4.7`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- timeout: `20000ms`;
- max output tokens: `64`;
- secure store available: `true`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared after run: `true`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1788`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: `false`;
- cleanup: `complete`;
- reason code: `GLM_STANDARD_HEALTH_INVALID_MINIMAL_RESPONSE`.

Interpretation:

- the standard Open Platform Chat Completions origin is reachable from this
  environment for the fixed `glm-4.7` health request;
- this result strongly separates the prior timeout evidence from the standard
  origin candidate;
- the remaining failure is local minimal-response normalization, not transport
  timeout, connection failure, authentication rejection, rate limit, model
  unavailable, or provider unavailable;
- no raw response was retained, so any parser hardening must be fixture-only
  and based on bounded anticipated Chat Completions response shapes rather than
  pasted provider output;
- do not rerun this health diagnostic under the same approval. Any further real
  GLM/API attempt requires a new exact-scope Product/Security/Release
  approval.

Recommended next step:

- perform fixture-only standard-origin health parser normalization for bounded
  GLM Chat Completions response variants, without credential, secure-store,
  network/API, raw provider diagnostics, UI/IPC, telemetry, or release behavior.

## Fixture-Only Parser Normalization

Implemented after the consumed standard-origin health window:

- source:
  `packages/inference-adapter-glm-runtime/src/health-diagnostic.ts`;
- tests:
  `packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts`.

Normalization now accepts bounded successful Chat Completions health variants:

- `status`: `ok`, `healthy`, `ready`, `success`, `successful`, `passed`, or
  `available`;
- boolean success flags: `ok`, `healthy`, `ready`, `success`, `available`, or
  `alive`;
- nested objects under `result`, `data`, `output`, `response`, or `health`;
- object-valued assistant `content` in fixture tests;
- missing assistant `role` only when the message remains otherwise safe;
- prefixed text containing a single JSON object.

The parser still fails closed for:

- tool calls or function calls;
- `directActionAttempted=true`;
- execution-shaped output;
- secret-like content;
- unsupported statuses such as `planned`;
- malformed or oversized content.

Verification:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Results:

- GLM runtime adapter build passed;
- health/model-origin tests passed: `31`;
- focused GLM provider/health/model-origin/offline tests passed: `53`;
- standard-origin health smoke passed;
- dependency boundary guard passed;
- sensitive artifact guard passed.

No credential was configured, no secure store was accessed, no GLM API/network
call was made, no raw provider output was used, and no UI/IPC/telemetry/release
behavior changed. A new exact-scope Product/Security/Release approval is
required before any real standard-origin health rerun.

## Expected Interpretation

- `healthy` within 20 seconds means the documented standard Chat Completions
  origin is reachable for a tiny `glm-4.7` response, but it does not prove
  Heavy Planner acceptance will pass.
- `timeout` means timeout remains present even on the standard origin with the
  same model; the next model strategy should move to a separately approved
  flash/low-latency candidate or provider alternative.
- HTTP auth/rate/model/provider categories should guide remediation without
  retaining provider body text.
- `blocked_preflight` means the local gates did not reach provider latency
  testing, and another attempt would require a new exact-scope approval.
