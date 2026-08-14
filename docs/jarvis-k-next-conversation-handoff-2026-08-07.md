# Jarvis-K Next Conversation Handoff

Recorded: 2026-08-07

This document is the source of truth for the next Jarvis-K conversation.
`C:\Users\Administrator\Documents\Jarvis-k\handoff.md` is an older Phase 8
handoff and is not current. Do not assume the repository is clean or that
Phase 8.37 is the current product frontier.

## Mission

Turn Jarvis-K from a collection of guarded alpha capabilities into one usable
desktop assistant spine:

```text
text or final voice transcript
-> one agent.runBrainCommand path
-> fast local router
-> bounded heavy planner fallback
-> safety gate
-> registered tool
-> executor
-> UI event/result stream
-> Memory and TTS
```

The project must remain fail-closed, default-off for dangerous/cloud/model
behavior, diagnosable with sanitized evidence, and reversible.

## Repository And Worktree

- Repository: `C:\Users\Administrator\Documents\Jarvis-k`
- Branch: `main`
- Current HEAD when this handoff was written: `94be10d docs: close phase 14 tool execution alpha`
- The worktree is heavily dirty from the accumulated Phase 8 through
  product-spine work.
- Do not run `git reset --hard`, `git checkout --`, or broad cleanup.
- Do not revert changes merely because they predate the new conversation.
- Before editing, run `git status --short --branch` and inspect only the
  relevant diff.
- `E:\bailongma` and `F:\openclaw-main` are reference projects only. Do not
  modify them.

## Product Status

### Existing desktop product

Already present:

- Electron desktop host with context-isolated preload bridges.
- React UI with Chinese/English language selection.
- General settings surface containing language and voice settings.
- Text input and final voice transcript both enter
  `agent.runBrainCommand`.
- Volcengine ASR adapter path based on the Bailongma-style capture/session
  contract.
- Encrypted voice-provider configuration and Windows microphone permission
  handling.
- Core Host supervision and validated command IPC.
- Browser/Open App allowlist adapter behind Core action ports.

The UI has been repaired from the earlier state where many controls were
painted but non-functional. Do not assume new controls are wired: every new
Stage 4 surface needs interaction tests.

### Memory

Memory alpha foundations exist:

- SQLite persistence and Memory contracts.
- local/provider embedding boundaries.
- provider-backed query vectors and vector writes/reads behind explicit gates.
- Memory retrieval routing and sanitized recall failure classification.
- Memory alpha implementation and rollback/degraded evidence.

Treat Memory as developer-alpha, not production-ready. Do not add a new
persistent schema, vector migration, real model artifact, or real retrieval
window as part of Stage 4.

### Model lifecycle and local Qwen

Model lifecycle alpha is frozen with:

- file-backed lifecycle/cache semantics;
- digest-before-ready;
- atomic activation;
- cleanup and rollback preservation;
- no default activation.

Qwen3-0.6B Fast Router is frozen as a developer-alpha candidate:

- approved artifact revision and digest set;
- temporary materialization/lifecycle/helper path;
- bounded generation port;
- Core Host composition;
- deterministic rules fallback;
- local-app/browser disambiguation;
- blocked-action fail-closed handling.

The Qwen lifecycle-backed runtime wiring window passed, but it did not enable
Qwen as a product default. Do not rerun or promote the Qwen runtime without a
new exact-scope approval.

### Observability and Tool Execution

Observability alpha is frozen:

- provider-neutral in-memory events;
- Core Host integration;
- diagnostic surface;
- pre-runtime runner attachment;
- sanitized failure classifications.

Tool Execution alpha is also frozen:

- provider-neutral contracts;
- Core Host fixture adapter/session;
- policy decision and diagnostic surface;
- pre-runtime runner attachment;
- executor-only side-effect boundary.

The next task is productization of these frozen contracts, not another
isolated diagnostic phase.

### Brain spine

Stage 1 is complete:

- deterministic rules router remains the fallback;
- text and voice use one BrainCommand route;
- browser/localApp intents remain allowlisted;
- Memory/model/observability routes exist.

Stage 2 is complete and frozen:

- Qwen fast-router provider-neutral adapter;
- Core Host selection/fallback composition;
- real lifecycle-backed wiring evidence;
- default-off local foreground brain candidate.

Stage 3 is complete and frozen:

- provider-neutral Heavy Planner port;
- bounded `BrainPlannerRequest` and `BrainPlannerResult`;
- bounded `BrainPlan` and tool steps;
- confirmation requirements for medium/high/blocked risk;
- Qwen/rules fallback;
- no direct action execution from planner output.

Read:

- `docs/brain-runtime-spine-upgrade-plan.md`
- `docs/qwen-lifecycle-backed-runtime-wiring-closeout.md`
- `docs/stage-3-heavy-planner-fallback-closeout.md`
- `docs/phase-14-5-tool-execution-alpha-closeout.md`

## GLM Runtime Status

The fixed real provider profile is:

- provider id: `heavy-planner.glm`;
- model id: `glm-4.7`;
- fixed GLM Chat Completions origin;
- non-streaming JSON object response;
- `temperature: 0`;
- current fixture-reduced maximum output tokens: `512`;
- maximum three prompts/calls per approved window;
- no retries, tools, function calls, or direct action execution.

### First real window

The first approved window was consumed before any provider call:

- `providerCallCount=0`;
- `networkApiCalled=false`;
- CoreRuntime constructor slot misalignment;
- no action/UI/IPC/default/telemetry/release change;
- secure credential cleanup verified.

The acceptance-only runtime factory was added and tested. It supplies exactly
the 21 optional CoreRuntime slots before the heavy planner and planner options.

### Second real window

The second approved window was consumed with:

- all composition gates true;
- `promptCount=3`;
- `providerCallCount=3`;
- `networkApiCalled=true`;
- first two samples: `PROVIDER_FAILED` /
  `PROVIDER_EXECUTION_FAILED`;
- third sample: unavailable with insufficient aggregate classification;
- final status: `degraded`;
- final reason:
  `GLM_HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`;
- no direct action;
- no UI/IPC/default/telemetry/release change;
- credential cleanup complete and verified.

This result does not prove that the key, account, model, or endpoint is
wrong. The old adapter discarded too much transport context.

### Offline failure-classification fix

Approved fixture-only work is complete:

- transport errors are compressed to `timeout`, `connection`, or `unknown`;
- fixed HTTP categories are counted without retaining response bodies;
- planner evidence distinguishes `missing`, `unavailable`,
  `blocked_unsafe`, and `other`;
- existing planner contracts and Qwen/rules fallback are unchanged.

Verification:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:core-host
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts
npx.cmd vitest run apps/core-host/test/glm-heavy-planner-acceptance-runtime.test.ts
npm.cmd run smoke:acceptance:heavy-planner:glm
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
npm.cmd run smoke:desktop:ui-interaction
```

All listed checks passed. That evidence did not authorize any additional
runtime/API attempt by itself.

Any API key previously pasted into a conversation must be treated as
compromised, revoked, and never reused. Never ask the user to paste a key into
chat, a command line, an environment variable, a file, or documentation.

## Immediate Workstream A: Stage 4 Tool Registry Product Loop

This is the primary product work. It should make Jarvis-K feel like one
assistant rather than separate panels.

### Approval status

Not yet approved. The draft is:

`docs/stage-4-tool-registry-product-loop-approval-request.md`

Required exact approvals:

```text
Product: APPROVE exactly this Stage 4 Tool Registry Product Loop developer-alpha fixture/replay implementation scope with the existing BrainCommand spine, bounded tool descriptors, route/safety/result UI event projection, and no new direct action behavior

Security: APPROVE exactly this bounded, fail-closed Stage 4 fixture/replay Tool Registry Product Loop scope with in-memory sanitized descriptors/events only, no credential/model/runtime/network/filesystem/process/Memory-write access, and no planner or UI path bypassing existing safety gates

