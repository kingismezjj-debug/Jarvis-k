# Phase 14.4 Tool Execution Diagnostic Runner Attachment Approval Request

Recorded on 2026-08-06 after the Phase 14.3 Tool Execution diagnostic
surface landed and CI passed.

## Status

`PENDING_THREE_PARTY_APPROVAL`

This request is for a narrow pre-runtime developer-alpha diagnostic runner
attachment implementation wave. It does not authorize real shell, PowerShell,
Windows, process, filesystem, network, browser, clipboard, screen, model,
helper, Memory, SQLite, Desktop IPC, UI, persistent telemetry, diagnostic
runner execution on a runtime path, default, installer, update,
release-channel, dynamic tool discovery, or model-driven tool invocation
behavior.

## Context

Phase 14.1 added provider-neutral Tool Execution contracts and fixture-only
governance/execution envelopes. Phase 14.2 added an explicitly constructed
Core Host fixture-only Tool Execution adapter/session. Phase 14.3 added a
Core Host diagnostic-surface helper that converts already-created sanitized
Tool Execution report-shaped values into a bounded diagnostic subreport.

Phase 14.4 is the proposed approval boundary for attaching the Phase 14.3
sanitized `toolExecution` diagnostic subreport to one existing
developer-alpha diagnostic runner output. The target runner is:

- `runCoreHostLocalEmbeddingHelperEmbedDiagnostic` in
  `apps/core-host/src/local-embedding-helper-embed-diagnostic-runner.ts`.

The attachment must be optional and testable only on the runner's already-safe
pre-runtime blocked/degraded return paths, before artifact verification,
resource lease acquisition, helper startup, helper `health`, helper `load`,
helper `embed`, helper shutdown, Memory access, SQLite access, filesystem
writes, network access, or telemetry persistence can occur.

## Exact Scope Requested

Approve one implementation wave for:

- adding optional in-memory Tool Execution attachment input to
  `runCoreHostLocalEmbeddingHelperEmbedDiagnostic`;
- using the Phase 14.3 diagnostic-surface helper to attach a sanitized
  `toolExecution` subreport to the runner report only when explicitly
  requested by the caller;
- preserving existing runner defaults when no Tool Execution summary is
  supplied or when attachment is not requested;
- returning fixed sanitized attachment reasons for attached, missing,
  not-requested, and rejected summaries;
- rejecting sensitive or malformed Tool Execution summary input without
  copying raw values into the runner report;
- focused tests that exercise only blocked/degraded pre-runtime paths; and
- documentation updates to record approval and verification evidence.

The implementation may consume only an already-created, already-sanitized,
in-memory Tool Execution diagnostic summary or report-shaped value supplied
directly by a fixture test. It must not evaluate policy, execute a fixture
tool, create a Phase 14.2 session, instantiate `FixtureToolExecutor`, call
`decideToolInvocation`, run any tool, read env values beyond the runner's
existing preflight checks, verify artifacts, start helpers, read model/cache
paths, access Memory or SQLite, write telemetry, or change product behavior.

## Allowed Report Shape Change

The target runner report may gain one optional field:

- `toolExecution`: the Phase 14.3 sanitized diagnostic subreport.

This field may contain only:

- `toolExecutionAttached` boolean;
- fixed `diagnosticReason`;
- optional bounded `toolId`;
- bounded fixed status/result/reason/failure classifications;
- timeout/cancellation flags;
- rollback/cleanup states;
- confirmation booleans copied only from sanitized decision/result fields;
- bounded counters;
- optional fixed wrapper status;
- `sessionReleased`;
- `persisted=false`; and
- `rawDiagnosticsExposed=false`.

It must not contain request IDs, raw tool input, raw tool output,
stdout/stderr, paths, URLs, credentials, signed URLs, tokens, env values,
commands, scripts, exception messages, stack traces, process IDs, hostnames,
usernames, tester IDs, model IDs, digests, vectors, source text, Memory
records, helper diagnostics, descriptors, policy, arbitrary diagnostics, or
raw diagnostic payloads.

## Allowed Implementation Surface

If approved, changes are limited to:

- `apps/core-host/src/local-embedding-helper-embed-diagnostic-runner.ts`:
  optional input/report typing and attachment call on already-returned
  pre-runtime blocked/degraded report paths;
- `apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts`:
  focused fixture tests for attachment on pre-runtime paths;
- `apps/core-host/src/tool-execution-diagnostic-surface.ts`: only if a
  narrowly required helper export or type reuse is needed, without changing
  existing behavior; and
- documentation updates to this approval request with approval and
  verification evidence.

No new runner, CLI script, npm command, Tool Execution session, Tool
Execution executor, runtime helper code, model lifecycle code, Memory code,
SQLite code, Desktop IPC, UI, provider registration, default behavior,
telemetry storage, installer, updater, artifact, cache, model directory, or
release metadata may be changed.

## Explicitly Not Authorized

This request does not authorize:

- running the helper embed diagnostic on the approved runtime-bearing product
  path;
- invoking helper `health`, `load`, `embed`, or `shutdown`;
- artifact verification, model directory access, runtime Python access, or
  temporary/persistent cache access;
- policy evaluation, fixture execution, runtime executor construction, Phase
  14.2 session construction, tool execution, or model-driven tool invocation;
- running any existing acceptance, usage, runtime, model lifecycle, Memory,
  provider-vector, or Tool Execution diagnostic window;
- dynamic host tool discovery, tool marketplace behavior, planner-to-tool
  execution, or user-facing tool commands;
