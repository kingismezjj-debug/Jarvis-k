# GLM Heavy Planner Fixture-Only Implementation Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED`

## Sanitized Fixture Evidence

Scope id: `glm-heavy-planner-fixture-only-implementation`

Status: `passed`

Accepted: `true`

Provider id: `heavy-planner.glm`

Evidence summary:

- bounded offline fixture suite: `38 passed`;
- bounded build steps: `5 passed`;
- dependency-boundary guard: `passed`;
- sensitive-artifact guard: `passed`;
- GLM forbidden-surface static scan: `passed`;
- adapter fixture coverage: `20` cases;
- Core Host composition coverage: `3` cases;
- default runtime wiring regression: `1` case; and
- dependency-boundary regression coverage: `14` cases.

Verified behavior labels:

- default-off composition: `disabled`;
- fully injected fixture composition: `available`;
- provider-unavailable selection: `unavailable`;
- fallback provider: `brain.rules`;
- GLM failure classifications: `authentication_rejected`, `rate_limited`,
  `model_unavailable`, `provider_unavailable`,
  `provider_execution_failed`, `invalid_output`, and `unsafe_output`;
- tool/function-call, unsupported-tool, and direct-action output: rejected;
  and
- medium, high, and blocked plan or step risks without confirmation: rejected.

Boundary evidence:

```text
directActionAttempted: false
realApiCalled: false
credentialExposed: false
networkUsed: false
modelRuntimeAccessed: false
defaultBehaviorChanged: false
uiIpcBehaviorChanged: false
telemetryChanged: false
releaseBehaviorChanged: false
qwenRulesFallbackPreserved: true
```

No real credential, secure store, network, endpoint, model runtime, prompt,
request, response, provider diagnostic, or action side effect was used or
retained. This evidence does not authorize a GLM runtime, credential, UI, IPC,
default, or release change.

## Approval Record

Approved: 2026-08-07

```text
Product: APPROVE exactly this GLM Heavy Planner fixture-only implementation scope with a default-off heavy-planner.glm adapter, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded fail-closed GLM fixture-only adapter and Core Host composition scope with no real credential, secure-store, network, endpoint, model runtime, raw provider diagnostic, or side effect access

Release: APPROVE implementation and fixture evidence only; no GLM runtime, credential UI/storage, default/UI/IPC/telemetry/installer/update/release changes
```

## Goal

Prepare `heavy-planner.glm` as a bounded developer-alpha Heavy Planner
candidate for Jarvis-K without contacting GLM or configuring a real credential.

The fixture-only implementation should prove that a GLM Chat
Completions-shaped request can be converted into the existing bounded
`BrainPlannerResult` and `BrainPlan` contracts. It must preserve the current
Qwen Fast Router and deterministic-rules fallback, and it must never execute
an action.

This is an implementation and fixture-evidence request only. It is not a GLM
runtime, credential, network, endpoint, model-selection, UI, or release
request.

## Context

Already completed:

- provider-neutral Heavy Planner contracts and fixture fallback;
- bounded `BrainPlannerResult` and `BrainPlan` validation;
- executor-only side-effect boundary;
- Qwen/rules fallback preservation;
- default-off OpenAI Heavy Planner composition; and
- a consumed OpenAI one-window acceptance that produced sanitized
  `unavailable` evidence without affecting defaults or action execution.

The OpenAI implementation remains unchanged and default-off. This scope adds
no automatic OpenAI-to-GLM fallback and does not activate, delete, migrate, or
reuse OpenAI credentials.

## Exact Implementation Scope

Approve exactly this fixture-only scope:

- add a `heavy-planner.glm` provider id and a GLM-specific planner adapter;
- model the GLM adapter as an injected, fixture-only Chat
  Completions-shaped transport with bounded `messages`, bounded output token
  settings, deterministic decoding controls, JSON-object response mode, and
  no declared tools or function calls;
- parse only fixture response shapes that contain a bounded assistant content
  string, then validate the content locally as `BrainPlannerResult`;
- reuse or extract only pure local planner validation needed to avoid
  duplicating allowed-tool, risk, confirmation, and
  `directActionAttempted=false` enforcement;
- reject malformed response shapes, invalid JSON, extra unsafe output,
  unsupported tool ids, tool/function-call responses, direct-action attempts,
  missing confirmation requirements, and unrecognized failure diagnostics;
- map fixture provider failures into a fixed sanitized GLM failure taxonomy,
  including unavailable, rate-limited, authentication/authorization rejected,
  model unavailable, invalid output, and provider execution failure;
- add a default-off Core Host GLM composition helper that can be constructed
  only with an injected fixture transport and fixture credential value;
