# GLM Heavy Planner Fourth One-Window Diagnostic Approval Request

Recorded: 2026-08-07

## Status

`DEGRADED_CONSUMED_NO_FIFTH_WINDOW_APPROVED`

The third GLM diagnostic window is consumed with `status=degraded`. After that
window, offline fixture-only hardening was completed for prompt wording, JSON
extraction, result normalization, fail-closed parser behavior, and timeout
strategy. This request authorizes one and only one fourth diagnostic window
using that offline-hardened implementation.

The fourth diagnostic window has now also been consumed. It completed cleanup
and credential clearing, but the fixed three-prompt acceptance result remained
`degraded`; no fifth GLM runtime/API attempt is approved by this document.

## Exact Approval Text

```text
Product: APPROVE exactly this fourth one-window GLM Heavy Planner diagnostic rerun using fixed heavy-planner.glm / glm-4.7, the same fixed three prompts, the offline-hardened prompt, JSON extraction, wrapper/result normalization, status/reason/failure-class mapping, clarify/plan/step normalization, fail-closed unsafe-output handling, Qwen/rules fallback preserved, one-attempt 45-second timeout strategy, and no direct action execution

Security: APPROVE exactly this fourth bounded heavy-planner.glm diagnostic rerun with secure-store-only fresh credential loading, fixed three-call maximum, no retries, 45-second timeout per call, no raw request/response or transport diagnostic persistence, sanitized category counts only, verified credential cleanup, fail-closed parser/unsafe-output handling, and executor-only side effects

Release: APPROVE developer-alpha fourth GLM diagnostic evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/packaging/release changes
```

## Fixed Window

- provider: `heavy-planner.glm`;
- model: `glm-4.7`;
- fixed GLM Chat Completions origin/profile;
- one fresh masked terminal credential, loaded only from secure storage;
- exactly three fixed prompt categories: planned, clarify, and blocked;
- maximum three provider calls total;
- no retries;
- 45-second timeout per call;
- no streaming, tools, functions, browser/local app/shell/filesystem, Memory
  write, or other side effect;
- no raw prompts, raw responses, headers, credential material, provider
  diagnostics, stack traces, or private paths retained;
- accepted final labels only: `passed`, `blocked`, or sanitized `degraded`.

## Stop Conditions

Stop immediately, clear credential state, and treat the fourth window as
consumed if any gate fails, secure-store setup or cleanup is uncertain, provider
call count would exceed three, output is unsafe, direct action is attempted,
raw diagnostics would be exposed, or any default/UI/IPC/telemetry/release
behavior would change.

## Pre-Run Gates

Run before entering a fresh credential or starting the fourth runtime window:

```powershell
npm.cmd run build:contracts
npm.cmd run build:capabilities
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts apps/core-host/test/glm-heavy-planner-runtime-composition.test.ts apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts apps/core-host/test/glm-heavy-planner-wiring.test.ts
npm.cmd run smoke:acceptance:heavy-planner:glm
npm.cmd run smoke:configure-heavy-planner:glm-credential
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

## Controlled Procedure

Only after pre-run gates pass:

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

If the run passes, blocks, or degrades, this fourth window is consumed. A fifth
attempt requires a new exact-scope Product/Security/Release approval.

## Pre-Run Evidence

Before fresh credential entry or any fourth-window network/API call, the local
pre-run gates passed:

```powershell
npm.cmd run build:contracts
npm.cmd run build:capabilities
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts apps/core-host/test/glm-heavy-planner-runtime-composition.test.ts apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts apps/core-host/test/glm-heavy-planner-wiring.test.ts
npm.cmd run smoke:acceptance:heavy-planner:glm
npm.cmd run smoke:configure-heavy-planner:glm-credential
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Results:

- contracts, capabilities, GLM runtime adapter, core, core-host, and desktop
  builds passed;
- focused GLM Vitest window passed: 24 tests;
- GLM acceptance smoke passed with `credentialExposed=false`,
  `networkAccessApproved=false`, and credential cleanup verification intact;
- GLM configure-credential smoke passed with `credentialExposed=false` and
  `networkAccessApproved=false`;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- whitespace diff check passed.

No GLM credential was configured and no real GLM API/network call was made in
these pre-run checks.

## Fourth Window Result

The approved fourth one-window diagnostic run was executed once with the fixed
`heavy-planner.glm` / `glm-4.7` profile, the same three prompt categories, no
retries, and the offline-hardened prompt/parser path.

Sanitized result summary:

- final status: `degraded`;
- accepted: `false`;
- provider calls: `3`;
- prompt count: `3`;
- secure store available: `true`;
- credential configured before run: `true`;
- credential exposed: `false`;
- credential cleared after run: `true`;
- network API called: `true`;
- direct action attempted: `false`;
- default/UI/IPC/telemetry/release behavior changed: `false`;
- cleanup: `complete`;
- aggregate reason: `GLM_HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`.

Failure classification:

- transport timeout: `3`;
- transport connection: `0`;
- transport unknown: `0`;
- HTTP authentication rejected: `0`;
- HTTP rate limited: `0`;
- HTTP model unavailable: `0`;
- HTTP provider unavailable: `0`;
- sample 1 expected `planned`, actual `unavailable`,
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`;
- sample 2 expected `clarify`, actual `unavailable`,
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`;
- sample 3 expected `blocked`, actual `unavailable`,
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`.

Interpretation:

- the fourth window was validly consumed and must not be rerun under this
  approval;
- parser hardening was not contradicted, but it was not exercised against a
  successful real provider response in this window;
- compared with the third window, the dominant real-runtime failure shifted
  from invalid planner result evidence to timeout-only transport evidence;
- the current GLM heavy-planner path is not acceptable for product enablement
  until timeout/provider-latency strategy is addressed offline and any further
  real API attempt receives a new exact-scope Product/Security/Release
  approval.

Follow-up offline analysis is recorded in
`docs/glm-heavy-planner-offline-timeout-payload-provider-strategy-analysis.md`.
