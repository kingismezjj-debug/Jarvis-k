# Phase 14.3 Tool Execution Diagnostic Surface Approval Request

Recorded on 2026-08-06 after the Phase 14.2 Core Host fixture-only Tool
Execution integration landed and CI passed.

## Status

`APPROVED_IMPLEMENTED_AND_VERIFIED`

This request is for a narrow developer-alpha Tool Execution diagnostic surface
implementation wave. It does not authorize real shell, PowerShell, Windows,
process, filesystem, network, browser, clipboard, screen, model, helper,
Memory, SQLite, Desktop IPC, UI, persistent telemetry, diagnostic runner
execution, default, installer, update, release-channel, dynamic tool
discovery, or model-driven tool invocation behavior.

## Context

Phase 14.1 added the provider-neutral Tool Execution alpha foundation:

- strict tool descriptors, bounded primitive invocation requests, sanitized
  policy decisions, and sanitized execution result envelopes;
- fixed lifecycle statuses, reason codes, failure classes, rollback/cleanup
  states, timeout/cancellation flags, and bounded counters; and
- fixture-only governance/execution that performs no operating-system action.

Phase 14.2 added a Core Host fixture-only adapter/session:

- explicitly constructed by local callers only;
- backed by caller-supplied in-memory descriptors, policy, bounded requests,
  and deterministic fixture simulation options;
- returning only Phase 14.1 sanitized decision/result envelopes plus fixed
  wrapper fields; and
- not wired to Core Host runtime routes, WebSocket commands, Desktop IPC, UI,
  provider registration, default behavior, real tool execution, Memory,
  model/helper/runtime code, or telemetry persistence.

Phase 14.3 is the proposed approval boundary for a diagnostic surface helper
that can convert already-created sanitized Tool Execution report-shaped
objects into a small bounded developer-alpha diagnostic subreport. The helper
must be inert unless a caller imports and invokes it directly with fixture
objects. It must not evaluate policy, execute tools, create a Tool Execution
session, attach to a diagnostic runner, or expose anything through Desktop IPC
or UI.

## Exact Scope Requested

Approve one implementation wave for:

- a Core Host diagnostic-surface helper that accepts already-created Phase
  14.1 `ToolPolicyDecision`, Phase 14.1 `ToolExecutionResult`, and/or Phase
  14.2 fixture session-summary report-shaped objects;
- a bounded diagnostic subreport containing only fixed status, lifecycle,
  result/reason/failure classifications, timeout/cancellation flags,
  rollback/cleanup states, confirmation booleans, bounded counters, optional
  bounded `toolId`, release/persistence flags, and fixed diagnostic reasons;
- fail-closed rejection for malformed input, unknown enum values, unrecognized
  report shapes, sensitive keys, unsafe string values, unbounded collections,
  counter overflow, duplicate reason/failure arrays, raw diagnostics, or
  unsafe wrapper fields;
- fixed diagnostic reasons such as `tool_execution_summary_attached`,
  `tool_execution_summary_missing`, `tool_execution_summary_not_requested`,
  and `tool_execution_summary_rejected`;
- optional attachment to an already-created in-memory diagnostic
  report-shaped object only when explicitly requested by the caller;
- focused Core Host tests using deterministic fixture objects only; and
- documentation updates to record approval and verification evidence.

The implementation may import `@jarvis-k/contracts` and consume already-safe
Phase 14.1/14.2 report-shaped values. It must not import or instantiate
`FixtureToolExecutor`, call `decideToolInvocation`, construct a Phase 14.2
session, inspect descriptors/policy beyond validating already-created report
objects, read environment values, read or write files, access Memory or
SQLite, start helpers, load models, call network APIs, spawn processes, or
expose anything through Desktop IPC or UI.

## Allowed Diagnostic Output

The diagnostic subreport may contain only:

- `toolExecutionAttached` boolean;
- fixed `diagnosticReason`;
- optional bounded `toolId`;
- bounded `status`, `resultCode`, `reasonCodes`, `failureClasses`,
  `timeoutOccurred`, `cancelled`, `rollbackState`, and `cleanupState`;
- confirmation booleans copied only from sanitized audit/decision fields;
- bounded counters copied only from Phase 14.1 counter fields or Phase 14.2
  session-summary counts;
- `sessionReleased`, `persisted=false`, and `rawDiagnosticsExposed=false`;
  and
- optional fixed wrapper status such as `evaluated`, `executed`, `blocked`,
  or `released`.

It must not include raw request IDs, raw tool input, raw tool output,
stdout/stderr, paths, URLs, credentials, signed URLs, tokens, env values,
commands, scripts, exception messages, stack traces, process IDs, hostnames,
usernames, tester IDs, model IDs, digests, vectors, source text, Memory
records, helper diagnostics, arbitrary diagnostics, serialized descriptors,
serialized policy, raw wrapper input, or raw diagnostic payloads.

