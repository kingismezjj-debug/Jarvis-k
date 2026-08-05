# Phase 13.4 Observability Diagnostic Runner Attachment Approval Request

Recorded on 2026-08-05 after the Phase 13.3 Observability diagnostic surface
landed and CI passed.

## Status

`APPROVED_IMPLEMENTED_AND_VERIFIED`

This request is for a narrow developer-alpha diagnostic runner attachment
implementation wave. It does not authorize a runtime/cache window, helper
execution, Memory execution, persistent telemetry, UI/IPC exposure, or any
change to the frozen Model Lifecycle alpha.

## Context

Phase 13.1 added the provider-neutral Observability contract and in-memory
collector. Phase 13.2 added Core Host fixture-only mapping from sanitized
lifecycle/helper report-shaped values into that contract. Phase 13.3 added a
diagnostic surface helper that converts an already-created in-memory
`ObservabilitySummary` into a bounded sanitized diagnostic subreport.

Phase 13.4 is the proposed approval boundary for attaching that sanitized
subreport to one existing developer-alpha diagnostic runner output. The target
runner is:

- `runCoreHostLocalEmbeddingHelperEmbedDiagnostic` in
  `apps/core-host/src/local-embedding-helper-embed-diagnostic-runner.ts`.

The attachment must be optional and must be testable only on the runner's
already-safe blocked/degraded paths, before artifact verification, helper
startup, helper `health`, helper `load`, helper `embed`, or helper shutdown is
reached.

## Exact Scope Requested

Approve one implementation wave for:

- adding an optional in-memory Observability attachment input to
  `runCoreHostLocalEmbeddingHelperEmbedDiagnostic`;
- using the Phase 13.3 diagnostic-surface helper to attach a sanitized
  `observability` subreport to the runner report only when explicitly
  requested by the caller;
- preserving existing runner defaults when no Observability summary is
  supplied or when attachment is not requested;
- returning fixed sanitized attachment reasons for attached, missing,
  not-requested, and rejected summaries;
- rejecting sensitive or malformed Observability summary input without
  copying raw values into the runner report;
- focused tests that exercise only blocked/degraded pre-runtime paths; and
- documentation updates to record approval and verification evidence.

The implementation may consume only an already-created, already-sanitized,
in-memory Observability summary supplied directly by a fixture test. It must
not create an Observability session, observe lifecycle/helper reports, start a
helper, read env values beyond the runner's existing preflight checks, verify
artifacts, read model/cache paths, access Memory or SQLite, write telemetry,
or change product behavior.

## Allowed Report Shape Change

The target runner report may gain one optional field:

- `observability`: the Phase 13.3 sanitized diagnostic subreport.

This field may contain only:

- `observabilityAttached` boolean;
- fixed `diagnosticReason`;
- bounded status, phase, lifecycle/helper states, timeout flag, optional fixed
  stop reason, bounded counters, fixed reason codes, fixed failure classes,
  release state, `persisted=false`, and `rawDiagnosticsExposed=false`.

It must not contain correlation IDs, raw paths, URLs, credentials, signed URLs,
environment values, digest values, model values, vectors, source text, raw
helper output, exception messages, stack traces, arbitrary diagnostics,
commands, scripts, cache paths, artifact paths, process IDs, hostnames,
usernames, tester IDs, or raw diagnostic payloads.

## Allowed Implementation Surface

If approved, changes are limited to:

- `apps/core-host/src/local-embedding-helper-embed-diagnostic-runner.ts`:
  optional input/report typing and attachment call on already-returned
  blocked/degraded report paths;
- `apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts`:
  focused fixture tests for attachment on pre-runtime paths;
- `apps/core-host/src/observability-diagnostic-surface.ts`: only if a narrowly
  required helper export or type reuse is needed, without changing its
  existing behavior; and
- documentation updates to this approval request with approval and verification
  evidence.

No new runner, CLI script, npm command, runtime helper code, model lifecycle
code, Memory code, SQLite code, Desktop IPC, UI, provider registration,
default behavior, telemetry storage, installer, updater, artifact, cache,
model directory, or release metadata may be changed.

## Explicitly Not Authorized

This request does not authorize:

- running the helper embed diagnostic on the approved product path;
- invoking helper `health`, `load`, `embed`, or `shutdown`;
- artifact verification, model directory access, runtime Python access, or
  temporary/persistent cache access;
- running any existing acceptance, usage, runtime, model lifecycle, Memory, or
  provider-vector diagnostic window;
- unfreezing Model Lifecycle alpha or opening another runtime/cache window;
- creating, materializing, fetching, loading, embedding, or releasing a real
  model;
- creating persistent telemetry, logs, SQLite rows, metrics files, dashboards,
  alerting, network export, analytics, or product SLOs;
- changing Desktop IPC, preload, UI, settings, provider visibility, default
  opt-in, user-facing commands, or release behavior;
- installer packaging, runtime bundling, automatic updates, release-channel
  exposure, or production-readiness claims; or
- using model, Memory, diagnostic, or observation output for shell,
  PowerShell, Windows, network, or tool execution.

Any later attachment to a real runtime diagnostic path, any execution of the
helper product path, any persistent telemetry, and any UI/IPC exposure requires
a separate exact-scope Product/Security/Release approval.

## Required Tests

If approved, focused Core Host tests must cover:

