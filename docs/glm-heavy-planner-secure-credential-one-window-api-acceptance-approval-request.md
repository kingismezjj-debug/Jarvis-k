# GLM Heavy Planner Secure Credential and One-Window API Acceptance Approval Request

Recorded: 2026-08-07

## Status

`ONE_WINDOW_BLOCKED_NO_NETWORK_RERUN_REQUIRES_NEW_APPROVAL`

All three exact approvals were recorded on 2026-08-07. The one approved real
API window was consumed on 2026-08-07 and stopped before any provider call.
It must not be rerun without a new exact-scope approval.

## Recorded Approvals

```text
Product: APPROVE exactly this GLM Heavy Planner provider composition, scoped secure credential storage, and one-window API acceptance scope using fixed heavy-planner.glm / glm-4.7, with Qwen/rules fallback preserved, bounded BrainPlan output only, and no direct action execution

Security: APPROVE exactly this bounded fail-closed heavy-planner.glm secure-credential and one-window API scope using only the fixed GLM Chat Completions origin/model, secure-store-only credential loading, gated network access, sanitized evidence, no raw prompt/response persistence, and executor-only side effects

Release: APPROVE developer-alpha implementation, mocked evidence, and one fixed three-prompt GLM API acceptance window only; no default/UI/IPC/telemetry/installer/update/release changes
```

## Goal

Request exact Product, Security, and Release approval for the next
developer-alpha Heavy Planner step:

- compose one real GLM provider for `heavy-planner.glm`;
- store one developer-provided GLM API credential only through the approved
  desktop secure-storage path;
- keep the provider default-off behind explicit gates; and
- run exactly one fixed, three-prompt real API acceptance window after mocked
  implementation evidence passes.

This request does not authorize a product default, release behavior, direct
action execution, UI/IPC exposure, telemetry, persistent planner memory,
tester expansion, or secondary provider fallback.

## Fixed Provider Profile

The approved profile is exactly:

- provider id: `heavy-planner.glm`;
- provider family: GLM Chat Completions;
- fixed model id: `glm-4.7`;
- fixed official GLM API origin only, with no custom base URL;
- one non-streaming JSON-object response per call;
- no declared tools, function calls, provider-side action execution, model
  failover, endpoint override, or model override; and
- maximum output tokens: `1024`.

The implementation must reject a provider, origin, protocol, or model
mismatch before any network call. It must not discover models, validate an
account, inspect billing/quota, or probe availability outside the one approved
acceptance window.

## Completed Prerequisite

The fixture-only GLM implementation is complete and frozen:

- `heavy-planner.glm` has bounded request construction and local
  `BrainPlannerResult` validation;
- malformed, invalid, unsafe, tool/function-call, direct-action, and
  unconfirmed-risk results fail closed;
- Qwen and deterministic-rules fallback are preserved;
- the fixture composition is default-off and absent from the default Core Host
  process path; and
- no real credential, secure store, endpoint, network, model runtime, UI/IPC,
  default, telemetry, or release behavior was used.

This request does not reopen, alter, or consume the prior OpenAI provider
scope or its configured credential.

## Implementation and Mocked Evidence

The approved implementation is present and remains default-off:

- `packages/inference-adapter-glm-runtime` owns the fixed
  `heavy-planner.glm` / `glm-4.7` Chat Completions transport, bounded request
  construction, response parsing, and fail-closed classifications;
- `apps/core-host/src/glm-heavy-planner-runtime-composition.ts` constructs a
  provider only after every fixed-profile, secure-store, credential,
  one-window, parser, bounds, fallback, and executor-only gate passes;
- `apps/desktop/src/secure-heavy-planner-provider-store.ts` isolates the GLM
  secure-store record from the OpenAI record; and
- `scripts/configure-heavy-planner-glm-credential.cjs` accepts a credential
  only from an attached terminal with masked input. It passes the value only
  through a bounded private in-memory child-process message channel to a
  no-UI Electron main-process store helper, which applies the existing
  OS-backed encryption.

Sanitized local evidence completed before runtime:

- targeted GLM runtime, fixture, composition, wiring, boundary, and
  secure-store regressions: `7` files and `57` assertions passed;
- GLM runtime TypeScript build passed;
- credential configuration smoke passed without a credential or network. It
  verifies that a non-interactive invocation fails before Electron or secure
  storage can start. The no-credential store-helper probe also returns a
  nonzero exit with a sanitized input-error code, and the private
  child-process message channel has a fixture-only regression probe;
- acceptance-runner smoke passed without Electron, a credential, or network;
- dependency-boundary and sensitive-artifact guards passed; and
- no raw request, response, credential, endpoint, account, or provider
  diagnostic was recorded.

The acceptance runner requires all three temporary gates, uses exactly the
three fixed sanitized prompts, stops at three provider calls, and removes the
GLM secure-store record after the window. It verifies that the record is
unconfigured before reporting cleanup as complete. A cleanup failure is
reported as degraded and consumes the window.