- persistent tool logs, telemetry, metrics files, SQLite rows, dashboards,
  alerting, analytics, network export, or product SLOs;
- changing Desktop IPC, preload, UI, settings, provider visibility, default
  opt-in, user-facing commands, or release behavior;
- installer packaging, runtime bundling, automatic updates, release-channel
  exposure, or production-readiness claims; or
- using model, Memory, diagnostic, observation, or tool output for shell,
  PowerShell, Windows, network, filesystem, or process execution.

Any later attachment to a runtime-bearing diagnostic path, any execution of
the helper product path, any real Tool Execution runner, any persistent
telemetry, and any UI/IPC exposure requires a separate exact-scope
Product/Security/Release approval.

## Required Tests

If approved, focused Core Host tests must cover:

- existing report shape and behavior remain unchanged when Tool Execution
  attachment is not requested;
- an explicitly supplied sanitized completed Tool Execution diagnostic
  subreport is attached to a pre-runtime `diagnostic_not_approved` or
  `diagnostic_opt_in_missing` report;
- missing summary returns a fixed `tool_execution_summary_missing` subreport
  without changing the runner's pre-runtime stop behavior;
- not-requested attachment returns a fixed
  `tool_execution_summary_not_requested` subreport only when a helper is
  called directly by tests, not by default runner output;
- malformed, unknown, or sensitive summary input returns a fixed rejected
  subreport without copying raw values;
- attachment does not cause artifact verification, resource lease
  acquisition, helper startup, helper `health`, helper `load`, helper `embed`,
  helper shutdown, Tool Execution policy evaluation, Tool Execution session
  construction, Tool Execution executor construction, Memory access, SQLite
  access, filesystem writes, network access, IPC, UI, or telemetry
  persistence; and
- the runner report remains free of raw paths, URLs, credentials, digests,
  vectors, source text, raw tool input, raw tool output, stdout/stderr,
  helper diagnostics, exception messages, env values, commands, scripts,
  process IDs, usernames, tester IDs, descriptors, policy, and raw payloads.

The tests must use fixture objects only and must stop before the runner's
runtime-bearing path.

## Required Verification

After approval and implementation, run:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke tests are not required unless the implementation changes Desktop
IPC, UI, preload, settings, provider visibility, or user-facing behavior;
those changes are not authorized by this request.

## Stop Conditions

Stop and return to Product/Security/Release approval if:

- attachment requires evaluating policy, executing a fixture tool, creating a
  Phase 14.2 session, constructing an executor, running the helper product
  path, or reading real runtime, model, artifact, cache, Memory, SQLite, env,
  filesystem, or network state;
- a diagnostic report would expose raw tool input, raw tool output,
  stdout/stderr, paths, URLs, credentials, signed URLs, tokens, env values,
  commands, scripts, exception messages, stack traces, process IDs,
  hostnames, usernames, tester IDs, model IDs, digests, vectors, source text,
  Memory records, helper diagnostics, descriptors, policy, or raw payloads;
- attachment changes existing runner behavior when not requested;
- an unknown summary shape or enum value would be treated as successful;
- the implementation requires a new CLI script, npm command, IPC route, UI
  field, telemetry sink, persistent store, release metadata, or default
  behavior; or
- any change would alter frozen Memory, Model Lifecycle, Observability, or
  Phase 14.1/14.2/14.3 Tool Execution semantics.

## Role Requests

**Product.** Approve exactly this Phase 14.4 pre-runtime Tool Execution
diagnostic runner attachment scope: optional attachment of an already-created
in-memory sanitized Tool Execution diagnostic subreport to
`runCoreHostLocalEmbeddingHelperEmbedDiagnostic` reports on pre-runtime
blocked/degraded fixture paths only. Exclude policy evaluation, tool
execution, runtime execution, Memory, provider behavior, UI/IPC, product
telemetry, product SLOs, defaults, tester workflows, and release changes.

**Security.** Approve exactly this bounded, fail-closed, in-memory,
no-runtime Tool Execution runner attachment scope with fixed fields,
sensitive-field rejection, counter/collection bounds, no persistence, no
network, no helper/model/cache/Memory access, no artifact verification, no
Tool Execution executor/session construction, no env/path reads beyond
existing pre-runtime checks, and no raw paths, URLs, credentials, raw tool
input/output, stdout/stderr, descriptors, policy, exception messages,
commands, scripts, process identifiers, usernames, or tester identifiers.

**Release.** Approve implementation and fixture evidence only. Do not approve
tool execution, runtime/cache acceptance, helper diagnostic execution,
existing product-path diagnostic execution, installer/update/default changes,
Desktop IPC, UI, provider visibility, telemetry persistence, release-channel
exposure, or production readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | PENDING | Exact Phase 14.4 pre-runtime Tool Execution diagnostic runner attachment scope |
| Security | PENDING | Exact bounded, fail-closed, in-memory, no-runtime Tool Execution runner attachment boundary |
| Release | PENDING | Implementation/fixture evidence only; no tool execution, diagnostic runner execution, default, UI/IPC, telemetry, or release behavior |

No implementation may begin until all three rows are explicitly approved for
this exact Phase 14.4 scope.

## Next Gate

After all three approvals are recorded, implement only the listed pre-runtime
Tool Execution diagnostic runner attachment, run the required verification,
record implementation evidence in this document, commit and push, and wait
for CI.

Any real diagnostic runner execution, real Tool Execution runner, runtime
route, Desktop IPC, UI, dynamic tool registry, network/filesystem/process
capability, persistent telemetry, model-driven invocation, Memory/model/helper
integration, or release behavior requires a new exact-scope
Product/Security/Release approval.
