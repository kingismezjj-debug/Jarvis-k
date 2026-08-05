# Phase 13.3 Observability Diagnostic Surface Approval Request

Recorded on 2026-08-05 after the Phase 13.2 Core Host Observability
integration landed and CI passed.

## Status

`APPROVED_IMPLEMENTATION_SCOPE`

This request is for a narrow developer-alpha diagnostic surface implementation
wave. It does not authorize a new runtime/cache window, helper execution,
Memory execution, persistent telemetry, UI/IPC exposure, or any change to the
frozen Model Lifecycle alpha.

## Context

Phase 13.1 added the provider-neutral Observability contract and in-memory
collector. Phase 13.2 added Core Host fixture-only adapter/session functions
that map already-sanitized lifecycle/helper report-shaped objects into that
contract.

The next missing piece is a bounded diagnostic surface: a way for an already
approved developer-alpha diagnostic path to attach a sanitized Observability
summary when one is explicitly provided in memory by the caller. This phase
does not make diagnostics run, does not collect telemetry on its own, and does
not expose anything through Desktop IPC or UI.

## Exact Scope Requested

Approve one implementation wave for:

- a Core Host diagnostic-surface helper that accepts an existing Phase 13.1
  `ObservabilitySummary` object and returns a bounded sanitized diagnostic
  subreport;
- fixed summary fields only: status, current phase, bounded counters,
  lifecycle/helper state booleans or enum states, timeout flag, optional fixed
  stop reason, fixed reason codes, fixed failure classes, release state, and
  non-persistence flags;
- a fail-closed sanitizer that rejects unrecognized summary shapes, unknown
  enum values, sensitive fields, raw diagnostics, unbounded collections,
  counter overflow, or correlation-id mismatch;
- an optional in-memory attachment helper for existing developer-alpha
  diagnostic report-shaped objects when a caller explicitly supplies a safe
  Observability summary;
- fixture-only Core Host tests covering pass, degraded, blocked, timeout,
  cancellation, cleanup, unknown, sensitive-output, bounds, and release cases;
  and
- documentation updates to record approval and verification evidence.

The implementation may consume only an already-created, already-sanitized,
in-memory Observability summary. It must not create a session, observe
lifecycle/helper reports, invoke existing diagnostic runners, call lifecycle
manager methods, start helpers, read env values, read files, access Memory,
write telemetry, or change product behavior.

## Allowed Diagnostic Output

The diagnostic subreport may contain only:

- `observabilityAttached` boolean;
- bounded `status`, `currentPhase`, `timeoutOccurred`, and optional fixed
  `stopReason`;
- bounded lifecycle/helper state values from the Phase 13.1 contract;
- bounded counters from the Phase 13.1 contract;
- deduplicated fixed `reasonCodes` and `failureClasses`;
- `released`, `persisted=false`, and `rawDiagnosticsExposed=false`; and
- an optional fixed diagnostic reason such as
  `observability_summary_attached`,
  `observability_summary_missing`,
  `observability_summary_rejected`, or
  `observability_summary_not_requested`.

It must not include raw paths, URLs, credentials, signed URLs, environment
values, digest values, model values, vectors, source text, raw helper output,
exception messages, stack traces, arbitrary diagnostics, commands, scripts,
cache paths, artifact paths, process IDs, hostnames, usernames, tester IDs, or
raw diagnostic payloads.

## Allowed Implementation Surface

If approved, changes are limited to:

- `apps/core-host/src`: a diagnostic-surface helper file and local export only
  if required by tests;
- `apps/core-host/test`: focused fixture-only tests for the diagnostic
  surface;
- documentation updates to this approval request with approval and verification
  evidence.

This phase may not modify existing diagnostic runner behavior by default. If a
test needs a report-shaped input, it must use fixture objects and the new
helper directly rather than executing existing runners.

## Explicitly Not Authorized

This request does not authorize:

- running any existing acceptance, usage, runtime, helper, model lifecycle, or
  Memory diagnostic;
- unfreezing Model Lifecycle alpha or opening another runtime/cache window;
- materializing, fetching, loading, embedding, or releasing a real model;
- starting, reusing, warming, or inspecting a helper session;
- reading local runtime, artifact, cache, Memory DB, env, or user paths;
- creating persistent telemetry, logs, SQLite rows, metrics files, dashboards,
  alerting, network export, analytics, or product SLOs;
- changing Desktop IPC, preload, UI, settings, provider visibility, default
  opt-in, user-facing commands, or release behavior;
- installer packaging, runtime bundling, automatic updates, release-channel
  exposure, or production-readiness claims; or
- using model, Memory, diagnostic, or observation output for shell,
  PowerShell, Windows, network, or tool execution.

Any later attachment to a real diagnostic runner, any runtime execution, any
persistent telemetry, and any UI/IPC exposure requires a separate exact-scope
Product/Security/Release approval.

## Required Tests

If approved, focused Core Host tests must cover:

- attaching a passed Observability summary into a sanitized diagnostic
  subreport;
- attaching degraded, blocked, timeout, cancellation, cleanup, and released
  summaries without changing the source summary;
- missing summary and not-requested paths returning fixed sanitized reasons;
- rejecting unknown enum values, unrecognized summary shapes, sensitive keys,
  raw paths, URLs, credentials, digests, model values, vectors, source text,
  helper diagnostics, error messages, stack traces, env values, commands,
  scripts, cache paths, and artifact paths;
