# GLM Standard PAAS v4 Compact JSON 128 Health Approval Request

Recorded: 2026-08-07

## Status

`CONSUMED_DEGRADED_TIMEOUT`

This is a new exact-scope approval request for one compact
`standard_paas_v4 / glm-4.7` minimal health diagnostic window with a shorter
JSON-only health prompt and a bounded `128` token output budget.

The prior shape-only standard-origin diagnostic reached the fixed standard
endpoint quickly (`1783ms`) and captured an assistant chat-completion envelope
with `finishReasonShape=length`, `contentShape=empty_string`, and
`healthSignalShape=missing_health_signal`. No timeout, connection, HTTP auth,
rate limit, model availability, provider availability, unsafe-output, raw
persistence, cleanup, UI/IPC, telemetry, default, or release issue was
observed.

Fixture-only prompt/output-bound strategy now recommends
`compact_json_object_128`: keep the provider, model, origin, endpoint,
single-request/no-retry boundary, and JSON-object response mode fixed, while
reducing the tiny health prompt payload and raising only the minimal health
output budget from `64` to `128`.

This request does not authorize GLM Heavy Planner acceptance, BrainPlan
evaluation, planner prompts, flash/GLM-5 testing, provider/model expansion,
endpoint fallback, retries, streaming, tool/function calls, direct action
execution, UI/IPC changes, telemetry, packaging, installer/update, or release
behavior.

## Prior Evidence

Consumed shape-only `standard_paas_v4 / glm-4.7` health window:

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1783`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- raw request/response/content persisted: all `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: all `false`;
- status: `shape_captured`;
- finish reason shape: `length`;
- content shape: `empty_string`;
- content length bucket: `zero`;
- JSON extraction shape: `not_attempted`;
- health signal shape: `missing_health_signal`;
- unsafe signal counts: all `0`.

Fixture-only prompt/output-bound strategy evidence:

- implemented in
  `packages/inference-adapter-glm-runtime/src/health-prompt-output-bound-strategy.ts`;
- tested in
  `packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts`;
- documented in `docs/glm-health-prompt-output-bound-strategy.md`;
- selected profile: `compact_json_object_128`;
- focused local tests passed: `38`;
- no credential, secure-store, network, Electron diagnostic, or GLM API access.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window GLM standard_paas_v4 compact_json_object_128 health diagnostic scope using fixed heavy-planner.glm / glm-4.7, fixed endpoint https://open.bigmodel.cn/api/paas/v4/chat/completions, one freshly configured secure-store credential, one compact minimal JSON-only health prompt, 128 max output tokens, sanitized health category and response-shape metadata only, no Heavy Planner acceptance, no BrainPlan evaluation, no flash/GLM-5 model testing, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded GLM standard_paas_v4 compact_json_object_128 health diagnostic window with secure-store-only fresh credential loading, fixed standard_paas_v4 origin/model, at most one non-streaming network call, no retries, 20-second timeout, 128 max output tokens, no raw request/response/header/content/credential/transport diagnostic persistence, sanitized health category, response-shape categories, and counts only, verified credential cleanup, fail-closed unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha GLM standard_paas_v4 compact_json_object_128 health evidence only; no provider expansion, Heavy Planner acceptance, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. This authorizes compact health
runner/smoke implementation, pre-run verification, fresh masked-terminal
credential configuration, and exactly one compact
`standard_paas_v4 / glm-4.7` health diagnostic window under the fixed scope
below. It does not authorize Heavy Planner acceptance or any other GLM/API
runtime attempt.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- selected strategy profile: `compact_json_object_128`;
- one fresh masked-terminal credential configured before the run and loaded
  only from secure storage;
- exactly one compact minimal JSON-only health prompt;
- at most one non-streaming provider call;
- no retries;
- timeout: `20000ms`;
- response format: JSON object;
- temperature: `0`;
- max output tokens: `128`;
- accepted diagnostic result labels only:
  - `healthy`;
  - `shape_captured`;
  - `timeout`;
  - `connection_failed`;
  - `http_authentication_rejected`;
  - `http_rate_limited`;
  - `http_model_unavailable`;
  - `http_provider_unavailable`;
  - `invalid_minimal_response`;
  - `unavailable`;
  - `blocked_preflight`;
- output evidence fields only:
  - sanitized health category;
  - sanitized response-shape categories;
  - bounded unsafe signal counts;
  - latency bucket or elapsed milliseconds;
  - request count;
  - cleanup result;
  - fixed reason codes.

## Explicit Non-Goals

This window must not:

- run `npm.cmd run acceptance:heavy-planner:glm`;
- use the prior `coding_paas_v4` endpoint;
- test `glm-4.7-flash`, `glm-4.7-flashx`, `glm-5-turbo`, `glm-5.2`, or any
  user-supplied model;
- increase output budget beyond `128`;
- run multiple prompts or compare candidates against the provider;
- enter `CoreRuntime` Heavy Planner acceptance;
- evaluate fixed Heavy Planner samples;
- parse, normalize, or accept a BrainPlan;
- use tools, functions, streaming, retries, browser/local app/shell/filesystem,
  Memory write, model lifecycle activation, Qwen runtime, or any executor;
- persist raw prompts, raw responses, assistant content, request headers,
  credential material, provider messages, stack traces, private paths,
  endpoint override data, or transport diagnostics;
