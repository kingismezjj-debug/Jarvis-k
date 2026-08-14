# GLM Heavy Planner Second One-Window Runtime Rerun Approval Request

Recorded: 2026-08-07

## Status

`CONSUMED_DEGRADED_NO_RERUN_WITHOUT_NEW_APPROVAL`

This is a new request. The original GLM acceptance window was consumed on
2026-08-07 when local `CoreRuntime` construction was blocked before any API
call. It produced zero provider calls, zero network calls, no side effect, and
verified secure-credential cleanup.

All three exact approvals were recorded on 2026-08-07. The one authorized
rerun completed on 2026-08-07 with a degraded result and is now consumed.
Do not configure another credential or retry the acceptance command without a
new exact-scope approval.

## Requested Approval Text

```text
Product: APPROVE exactly this second one-window GLM Heavy Planner runtime rerun using fixed heavy-planner.glm / glm-4.7, the same fixed three prompts, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded heavy-planner.glm runtime rerun with secure-store-only credential loading, the corrected acceptance-only CoreRuntime factory, gated network access, no raw request/response persistence, sanitized evidence, verified credential cleanup, and executor-only side effects

Release: APPROVE developer-alpha second runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/release changes
```

## Recorded Approvals

```text
Product: APPROVE exactly this second one-window GLM Heavy Planner runtime rerun using fixed heavy-planner.glm / glm-4.7, the same fixed three prompts, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded heavy-planner.glm runtime rerun with secure-store-only credential loading, the corrected acceptance-only CoreRuntime factory, gated network access, no raw request/response persistence, sanitized evidence, verified credential cleanup, and executor-only side effects

Release: APPROVE developer-alpha second runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/release changes
```

## Fixed Scope

- provider: `heavy-planner.glm`;
- model: `glm-4.7`;
- official fixed GLM Chat Completions origin only;
- one freshly configured developer credential, loaded only from the GLM
  OS-backed secure-store record;
- exactly three fixed sanitized prompt categories: complex, underspecified,
  and high-impact;
- at most three non-streaming calls, with no retries and a 30-second timeout
  per call;
- JSON-object response mode, `temperature: 0`, and maximum output of `1024`
  tokens;
- one composition-created provider and the corrected acceptance-only
  `CoreRuntime` factory; and
- accepted result labels only: `planned`, `clarify`, `blocked`, or sanitized
  unavailable.

The rerun must not use tools or function calls, execute actions, access
browser/local-app/shell/filesystem tools, write Memory, expose a UI/IPC
surface, persist raw prompts or responses, alter defaults, change telemetry,
or make any installer, update, packaging, or release change.

## Prerequisite Evidence

- The original approved window made no provider or network call and securely
  cleared its credential record.
- The failure was isolated to one missing optional `CoreRuntime` argument in
  the acceptance runner, not to GLM composition, secure storage, network, or
  model behavior.
- `createGlmHeavyPlannerAcceptanceRuntime(...)` now supplies exactly the 21
  optional constructor arguments before `heavyPlannerProvider` and planner
  options.
- A fixture-only Core Host regression verifies that the provider is placed in
  the heavy-planner slot and receives exactly one `plan()` call.
- The acceptance runner preserves nonzero blocked/degraded exit statuses,
  classifies local construction failures without stack output, caps calls at
  three, and clears the credential after the run.

## Gates and Stop Conditions

All three temporary environment approvals must be set to `1`; the fixed
provider/model, secure-store availability, configured non-exposed credential,
contract/parser/bounds, Qwen/rules fallback, default-off behavior, and
executor-only side-effect gates must all pass before any network request.

Stop immediately, clear the credential, and treat this window as consumed if
any gate fails, the factory regression is not green, a call fails, an output
is invalid or unsafe, a result mismatches, cleanup is uncertain, or any
prohibited surface would be touched. A third attempt would require a further
new exact-scope approval.

## Controlled Procedure After Approval

1. Configure a fresh credential only from an attached terminal:

   ```powershell
   npm.cmd run configure:heavy-planner:glm-credential
   ```

2. Run exactly once from that same terminal:

   ```powershell
   $env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
   $env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED = "1"
   $env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED = "1"
   npm.cmd run acceptance:heavy-planner:glm
   Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
   Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED
   Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED
   ```

Do not paste a credential into chat, a command line, an environment variable,
or a file. Do not run either command until the three new approval lines are
recorded.

## Second One-Window Result

The approved second window completed with `status=degraded`:

- all fixed composition gates were true before the first request;
- prompt count: `3`;
- provider call count: `3`;
- `networkApiCalled=true`;
- the complex and underspecified samples returned sanitized
  `PROVIDER_FAILED` / `PROVIDER_EXECUTION_FAILED` unavailable results;
- the high-impact sample returned `unavailable`; its aggregate evidence was
  `PLANNER_RESULT_UNCLASSIFIED`;
- no direct action was attempted;
- default, UI/IPC, telemetry, and release behavior remained unchanged;
- secure credential cleanup completed and the record was verified
  unconfigured; and
- final reason code:
  `GLM_HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`.

The transport adapter intentionally retains no raw provider body, endpoint
diagnostic, request id, account detail, credential, or stack trace. The two
`PROVIDER_FAILED` results therefore establish only that no usable successful
provider response reached the bounded planner parser; they do not establish
whether the cause was credentials, model access, a network path, timeout, or
provider availability.

Before any further runtime request, add and verify fixture-only sanitized
transport and aggregate failure classification. That work must preserve the
same no-raw-diagnostic boundary and receive a separate exact-scope approval.