## Allowed Implementation Surface

If approved, changes are limited to:

- `apps/core-host/src`: one provider-neutral Tool Execution diagnostic
  surface helper file and local export only if required by tests;
- `apps/core-host/test`: focused fixture-only tests for the diagnostic
  surface and optional attachment helper;
- documentation updates to this approval request with approval and
  verification evidence; and
- package build outputs only as generated by existing build commands, if any
  are already part of local workflow.

The implementation must not modify:

- `apps/core-host/src/index.ts`, Core Host server routes, WebSocket behavior,
  provider registration, default composition, diagnostic runner execution, or
  product-path runtime behavior;
- Phase 14.1 contracts/capabilities semantics unless a separately approved
  fix is required;
- Phase 14.2 fixture adapter/session semantics unless a separately approved
  fix is required;
- Desktop main/preload/settings IPC, UI, settings, or user-facing controls;
- Memory, Memory SQLite, provider-vector retrieval/write/read paths, or
  historical indexing;
- model lifecycle runtime/cache/artifact/helper/session code;
- voice, OCR/vision, browser, clipboard, screen, filesystem, process, shell,
  PowerShell, Windows, network, or package installation behavior;
- persistent telemetry/log/metric sinks, dashboards, analytics, or product
  SLOs; or
- installer, updater, release metadata, release channels, defaults, or tester
  workflow.

## Data Boundary

The helper may accept only these bounded in-memory inputs:

- already-created `ToolPolicyDecision` objects that pass the Phase 14.1
  schema;
- already-created `ToolExecutionResult` objects that pass the Phase 14.1
  schema;
- Phase 14.2 session-summary-shaped objects with bounded counts,
  `sessionReleased`, `persisted=false`, and `rawDiagnosticsExposed=false`;
- optional wrapper fields from Phase 14.2 reports such as `accepted`,
  `status`, `reasonCode`, `toolCount`, and `sessionReleased`; and
- an explicit boolean `attachmentRequested` flag.

Unknown, missing, malformed, sensitive, unbounded, or unsafe inputs must
produce a fixed rejected or missing diagnostic subreport. Unknown errors must
map to `UNKNOWN_SANITIZED_FAILURE` without copying exception text.

## Required Safety Invariants

The implementation must preserve these invariants:

- diagnostic helpers never evaluate policy or execute tools;
- diagnostic helpers never create or release a Phase 14.2 session;
- diagnostic helpers never import or instantiate runtime executors;
- diagnostic helpers never read or retain raw inputs, raw outputs, paths,
  URLs, credentials, commands, scripts, stdout/stderr, stack traces, env
  values, process details, model data, Memory records, helper diagnostics, or
  arbitrary payloads;
- unknown enum values, duplicate arrays, counter overflow, malformed wrapper
  fields, and sensitive fields fail closed;
- attachment is explicit and in-memory only;
- reports remain bounded and schema-like; and
- no model, Memory, helper, runtime, OS, filesystem, network, browser, IPC, UI,
  or telemetry sink is touched.

## Explicitly Not Authorized

This request does not authorize:

- real shell, PowerShell, command prompt, Windows API, process, filesystem,
  network, browser, clipboard, screen, OCR, voice, model, helper, Memory, or
  SQLite execution;
- policy evaluation, fixture execution, runtime executor construction, Core
  Host route exposure, WebSocket commands, Desktop IPC, preload exposure, UI
  controls, settings, provider visibility, or default opt-in;
- attaching this diagnostic surface to an existing diagnostic runner or
  executing any existing diagnostic runner;
- dynamic host tool discovery, tool marketplace behavior, model-driven or
  autonomous tool invocation, planner-to-tool execution, or user-facing tool
  commands;
- persistent tool logs, telemetry, metrics files, SQLite rows, dashboards,
  alerting, analytics, network export, or product SLOs;
- retaining raw inputs, raw outputs, stdout/stderr, paths, URLs, credentials,
  signed URLs, tokens, env values, commands, scripts, exceptions, stack traces,
  process IDs, hostnames, usernames, tester IDs, model IDs, digests, vectors,
  source text, Memory records, helper diagnostics, or raw payloads;
- destructive file operations, process termination, registry edits, service
  control, package installation, downloads, uploads, or remote calls;
- changing frozen Memory alpha, Model Lifecycle alpha, Observability alpha, or
  Phase 14.1/14.2 Tool Execution semantics; or
- using model, Memory, Observability, diagnostic, or tool output for shell,
  PowerShell, Windows, network, filesystem, or process execution.

