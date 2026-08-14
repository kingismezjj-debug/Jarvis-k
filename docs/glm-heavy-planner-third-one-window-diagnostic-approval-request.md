# GLM Heavy Planner Third One-Window Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`DEGRADED_CONSUMED_NO_FOURTH_WINDOW_APPROVED`

The first GLM window was blocked before a provider call. The second window
made three calls and completed with `degraded`. The offline sanitized failure
classification work is complete. This request authorizes one and only one
third diagnostic window after the new classifications and focused tests are
green.

## Exact Approval Text

```text
Product: APPROVE exactly this third one-window GLM Heavy Planner diagnostic rerun using fixed heavy-planner.glm / glm-4.7, the same fixed three prompts, the new sanitized transport and planner-result classifications, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this third bounded heavy-planner.glm diagnostic rerun with secure-store-only fresh credential loading, fixed three-call maximum, no raw request/response or transport diagnostic persistence, sanitized category counts, verified cleanup, and executor-only side effects

Release: APPROVE developer-alpha third GLM diagnostic evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/release changes
```

## Fixed Window

- provider: `heavy-planner.glm`;
- model: `glm-4.7`;
- fixed origin/profile;
- one fresh masked terminal credential;
- exactly three fixed prompts, maximum three calls;
- no retry, streaming, tools, functions, or side effects;
- immediate stop on failure, mismatch, or unsafe output;
- secure-store cleanup and verification after the run.

This is a diagnostic window only. It does not authorize a fourth attempt,
product-default provider use, UI/IPC exposure, or real tool execution.

## Recorded Approval

The exact Product, Security, and Release approvals above were recorded in chat
on 2026-08-07 before any third-window credential configuration or runtime/API
execution.

## Controlled Procedure

Run only after local smoke/build gates are green:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED = "1"
npm.cmd run acceptance:heavy-planner:glm
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED
```

The GLM API key must be entered only into the masked local terminal prompt.
Never paste it into chat, command arguments, environment variables, files,
logs, docs, or UI fields.

If the run passes, blocks, or degrades, this third window is consumed. A fourth
attempt requires a new exact-scope approval.

## Pre-Run Evidence

Before credential entry or any third-window network/API call, the following
local no-credential gates passed:

```powershell
npm.cmd run build:contracts
npm.cmd run build:capabilities
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
npm.cmd run smoke:acceptance:heavy-planner:glm
npm.cmd run smoke:configure-heavy-planner:glm-credential
npx.cmd vitest run apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts apps/core-host/test/glm-heavy-planner-runtime-composition.test.ts apps/core-host/test/glm-heavy-planner-wiring.test.ts packages/contracts/test/protocol.test.ts
```

Observed sanitized smoke evidence:

- GLM acceptance smoke passed;
- configure-credential smoke passed;
- `credentialExposed=false`;
- `networkAccessApproved=false` before the approved runtime window;
- cleanup verification path passed.

No GLM credential was configured and no real GLM API/network call was made in
these pre-run checks.

## Third Window Result

The approved third one-window diagnostic was run on 2026-08-07 and is now
consumed.

Sanitized result:

- `status=degraded`;
- `accepted=false`;
- provider `heavy-planner.glm`;
- model `glm-4.7`;
- secure storage was available;
- credential was configured for the window;
- `credentialExposed=false`;
- `credentialCleared=true`;
- composition status was `available`;
- all composition gates passed;
- `providerCallCount=3`;
- `promptCount=3`;
- `networkApiCalled=true`;
- `directActionAttempted=false`;
- default, UI/IPC, telemetry, and release behavior were unchanged;
- cleanup completed.

Sanitized failure classification:

- transport failures: `timeout=1`, `connection=0`, `unknown=0`;
- HTTP categories: `authenticationRejected=0`, `rateLimited=0`,
  `modelUnavailable=0`, `providerUnavailable=0`;
- sample 1 expected `planned`, actual `unavailable`,
  `INVALID_PLAN / PROVIDER_RESULT_INVALID`;
- sample 2 expected `clarify`, actual `unavailable`,
  `INVALID_PLAN / PROVIDER_RESULT_INVALID`;
- sample 3 expected `blocked`, actual `unavailable`,
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`;
- window reason: `GLM_HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`.

Interpretation:

- The approved runtime composition and secure-store gates worked.
- Credential cleanup completed and was verified.
- No direct action execution or product/default/release behavior occurred.
- The first two calls reached a provider path but did not produce a bounded
  `BrainPlannerResult` accepted by the local parser.
- The third call hit the bounded transport timeout path.

No raw prompts, raw responses, credential material, request headers, stack
traces, private paths, or provider diagnostics were retained in this document.
Do not rerun this diagnostic window. A fourth GLM runtime/API attempt requires
a new exact-scope Product/Security/Release approval.

## Offline Fixture-Only Hardening

After the consumed third window, a fixture-only hardening pass was completed
without configuring a credential, starting a runtime acceptance window, making
network/API calls, or broadening provider/default/UI/IPC/telemetry/release
behavior.

Implemented:

- tightened the GLM system prompt to request one JSON object only, fixed
  `BrainPlannerResult` statuses, explicit `providerId`, no tool/function calls,
  and `directActionAttempted=false`;
- added JSON extraction for fenced or prefixed assistant content while keeping
  malformed text fail-closed;
- added normalization for common wrapper keys such as `result`,
  `plannerResult`, and `brainPlannerResult`;
- added bounded status, reason, failure-class, clarify question, plan, and step
  normalization;
- defaulted missing safe fields such as `providerId`, `plannedAt`,
  `directActionAttempted=false`, and omitted confirmation flags only when that
  preserves safer confirmation-required behavior;
- preserved explicit unsafe fields such as `directActionAttempted=true` and
  unsupported tool ids as rejected output;
- changed the future bounded timeout strategy to one attempt with a 45-second
  per-call timeout, with no retry.

Verification:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core-host
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts apps/core-host/test/glm-heavy-planner-runtime-composition.test.ts apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts apps/core-host/test/glm-heavy-planner-wiring.test.ts
npm.cmd run smoke:acceptance:heavy-planner:glm
npm.cmd run check:sensitive-artifacts
git diff --check -- packages/inference-adapter-glm-runtime/src/provider.ts packages/inference-adapter-glm-runtime/test/provider.test.ts docs/glm-heavy-planner-third-one-window-diagnostic-approval-request.md docs/jarvis-k-next-conversation-handoff-2026-08-07.md
```

Results:

- GLM runtime adapter build passed;
- Core Host build passed;
- focused GLM Vitest window passed: 24 tests;
- GLM acceptance smoke passed with `credentialExposed=false`,
  `networkAccessApproved=false`, and cleanup verification intact;
- sensitive artifact guard passed;
- whitespace diff check passed.

This offline hardening does not authorize any fourth GLM runtime/API attempt.
Any future real rerun must request and receive a new exact-scope approval that
mentions the updated parser normalization and 45-second one-attempt timeout
strategy.
