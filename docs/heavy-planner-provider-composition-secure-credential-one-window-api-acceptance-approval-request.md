# Heavy Planner Provider Composition, Secure Credential Storage, and One-Window API Acceptance Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED_RUNTIME_WINDOW_BLOCKED`

This document requests Product, Security, and Release approval for the next
Brain Runtime Spine step after the frozen Stage 3 Heavy Planner Fallback
fixture/simulated closeout.

This request covers a bounded developer-alpha scope for:

- real Heavy Planner provider composition;
- secure credential storage and sanitized credential-status reporting; and
- exactly one fixed-window real API acceptance run after implementation is
  ready and all gates pass.

This approval is not a product default approval. It is not a release approval.
It does not authorize tool execution from planner output, UI/IPC exposure,
telemetry, persistent planner memory, broad tester expansion, installer,
update, release-channel, or production behavior.

## Context

Already completed and frozen:

- provider-neutral `HeavyPlannerProvider` port;
- bounded `BrainPlannerRequest` and `BrainPlannerResult` contracts;
- bounded `BrainPlan` and `BrainPlannedToolStep` contracts;
- sanitized planner selection evidence on `BrainCommandResult`;
- `directActionAttempted=false` enforcement;
- fixture planner provider;
- Core runtime fallback hooks for complex, clarify, and low-confidence
  routing cases;
- invalid/unsafe/unavailable planner fallback classification;
- Qwen/rules fallback preservation; and
- no tool execution from planner output.

The next step should prove that Jarvis-K can compose one real API-backed heavy
planner provider through secure credential gates while preserving the same
bounded `BrainPlan` contract and fail-closed behavior.

## Provider Choice for This Request

Approve one provider family only for the first real API window:

- provider id: `heavy-planner.openai`;
- provider type: API-backed heavy planner;
- accepted output: bounded `BrainPlan` JSON only;
- no raw provider response persistence; and
- no direct action execution.

No GLM, Anthropic, Volcengine, Qwen-cloud, local model runtime, or secondary
fallback API provider is included in this approval. A different provider
requires a separate exact-scope approval.

## Exact Approval Requested

Approve exactly this developer-alpha implementation and one-window acceptance
scope:

- add a real provider composition module for `heavy-planner.openai`;
- keep the provider default-off and unavailable unless explicit runtime
  enablement, secure credential readiness, planner contract readiness,
  parser readiness, timeout/retry bounds, and fallback preservation gates are
  all true;
- add secure credential storage for the provider key using the existing
  desktop secure storage pattern or an equivalent OS-backed secret store;
- expose only sanitized credential-status reports: configured/not configured,
  store available/unavailable, last validation status, and fixed reason
  codes;
- never expose raw keys, tokens, endpoints, organization IDs, account
  metadata, request IDs, or provider billing/quota details in diagnostics,
  logs, docs, IPC, tests, or evidence;
- add a real provider adapter that sends a bounded planner request and parses
  only bounded JSON into `BrainPlannerResult`;
- enforce output size, timeout, retry, and schema limits;
- reject invalid JSON, unsupported tool IDs, unsafe plans, missing
  confirmation flags, hidden execution requests, or direct-action attempts;
- preserve Qwen/rules fallback when the provider is disabled,
  unconfigured, unavailable, invalid, unsafe, timed out, quota-limited, or
  failed;
- add mocked-transport tests for success, clarify, invalid JSON, unsafe plan,
  credential missing, timeout, quota/rate-limit, provider error, and fallback
  preservation;
- after implementation passes fixture/mocked tests, run exactly one real API
  acceptance window using the approved provider, one configured developer
  credential, one fixed prompt set, bounded output, sanitized evidence, and no
  tool execution; and
- update docs with sanitized implementation and one-window evidence.

## Implementation Bounds Before Real API Window

Before the one-window API acceptance run, implementation may only use mocked
transport or fixture providers.

Allowed:

- provider composition code;
- secure credential storage code and tests using fake secrets;
- sanitized credential report code;
- request shaping and output parser code;
- mocked provider transport tests;
- Core runtime composition gates;
- fallback tests; and
- documentation updates.

Not allowed before the real API window:

- real API calls;
- live network access;
- use of real credentials;
- storing real credentials outside the approved secure store;
- planner session persistence;
- raw provider response persistence;
- UI/IPC exposure;
- tool execution;
- telemetry; or
- release/default behavior changes.

## One-Window Real API Acceptance Bounds

After implementation and mocked evidence pass, approve exactly one real API
acceptance window with these bounds:

- one local developer operator;
- one provider: `heavy-planner.openai`;
- one configured developer credential stored only in the approved secure
  store;
- no credential printed, logged, serialized, snapshotted, committed, or
  included in evidence;