Any later diagnostic runner attachment, Core Host runtime route, Desktop
IPC/UI exposure, real OS/tool execution, filesystem/network/browser/
clipboard/screen capability, dynamic tool discovery, model-driven invocation,
Memory integration, persistent telemetry, or release behavior requires a
separate exact-scope Product/Security/Release approval.

## Required Tests

If approved, focused Core Host tests must cover:

- attaching a passed/completed sanitized Tool Execution result into a bounded
  diagnostic subreport;
- attaching denied, needs-confirmation, degraded, blocked, timed-out,
  cancelled, rollback-failed, cleanup-failed, fixture-unavailable, and
  sensitive-output sanitized results without retaining raw input/output;
- converting sanitized policy decisions and Phase 14.2 wrapper/session
  summaries into fixed diagnostic reasons and bounded counters;
- missing summary, not-requested attachment, and rejected summary paths;
- rejecting unknown enum values, unknown report shapes, duplicate
  reason/failure arrays, counter overflow, malformed wrapper fields,
  `persisted=true`, `rawDiagnosticsExposed=true`, and sensitive keys;
- rejecting raw paths, URLs, credentials, signed URLs, tokens, env values,
  commands, scripts, raw tool input, raw tool output, stdout/stderr, stack
  traces, exception messages, process IDs, hostnames, usernames, tester IDs,
  model IDs, digests, vectors, source text, Memory records, helper diagnostics,
  serialized descriptors, serialized policy, and raw payloads; and
- proof that no executor, session, diagnostic runner, filesystem, runtime,
  helper, Memory, SQLite, IPC, UI, network, or persistent telemetry action is
  required.

The tests must use fixture objects only. They must not start Core Host as a
process, launch helpers, read env values, touch filesystem roots, access
Memory, access SQLite, start browser/screen/clipboard tooling, spawn
processes, call network APIs, execute tools, or require model artifacts.

## Required Verification

After approval and implementation, run:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/<phase-14-3-tool-execution-diagnostic-surface-tests>
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Full verification must remain green before commit/push. Desktop smoke tests
are not required unless the implementation changes Desktop IPC, UI, preload,
settings, provider visibility, or user-facing behavior; those changes are not
authorized by this request.

## Stop Conditions

Stop and return to Product/Security/Release approval if:

- the helper needs to evaluate policy, execute a fixture tool, create a Phase
  14.2 session, call a diagnostic runner, or touch real shell, PowerShell,
  Windows, process, filesystem, network, browser, clipboard, screen, model,
  helper, Memory, SQLite, env, or Desktop IPC state;
- useful diagnostics require raw tool input, raw tool output, stdout/stderr,
  paths, URLs, credentials, signed URLs, tokens, env values, commands,
  scripts, exception messages, stack traces, process IDs, hostnames,
  usernames, tester IDs, model IDs, digests, vectors, source text, Memory
  records, helper diagnostics, descriptors, policy, or raw payloads;
- a test requires real artifacts, a model directory, Memory, SQLite, env
  values, helper startup, filesystem writes, network access, executor
  invocation, or persistent telemetry;
- unknown descriptors, requests, statuses, reason codes, failure classes,
  counters, wrapper fields, or report shapes would be treated as successful;
- the implementation would change Core Host runtime composition, Desktop
  IPC/UI, defaults, provider visibility, release metadata, or product SLOs; or
- any change would alter frozen Memory, Model Lifecycle, Observability, or
  Phase 14.1/14.2 semantics.

## Role Requests

**Product.** Approve exactly this Phase 14.3 developer-alpha Tool Execution
diagnostic surface scope: an explicitly invoked Core Host helper that converts
already-created sanitized Phase 14.1/14.2 Tool Execution report-shaped values
into a bounded diagnostic subreport for tests or later separately approved
developer-alpha diagnostics. Exclude policy evaluation, tool execution,
diagnostic runner attachment/execution, dynamic tool discovery, model-driven
invocation, UI/IPC, Memory/model/helper integration, defaults, tester
workflows, product telemetry, product SLOs, and release behavior.

**Security.** Approve exactly this bounded, fail-closed, in-memory,
no-runtime Tool Execution diagnostic surface scope with no shell, PowerShell,
Windows, process, filesystem, network, browser, clipboard, screen, OCR, voice,
model, helper, Memory, SQLite, executor construction, session construction,
diagnostic runner execution, persistent telemetry, raw output, credentials,
paths, commands, scripts, env values, stack traces, destructive side effects,
or host tool discovery. Require fixed fields, bounded counters, sanitized
failure classes, sensitive-field rejection, and no persistence.

