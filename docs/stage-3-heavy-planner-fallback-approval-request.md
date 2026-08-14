# Stage 3 Heavy Planner Fallback Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTATION_PASSED`

This document requests Product, Security, and Release approval for the next
Brain Runtime Spine step: Stage 3 Heavy Planner Fallback.

This request follows the frozen Qwen Fast Router alpha, frozen Core Host
selection/fallback integration, approved no-runtime Qwen provider composition,
and passed one-window Qwen lifecycle-backed runtime wiring acceptance.

This approval request is for implementation and fixture/simulated evidence
only. It does not authorize real GLM, ChatGPT, OpenAI, Volcengine, Qwen-cloud,
or other planner API calls. It does not authorize network access, real
credential storage, tool execution, UI/IPC exposure, telemetry, installer,
update, release-channel, or default behavior changes.

## Goal

Stage 3 should let Jarvis-K decide when a request is too complex, fuzzy, or
low-confidence for the foreground router, then escalate to a bounded heavy
planner contract.

The planner may return only a structured `BrainPlan`. It must not execute
actions. The executor, action allowlist, confirmation policy, and existing
safety gates remain the only side-effect path.

Target product spine:

```text
voice/text input
-> BrainCommand
-> Qwen fast router or deterministic rules
-> heavy planner fallback for complex/fuzzy cases
-> bounded BrainPlan
-> safety gate and executor
-> UI event stream, Memory, and TTS later
```

## Exact Approval Requested

Approve exactly this fixture/simulated implementation scope:

- add a provider-neutral heavy planner port;
- add bounded planner request, result, diagnostic, and failure-class
  contracts;
- add a bounded `BrainPlan` shape that can describe candidate tool steps
  without executing them;
- add fixed planner selection statuses such as `not_needed`, `planned`,
  `clarify`, `fallback`, `blocked`, and `unavailable`;
- add fixed planner reason codes for complex request, fuzzy request,
  low-confidence fast-router result, unsupported intent, clarify required,
  provider unavailable, provider failed, invalid plan, unsafe plan, and
  fixture fallback;
- add a fixture heavy planner provider for tests only;
- add Core runtime fallback hooks that can request a planner only when the
  fast router/rules path is complex, fuzzy, unsupported, low-confidence, or
  explicitly needs clarification;
- preserve Qwen/rules fallback behavior when the planner is absent,
  unavailable, invalid, or blocked;
- add a secure-key report shape that can say whether a planner provider is
  configured without exposing raw keys, tokens, endpoints, organization IDs,
  or account metadata;
- require medium/high-risk planned actions to be marked
  `requiresConfirmation=true`;
- ensure the executor remains the sole actor for side effects;
- add fixture-only regression tests for successful plan, clarify plan,
  unavailable planner, invalid plan, unsafe plan, low-confidence escalation,
  and fallback preservation; and
- update docs with sanitized fixture evidence only.

## Implementation Bounds

This approval permits only code, contracts, tests, and documentation for
bounded planner composition and fixture/simulated behavior.

The implementation must keep:

- no real API call to GLM, ChatGPT, OpenAI, Anthropic, Volcengine, Qwen-cloud,
  or any other planner provider;
- no network access;
- no real credential storage, credential migration, keychain integration, or
  environment-secret capture;
- no raw API key, token, endpoint, organization ID, account metadata, prompt,
  provider response, stack trace, URL, private path, or user-private data in
  diagnostics or docs;
- no tool execution, browser action, local-app launch, shell/process action,
  filesystem write, network action, Memory write, vector write, OCR action,
  voice action, or planner-triggered side effect;
- no Desktop IPC, preload, settings UI, UI panel, telemetry, analytics,
  installer, update, package, release-channel, or production-readiness
  behavior;
- no product default enablement of the planner;
- no persistent queue, cache, transcript store, or planner session memory;
- no Qwen runtime/cache rerun; and
- deterministic rules/fixture fallback preserved.

## Planner Contract Requirements

The planner result must be bounded and schema-validated before any later
executor can consider it. A valid fixture plan may include only:

- planner status;
- fixed reason codes and failure class;
- sanitized plan summary;
- bounded ordered candidate steps using registered tool IDs only;
- normalized arguments that match tool schemas;
- risk class;
- `requiresConfirmation` for medium/high-risk steps;
- clarify question when user input is required;
- fallback reason when no plan is accepted; and
- `directActionAttempted=false`.

The result must not include raw prompt text, raw provider completion,
untrusted executable code, shell command strings, arbitrary URLs outside
allowlisted browser intent slots, private paths, credentials, hidden chain of
thought, logits, vectors, benchmarks, or full diagnostic payloads.

## Stop Conditions

Stop immediately and do not continue implementation if any of these occur:

- a real planner API call, network call, model runtime, helper startup, or
  credential access becomes required;
- the planner would execute actions directly;
- a planned action can bypass the executor, action allowlist, confirmation
  policy, or existing safety gates;
- raw credentials, prompts, provider responses, URLs, private paths, stack
  traces, user-private data, hidden reasoning, model internals, vectors, or
  benchmarks would be recorded;
- product defaults, normal startup behavior, UI/IPC, telemetry, installer,
  update, release-channel, or production behavior would change;
- Qwen runtime/cache must be rerun;
- deterministic rules or fixture fallback cannot be preserved; or
- fixture tests require external provider availability.

## Explicitly Not Authorized

This approval does not authorize:

- real GLM, ChatGPT, OpenAI, Anthropic, Volcengine, Qwen-cloud, or other API
  calls;
- storing, validating, migrating, or using real API keys;
- network access;
- planner session residency, persistent planner memory, or transcript
  persistence;