- bounds enforcement for counters, reason codes, failure classes, and
  correlation IDs; and
- proof that no filesystem, runtime, helper, Memory, SQLite, IPC, UI, network,
  or persistent telemetry action is required.

## Required Verification

After approval and implementation, run:

```powershell
npx.cmd vitest run apps/core-host/test/<phase-13-3-observability-diagnostic-surface-tests>
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke tests are not required unless the implementation changes Desktop
IPC, UI, preload, settings, provider visibility, or user-facing behavior;
those changes are not authorized by this request.

## Implementation Evidence

The approved Phase 13.3 implementation is complete within the authorized
surface:

- `apps/core-host/src/observability-diagnostic-surface.ts` adds a fixture-only
  diagnostic surface helper that accepts an already-created in-memory
  `ObservabilitySummary`, validates it through the Phase 13.1 schema, strips
  correlation identity from the diagnostic subreport, and returns only bounded
  sanitized fields.
- The helper returns fixed reasons for attached, missing, rejected, and
  not-requested summaries.
- The optional attachment helper copies only sanitized bounded report-shaped
  fields and rejects sensitive report-shaped inputs without retaining them.
- `apps/core-host/test/observability-diagnostic-surface.test.ts` covers passed,
  degraded, blocked, timeout, cancellation, cleanup, released, missing,
  not-requested, unknown, sensitive-output, bounds, correlation mismatch, and
  attachment cases.

No existing diagnostic runner is executed or modified. No runtime helper,
Model Lifecycle manager, Memory path, SQLite path, filesystem root, network,
Desktop IPC, UI, provider registration, default behavior, telemetry
persistence, installer, updater, release metadata, artifact, cache, or model
directory was touched.

Focused verification passed on 2026-08-05:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/observability-diagnostic-surface.test.ts
```

Focused Core Host Observability diagnostic-surface tests passed with 1 test
file and 6 tests.

Full local verification passed on 2026-08-05:

```powershell
npm.cmd run verify
```

Full repository verification passed with 140 test files and 748 tests, plus
typecheck, build, dependency boundaries, and the sensitive-artifact guard.

## Stop Conditions

Stop and return to Product/Security/Release approval if:

- useful diagnostics require raw paths, model IDs, digests, helper diagnostics,
  exception messages, source text, vectors, env values, process IDs, usernames,
  or tester IDs;
- the implementation would run or modify an existing diagnostic runner by
  default;
- a test requires real artifacts, model directories, Memory, SQLite, env
  values, helper startup, filesystem writes, network, or persistent telemetry;
- an unknown enum or report shape would be treated as successful;
- a diagnostic report would retain sensitive metadata;
- a caller-visible API would become product telemetry, UI state, IPC, or
  default runtime behavior; or
- any change would alter frozen Model Lifecycle semantics.

## Role Requests

**Product.** Approve exactly the Phase 13.3 developer-alpha Observability
diagnostic surface scope described here: a fixture-only helper that attaches an
already-created in-memory Observability summary to sanitized diagnostic
report-shaped objects. Exclude runtime execution, Memory, provider behavior,
UI/IPC, product telemetry, product SLOs, defaults, and release changes.

**Security.** Approve exactly this bounded, fail-closed, in-memory, no-runtime
diagnostic surface scope with fixed fields, sensitive-field rejection,
counter/collection bounds, no persistence, no network, no helper/model/cache/
Memory access, and no raw paths, URLs, credentials, digests, model values,
vectors, source text, helper diagnostics, exception messages, env values,
commands, scripts, process identifiers, usernames, or tester identifiers.

**Release.** Approve implementation and fixture evidence only. Do not approve
runtime/cache acceptance, Model Lifecycle unfreeze, existing diagnostic runner
execution, installer/update/default changes, Desktop IPC, UI, provider
visibility, telemetry persistence, release-channel exposure, or production
readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | APPROVED | Exact Phase 13.3 developer-alpha diagnostic surface helper scope |
| Security | APPROVED | Exact bounded, fail-closed, in-memory, no-runtime diagnostic surface boundary |
| Release | APPROVED | Implementation/fixture evidence only; no runtime or release behavior |

The following explicit approvals were received on 2026-08-05. The same three
approval lines were repeated by the operator; the duplicate approval does not
expand scope.

| Role | Approval evidence |
| --- | --- |
| Product | `APPROVE exactly this Phase 13.3 developer-alpha Observability diagnostic surface scope` |
| Security | `APPROVE exactly this bounded, fail-closed, in-memory, no-runtime Observability diagnostic surface scope` |
| Release | `APPROVE implementation and fixture evidence only; no runtime, diagnostic runner execution, UI/IPC, telemetry, default, or release changes` |

These approvals authorize only the implementation and fixture evidence listed
here. They do not authorize runtime execution, existing diagnostic runner
execution, Model Lifecycle unfreeze, helper instrumentation, Memory
integration, persistence, UI/IPC, telemetry export, default behavior, or
release changes.

## Next Gate

The three approvals are now recorded. Implement only the listed Core Host
diagnostic-surface helper and fixture tests, run the required verification,
commit and push the implementation, and wait for CI. Any later connection to a
real diagnostic runner, runtime instrumentation, persistent telemetry, UI/IPC
exposure, helper integration, Memory integration, or release behavior requires
a new exact-scope Product/Security/Release approval.