- existing report shape and behavior remain unchanged when Observability
  attachment is not requested;
- an explicitly supplied passed Observability summary is attached to a
  pre-runtime `diagnostic_not_approved` or `diagnostic_opt_in_missing` report;
- missing summary returns a fixed `observability_summary_missing` subreport
  without changing the runner's pre-runtime stop behavior;
- malformed or sensitive summary input returns a fixed rejected subreport
  without copying raw values;
- correlation mismatch returns a fixed rejected subreport;
- attachment does not cause artifact verification, resource lease acquisition,
  helper startup, helper `health`, helper `load`, helper `embed`, helper
  shutdown, Memory access, SQLite access, filesystem writes, network access,
  IPC, UI, or telemetry persistence; and
- the runner report remains free of raw paths, URLs, credentials, digests,
  model values beyond the existing approved model identifier, vectors, source
  text, helper diagnostics, exception messages, env values, commands, scripts,
  process IDs, usernames, and tester IDs.

The tests must use fixture objects only and must stop before the runner's
runtime-bearing path.

## Required Verification

After approval and implementation, run:

```powershell
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

- attachment requires running the helper product path or reading real runtime,
  model, artifact, cache, Memory, SQLite, env, filesystem, or network state;
- a diagnostic report would expose raw paths, URLs, credentials, digests,
  vectors, source text, helper diagnostics, exception messages, env values,
  commands, scripts, process IDs, usernames, tester IDs, or raw payloads;
- attachment changes existing runner behavior when not requested;
- an unknown summary shape or enum value would be treated as successful;
- the implementation requires a new CLI script, npm command, IPC route, UI
  field, telemetry sink, persistent store, release metadata, or default
  behavior; or
- any change would alter frozen Model Lifecycle semantics.

## Role Requests

**Product.** Approve exactly the Phase 13.4 developer-alpha Observability
diagnostic runner attachment scope described here: optional attachment of an
already-created in-memory Observability diagnostic subreport to the
`runCoreHostLocalEmbeddingHelperEmbedDiagnostic` report on pre-runtime
blocked/degraded fixture paths only. Exclude helper execution, runtime,
Memory, provider behavior, UI/IPC, product telemetry, product SLOs, defaults,
and release changes.

**Security.** Approve exactly this bounded, fail-closed, in-memory, no-runtime
attachment scope with fixed fields, sensitive-field rejection, counter/
collection bounds, no persistence, no network, no helper/model/cache/Memory
access, no artifact verification, no env/path reads beyond existing
pre-runtime checks, and no raw paths, URLs, credentials, digests, vectors,
source text, helper diagnostics, exception messages, commands, scripts,
process identifiers, usernames, or tester identifiers.

**Release.** Approve implementation and fixture evidence only. Do not approve
runtime/cache acceptance, helper diagnostic execution, Model Lifecycle
unfreeze, existing product-path diagnostic execution, installer/update/default
changes, Desktop IPC, UI, provider visibility, telemetry persistence,
release-channel exposure, or production readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | APPROVED | Exact Phase 13.4 pre-runtime diagnostic runner attachment scope |
| Security | APPROVED | Exact bounded, fail-closed, in-memory, no-runtime attachment boundary |
| Release | APPROVED | Implementation/fixture evidence only; no runtime or release behavior |

Approval text recorded from the 2026-08-05 implementation window:

- Product: APPROVE exactly this Phase 13.4 pre-runtime Observability
  diagnostic runner attachment scope
- Security: APPROVE exactly this bounded, fail-closed, in-memory, no-runtime
  Observability runner attachment scope
- Release: APPROVE implementation and fixture evidence only; no runtime,
  helper diagnostic execution, UI/IPC, telemetry, default, or release changes

## Implementation Evidence

Phase 13.4 attached the Phase 13.3 sanitized Observability diagnostic
subreport to the existing
`runCoreHostLocalEmbeddingHelperEmbedDiagnostic` report only when
`observabilityAttachmentRequested` is explicitly true.

Implementation changes were limited to:

- optional runner input fields for an already-created in-memory summary and
  optional correlation check;
- one optional `observability` report field;
- attachment only on pre-runtime blocked/degraded returns before artifact
  verification, helper startup, helper `health`, helper `load`, helper
  `embed`, helper shutdown, resource lease acquisition, Memory, SQLite, UI/IPC,
  telemetry, or persistence; and
- fixture tests for default unchanged behavior, attached summary, missing
  summary, sensitive summary rejection, correlation mismatch, and opt-in
  missing early return.

No runtime helper execution, artifact verification, model/cache access, Memory
access, SQLite access, IPC/UI exposure, telemetry persistence, default change,
or release behavior was introduced by this implementation.

## Verification Evidence

Commands run on 2026-08-05:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Results:

- Core Host build: passed.
- Focused runner test: passed, 1 file / 7 tests.
- Full `npm.cmd run verify`: passed, including 140 test files / 751 tests,
  dependency boundary check, sensitive artifact guard, and full build.
- Standalone `check:boundaries`: passed.
- Standalone `check:sensitive-artifacts`: passed.

## Next Gate

After commit and push, wait for CI on `main`.
Any later real diagnostic runner execution, runtime instrumentation,
persistent telemetry, UI/IPC exposure, helper integration, Memory integration,
or release behavior requires a new exact-scope Product/Security/Release
approval.