- direct tool execution from planner output;
- browser/local-app/shell/filesystem/network/Memory/vector/OCR/voice actions;
- Qwen runtime/cache reruns;
- UI/IPC exposure or settings toggles;
- telemetry, analytics, installer, update, packaging, release-channel, or
  production-readiness behavior;
- broad tester expansion; or
- product default enablement.

## Fixture Evidence Contract

The final fixture evidence may contain only:

- scope id;
- status: `passed`, `degraded`, or `blocked`;
- accepted boolean;
- planner provider status;
- fixed selection statuses, reason codes, and failure classes;
- test counts and pass/fail status;
- per-sample expected/actual planner status and accepted boolean;
- booleans for direct action attempted, real API called, credential exposed,
  network used, default behavior changed, UI/IPC behavior changed, telemetry
  changed, and release behavior changed; and
- sanitized notes about fallback preservation.

Evidence must not contain raw prompts, raw planner responses, credentials,
tokens, endpoints, URLs, private paths, stack traces, provider account data,
hidden reasoning, model internals, logits, vectors, benchmarks, or
user-private data.

## Role Requests

**Product.** Approve exactly this Stage 3 Heavy Planner Fallback
provider-neutral fixture/simulated implementation scope. It may add planner
contracts, fixture providers, Core runtime fallback hooks, bounded BrainPlan
schemas, and sanitized fixture evidence. Qwen and deterministic rules
fallback must remain preserved. No direct action execution or product default
behavior is authorized.

**Security.** Approve exactly this bounded fail-closed no-real-API planner
scope. It must not call networks or real planner APIs, use or expose
credentials, persist planner sessions, record raw prompts or raw provider
responses, or allow planner output to bypass executor safety gates. Reports
must be sanitized and side effects must remain executor-only.

**Release.** Approve implementation and fixture/simulated evidence only.
Exclude real API calls, runtime/cache changes, defaults, UI/IPC, telemetry,
installer, update, packaging, release-channel, product availability, and
production-readiness changes.

## Approval Lines To Provide

```text
Product: APPROVE exactly this Stage 3 Heavy Planner Fallback provider-neutral fixture/simulated implementation scope with Qwen/rules fallback preserved and no direct action execution
Security: APPROVE exactly this bounded fail-closed no-real-API planner scope with no credentials exposure, no network/API calls, sanitized plans only, and executor-only side effects
Release: APPROVE implementation and fixture/simulated evidence only; no real API/default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, implement only the
fixture/simulated planner contracts, Core runtime fallback hooks, fixture
provider, and regression tests. Do not call real planner APIs, use real
credentials, open network access, execute tools, expose UI/IPC, change
defaults, or change release behavior.

## Approval Record

The following explicit approvals were received on 2026-08-07 in the current
task:

| Role | Status | Approval evidence |
| --- | --- | --- |
| Product | APPROVED | Exactly this Stage 3 Heavy Planner Fallback provider-neutral fixture/simulated implementation scope with Qwen/rules fallback preserved and no direct action execution |
| Security | APPROVED | Exactly this bounded fail-closed no-real-API planner scope with no credentials exposure, no network/API calls, sanitized plans only, and executor-only side effects |
| Release | APPROVED | Implementation and fixture/simulated evidence only; no real API/default/UI/IPC/telemetry/installer/update/release changes |

## Implementation Evidence

The approved Stage 3 fixture/simulated implementation completed without real
API calls, network access, credential access, Qwen runtime/cache reruns,
tool execution, browser/local-app execution from planner output, UI/IPC,
telemetry, default, installer, update, release-channel, or production
behavior changes.

Implemented:

- provider-neutral Heavy Planner contracts in `@jarvis-k/contracts`;
- bounded `BrainPlan` and `BrainPlannedToolStep` schemas with confirmation
  requirements for medium, high, and blocked risk;
- sanitized planner selection reports on `BrainCommandResult`;
- sanitized planner result reports with `directActionAttempted=false`;
- secure-key report shape with `credentialExposed=false` and
  `networkAccessApproved=false`;
- `HeavyPlannerProvider` port in `@jarvis-k/capabilities`;
- `FixtureHeavyPlannerProvider`, a no-network/no-credential/no-execution
  fixture provider;
- Core runtime planner fallback hooks for complex, clarify, and low-confidence
  fast-router cases;
- fallback preservation when the planner is absent, unavailable, invalid, or
  throwing;
- planner result dispatch handling that returns bounded plan, clarify, or
  blocked status without executing tools; and
- focused fixture regression coverage for planned, clarify, invalid plan,
  unsafe plan, low-confidence escalation, and fallback preservation.

Verification:

- `npm run build:contracts`: `passed`;
- `npm run build:capabilities`: `passed`;
- `npm run build:core`: `passed`;
- `vitest packages/contracts/test/protocol.test.ts`: `29 passed`;
- `vitest packages/core/test/runtime.test.ts`: `56 passed`;
- `npm run check:sensitive-artifacts`: `passed`; and
- `npm run check:boundaries`: `passed`.

The same Stage 3 source and documentation changes were synced to
`E:\Jarvis-K`, where the contracts/capabilities/core builds, focused
contracts/core tests, sensitive-artifact guard, and boundary guard also
passed.

Sanitized evidence retained no raw planner prompts, raw provider responses,
credentials, tokens, endpoints, private paths, stack traces, hidden reasoning,
model internals, logits, vectors, benchmarks, helper diagnostics, or
user-private data.

This implementation evidence does not authorize real GLM, ChatGPT, OpenAI,
Anthropic, Volcengine, Qwen-cloud, or other API calls; real credential
storage; network access; planner session persistence; tool execution;
UI/IPC; telemetry; installer/update/release behavior; product default
enablement; or production-readiness changes.
