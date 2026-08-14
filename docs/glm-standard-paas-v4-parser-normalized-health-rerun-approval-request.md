# GLM Standard PAAS v4 Parser-Normalized Health Rerun Approval Request

Recorded: 2026-08-07

## Status

`CONSUMED_DEGRADED_INVALID_MINIMAL_RESPONSE`

This document records the approved and now-consumed exact-scope
parser-normalized rerun of the `standard_paas_v4 / glm-4.7` minimal health
diagnostic. The previous standard-origin window was consumed with a fast
provider response (`1788ms`) but local classification
`invalid_minimal_response`.

This window existed only to verify the fixture-only health parser
normalization against the same fixed standard-origin health probe.

It does not authorize GLM Heavy Planner acceptance, BrainPlan evaluation,
flash/GLM-5 model testing, provider expansion, prompt expansion, retries,
streaming, default changes, UI/IPC changes, telemetry, packaging, or release
behavior.

## Prior Evidence

The consumed standard-origin health window:

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1788`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- raw request/response persisted: `false`;
- diagnostic status: `invalid_minimal_response`.

Fixture-only parser normalization then added bounded support for anticipated
safe Chat Completions response variants while preserving fail-closed behavior
for unsafe, secret-like, tool/function, direct-action, malformed, oversized, or
planner-shaped output.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window parser-normalized GLM standard_paas_v4 health rerun using fixed heavy-planner.glm / glm-4.7, fixed endpoint https://open.bigmodel.cn/api/paas/v4/chat/completions, one freshly configured secure-store credential, and the same minimal non-planning JSON health prompt only, with no Heavy Planner acceptance, no BrainPlan evaluation, no flash/GLM-5 model testing, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded parser-normalized GLM standard_paas_v4 health rerun with secure-store-only fresh credential loading, fixed standard_paas_v4 origin/model, at most one non-streaming network call, no retries, 20-second timeout, 64 max output tokens, no raw request/response/header/credential/transport diagnostic persistence, sanitized latency/category output only, verified credential cleanup, fail-closed unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha parser-normalized GLM standard_paas_v4 health evidence only; no provider expansion, Heavy Planner acceptance, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. This authorizes pre-run verification,
fresh masked-terminal credential configuration, and exactly one
parser-normalized `standard_paas_v4 / glm-4.7` health rerun under the fixed
scope below. It does not authorize Heavy Planner acceptance or any other
GLM/API runtime attempt.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- one fresh masked terminal credential configured before the run and loaded
  only from secure storage;
- exactly the same minimal non-planning JSON health prompt;
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

This rerun must not:

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

## Gates

All of these must pass before the one network call:

- exact Product/Security/Release approval text is recorded in this document;
- parser-normalized fixture tests are green;
- standard-origin smoke is green;
- provider id is exactly `heavy-planner.glm`;
- profile id is exactly `standard_paas_v4`;
- endpoint is exactly
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id is exactly `glm-4.7`;
- secure storage is available;
- fresh credential is configured through the masked local terminal script;
- credential is loaded only from secure storage and not exposed;
- parser-normalized standard-origin one-window network access is explicitly
  approved;
- request count is zero;
- timeout is exactly `20000ms`;
- max output tokens is exactly `64`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat this parser-normalized
standard-origin window as consumed if:

- any gate fails;
- fixture/smoke verification is not green;
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

## Controlled Procedure After Approval

Do not run these commands until the exact three approval lines above are
recorded and pre-run verification passes.

Configure a fresh credential only from an attached terminal:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

Then run exactly one parser-normalized standard-origin health window:

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

Before configuring the fresh credential or starting the real parser-normalized
standard-origin health rerun, run:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential configuration and no real GLM API/network call are authorized by
pre-run verification alone.

## Pre-Run Evidence

Executed before fresh credential configuration or any parser-normalized
standard-origin health/API call:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- GLM runtime adapter build passed;
- desktop build passed;
- focused GLM provider/health/model-origin/offline tests passed: `53`;
- standard-origin health smoke passed with `acceptanceRunnerUsed=false`,
  `coreRuntimePlannerActivated=false`, `credentialExposed=false`, and
  `networkAccessApproved=false`;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- whitespace diff check passed.

No credential was configured, no secure store was accessed, and no real GLM
API/network call was made during pre-run verification.

## Expected Interpretation

- `healthy` within 20 seconds means the standard origin and parser-normalized
  health path are viable for a tiny `glm-4.7` response. It still does not prove
  Heavy Planner acceptance.
- `invalid_minimal_response` again means the parser remains incompatible with
  the provider's sanitized success shape; further parser work must remain
  fixture-only unless separately approved.
- `timeout` means standard origin reachability regressed or became unstable;
  do not proceed to Heavy Planner acceptance.
- HTTP auth/rate/model/provider categories should guide remediation without
  retaining provider body text.
- `blocked_preflight` means the local gates did not reach provider testing, and
  another attempt would require a new exact-scope approval.

## One-Window Run Evidence

Executed once after approval and pre-run verification, using a freshly
configured secure-store credential from the masked local terminal prompt.

Sanitized result:

- scope id: `glm-standard-paas-v4-health-diagnostic`;
- status: `degraded`;
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
- credential cleared: `true`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1889`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: all `false`;
- cleanup: `complete`;
- reason code: `GLM_STANDARD_HEALTH_INVALID_MINIMAL_RESPONSE`.

Interpretation:

- The standard GLM origin is reachable and fast for this tiny request.
- The credential path remained secure and cleanup completed.
- The failure is still local compatibility with the provider's sanitized
  minimal success shape, not observed authentication, rate limit, model
  availability, provider availability, connection, or timeout failure.
- This parser-normalized standard-origin window is consumed. Do not rerun GLM
  health, Heavy Planner acceptance, flash/GLM-5 testing, or any real GLM/API
  window without a new exact-scope Product/Security/Release approval.