**Release.** Approve implementation and fixture evidence only. Do not approve
installer, update, default, Desktop IPC, UI, settings, provider visibility,
tool marketplace, telemetry persistence, diagnostic runner execution,
release-channel exposure, public tester workflow, product SLO, production
readiness, or real execution changes.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | APPROVED | Exact Phase 14.3 developer-alpha Tool Execution diagnostic surface scope |
| Security | APPROVED | Exact bounded, fail-closed, in-memory, no-runtime Tool Execution diagnostic surface boundary |
| Release | APPROVED | Implementation and fixture evidence only; no diagnostic runner, default, UI/IPC, telemetry, or release behavior |

Approval text recorded from the 2026-08-06 UTC / 2026-08-05 local
implementation window:

- Product: APPROVE exactly this Phase 14.3 developer-alpha Tool Execution
  diagnostic surface scope
- Security: APPROVE exactly this bounded, fail-closed, in-memory, no-runtime
  Tool Execution diagnostic surface boundary
- Release: APPROVE implementation and fixture evidence only; no diagnostic
  runner, default, UI/IPC, telemetry, or release behavior

These approvals authorize only the implementation and fixture evidence listed
here. They do not authorize policy evaluation, tool execution, diagnostic
runner attachment/execution, runtime route exposure, Desktop IPC, UI, dynamic
host tool discovery, model-driven invocation, Memory integration,
model/helper integration, persistent telemetry, default behavior, or release
changes.

## Implementation Evidence

Phase 14.3 implemented the approved developer-alpha Tool Execution diagnostic
surface within the authorized surface:

- `apps/core-host/src/tool-execution-diagnostic-surface.ts` adds an
  explicitly invoked helper that converts already-created sanitized Phase
  14.1 `ToolExecutionResult`, Phase 14.1 `ToolPolicyDecision`, Phase 14.2
  wrapper report, or Phase 14.2 session-summary-shaped values into a bounded
  diagnostic subreport.
- The diagnostic subreport omits `requestId`, raw audit payload, raw tool
  input/output, stdout/stderr, paths, URLs, credentials, tokens, env values,
  commands, scripts, exception/stack details, process/host/user/tester data,
  model IDs, digests, vectors, source text, Memory records, helper
  diagnostics, descriptors, policy, and raw payloads.
- The helper returns fixed reasons for attached, missing, not-requested, and
  rejected summaries; rejects sensitive fields, unsafe strings, malformed
  shapes, unknown enum values, duplicate arrays, counter overflow,
  `persisted=true`, and `rawDiagnosticsExposed=true`; and keeps
  `persisted=false` and `rawDiagnosticsExposed=false` in all outputs.
- `attachCoreHostToolExecutionDiagnosticSurface` attaches the sanitized
  subreport only to an already-created safe in-memory report-shaped object and
  rejects unsafe attachment targets without copying raw values.
- `apps/core-host/test/tool-execution-diagnostic-surface.test.ts` covers
  completed, denied, needs-confirmation, degraded, blocked, timed-out,
  cancelled, rollback-failed, cleanup-failed, fixture-unavailable, and
  sensitive-output results; policy decisions; wrapper reports; session
  summaries; missing/not-requested paths; malformed/unknown/bounds failures;
  sensitive-field rejection; sanitized attachment; and unsafe attachment
  rejection.

No `FixtureToolExecutor`, `decideToolInvocation`, Phase 14.2 session
construction, diagnostic runner, Core Host route, WebSocket behavior, provider
registration, default composition, Desktop IPC, preload, UI, settings, Memory,
SQLite, provider-vector path, model lifecycle runtime/cache/artifact/helper/
session code, voice, OCR/vision, browser, clipboard, screen, filesystem tool,
process spawning, shell/PowerShell/Windows execution, network client,
persistent telemetry, installer, updater, release metadata, default behavior,
or release behavior was introduced or changed by this implementation.

## Verification Evidence

Commands run on 2026-08-06 UTC / 2026-08-05 local:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/tool-execution-diagnostic-surface.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Results:

- Core Host build: passed.
- Focused Core Host Tool Execution diagnostic surface tests: passed, 1 file
  / 7 tests.
- Full `npm.cmd run verify`: passed, including 142 test files / 773 tests,
  typecheck, dependency boundary check, sensitive artifact guard, and full
  build.
- Standalone `check:boundaries`: passed.
- Standalone `check:sensitive-artifacts`: passed.

## Next Gate

After commit and push, wait for CI on `main`.

Any diagnostic runner attachment, real execution runner, runtime route,
Desktop IPC, UI, dynamic tool registry, network/filesystem/process capability,
persistent telemetry, model-driven invocation, Memory/model/helper
integration, or release behavior requires a new exact-scope
Product/Security/Release approval.