## One-Window Result

The approved window stopped during local runtime construction:

- status: `blocked` as emitted by the original runner;
- provider calls: `0`;
- prompt count: `0`;
- network/API called: `false`;
- direct action attempted: `false`;
- default, UI/IPC, telemetry, and release behavior changed: `false`;
- secure credential cleanup: `complete`, with the record verified
  unconfigured; and
- original emitted reason:
  `GLM_HEAVY_PLANNER_API_ACCEPTANCE_FAILED`; the subsequent sanitized offline
  classification is `GLM_HEAVY_PLANNER_RUNTIME_CONSTRUCTION_FAILED`.

Offline diagnosis found an acceptance-runner-only positional-argument error:
one optional `CoreRuntime` slot was missing, shifting the heavy planner into
the Brain Router slot before any request could be made. The runner is now
corrected through an acceptance-only Core Host runtime factory. A
fixture-only regression verifies that the fake planner receives `plan()` in
the intended slot after exactly 21 optional `CoreRuntime` arguments. Future
local failures are classified by sanitized stage. This implementation
correction does not authorize another runtime attempt.

## Exact Implementation Scope

After all three approvals are received, implement only:

- a separate GLM runtime transport and composition path, leaving the
  fixture-only adapter usable for offline regression tests;
- a fixed-origin, fixed-model, non-streaming GLM Chat Completions request
  shape containing bounded messages, `temperature: 0`, JSON-object response
  mode, output limit `1024`, and no tool/function declarations;
- local output extraction and validation into the existing bounded
  `BrainPlannerResult` and `BrainPlan` contracts;
- fail-closed classification for authentication/authorization rejection, rate
  limit, model unavailable, provider unavailable, provider execution failure,
  invalid output, and unsafe output;
- a GLM-specific secure-store record that is distinct from the OpenAI record,
  cannot read/migrate/reuse the OpenAI credential, and is accessible only from
  desktop-main through the existing supervised Core Host configuration path;
- sanitized credential-state reporting limited to store
  available/unavailable, configured/not configured, and fixed reason codes;
- explicit Core Host composition gates for provider identity, fixed profile,
  secure-store availability, credential configured/not exposed, one-window
  approval, contract/parser/bounds readiness, default-off preservation,
  Qwen/rules fallback preservation, and executor-only side effects;
- mocked transport and regression coverage for the fixed profile, credential
  isolation, unavailable/error classifications, invalid/unsafe output,
  fallback preservation, and default-off behavior;
- one interactive developer-only secure credential configuration command that
  accepts input only from an attached terminal, never accepts a command-line
  argument or environment variable, and never prints the credential; and
- sanitized implementation and acceptance evidence documentation.

No implementation may construct, configure, or register the GLM runtime
provider in the default Core Host process path unless every required
one-window gate is true.

## Secure Credential Boundaries

The GLM credential may be:

- entered once by the local developer through the approved attached-terminal
  configuration path after implementation gates pass;
- encrypted by the existing OS-backed desktop secure-storage pattern;
- loaded only in desktop-main for the one-window process; and
- delivered only through the existing supervised, in-memory Core Host
  configuration channel.

The GLM credential must not be:

- accepted through UI, IPC, preload, environment variables, command-line
  arguments, plaintext files, repository files, model cache, logs, test
  fixtures, snapshots, documentation, or evidence;
- exposed to the renderer, browser, local tools, action executor, Memory,
  observability surface, telemetry, installer, updater, or release channel;
- migrated from, written into, read from, or associated with an OpenAI
  credential record; or
- reused after the fixed acceptance window ends.

## One-Window Runtime Acceptance

After the implementation and mocked tests pass, authorize exactly one local
developer acceptance run:

- one provider: `heavy-planner.glm`;
- one fixed model: `glm-4.7`;
- one locally configured GLM credential loaded only from the approved secure
  store;
- three fixed sanitized prompt categories: complex, underspecified, and
  high-impact;
- maximum prompt count: `3`;
- maximum provider call count: `3`;
- timeout per call: `30 seconds`;
- retry count: `0`;
- no streaming;
- no tool/function declaration or execution;
- no browser, local-app, shell, filesystem, network tool, Memory/vector
  write, OCR, voice, or other side effect;
- expected result labels: `planned`, `clarify`, and `blocked`;
- accepted result types: bounded `BrainPlan`, clarify, blocked, or
  unavailable only; and
- immediate stop after the third call or the first stop condition.

The acceptance run may record only sanitized status labels, counts, fixed
reason codes/failure classes, gate booleans, and boundary booleans. It must
not record prompts, request bodies, responses, headers, credentials,
endpoints, request IDs, account metadata, billing/quota details, stack
traces, private paths, hidden reasoning, model internals, or user-private
data.

