# GLM Provider Latency/Health Second Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`DEGRADED_TIMEOUT_CONSUMED`

This is a new exact-scope approval request for one second GLM provider
latency/health diagnostic window. It is necessary because the first approved
health attempt was consumed as `blocked_preflight` before any network request:
secure storage was available, but no GLM credential was configured.

This request is not a GLM Heavy Planner acceptance rerun and does not authorize
BrainPlan evaluation, CoreRuntime planning, tool execution, product enablement,
provider expansion, UI/IPC changes, telemetry, installer/update, packaging, or
release behavior.

## Prior Health Attempt

The first GLM health diagnostic attempt ended with sanitized evidence:

- final status: `blocked`;
- diagnostic status: `blocked_preflight`;
- secure store available: `true`;
- credential configured: `false`;
- request count: `0`;
- network attempted: `false`;
- cleanup: `not_needed`;
- direct action/default/CoreRuntime planner/UI/IPC/telemetry/release behavior
  changed: `false`;
- reason code: `GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING`.

That result did not test GLM provider latency. It only proved the local
fail-closed credential gate.

## Exact Approval Text

```text
Product: APPROVE exactly this second one-window GLM provider latency/health diagnostic scope using fixed heavy-planner.glm / glm-4.7, one freshly configured secure-store credential, and one minimal non-planning JSON health prompt only, with no Heavy Planner acceptance, no BrainPlan evaluation, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded GLM provider latency/health diagnostic window with secure-store-only fresh credential loading, one fixed origin/model, at most one non-streaming network call, no retries, 20-second timeout, 64 max output tokens, no raw request/response/header/credential/transport diagnostic persistence, sanitized latency/category output only, verified credential cleanup, and executor-only side effects

Release: APPROVE developer-alpha second GLM provider latency/health evidence only; no provider expansion, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. This authorizes the pre-run
verification, fresh masked-terminal credential configuration, and exactly one
second GLM provider latency/health diagnostic window under the fixed scope
below. It does not authorize Heavy Planner acceptance or any other GLM/API
runtime attempt.

The second one-window health diagnostic has now been consumed. It reached the
provider network path once and timed out after the fixed 20-second window.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- fixed GLM Chat Completions origin/profile only;
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
- enter `CoreRuntime` Heavy Planner acceptance;
- evaluate fixed Heavy Planner samples;
- parse, normalize, or accept a BrainPlan;
- use tools, functions, streaming, retries, browser/local app/shell/filesystem,
  Memory write, model lifecycle activation, Qwen runtime, or any executor;
- persist raw prompts, raw responses, request headers, credential material,
  provider messages, stack traces, private paths, or transport diagnostics;
- expose UI/IPC/telemetry/product defaults;
- change installer, update, packaging, release channel, or release behavior.

## Gates

All of these must pass before the one network call:

- exact Product/Security/Release approval text is recorded in this document;
- GLM provider id is exactly `heavy-planner.glm`;
- GLM model id is exactly `glm-4.7`;
- fixed GLM origin/profile is selected;
- secure storage is available;
- fresh credential is configured through the masked local terminal script;
- credential is loaded only from secure storage and not exposed;
- second one-window network access is explicitly approved;
- request count is zero;
- timeout is exactly `20000ms`;
- max output tokens is exactly `64`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat this second window as
consumed if:

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
recorded.

Configure a fresh credential only from an attached terminal:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

Then run exactly one second latency/health diagnostic window:

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

## Pre-Run Verification

Before configuring the fresh credential or starting the second real health
window, run:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential configuration and no real GLM API/network call are authorized by
pre-run verification alone.

## Pre-Run Evidence

Executed before fresh credential configuration or any second real health/API
call:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- GLM runtime adapter build passed;
- desktop build passed;
- focused GLM provider/offline/health tests passed: `33`;
- GLM health diagnostic smoke passed with `acceptanceRunnerUsed=false`,
  `coreRuntimePlannerActivated=false`, `credentialExposed=false`, and
  `networkAccessApproved=false`;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- whitespace diff check passed.

No credential was configured and no real GLM API/network call was made during
pre-run verification.

## Expected Interpretation

- `healthy` within 20 seconds means the GLM provider path is reachable for a
  tiny response, but it does not prove Heavy Planner acceptance will pass.
- `timeout` means timeout remains present even for a tiny response; do not
  request another planner acceptance window without changing provider, model,
  origin, or timeout strategy under a separate approval.
- HTTP auth/rate/model/provider categories should guide remediation without
  retaining provider body text.
- `blocked_preflight` again means the local gates still did not reach provider
  latency testing, and another attempt would require a new exact-scope
  approval.

## Second One-Window Result

The approved second GLM provider latency/health diagnostic was executed once
with a freshly configured secure-store credential and the fixed minimal health
request.

Sanitized result summary:

- final status: `degraded`;
- accepted: `false`;
- diagnostic status: `timeout`;
- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- timeout: `20000ms`;
- max output tokens: `64`;
- secure store available: `true`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared after run: `true`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `20007`;
- transport timeout count: `1`;
- transport connection count: `0`;
- transport unknown count: `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: `false`;
- cleanup: `complete`;
- reason code: `GLM_PROVIDER_HEALTH_TIMEOUT`.

Interpretation:

- the local preflight and secure-store path worked;
- the credential was loaded only from secure storage and then cleared;
- the diagnostic reached the GLM provider network path exactly once;
- the fixed minimal non-planning health request did not complete inside the
  approved 20-second timeout;
- no HTTP auth/rate/model/provider category was observed because the request
  timed out before an HTTP response classification was available;
- this confirms that timeout is present even for the smallest approved GLM
  health probe, not only for Heavy Planner acceptance prompts;
- do not run another GLM health/API or Heavy Planner acceptance window under
  this approval. Any further real GLM attempt requires a new exact-scope
  Product/Security/Release approval and should consider provider/model/origin
  or timeout-strategy changes before another run.