- expose UI/IPC/telemetry/product defaults;
- change installer, update, packaging, release channel, or release behavior.

## Gates

All of these must pass before the one network call:

- exact Product/Security/Release approval text is recorded in this document;
- compact prompt/output-bound fixture tests are green;
- compact health diagnostic runner attachment is verified by fixture/smoke
  evidence before credential configuration;
- provider id is exactly `heavy-planner.glm`;
- profile id is exactly `standard_paas_v4`;
- endpoint is exactly
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id is exactly `glm-4.7`;
- output budget is exactly `128`;
- secure storage is available;
- fresh credential is configured through the masked local terminal script;
- credential is loaded only from secure storage and not exposed;
- compact standard-origin one-window network access is explicitly approved;
- request count is zero before the call;
- timeout is exactly `20000ms`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- output projection contains only sanitized health category and shape metadata;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat this compact health window
as consumed if:

- any gate fails;
- fixture/smoke verification is not green;
- secure-store setup or cleanup is uncertain;
- request count would exceed one;
- endpoint differs from the fixed standard endpoint;
- model differs from `glm-4.7`;
- output budget differs from `128`;
- timeout would exceed `20000ms`;
- a retry would be attempted;
- a raw prompt/response/header/content/credential/diagnostic would be retained;
- a BrainPlan or Heavy Planner acceptance path would be touched;
- direct action/tool execution/default/UI/IPC/telemetry/release behavior would
  change;
- output is unsafe or contains credential-like material;
- final output cannot be reduced to fixed sanitized labels and counts.

## Controlled Procedure After Approval

Do not run these commands until the exact three approval lines above are
recorded and pre-run verification passes.

Pre-run verification target after the compact runner exists:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-compact-health
npm.cmd run build:desktop
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential configuration and no real GLM API/network call are authorized by
pre-run verification alone.

After approval and pre-run verification, configure a fresh credential only
from an attached terminal:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

Then run exactly one compact standard-origin health window:

```powershell
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_COMPACT_HEALTH_ONE_WINDOW_APPROVED = "1"
npm.cmd run diagnostic:heavy-planner:glm-standard-compact-health
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_COMPACT_HEALTH_ONE_WINDOW_APPROVED
```

The GLM API key must be entered only into the masked local terminal prompt.
Never paste it into chat, command arguments, environment variables, files,
logs, docs, or UI fields.

## Expected Interpretation

- `healthy` means the compact `128` health profile returned a minimal safe
  health signal. It still does not prove Heavy Planner acceptance.
- `shape_captured` means the response shape was captured for diagnosis but the
  health parser did not accept it.
- `finish_reason=length` with empty content again means the provider likely
  needs a different model/profile strategy, not a wider Heavy Planner window.
- HTTP auth/rate/model/provider categories should guide remediation without
  retaining provider body text.
- Unsafe, secret-like, oversized, or unsupported shapes must remain
  fail-closed and may only drive fixture-only parser strategy.
- Any further real GLM/API window after this one requires a new exact-scope
  Product/Security/Release approval.

## Implementation And Pre-Run Evidence

Implemented after approval:

- compact diagnostic runner:
  `tests/glm-standard-paas-v4-compact-health-diagnostic.cjs`;
- compact diagnostic smoke guard:
  `tests/glm-standard-paas-v4-compact-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-standard-compact-health`;
  - `smoke:diagnostic:heavy-planner:glm-standard-compact-health`.

Executed before fresh credential configuration or any compact standard-origin
health/API call:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-prompt-output-bound-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-compact-health
npm.cmd run build:desktop
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- GLM runtime adapter build passed;
- focused GLM health prompt/output, response-shape, and parser tests passed:
  `38`;
- compact diagnostic smoke passed with `compactHealthOnly=true`,
  `acceptanceRunnerUsed=false`, `coreRuntimePlannerActivated=false`,
  `credentialExposed=false`, and `networkAccessApproved=false`;
- desktop build passed;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- whitespace diff check passed.

No credential was configured, no secure store was accessed, and no real GLM
API/network call was made during pre-run verification.

## One-Window Run Evidence

Executed once after approval and pre-run verification, using a freshly
configured secure-store credential from the masked local terminal prompt.

Sanitized result:

- scope id: `glm-standard-paas-v4-compact-json-128-health-diagnostic`;
- status: `degraded`;
- accepted: `false`;
- diagnostic status: `timeout`;
- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- strategy profile id: `compact_json_object_128`;
- model id: `glm-4.7`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- timeout: `20000ms`;
- max output tokens: `128`;
- secure store available: `true`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `20014`;
- transport timeout count: `1`;
- transport connection/unknown counts: `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- raw content persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: all `false`;
- cleanup: `complete`;
- reason code: `GLM_STANDARD_COMPACT_HEALTH_TIMEOUT`.

Interpretation:

- The compact `128` profile did not fix the prior empty-content length finish.
- Increasing the tiny health output budget from `64` to `128` coincided with a
  bounded provider timeout in this one-window run.
- No authentication, rate limit, model availability, provider availability,
  raw persistence, credential exposure, cleanup, direct action, UI/IPC,
  telemetry, default, or release issue was observed.
- This compact standard-origin window is consumed. Do not rerun GLM health,
  Heavy Planner acceptance, flash/GLM-5 testing, alternate GLM model testing,
  endpoint testing, or any real GLM/API window without a new exact-scope
  Product/Security/Release approval.