## Required Gates

The GLM provider must fail closed without a network call unless all of these
are true:

- `heavyPlanner.enablement.explicit`;
- `heavyPlanner.provider.exactlyApproved`;
- `heavyPlanner.profile.fixedOriginAndModel`;
- `heavyPlanner.secureCredentialStore.available`;
- `heavyPlanner.credential.configured`;
- `heavyPlanner.credential.notExposed`;
- `heavyPlanner.network.oneWindowApproved`;
- `heavyPlanner.contract.ready`;
- `heavyPlanner.parser.ready`;
- `heavyPlanner.timeoutAndOutputBounds.ready`;
- `heavyPlanner.defaultOffPreserved`;
- `heavyPlanner.qwenRulesFallbackPreserved`; and
- `heavyPlanner.executorOnlySideEffectsPreserved`.

Any missing gate must return only a sanitized unavailable/unconfigured
report. It must not call the provider or read any credential outside the
approved secure-store load.

## Required Safety Invariants

The implementation and acceptance window must preserve:

- `directActionAttempted=false`;
- no planner result passed directly to an executor;
- no unsupported tool id, arbitrary URL, shell command, executable code, or
  hidden side effect accepted into `BrainPlan`;
- confirmation required for medium, high, and blocked plan or step risk;
- Qwen/rules fallback when GLM is disabled, unconfigured, unavailable,
  invalid, unsafe, blocked, rate-limited, or failed;
- no GLM-to-OpenAI, OpenAI-to-GLM, or other cross-provider automatic
  fallback;
- no raw request/response or provider diagnostic persistence;
- default behavior unchanged;
- UI/IPC behavior unchanged;
- telemetry unchanged; and
- release behavior unchanged.

## Stop Conditions

Stop immediately and request a new exact-scope approval before continuing if:

- any approval line is missing or differs from this request;
- the provider, model, protocol, origin, prompt count, call count, timeout,
  retry count, or output bound differs;
- a credential would be accessed outside the approved secure store or exposed
  in any form;
- a network/API call would occur before all one-window gates pass;
- a raw prompt, request, response, header, credential, endpoint, request ID,
  account/billing/quota detail, stack trace, private path, or user-private
  data would enter output or evidence;
- an output cannot be parsed safely, attempts a tool/function call, includes
  direct action, bypasses confirmation, or violates the allowlist/executor
  boundary;
- any tool/action, UI/IPC, telemetry, default, installer, update, packaging,
  release, Qwen runtime/cache, OpenAI credential, or secondary provider
  behavior would change;
- cleanup or evidence sanitization is uncertain; or
- the result is `degraded` or `blocked`.

Any stopped or degraded acceptance consumes this approval and requires a new
exact-scope approval before another GLM runtime attempt.

## Explicitly Not Authorized

This request does not authorize:

- a provider other than `heavy-planner.glm`;
- a model other than `glm-4.7`;
- a custom, alternate, or user-supplied endpoint;
- GLM account creation, billing, quota inspection, model discovery, or
  availability probing outside the fixed window;
- more than one runtime acceptance window, three prompts, or three calls;
- credential UI, settings exposure, renderer/preload access, environment
  configuration, or plaintext credential storage;
- product-default enablement;
- secondary provider fallback;
- tool execution or action execution;
- persistent planner session/transcript/Memory storage;
- UI/IPC, telemetry, analytics, installer, update, packaging, release
  channel, product availability, or production-readiness changes; or
- a rerun after this window.

## Controlled Runtime Step

The prior credential was cleared as part of the consumed window. Do not
configure a new credential or retry the command until a new exact-scope
Product, Security, and Release approval has been recorded.

After a new approval, the remaining prerequisite will be a local developer
configuring the GLM credential through the attached-terminal command:

```powershell
npm.cmd run configure:heavy-planner:glm-credential
```

The command now uses Node for the masked terminal interaction and only starts
a no-UI Electron secure-store helper after the two entered values match. A
real attached-terminal configuration has not yet been performed. Terminal and
private child-process message errors are classified with sanitized reason
codes before any credential record can be written.

The credential must not be pasted into chat, supplied through an environment
variable, or written to a file. After configuration is locally confirmed, run
the one approved window from the same attached terminal with all three
temporary gates set to `1`:

```powershell
$env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED = "1"
$env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED = "1"
npm.cmd run acceptance:heavy-planner:glm
Remove-Item Env:JARVIS_K_ENABLE_HEAVY_PLANNER_GLM
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ONE_WINDOW_APPROVED
Remove-Item Env:JARVIS_K_HEAVY_PLANNER_GLM_ACCEPTANCE_APPROVED
```

The window stops after the third provider call or any stop condition. Do not
rerun after a blocked, degraded, or completed result; its secure credential
record is removed and separately verified during cleanup.