Release: APPROVE implementation and fixture/replay UI evidence only; no default behavior, real tool execution, new provider runtime, persistent telemetry, installer/update, packaging, or release changes
```

Do not begin Stage 4 implementation until all three exact lines are recorded
in the approval document.

### Stage 4 implementation goal

Build one reusable tool registry and one visible command lifecycle:

```text
received
-> routed
-> planner selected or rules fallback
-> tool selected
-> safety decision
-> execution/replay result
-> final assistant result
```

Initial descriptors should cover the existing bounded tools:

- `browser.open`;
- `localApp.open`;
- `chat.answer`;
- `memory.search`;
- `memory.status`;
- `model.status`;
- `observability.status`; and
- `system.settings`.

### Stage 4 implementation boundaries

- Reuse the existing Core Brain action port, Tool Execution contracts,
  allowlist adapter, Observability diagnostic surface, and BrainCommand result
  schemas.
- Add descriptors and schemas, not hardcoded UI branches for each new tool.
- Keep the registry provider-neutral and bounded.
- Project only sanitized DTOs to UI/IPC:
  input source, route intent, selected tool, safety status, confirmation
  requirement, execution/replay status, fallback reason, final result.
- Use fixture/replay data for the first product loop.
- Do not invoke Windows, browser, local apps, shell, filesystem, network, real
  Memory writes, cloud providers, Qwen runtime, or planner APIs.
- Keep dangerous/default-off tools blocked unless a separately approved runtime
  scope exists.
- Add UI interaction tests for submit, route display, blocked state,
  fallback state, confirmation-required state, replay result, error state,
  retry/rollback affordance, and Chinese/English labels.
- Verify desktop build, UI build, Core Host build, focused Vitest tests,
  boundary guard, sensitive-artifact guard, and desktop UI smoke.

### Stage 4 acceptance criteria

Given a fixture command, the UI must visibly show:

- the original input source;
- the deterministic/Qwen/planner route label;
- the selected tool descriptor;
- safety/confirmation status;
- execution or replay result;
- fallback/degraded reason;
- a final assistant status.

No button may be decorative. Every command control must either perform the
bounded fixture/replay operation, show a clear disabled state, or return a
sanitized failure state.

## Immediate Workstream B: GLM Timeout Closeout

This workstream is diagnostic only and must remain separate from product
enablement.

The third GLM diagnostic window was approved, run once, and consumed with
`status=degraded`. It produced two invalid planner-result classifications and
one bounded timeout classification. No direct action/default/UI/IPC/telemetry
or release behavior changed, and credential cleanup completed.

After the third window, offline fixture-only hardening was completed for GLM
prompt wording, JSON extraction, wrapper/result normalization,
status/reason/failure-class mapping, clarify/plan/step normalization,
fail-closed unsafe-output preservation, and the future one-attempt 45-second
timeout strategy.

The fourth GLM diagnostic window was then approved, run once, and consumed
with `status=degraded`. Sanitized evidence:

- provider: `heavy-planner.glm`;
- model: `glm-4.7`;
- prompt count: `3`;
- provider calls: `3`;
- network API called: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- cleanup: `complete`;
- direct action/default/UI/IPC/telemetry/release behavior changed: `false`;
- transport timeout count: `3`;
- HTTP auth/rate/model/provider failure counts: all `0`;
- all three samples returned `unavailable` with
  `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`;
- aggregate reason:
  `GLM_HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`.

The fourth result means parser hardening was not contradicted, but it was not
exercised against a successful real provider response. The dominant current
failure signal is timeout/provider-latency, not invalid JSON/result parsing.

No fifth GLM runtime/API attempt is authorized. Do not configure a GLM
credential or run `npm.cmd run acceptance:heavy-planner:glm` again unless a new
exact-scope Product/Security/Release approval is recorded.

Offline fixture-only timeout/payload/provider-strategy analysis is complete:

- document:
  `docs/glm-heavy-planner-offline-timeout-payload-provider-strategy-analysis.md`;
- analyzer:
  `packages/inference-adapter-glm-runtime/src/offline-strategy-analysis.ts`;
- tests:
  `packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts`;
- classification: `transport_timeout`;
- timeout ratio: `1.0`;
- initial largest fixed request body before reduction: `1009` bytes;
- initial total fixed request body bytes across the three prompts: `2946`;
- fixture-reduced largest request body: `898` bytes;
- fixture-reduced total request body bytes across the three prompts: `2613`;
- fixture-reduced output token budget: `512`;
- parser hardening remains fixture-proven but not real-runtime-proven;
- recommendation: do not request a fifth acceptance rerun immediately; first
  either draft a separate minimal provider-latency health window or evaluate
  an alternate heavy-planner provider/model strategy.

A separate GLM provider latency/health diagnostic approval draft now exists:

- `docs/glm-provider-latency-health-diagnostic-approval-request.md`;
- it is not a Heavy Planner acceptance rerun;
- it proposes one minimal non-planning JSON health prompt only;
- it allows at most one non-streaming provider call, no retries, `20000ms`
  timeout, `64` max output tokens, and sanitized latency/category evidence
  only;
- exact Product/Security/Release approval has been recorded;
- fixture/smoke implementation is complete;
- the approved health attempt was started once and blocked during preflight
  because no GLM secure-store credential was configured;
- no real GLM network/API call was made.

Implemented for the GLM health diagnostic:

- `packages/inference-adapter-glm-runtime/src/health-diagnostic.ts`;
- `packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts`;
- `tests/glm-provider-latency-health-diagnostic.cjs`;
- `tests/glm-provider-latency-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-health`;
  - `smoke:diagnostic:heavy-planner:glm-health`.

Fixture/smoke verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-health
npm.cmd run build:core-host
npm.cmd run build:desktop
npm.cmd run check:sensitive-artifacts
npm.cmd run check:boundaries
```

The real health window is now consumed as a blocked preflight attempt:

- final status: `blocked`;
- diagnostic status: `blocked_preflight`;
- secure store available: `true`;
- credential configured: `false`;
- request count: `0`;
- network attempted: `false`;
- direct action/default/CoreRuntime planner/UI/IPC/telemetry/release behavior
  changed: `false`;
- cleanup: `not_needed`;
- reason code: `GLM_PROVIDER_HEALTH_SECURE_CREDENTIAL_MISSING`.

This does not diagnose GLM endpoint latency. It only proves the local preflight
gate correctly blocked without a configured secure-store credential. Do not
rerun the health diagnostic under the same approval; a fresh exact-scope
Product/Security/Release approval is required before another GLM health/API
attempt.

A fresh second GLM provider latency/health diagnostic approval request has been
drafted and approved:

- `docs/glm-provider-latency-health-second-diagnostic-approval-request.md`;
- it is still not a Heavy Planner acceptance rerun;
- it requires one freshly configured masked-terminal secure-store credential;
- it allows at most one non-streaming provider call, no retries, `20000ms`
  timeout, `64` max output tokens, and sanitized latency/category evidence
  only;
- exact Product/Security/Release approval has been recorded;
- pre-run verification passed;
- the second real GLM health diagnostic was run once and consumed with
  `status=degraded` / `diagnosticStatus=timeout`.

Second health pre-run verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Second health runtime result:

- final status: `degraded`;
- diagnostic status: `timeout`;
- secure store available: `true`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `20007`;
- transport timeout count: `1`;
- transport connection/unknown counts: `0`;
- HTTP auth/rate/model/provider counts: all `0`;
- raw request/response persisted: `false`;
- direct action/default/CoreRuntime planner/UI/IPC/telemetry/release behavior
  changed: `false`;
- cleanup: `complete`;
- reason code: `GLM_PROVIDER_HEALTH_TIMEOUT`.

This means the GLM provider path timed out even for the smallest approved
non-planning health probe. Do not request another GLM Heavy Planner acceptance
window on the current fixed `glm-4.7` path. Any further real GLM attempt needs
a new exact-scope approval and should change the provider/model/origin or
timeout strategy under that approval.

GLM provider/model/origin strategy has now been redirected:

- strategy analysis:
  `docs/glm-provider-model-origin-strategy-analysis.md`;
- fixture-only implementation approval and evidence:
  `docs/glm-provider-model-origin-fixture-only-approval-request.md`.

Key strategy decision:

- do not continue on the current
  `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` origin;
- public BigModel Chat Completions documentation uses
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- next fixture-only work should separate current `coding_paas_v4` evidence from
  a `standard_paas_v4` candidate, without changing runtime defaults or running
  GLM;
- the first future runtime candidate should isolate origin only:
  `standard_paas_v4 / glm-4.7`;
- only after that should Jarvis-K consider flash/fast candidates such as
  `glm-4.7-flash`, `glm-4.7-flashx`, or later GLM-5-family quality candidates.

The fixture-only profile metadata implementation is complete:

- `packages/inference-adapter-glm-runtime/src/model-origin-strategy.ts`;
- `packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts`;
- `coding_paas_v4` is recorded as `prior_timeout_evidence`;
- `standard_paas_v4` is recorded as a default-off candidate;
- candidate model ids are fixed strings only:
  `glm-4.7`, `glm-4.7-flash`, `glm-4.7-flashx`, `glm-5-turbo`, `glm-5.2`;
- runtime provider defaults remain unchanged;
- no credential, secure store, network, health diagnostic, Heavy Planner
  acceptance, UI/IPC, telemetry, persistence, packaging, or release behavior
  was touched.

Verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

A new Candidate A approval request is drafted for exactly one
`standard_paas_v4 / glm-4.7` minimal health diagnostic window:

- `docs/glm-standard-paas-v4-health-diagnostic-approval-request.md`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- model: `glm-4.7`;
- no Heavy Planner acceptance;
- no flash/GLM-5 model testing;
- requires fixture/smoke profile wiring before runtime because the existing
  health runner still uses the prior fixed runtime endpoint.

That approval has now been recorded and fixture/smoke wiring is complete:

- standard-origin runner:
  `tests/glm-standard-paas-v4-health-diagnostic.cjs`;
- standard-origin smoke:
  `tests/glm-standard-paas-v4-health-diagnostic-smoke.mjs`;
- npm scripts:
  - `diagnostic:heavy-planner:glm-standard-health`;
  - `smoke:diagnostic:heavy-planner:glm-standard-health`;
- status:
  `DEGRADED_INVALID_MINIMAL_RESPONSE_CONSUMED`.

Pre-run verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

The standard-origin real GLM health window was run once and consumed:

- final status: `degraded`;
- diagnostic status: `invalid_minimal_response`;
- provider id: `heavy-planner.glm`;
- profile id: `standard_paas_v4`;
- model id: `glm-4.7`;
- endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- request count: `1`;
- network attempted: `true`;
- elapsed milliseconds: `1788`;
- credential configured: `true`;
- credential exposed: `false`;
- credential cleared: `true`;
- transport timeout/connection/unknown counts: all `0`;
- HTTP auth/rate/model/provider counts: all `0`;
- raw request/response persisted: `false`;
- direct action/default/CoreRuntime planner/UI/IPC/telemetry/release behavior
  changed: `false`;
- cleanup: `complete`;
- reason code: `GLM_STANDARD_HEALTH_INVALID_MINIMAL_RESPONSE`.

This changes the GLM diagnosis: the standard Open Platform origin is reachable
and fast enough for a tiny response, but the current minimal health parser did
not accept the returned shape. Do not rerun the standard health diagnostic
under the same approval. The next GLM step should be fixture-only
standard-origin health parser normalization using bounded anticipated Chat
Completions response variants, not raw provider output.

Fixture-only standard-origin health parser normalization is now complete:

- source:
  `packages/inference-adapter-glm-runtime/src/health-diagnostic.ts`;
- tests:
  `packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts`;
- accepted bounded success variants now include status tokens such as `ok`,
  `healthy`, `ready`, `success`, `successful`, `passed`, `available`, nested
  objects under `result`/`data`/`output`/`response`/`health`, boolean success
  flags, object-valued fixture content, missing assistant role when otherwise
  safe, and prefixed text containing a single JSON object;
- fail-closed behavior remains for tool/function calls, direct-action output,
  execution-shaped output, secret-like content, unsupported statuses such as
  `planned`, malformed content, or oversized content.

Verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

No credential was configured, no secure store was accessed, no GLM API/network
call was made, and no raw provider output was used. A new exact-scope approval
is required before any parser-normalized standard-origin health rerun.

A new parser-normalized standard-origin health rerun approval request is
drafted and approved:

- `docs/glm-standard-paas-v4-parser-normalized-health-rerun-approval-request.md`;
- same fixed endpoint:
  `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
- same fixed model: `glm-4.7`;
- same minimal non-planning JSON health prompt;
- at most one non-streaming call, no retries, `20000ms` timeout, `64` max
  output tokens;
- no Heavy Planner acceptance, BrainPlan evaluation, flash/GLM-5 model testing,
  default changes, UI/IPC, telemetry, packaging, or release behavior.

Parser-normalized standard-origin health rerun pre-run verification passed:

```powershell
npm.cmd run build:inference-adapter-glm-runtime
npm.cmd run build:desktop
npx.cmd vitest run packages/inference-adapter-glm-runtime/test/provider.test.ts packages/inference-adapter-glm-runtime/test/health-diagnostic.test.ts packages/inference-adapter-glm-runtime/test/model-origin-strategy.test.ts packages/inference-adapter-glm-runtime/test/offline-strategy-analysis.test.ts
npm.cmd run smoke:diagnostic:heavy-planner:glm-standard-health
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

No credential was configured, no secure store was accessed, and no real GLM
API/network call was made during pre-run verification. The parser-normalized
standard-origin health rerun is approved and pre-run verified, but not yet
consumed.

## Recommended Execution Order In The New Conversation

1. Read this handoff completely.
2. Run `git status --short --branch`, `git log -3 --oneline --decorate`, and
   inspect the current relevant diff. Do not clean the worktree.
3. Treat Stage 4 Tool Registry Product Loop as implemented fixture/replay
   evidence only; verify rather than reimplement unless the diff shows a gap.
4. Treat the fourth GLM real diagnostic window as consumed and degraded. Do
   not configure credentials or rerun GLM.
5. Update or verify the GLM fourth-window closeout evidence in
   `docs/glm-heavy-planner-fourth-one-window-diagnostic-approval-request.md`.
6. Review the completed offline GLM timeout/payload/provider-strategy analysis.
7. Run lightweight documentation/safety checks for the closeout.
8. Treat Stage 5 Product Alpha Hardening as complete developer-alpha evidence.
   Decide the next separately approved workstream: product manual acceptance,
   a narrow hardening increment, or an alternate heavy-planner
   provider/model strategy.
9. The GLM provider latency/health path has one blocked preflight consumed
   attempt. If another GLM health/API attempt is desired, draft and record a
   fresh exact-scope Product/Security/Release approval first. The current draft
   was approved, pre-run verified, run once, and consumed with timeout in
   `docs/glm-provider-latency-health-second-diagnostic-approval-request.md`.
10. If any other real GLM/API/runtime attempt is desired, draft a new
    exact-scope Product/Security/Release approval first and keep it separate
    from Stage 5.
11. GLM fixture-only profile metadata is implemented. If continuing GLM
    runtime investigation, the next approval should be for a single
    `standard_paas_v4 / glm-4.7` minimal health diagnostic window. Do not run
    GLM without that new exact approval.
12. The `standard_paas_v4 / glm-4.7` health window was run once and consumed
    with `invalid_minimal_response` after a fast `1788ms` response. If
    continuing, the parser-normalization fixture work is complete. Do not
    rerun GLM without a new exact runtime approval for a parser-normalized
    standard-origin health rerun.
13. The parser-normalized `standard_paas_v4 / glm-4.7` health rerun in
    `docs/glm-standard-paas-v4-parser-normalized-health-rerun-approval-request.md`
    was approved, pre-run verified, run once, and consumed with
    `status=degraded`, `diagnosticStatus=invalid_minimal_response`,
    `elapsedMs=1889`, `requestCount=1`, no timeout/connection/HTTP auth/rate/
    model/provider failures, credential cleared, no raw request/response
    persistence, and no default/UI/IPC/telemetry/release behavior changes. Do
    not rerun GLM health or Heavy Planner acceptance without a new exact-scope
    Product/Security/Release approval.

## Stage 4 Completion Update

Stage 4 Tool Registry Product Loop has now been approved, implemented, and
verified as fixture/replay evidence only.

Implemented:

- optional `BrainCommandResult.toolProductLoop` contract;
- fixed eight-tool descriptor projection for the existing BrainCommand spine;
- camelCase `localApp.open` tool id compatibility in the Tool protocol;
- CoreRuntime fixture dry-run projection for selected tool, safety decision,
  result, fallback, retry, rollback, lifecycle, and evidence flags;
- Brain Dispatch UI rendering for the Tool Product Loop.

Verified:

```powershell
npm.cmd run build:contracts
npm.cmd run build:capabilities
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run packages/contracts/test/tool-protocol.test.ts packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Do not treat Stage 4 as authorization for real tool execution. It added no new
IPC command, provider runtime, network, filesystem/process, Memory write,
credential, persistence, telemetry, installer/update, packaging, or release
behavior.

The third GLM diagnostic approval request was later approved and run once. It
is now consumed with `status=degraded`: three provider calls occurred, cleanup
completed, credential was cleared, no direct action/default/UI/IPC/telemetry or
release behavior changed, two samples classified as
`INVALID_PLAN / PROVIDER_RESULT_INVALID`, and one sample classified through the
bounded timeout transport path. Do not rerun GLM without a new exact-scope
approval.

Offline fixture-only hardening was then completed for GLM prompt wording, JSON
extraction, wrapper/result normalization, status/reason/failure-class mapping,
clarify/plan/step normalization, fail-closed unsafe-output preservation, and a
future one-attempt 45-second timeout strategy. Verification passed for GLM
runtime adapter build, Core Host build, focused GLM tests, GLM acceptance smoke,
sensitive-artifact guard, and whitespace diff check. This still does not
authorize a fourth GLM runtime/API attempt.

A fourth GLM one-window diagnostic rerun was later approved with the same fixed
provider/model/prompts, the offline-hardened parser/prompt path, no retries,
and a 45-second timeout. Pre-run gates passed without credential configuration
or network/API calls. The fourth real window was then run once and consumed
with `status=degraded`: three provider calls occurred, all three classified as
timeout-backed `PROVIDER_FAILED / PROVIDER_EXECUTION_FAILED`, cleanup
completed, credential was cleared, no direct action/default/UI/IPC/telemetry or
release behavior changed, and no HTTP auth/rate/model/provider failure count
was observed. No fifth GLM runtime/API window is approved.

A separate minimal `standard_paas_v4 / glm-4.7` provider health path then
proved the standard GLM endpoint is reachable and fast, but the local
sanitized health parser still classified the result as
`invalid_minimal_response`. The parser-normalized rerun repeated that outcome
after fixture-only normalization: elapsed `1889ms`, request count `1`, no
timeout/connection/HTTP auth/rate/model/provider failures, secure credential
cleanup complete. The next GLM step, if pursued, should be fixture-only
diagnostic parser instrumentation or provider-response-shape strategy, not
another real API window.

Fixture-only GLM health response-shape strategy was then implemented in
`packages/inference-adapter-glm-runtime/src/health-response-shape-strategy.ts`
and documented in `docs/glm-health-response-shape-strategy.md`. It classifies
only sanitized structural metadata: top-level shape, choices/message envelope,
finish reason, content category, content length bucket, JSON extraction class,
health signal class, unsafe signal counts, recommendations, and reason codes.
It does not widen the runtime parser, access credentials, call GLM, persist raw
content, or authorize another runtime window. Focused GLM build and tests
passed for the health parser plus response-shape strategy: `35` tests.

A new exact-scope shape-only GLM health diagnostic approval request has been
drafted in
`docs/glm-standard-paas-v4-shape-only-health-diagnostic-approval-request.md`.
It was approved, implemented, and pre-run verified. The runner is
`tests/glm-standard-paas-v4-shape-health-diagnostic.cjs`, the smoke guard is
`tests/glm-standard-paas-v4-shape-health-diagnostic-smoke.mjs`, and the one
approved real command was
`npm.cmd run diagnostic:heavy-planner:glm-standard-shape-health` with
`JARVIS_K_ENABLE_HEAVY_PLANNER_GLM=1` and
`JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_SHAPE_HEALTH_ONE_WINDOW_APPROVED=1`.
Pre-run gates passed with no credential, secure-store, or network access. The
one real shape-only window was then run once and consumed with
`status=shape_captured`, `accepted=true`, `elapsedMs=1783`, `requestCount=1`,
no timeout/connection/HTTP auth/rate/model/provider failures, credential
cleared, no raw request/response/content persistence, and no
default/UI/IPC/telemetry/release behavior changes.

Captured shape: top-level `object`, `chat_completion_choices`, one assistant
message, `finishReasonShape=length`, `contentShape=empty_string`,
`contentLengthBucket=zero`, `jsonExtractionShape=not_attempted`,
`healthSignalShape=missing_health_signal`, and all unsafe signal counts `0`.
This explains the prior `invalid_minimal_response` evidence as a provider
response-shape/output-bound issue, not a network/auth/rate/model/provider
availability issue. Do not run any other GLM health, acceptance, model,
endpoint, or provider window without a new exact-scope approval.

Fixture-only GLM health prompt/output-bound strategy was then implemented in
`packages/inference-adapter-glm-runtime/src/health-prompt-output-bound-strategy.ts`
and documented in `docs/glm-health-prompt-output-bound-strategy.md`. For the
observed `finishReasonShape=length`, `contentShape=empty_string`, and
`healthSignalShape=missing_health_signal` shape, it selects
`compact_json_object_128`: keep `standard_paas_v4 / glm-4.7` fixed, keep one
request/no retries, reduce the health prompt payload, raise only the tiny
health output budget from `64` to `128`, preserve fail-closed empty-content
handling, and avoid Heavy Planner acceptance. Focused GLM build and tests
passed for health prompt/output, response-shape, and parser strategy: `38`
tests. No credential, secure-store, or network access was used.

A new exact-scope compact health approval request has been drafted in
`docs/glm-standard-paas-v4-compact-json-128-health-approval-request.md`. It is
now approved, implemented, and pre-run verified. The runner is
`tests/glm-standard-paas-v4-compact-health-diagnostic.cjs`, the smoke guard is
`tests/glm-standard-paas-v4-compact-health-diagnostic-smoke.mjs`, and the one
approved real command was
`npm.cmd run diagnostic:heavy-planner:glm-standard-compact-health` with
`JARVIS_K_ENABLE_HEAVY_PLANNER_GLM=1` and
`JARVIS_K_HEAVY_PLANNER_GLM_STANDARD_COMPACT_HEALTH_ONE_WINDOW_APPROVED=1`.
Pre-run gates passed with no credential, secure-store, or network access. The
one real compact health window was then run once and consumed with
`status=degraded`, `diagnosticStatus=timeout`, `elapsedMs=20014`,
`requestCount=1`, `transportFailureCounts.timeout=1`, no HTTP auth/rate/model/
provider failures, credential cleared, no raw request/response/content
persistence, and no default/UI/IPC/telemetry/release behavior changes. Do not
run any other GLM health, acceptance, model, endpoint, or provider window.

Current GLM interpretation: `standard_paas_v4 / glm-4.7` is reachable and
authenticated. The `64` token shape-only window returned quickly but with
`finishReasonShape=length` and `contentShape=empty_string`; the compact `128`
window timed out. Do not proceed to Heavy Planner acceptance. If GLM remains
worth investigating, the next work should be fixture-only provider/model
strategy or a separate exact approval for a different model/profile, not
another rerun of the same compact window.

Fixture-only GLM provider/model strategy was then implemented in
`packages/inference-adapter-glm-runtime/src/provider-model-strategy.ts` and
documented in `docs/glm-provider-model-strategy-after-compact-timeout.md`.
Using only sanitized evidence, it deprioritizes `standard_paas_v4 / glm-4.7`,
keeps `standard_paas_v4` fixed, preserves one-request/no-retry JSON health
probe boundaries, and selects `glm-4.7-flash` as the next low-latency health
candidate if GLM continues. `glm-4.7-flashx` remains secondary, while
`glm-5-turbo` and `glm-5.2` are deferred quality candidates. Focused GLM build
and provider/model strategy tests passed: `13`. No credential, secure-store,
or network access was used.

The project direction then shifted from continuing one-off GLM probes to a
provider-neutral OpenAI-compatible Heavy Planner layer. A new fixture-only
approval request was drafted in
`docs/openai-compatible-heavy-planner-fixture-only-approval-request.md`. It
was approved and implemented. The fixture layer is in
`packages/inference-adapter-openai-planner/src/openai-compatible.ts`, tests are
in `packages/inference-adapter-openai-planner/test/openai-compatible.test.ts`,
and docs are in
`docs/openai-compatible-heavy-planner-fixture-only-implementation.md`. It adds
default-off fixed profile metadata and fixture-only normalization for
OpenAI-compatible candidates such as OpenAI, DeepSeek, Qwen/DashScope, and
GLM, while preserving Qwen/rules fallback and direct-action safety. Focused
OpenAI planner build and tests passed: `15`. It does not authorize
credentials, secure-store access, network/API calls, provider activation,
UI/IPC, telemetry, defaults, installer/update, packaging, release behavior, or
real diagnostic windows.

Focused verification later passed again:

```powershell
npm.cmd run build:inference-adapter-openai-planner
npx.cmd vitest run packages/inference-adapter-openai-planner/test/openai-compatible.test.ts packages/inference-adapter-openai-planner/test/provider.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