- one fixed prompt set with no private user data and no broad tester input;
- maximum prompt count: `3`;
- maximum provider calls: `3`;
- timeout per call: `30 seconds`;
- maximum retry count: `0` unless the first call fails before request body
  submission, in which case exactly one retry is allowed;
- output must be parsed into `BrainPlannerResult`;
- accepted planner result must contain only bounded `BrainPlan` JSON,
  clarify, blocked, or unavailable status;
- planner output must not execute tools;
- medium/high/blocked risk steps must require confirmation;
- invalid JSON, invalid schema, unsafe plan, unsupported tool ID, timeout,
  rate limit, quota issue, credential failure, provider failure, or parser
  failure must fail closed;
- raw request body, raw prompt, raw response, headers, request IDs,
  credentials, endpoints, account metadata, stack traces, private paths, and
  user-private data must not be recorded;
- evidence must be sanitized; and
- the run ends immediately after the fixed prompt window completes or any
  stop condition is reached.

## Required Gates

The real provider must fail closed unless all required gates are true:

- `heavyPlanner.enablement.explicit`;
- `heavyPlanner.provider.exactlyApproved`;
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

Any missing gate must return unavailable/unconfigured report-shaped evidence
and must not call the provider.

## Stop Conditions

Stop immediately and do not continue to another prompt, provider call, retry,
or implementation expansion if any of these occur:

- any Product/Security/Release approval line is missing or differs from this
  exact scope;
- provider id differs from `heavy-planner.openai`;
- any credential would be exposed, logged, serialized, snapshotted,
  committed, or included in evidence;
- credential storage is not OS-backed or approved secure-store backed;
- network/API call happens before the one-window acceptance gate;
- more than three fixed prompts or three provider calls are attempted;
- raw prompt, raw request body, raw response, headers, request ID, endpoint,
  account metadata, stack trace, private path, or user-private data would be
  recorded;
- planner result cannot be parsed into `BrainPlannerResult`;
- output includes unsupported tool IDs, shell commands, executable code,
  hidden side effects, missing confirmation for medium/high/blocked risk, or
  `directActionAttempted=true`;
- planner output attempts to bypass executor, allowlist, confirmation policy,
  or safety gates;
- any tool, browser, app, shell, filesystem, network, Memory write, vector
  write, OCR, voice, UI/IPC, telemetry, installer, update, release, or
  product-default behavior is triggered by planner output;
- Qwen runtime/cache rerun is required;
- fallback preservation fails; or
- sanitized cleanup/evidence status is uncertain.

`degraded` and `blocked` are stopped-run evidence, not acceptance, and require
a fresh exact-scope approval before any rerun.

## Sanitized Evidence Contract

Implementation evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- accepted boolean;
- provider id;
- provider composition gate statuses;
- secure-store availability boolean;
- credential configured boolean;
- credential exposed boolean, which must be `false`;
- network/API called boolean;
- mocked test counts and pass/fail status;
- one-window prompt count and provider call count;
- per-sample expected/actual planner status;
- fixed reason codes and failure classes;
- direct action attempted boolean, which must be `false`;
- default behavior changed boolean;
- UI/IPC behavior changed boolean;
- telemetry changed boolean;
- release behavior changed boolean; and
- fallback preservation status.

Evidence must not contain raw prompts, raw request bodies, raw provider
responses, headers, request IDs, endpoints, credentials, tokens,
organization IDs, account metadata, billing/quota details, private paths,
stack traces, hidden reasoning, model internals, logits, vectors, benchmarks,
or user-private data.

## Explicitly Not Authorized

This approval does not authorize:

- any provider other than `heavy-planner.openai`;
- more than one real API acceptance window;
- broader prompt windows or tester expansion;
- product default enablement;
- UI/IPC exposure or settings toggles;
- telemetry, analytics, installer, update, packaging, release-channel, or
  production-readiness behavior;
- raw prompt or raw response persistence;
- planner session residency, persistent planner memory, or transcript
  persistence;
- tool execution, browser/local-app execution, shell/process/filesystem
  execution, network tool execution, Memory writes, vector writes, OCR, voice,
  or action execution from planner output;
- Qwen runtime/cache reruns;
- storing credentials in plaintext, repo files, logs, docs, env examples, test
  snapshots, or non-secure cache;
- exposing provider account metadata, quota details, request IDs, or
  endpoints in evidence;
- adding secondary cloud fallback providers; or
- production-readiness claims.

## Role Requests

**Product.** Approve exactly this developer-alpha Heavy Planner provider
composition, secure credential storage, and one-window API acceptance scope
for `heavy-planner.openai`. The planner may return bounded plans only. Qwen
and deterministic rules fallback must remain preserved. No product default,
tool execution, UI/IPC, tester expansion, or release behavior is authorized.

