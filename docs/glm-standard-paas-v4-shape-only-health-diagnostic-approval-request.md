# GLM Standard PAAS v4 Shape-Only Health Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`CONSUMED_SHAPE_CAPTURED_FINISH_REASON_LENGTH_EMPTY_CONTENT`

This is a new exact-scope approval request for one shape-only
`standard_paas_v4 / glm-4.7` minimal health diagnostic window.

The parser-normalized standard-origin health rerun reached the fixed standard
endpoint quickly (`1889ms`) but still classified the provider result as
`invalid_minimal_response`. Fixture-only response-shape strategy is now
implemented and verified. This request exists only to capture sanitized
response-shape metadata from one minimal non-planning health response so the
local parser mismatch can be diagnosed without retaining provider content.

This request does not authorize GLM Heavy Planner acceptance, BrainPlan
evaluation, planner prompts, flash/GLM-5 testing, provider/model expansion,
endpoint fallback, retries, streaming, tool/function calls, direct action
execution, UI/IPC changes, telemetry, packaging, installer/update, or release
behavior.

## Prior Evidence

Consumed parser-normalized `standard_paas_v4 / glm-4.7` health rerun:

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1889`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- raw request/response persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: all `false`;
- diagnostic status: `invalid_minimal_response`.

Fixture-only response-shape strategy was then implemented in:

- `packages/inference-adapter-glm-runtime/src/health-response-shape-strategy.ts`;
- `packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts`.

It classifies only sanitized structural metadata: top-level shape, choices
envelope, message shape, `finish_reason`, content category, content length
bucket, JSON extraction category, health signal category, unsafe signal
counts, recommendations, and reason codes.

## Exact Approval Text

```text
Product: APPROVE exactly this one-window GLM standard_paas_v4 shape-only health diagnostic scope using fixed heavy-planner.glm / glm-4.7, fixed endpoint https://open.bigmodel.cn/api/paas/v4/chat/completions, one freshly configured secure-store credential, the same minimal non-planning JSON health prompt only, sanitized response-shape metadata only, no Heavy Planner acceptance, no BrainPlan evaluation, no flash/GLM-5 model testing, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded GLM standard_paas_v4 shape-only health diagnostic window with secure-store-only fresh credential loading, fixed standard_paas_v4 origin/model, at most one non-streaming network call, no retries, 20-second timeout, 64 max output tokens, no raw request/response/header/content/credential/transport diagnostic persistence, sanitized response-shape categories and counts only, verified credential cleanup, fail-closed unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha GLM standard_paas_v4 shape-only health evidence only; no provider expansion, Heavy Planner acceptance, default behavior, CoreRuntime planner activation, UI/IPC, telemetry, installer/update, packaging, or release changes
```

Approval was recorded exactly as above. This authorizes fixture/smoke
implementation, pre-run verification, fresh masked-terminal credential
configuration, and exactly one shape-only `standard_paas_v4 / glm-4.7` health
diagnostic window under the fixed scope below. It does not authorize Heavy
Planner acceptance or any other GLM/API runtime attempt.

## Fixed Scope

- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- origin: `https://open.bigmodel.cn/api/paas/v4`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id: `glm-4.7`;
- one fresh masked-terminal credential configured before the run and loaded
  only from secure storage;
- exactly the same minimal non-planning JSON health prompt;
- at most one non-streaming provider call;
- no retries;
- timeout: `20000ms`;
- response format: JSON object;
- temperature: `0`;
- max output tokens: `64`;
- sanitized shape fields only:
  - top-level shape;
  - `choices` shape;
  - choice count bucket;
  - message shape;
  - `finish_reason` shape;
  - content shape;
  - content length bucket;
  - JSON extraction shape;
  - health signal shape;
  - unsafe signal counts;
  - bounded recommendations;
  - bounded reason codes;
- accepted result labels only:
  - `shape_captured`;
  - `timeout`;
  - `connection_failed`;
  - `http_authentication_rejected`;
  - `http_rate_limited`;
  - `http_model_unavailable`;
  - `http_provider_unavailable`;
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
- classify provider text semantically beyond the fixed shape categories;
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
- fixture-only response-shape tests are green;
- standard-origin health smoke is green without network approval;
- any shape-only diagnostic runner attachment is verified by fixture/smoke
  evidence before credential configuration;
- provider id is exactly `heavy-planner.glm`;
- profile id is exactly `standard_paas_v4`;
- endpoint is exactly
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model id is exactly `glm-4.7`;
- secure storage is available;
- fresh credential is configured through the masked local terminal script;
- credential is loaded only from secure storage and not exposed;
- shape-only standard-origin one-window network access is explicitly approved;
- request count is zero before the call;
- timeout is exactly `20000ms`;
- max output tokens is exactly `64`;
- non-streaming JSON-object mode is selected;
- no tools/functions/BrainPlan/CoreRuntime/acceptance runner path is reachable;
- output projection contains only sanitized shape metadata;
- Qwen/rules fallback and default-off behavior are preserved.