A follow-up Core Host fixture-only composition scope was approved, implemented,
and verified on 2026-08-08:

- approval/evidence:
  `docs/openai-compatible-heavy-planner-core-host-fixture-composition-approval-request.md`;
- helper:
  `apps/core-host/src/openai-compatible-heavy-planner-composition.ts`;
- focused tests:
  `apps/core-host/test/openai-compatible-heavy-planner-composition.test.ts`.

The composition helper selects only fixed default-off OpenAI, DeepSeek, Qwen,
and GLM fixture profiles; emits sanitized composition reports; and constructs
only an injected fixture transport provider after all fixture-only gates pass.
It does not authorize or include credentials, secure-store access, network/API
calls, runtime activation, UI/IPC, telemetry, defaults, installer/update,
packaging, release behavior, or real diagnostics. Core Host build passed;
three focused composition test files with nine tests passed; boundary,
sensitive-artifact, and whitespace checks passed.

## Stage 5 Product Alpha Hardening

Stage 5 is approved, implemented, and verified as developer-alpha evidence:

`docs/stage-5-product-alpha-hardening-approval-request.md`

Implemented:

- opt-in one-session sanitized structured history;
- bounded read-only existing Memory context;
- blocked/degraded retry and rollback affordances that re-enter existing
  safety gates;