**Security.** Approve exactly this bounded fail-closed real-provider scope
with OS-backed or approved secure-store credential handling, credential
non-exposure, one-window network/API access only after all gates pass,
bounded request/output limits, sanitized evidence, no raw prompt/response
persistence, and executor-only side effects. Missing gates, invalid output,
unsafe plans, credential issues, timeout, quota/rate-limit, or provider
failure must fail closed.

**Release.** Approve developer-alpha implementation, mocked evidence, and one
fixed-window API acceptance evidence only. Exclude defaults, UI/IPC,
telemetry, installer, update, packaging, release-channel, product
availability, and production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Heavy Planner provider composition, secure credential storage, and one-window API acceptance scope for heavy-planner.openai with Qwen/rules fallback preserved, bounded BrainPlan output only, and no direct action execution
Security: APPROVE exactly this bounded fail-closed heavy-planner.openai secure-credential and one-window API scope with credential non-exposure, gated network access, sanitized evidence, no raw prompt/response persistence, and executor-only side effects
Release: APPROVE developer-alpha implementation, mocked evidence, and one fixed-window API acceptance evidence only; no default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement only the
provider composition, secure credential store/report shape, mocked transport
tests, parser/gate/fallback logic, and then run exactly one approved fixed
real API acceptance window. Do not expand providers, prompts, retries,
testers, UI/IPC, telemetry, defaults, tool execution, or release behavior.

## Approval Record

The following explicit approvals were received on 2026-08-07 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Heavy Planner provider composition, secure credential storage, and one-window API acceptance scope for heavy-planner.openai with Qwen/rules fallback preserved, bounded BrainPlan output only, and no direct action execution |
| Security | APPROVED | Exactly this bounded fail-closed heavy-planner.openai secure-credential and one-window API scope with credential non-exposure, gated network access, sanitized evidence, no raw prompt/response persistence, and executor-only side effects |
| Release | APPROVED | Developer-alpha implementation, mocked evidence, and one fixed-window API acceptance evidence only; no default/UI/IPC/telemetry/installer/update/release changes |

## Implementation Evidence

The approved implementation completed without real planner API calls, network
access, raw credential exposure, raw prompt/response persistence, tool
execution, UI/IPC behavior changes, telemetry, default, installer, update,
release-channel, or production behavior changes.

Implemented:

- `OpenAiHeavyPlannerProvider` for `heavy-planner.openai`;
- bounded OpenAI Responses transport and timeout handling;
- strict structured-output request shape plus local `BrainPlannerResult`
  validation;
- unsupported-tool, invalid-output, unsafe-plan, provider-error, timeout,
  and rate-limit fail-closed handling;
- `createCoreHostOpenAiHeavyPlannerComposition` with explicit provider,
  secure-store, credential, network-window, parser, output-bound, fallback,
  default-off, and executor-only gates;
- `SecureHeavyPlannerProviderStore` using the existing desktop
  `safeStorage` encryption pattern;
- private desktop-main to supervised Core Host credential delivery;
- default-off Core Host configuration with no real provider constructed unless
  the one-window gate is explicit; and
- mocked transport, composition, secure-store, contracts, and Core fallback
  regression coverage.

Verification passed:

- `npm run build:contracts`;
- `npm run build:capabilities`;
- `npm run build:inference-adapter-openai-planner`;
- `npm run build:core`;
- `npm run build:core-host`;
- `npm run build:desktop`;
- OpenAI adapter tests: `5 passed`;
- Core Host composition tests: `2 passed`;
- secure credential store tests: `3 passed`;
- contracts/core focused tests: `85 passed`;
- `npm run check:sensitive-artifacts`; and
- `npm run check:boundaries`.

## One-Window Runtime Evidence

The exact acceptance runner was launched with the approved acceptance gate.
The run stopped before any provider call because the secure credential store
was available but not configured.

Sanitized result:

```json
{
  "scopeId": "heavy-planner-openai-one-window-api-acceptance",
  "status": "blocked",
  "accepted": false,
  "providerId": "heavy-planner.openai",
  "secureStore": {
    "available": true,
    "credentialConfigured": false,
    "credentialExposed": false
  },
  "promptCount": 0,
  "providerCallCount": 0,
  "networkApiCalled": false,
  "directActionAttempted": false,
  "defaultBehaviorChanged": false,
  "uiIpcBehaviorChanged": false,
  "telemetryChanged": false,
  "releaseBehaviorChanged": false,
  "reasonCodes": [
    "HEAVY_PLANNER_SECURE_CREDENTIAL_MISSING"
  ]
}
```

No raw credential, encrypted file contents, prompt, request body, response,
headers, endpoint, request ID, account metadata, stack trace, private path,
hidden reasoning, model internals, or user-private data was recorded.

The one-window approval is consumed by this stopped preflight. Do not rerun
the real API acceptance under this approval. A new exact-scope approval is
required after a secure credential is deliberately configured.