- preserve Qwen/rules fallback whenever the GLM provider is absent,
  unconfigured, unavailable, invalid, unsafe, blocked, or throws;
- add fixture-only adapter, composition, and Core fallback regression tests;
- add sanitized fixture evidence documentation; and
- preserve all existing OpenAI adapter behavior and tests.

## Mandatory Bounds

The implementation must keep all of the following true:

- no real GLM, OpenAI, or other provider API call;
- no network access, `fetch`, WebSocket, HTTP client, helper, subprocess, or
  model runtime execution;
- no real credential, credential lookup, credential migration, environment
  secret, Electron `safeStorage`, keychain, or persistent cache access;
- no GLM endpoint, account, organization, billing, quota, request id, or
  raw provider diagnostic persistence;
- no raw prompt, raw request, raw response, header, private path,
  user-private data, hidden reasoning, model internals, vectors, logits, or
  benchmark data in evidence;
- no tool execution, browser action, local-app launch, shell, filesystem,
  network, Memory, vector, OCR, voice, or action side effect;
- no Desktop IPC, preload, settings, UI, telemetry, analytics, installer,
  update, packaging, release-channel, or product-default behavior change;
- no Qwen model/runtime/cache access or rerun;
- no OpenAI credential read, write, migration, or runtime retry; and
- no automatic cross-provider fallback.

## Required Fixture Coverage

Fixture tests must cover at least:

- bounded GLM-shaped request construction with no tool/function declaration;
- valid planned, clarify, and blocked planner results;
- unavailable, rate-limited, authorization-rejected, model-unavailable, and
  provider-execution failure classification;
- malformed Chat Completions response shape and invalid JSON;
- rejection of unsupported tool ids and direct-action attempts;
- rejection of a tool/function-call response;
- confirmation enforcement for medium, high, and blocked risk;
- Qwen/rules fallback preservation;
- default-off composition behavior; and
- evidence sanitization with no fixture credential or raw provider response
  retained.

## Stop Conditions

Stop immediately and request a new approval before continuing if:

- a real GLM key, real endpoint, network request, account verification, or
  model availability check is needed;
- a real credential store, Electron API, or environment secret would be
  accessed;
- the GLM adapter would execute a tool or bypass the executor, action
  allowlist, confirmation policy, or existing safety gates;
- any raw provider response or non-whitelisted diagnostic could enter logs,
  tests, docs, snapshots, or evidence;
- a default, UI/IPC, telemetry, release, installer, update, or packaging
  behavior would change;
- Qwen or OpenAI runtime/cache behavior would be touched; or
- fixture tests cannot prove fail-closed fallback behavior.

## Explicitly Not Authorized

This request does not authorize:

- GLM account creation, billing, key creation, key storage, key entry, or key
  validation;
- real GLM endpoint selection, model selection, API call, or network test;
- a real GLM runtime acceptance window;
- secure-store implementation or Desktop credential UI for GLM;
- OpenAI runtime retry, OpenAI credential use, or OpenAI-to-GLM forwarding;
- any action execution from planner output;
- Memory, voice, OCR, local-app, browser, shell, filesystem, or network tool
  execution;
- settings/UI/IPC exposure, telemetry, analytics, installer, update,
  packaging, release-channel, or default behavior changes; or
- broader tester or user-task expansion.

## Sanitized Evidence Contract

The fixture closeout may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- accepted boolean;
- provider id;
- fixed fixture test counts and pass/fail status;
- fixed selection statuses, reason codes, and failure classes;
- per-sample expected/actual status labels;
- direct action attempted boolean;
- real API called boolean;
- credential exposed boolean;
- network used boolean;
- default/UI/IPC/telemetry/release changed booleans; and
- a sanitized fallback-preserved boolean.

It must not contain raw prompts, raw requests, raw responses, credentials,
tokens, endpoints, URLs, account metadata, billing/quota information, private
paths, stack traces, hidden reasoning, model internals, vectors, logits,
benchmarks, or user-private data.

## Approval Lines To Provide

```text
Product: APPROVE exactly this GLM Heavy Planner fixture-only implementation scope with a default-off heavy-planner.glm adapter, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this bounded fail-closed GLM fixture-only adapter and Core Host composition scope with no real credential, secure-store, network, endpoint, model runtime, raw provider diagnostic, or side effect access

Release: APPROVE implementation and fixture evidence only; no GLM runtime, credential UI/storage, default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement only the
fixture-only GLM adapter, injected fixture transport, pure local parser and
failure classification, default-off Core Host composition helper, regression
tests, and sanitized closeout evidence. Do not configure a credential or run
GLM.