- opt-in local TTS playback after successful safe results;
- dangerous tools remaining default-off;
- focused contracts, CoreRuntime, UI, and desktop smoke coverage.

The implemented session history is capped at 12 entries, Core-process
in-memory only, and contains no raw command/transcript/Memory/provider data.
Its clear command affects only that in-memory projection. Memory context
contains only read-only status/count/dimension metadata. Local TTS is default
off, user-controlled, bounded, cancelable, and uses browser speech synthesis
only after a completed safe result.

Stage 5 adds no credentials/secure-store, cloud or model runtime, network,
Memory write/schema migration, real tool execution, telemetry, default,
installer/update, packaging, or release behavior. Do not combine later
product work with a GLM runtime window or real tool execution without a new
exact-scope approval.

A separate one-window Stage 5 local manual acceptance approval request is
drafted and pending in:

`docs/stage-5-product-alpha-manual-acceptance-approval-request.md`

It covers at most five local developer-alpha text inputs, read-only Memory context,
in-memory history clear, safe retry/rollback-view behavior, and explicit
local-only TTS after a completed safe result. It explicitly excludes live
microphone/ASR provider use, cloud providers, model runtime, credentials,
Memory writes, real tool execution, and release behavior.

That original Stage 5 manual window is approved but not started and not
consumed. Preflight found that ordinary BrainCommand processing writes accepted
messages through the existing local SQLite Memory repository, contrary to the
no-Memory-write Security condition. No desktop session or manual input was
started.

The replacement exact-scope request is:

`docs/stage-5-product-alpha-manual-acceptance-temporary-memory-approval-request.md`

It permits one newly created temporary DB for at most five fixed benign
BrainCommand calls and ten message records, with provider/vector/retrieval
paths disabled and verified temporary-DB cleanup. The window was executed
once and accepted with these sanitized results:

- command count: `5`;
- message count: `10`;
- temporary DB created: `true`;
- temporary DB cleanup verified: `true`;
- session history before clear: `5`;
- session history after clear: `0`;
- retry safety path: `preserved`;
- rollback view: `cleared`;
- TTS status: `unavailable`;
- voice capture used: `false`;
- credential exposed: `false`;
- secure-store access disabled: `true`;
- provider runtime used: `false`;
- model runtime used: `false`;
- network accessed: `false`;
- vector retrieval activated: `false`;
- direct action attempted: `false`;
- telemetry changed: `false`;
- default behavior changed: `false`;
- release behavior changed: `false`.

The original no-Memory-write manual approval was not started or consumed.

## Verification And Release Discipline

For every implementation wave:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
```

Add focused commands for touched surfaces:

```powershell
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npm.cmd run smoke:desktop:ui-interaction
```

Do not claim CI-green unless CI was actually run and passed. Do not push
unrelated dirty changes merely to make the branch look clean. Before a commit,
separate Stage 4/GLM changes from unrelated accumulated work and inspect the
staged diff.

## Hard Safety Rules

- No raw API keys, tokens, signed URLs, response bodies, stack traces, private
  paths, raw vectors, model internals, or user-private data in output/docs.
- No secret through chat, argv, environment variables, plaintext files, UI,
  renderer, preload, or telemetry.
- No real API/network/runtime/cache/artifact execution without exact approval.
- No tool output bypasses schemas, allowlists, confirmation, or executor-only
  side effects.
- No changes to Bailongma or OpenClaw reference projects.
- No broad phase expansion simply because a local fixture test passes.
- Preserve deterministic rules fallback whenever Qwen/cloud providers are
  unavailable, invalid, disabled, or degraded.
- When uncertain, stop and create a narrow approval request rather than
  widening an existing one.

## First Message For The New Conversation

Use this as the opening instruction:

```text
Read C:\Users\Administrator\Documents\Jarvis-k\docs\jarvis-k-next-conversation-handoff-2026-08-07.md completely. Treat it as the current source of truth; do not rely on the older handoff.md. Start by checking the dirty worktree without reverting anything. Stage 4 Tool Registry Product Loop and Stage 5 Product Alpha Hardening are implemented as developer-alpha evidence only. GLM `glm-4.7` windows are consumed and should not be rerun; fixture-only GLM provider/model strategy selects `standard_paas_v4 / glm-4.7-flash` only as a future exact-approved low-latency candidate. Provider-neutral OpenAI-compatible Heavy Planner fixture layer is approved and implemented in `packages/inference-adapter-openai-planner/src/openai-compatible.ts`. The approved Core Host fixture-only composition is implemented and verified in `apps/core-host/src/openai-compatible-heavy-planner-composition.ts`; its evidence is in `docs/openai-compatible-heavy-planner-core-host-fixture-composition-approval-request.md`. Stage 5 evidence is in `docs/stage-5-product-alpha-hardening-approval-request.md`. Do not configure credentials, access secure-store, call APIs, activate providers, or run any GLM/DeepSeek/Qwen/OpenAI runtime window without new exact-scope approval. The next decision is a separately approved product manual-acceptance window, a narrow hardening increment, or one separately approved provider health window.
```