## Stop Conditions

Stop immediately, clear the credential, and treat this shape-only
standard-origin window as consumed if:

- any gate fails;
- fixture/smoke verification is not green;
- secure-store setup or cleanup is uncertain;
- request count would exceed one;
- endpoint differs from the fixed standard endpoint;
- model differs from `glm-4.7`;
- timeout would exceed `20000ms`;
- a retry would be attempted;
- a raw prompt/response/header/content/credential/diagnostic would be retained;
- a BrainPlan or Heavy Planner acceptance path would be touched;
- direct action/tool execution/default/UI/IPC/telemetry/release behavior would
  change;
- output is unsafe or contains credential-like material;
- final output cannot be reduced to the fixed sanitized shape labels and
  counts.

## Controlled Procedure After Approval

Do not run these commands until the exact three approval lines above are
recorded and pre-run verification passes.

Pre-run verification target:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-shape-health
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

Then run exactly one shape-only standard-origin health window:

```powershell
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_SHAPE_HEALTH_ONE_WINDOW_APPROVED = "1"
npm.cmd run diagnostic:heavy-planner:glm-standard-shape-health
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_SHAPE_HEALTH_ONE_WINDOW_APPROVED
```

The GLM API key must be entered only into the masked local terminal prompt.
Never paste it into chat, command arguments, environment variables, files,
logs, docs, or UI fields.

## Expected Interpretation

- `shape_captured` means the standard origin returned a response whose
  sanitized structure was captured. It still does not prove Heavy Planner
  acceptance or make the provider output acceptable.
- `timeout` or `connection_failed` means the standard health path is not stable
  enough to proceed.
- HTTP auth/rate/model/provider categories should guide remediation without
  retaining provider body text.
- Unsafe, secret-like, oversized, or unsupported shapes must remain
  fail-closed and may only drive fixture-only parser strategy.
- Any further real GLM/API window after this one requires a new exact-scope
  Product/Security/Release approval.

## Implementation And Pre-Run Evidence

Implemented after approval:

- shape-only diagnostic runner:
  `tests/glm-standard-paas-v4-shape-health-diagnostic.cjs`;
- shape-only smoke guard:
  `tests/glm-standard-paas-v4-shape-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-standard-shape-health`;
  - `smoke:diagnostic:heavy-planner:glm-standard-shape-health`.

Executed before fresh credential configuration or any shape-only
standard-origin health/API call:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/health-response-shape-strategy.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-shape-health
npm.cmd run build:desktop
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- GLM runtime adapter build passed;
- focused GLM health parser and response-shape tests passed: `35`;
- shape-only diagnostic smoke passed with `shapeOnly=true`,
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

- scope id: `glm-standard-paas-v4-shape-health-diagnostic`;
- status: `shape_captured`;
- accepted: `true`;
- diagnostic status: `shape_captured`;
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
- elapsed milliseconds: `1783`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP authentication/rate/model/provider counts: all `0`;
- raw request persisted: `false`;
- raw response persisted: `false`;
- raw content persisted: `false`;
- direct action attempted: `false`;
- CoreRuntime planner activated: `false`;
- default/UI/IPC/telemetry/release behavior changed: all `false`;
- cleanup: `complete`;
- reason code: `GLM_STANDARD_SHAPE_HEALTH_SHAPE_CAPTURED`.

Captured sanitized response shape:

- top-level shape: `object`;
- choices shape: `chat_completion_choices`;
- choice count bucket: `one`;
- message shape: `assistant_message`;
- finish reason shape: `length`;
- content shape: `empty_string`;
- content length bucket: `zero`;
- JSON extraction shape: `not_attempted`;
- health signal shape: `missing_health_signal`;
- unsafe signal counts:
  - tool calls: `0`;
  - function calls: `0`;
  - direct action: `0`;
  - execution-shaped output: `0`;
  - secret-like content: `0`;
  - oversized content: `0`;
- shape reason codes:
  - `GLM_HEALTH_RESPONSE_SHAPE_FIXTURE_ONLY`;
  - `GLM_HEALTH_SHAPE_CHAT_COMPLETION_ENVELOPE`;
  - `GLM_HEALTH_SHAPE_FINISH_REASON_LENGTH`;
  - `GLM_HEALTH_SHAPE_HEALTH_SIGNAL_MISSING`;
- recommendation: `consider_finish_reason_length_handling`.

Interpretation:

- The standard GLM origin is reachable and fast for this tiny request.
- The credential path remained secure and cleanup completed.
- The prior `invalid_minimal_response` evidence is explained by an assistant
  chat-completion envelope with `finish_reason=length`, empty content, and no
  health signal, not by observed timeout, connection, authentication, rate
  limit, model availability, or provider availability failure.
- This shape-only standard-origin window is consumed. Do not rerun GLM health,
  Heavy Planner acceptance, flash/GLM-5 testing, or any real GLM/API window
  without a new exact-scope Product/Security/Release approval.
