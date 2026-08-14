# Heavy Planner OpenAI Second One-Window Runtime Rerun Approval Request

Recorded: 2026-08-07

## Status

`CONSUMED_DEGRADED`

## Approval Record

Approved: 2026-08-07

```text
Product: APPROVE exactly this second one-window heavy-planner.openai runtime rerun using the configured safeStorage credential, the same fixed three prompts, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution

Security: APPROVE exactly this second bounded heavy-planner.openai runtime rerun with credential non-exposure, secure-store-only loading, gated network access, no raw request/response persistence, sanitized evidence, and executor-only side effects

Release: APPROVE developer-alpha second runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/release changes
```

This approval authorizes exactly one execution of the fixed acceptance window
described below. It is consumed whether the runner passes, degrades, or blocks.

## One-Window Outcome

Executed: 2026-08-07

- status: `degraded`
- accepted: `false`
- provider id: `heavy-planner.openai`
- secure store available/configured/credential exposed:
  `true` / `true` / `false`
- composition gates: all required gates were `true`
- prompt count/provider call count: `3` / `3`
- expected planner statuses: `planned`, `clarify`, `blocked`
- actual planner statuses: `unavailable`, `unavailable`, `unavailable`
- network API called/direct action attempted: `true` / `false`
- default/UI/IPC/telemetry/release changed:
  `false` / `false` / `false` / `false`
- sanitized outcome code: `HEAVY_PLANNER_FIXED_WINDOW_RESULT_MISMATCH`

No raw prompt, request, response, header, endpoint, account metadata, or
credential was persisted. The pre-enhancement runner did not include the
provider's already-sanitized unavailable failure classification in its report,
so the observed outcome does not distinguish authorization, rate-limit,
availability, or another non-2xx provider condition.

This approval is consumed. Do not rerun under it. The next runtime attempt, if
requested, requires a new exact-scope approval after offline diagnostic
evidence improvements are reviewed.

This document requested a fresh exact-scope Product, Security, and Release
approval for one additional developer-alpha Heavy Planner runtime window.

The previous approved window was stopped before any network call because the
secure credential store was available but not configured. No prompt was sent,
no provider call was made, and no API response was received.

This request was only to repeat the same bounded acceptance after a credential
has been deliberately configured through the local Electron `safeStorage`
credential setup path. It does not authorize implementation expansion,
provider expansion, product defaults, UI/IPC, telemetry, tool execution, or
release behavior.

## Exact Rerun Scope

Approve exactly one local developer-alpha runtime rerun using:

- provider id: `heavy-planner.openai`;
- the same approved provider composition and parser;
- one credential loaded only from the encrypted
  `jarvis-k-heavy-planner-provider.json` secure store;
- `credentialExposed=false` throughout;
- explicit one-window acceptance gate enabled for this process only;
- the same fixed three sanitized prompt cases:
  - complex request expected to produce `planned`;
  - underspecified request expected to produce `clarify`; and
  - destructive/high-impact request expected to produce `blocked`;
- maximum prompt count: `3`;
- maximum provider call count: `3`;
- timeout per call: `30 seconds`;
- no retry, except at most one retry only if the first transport failure
  happens before request submission;
- bounded OpenAI Responses request;
- bounded `BrainPlannerResult` parsing;
- no raw prompt, request, response, headers, request ID, endpoint, account
  metadata, credential, stack trace, private path, hidden reasoning, model
  internals, logits, vectors, benchmarks, or user-private data in evidence;
- no browser, local-app, shell, filesystem, network tool, Memory, vector,
  OCR, voice, or other action execution; and
- sanitized evidence plus process cleanup.

## Required Gates

The rerun may proceed only when all gates are true:

- exact Product/Security/Release approval lines match this request;
- `heavyPlanner.enablement.explicit=true`;
- `heavyPlanner.provider.exactlyApproved=true`;
- `heavyPlanner.secureCredentialStore.available=true`;
- `heavyPlanner.credential.configured=true`;
- `heavyPlanner.credential.notExposed=true`;
- `heavyPlanner.network.oneWindowApproved=true`;
- `heavyPlanner.contract.ready=true`;
- `heavyPlanner.parser.ready=true`;
- `heavyPlanner.timeoutAndOutputBounds.ready=true`;
- `heavyPlanner.defaultOffPreserved=true`;
- `heavyPlanner.qwenRulesFallbackPreserved=true`; and
- `heavyPlanner.executorOnlySideEffectsPreserved=true`.

If the secure store is unavailable, the credential is missing, or any other
gate is false, stop before the first provider call and record `blocked`.

## Required Safety Invariants

The rerun must preserve:

- no credential in command-line arguments, environment variables, logs,
  snapshots, source files, test output, or evidence;
- no raw request or response persistence;
- no provider response passed directly to an executor;
- no unsupported tool id, shell command, executable code, arbitrary URL, or
  hidden side effect accepted into `BrainPlan`;
- confirmation required for medium, high, and blocked risk;
- Qwen/rules fallback preserved;
- `directActionAttempted=false`;
- default behavior unchanged;
- UI/IPC behavior unchanged;
- telemetry unchanged; and
- release behavior unchanged.

## Stop Conditions

Stop immediately before another prompt or call if:

- the secure credential file is missing, invalid, or cannot be decrypted;
- the provider id, prompt count, call count, timeout, or output bound differs;
- any credential or provider diagnostic would be exposed;
- a network call would occur before the explicit one-window gate;
- a raw prompt, raw response, endpoint, request ID, header, private path, or
  user-private value would be recorded;
- planner output is invalid, unsafe, unsupported, or attempts direct action;
- any tool/action execution is attempted;
- Qwen runtime/cache, UI/IPC, telemetry, default, installer, update, or
  release behavior changes; or
- cleanup/evidence sanitization is uncertain.

`blocked` or `degraded` is stopped-run evidence, not acceptance, and requires
another fresh exact-scope approval before a further rerun.

## Sanitized Evidence Contract

Evidence may contain only:

- scope id;
- `passed`, `degraded`, or `blocked` status;
- accepted boolean;
- provider id;
- secure-store availability and configured booleans;
- credential exposed boolean, which must be `false`;
- composition gate statuses;
- prompt count and provider call count;
- expected/actual planner status labels;
- fixed reason codes and failure classes;
- network API called boolean;
- direct action attempted boolean;
- default/UI/IPC/telemetry/release changed booleans; and
- cleanup status.

## Explicitly Not Authorized

This rerun does not authorize:

- a third provider or alternate model;
- more than the fixed three prompts;
- more than three provider calls;
- broad tester or user-task expansion;
- API key use from env, command line, plaintext file, repo, or logs;
- raw response or transcript persistence;
- tool execution or action execution;
- Qwen runtime/cache rerun;
- UI/IPC/settings exposure;
- telemetry or analytics;
- default enablement;
- installer, update, packaging, release-channel, or production changes; or
- a further rerun after this window.

## Approval Lines To Provide

```text
Product: APPROVE exactly this second one-window heavy-planner.openai runtime rerun using the configured safeStorage credential, the same fixed three prompts, bounded BrainPlan output, Qwen/rules fallback preserved, and no direct action execution
Security: APPROVE exactly this second bounded heavy-planner.openai runtime rerun with credential non-exposure, secure-store-only loading, gated network access, no raw request/response persistence, sanitized evidence, and executor-only side effects
Release: APPROVE developer-alpha second runtime evidence only; no provider expansion, default/UI/IPC/telemetry/installer/update/release changes
```

## Next Step After Approval

After all three exact approval lines are received, run the local acceptance
runner exactly once. If any gate is false, stop before the first provider
call. If all gates pass, run only the fixed three prompts, record sanitized
evidence, clean up, and do not rerun.
