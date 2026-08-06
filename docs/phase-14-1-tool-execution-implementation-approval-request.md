# Phase 14.1 Tool Execution Implementation Approval Request

Recorded on 2026-08-05 after Phase 13 Observability alpha closeout and freeze.

## Status

`APPROVED_IMPLEMENTED_AND_VERIFIED`

This document requests approval for the first Tool Execution alpha
implementation wave after Observability. It is an implementation and fixture
evidence request only. It does not approve real shell, PowerShell, Windows,
network, browser, filesystem, process, Desktop IPC, UI, Memory, model-driven
tool invocation, default, installer, update, telemetry persistence, or release
behavior.

## Context

Phase 9.1 already added the low-risk provider-neutral tool governance
foundation:

- stable tool descriptors and input schema identifiers;
- bounded primitive tool arguments;
- risk levels, allowlists, blocked tool IDs, permission scopes, and
  confirmation requirements;
- policy decisions and sanitized audit records; and
- a fixture-only executor that performs no operating-system action.

Phase 13 then closed Observability alpha as a sanitized, in-memory,
developer-alpha evidence foundation. Phase 14.1 should build on both:

- keep the Phase 9.1 governance boundary;
- add clearer execution lifecycle and failure-classification semantics;
- define timeout, cancellation, rollback, and cleanup result contracts; and
- optionally map sanitized tool report-shaped values into Observability
  without exposing raw command, path, output, credential, or model data.

## Exact Scope Requested

Approve one implementation wave for a bounded Tool Execution alpha foundation
that may:

- extend `@jarvis-k/contracts` with provider-neutral tool execution lifecycle
  schemas for started, completed, denied, degraded, blocked, timed out,
  cancelled, rollback, and cleanup outcomes;
- extend fixed tool reason codes and failure classes for policy denial,
  confirmation missing, timeout, cancellation, fixture unavailable,
  sandbox/scope violation, rollback failure, cleanup failure, sensitive output,
  and unknown sanitized failure;
- keep tool invocation input limited to bounded primitive arguments and
  restricted key names;
- add sanitized execution result envelopes that include only request ID, tool
  ID, status, fixed result/reason/failure codes, bounded counters, timestamps,
  timeout/cancellation flags, rollback/cleanup state, and sanitized audit
  metadata;
- add an in-memory fixture executor/session in `@jarvis-k/capabilities` that
  never calls the operating system, shell, PowerShell, network, browser,
  filesystem, process APIs, Desktop IPC, UI, Memory, model runtime, or helper;
- add explicit policy gates for fixture execution, confirmation, allowlist,
  blocked tools, permission scopes, shell/process denial, Windows execution
  denial, and network denial;
- add optional sanitized Observability adapter functions that consume only
  fixed tool report-shaped values and create in-memory observations;
- add focused contract, capability, and fixture tests; and
- document implementation evidence and verification results.

The implementation must preserve all existing Phase 9.1 default-disabled
behavior. Existing consumers must not begin executing tools unless they
explicitly opt into the new fixture-only path.

## Allowed Implementation Surface

If approved, changes are limited to:

- `packages/contracts/src/tool-protocol.ts` and focused tests for bounded
  schemas, reason codes, failure classes, lifecycle status, rollback/cleanup,
  and sanitized result envelopes;
- `packages/capabilities/src/tool-governance.ts` and focused tests for
  fixture-only execution lifecycle, policy decisions, confirmation gates,
  timeout/cancellation classification, rollback/cleanup result construction,
  and sensitive-output rejection;
- optional provider-neutral fixture files under `packages/capabilities/src`
  if the existing `tool-governance.ts` would become too dense;
- optional Core Host-free Observability adapter tests only if they consume
  sanitized fixture report-shaped values and remain in-memory;
- documentation updates for this approval request and implementation
  evidence.

No Core runtime route, Core Host composition, Desktop IPC, preload, UI,
settings, provider registry, Memory repository, SQLite migration, model
runtime, helper runtime, browser control, network client, filesystem tool,
process spawning, installer, updater, release metadata, or telemetry sink may
be changed by this wave.

## Explicitly Not Authorized

This request does not authorize:

- real shell, PowerShell, command prompt, Windows API, process, filesystem,
  network, browser, clipboard, screen, OCR, voice, model, helper, Memory, or
  SQLite execution;
- model-driven or autonomous tool invocation;
- user-facing tool commands, Desktop IPC, preload exposure, UI controls,
  settings, provider visibility, default opt-in, public tester workflow, or
  release-channel behavior;
- persistent tool logs, telemetry, metrics files, SQLite rows, dashboards,
  alerting, analytics, network export, or product SLOs;
- retaining raw tool input, raw output, stdout/stderr, stack traces,
  exception messages, paths, URLs, credentials, signed URLs, tokens, env
  values, commands, scripts, process IDs, hostnames, usernames, tester IDs, or
  raw diagnostic payloads;
- destructive file operations, recursive delete/move, process termination,
  registry edits, service control, package installation, downloads, uploads,
  or remote calls;
- changing frozen Memory alpha, Model Lifecycle alpha, or Observability alpha
  semantics; or
- using model, Memory, Observability, diagnostic, or tool output for shell,
  PowerShell, Windows, network, filesystem, or process execution.

Any later Core/Core Host wiring, real OS execution, filesystem/network tool,
Desktop IPC, UI exposure, persistent telemetry, Memory integration, model
integration, browser/clipboard/screen integration, or release behavior
requires a separate exact-scope Product/Security/Release approval.

## Required Safety Invariants

The implementation must preserve these invariants:

- fixture execution is the only executable mode;
- `windowsExecutionEnabled`, `networkAccessAllowed`, and
  `shellExecutionAllowed` remain hard false in accepted policies;
- any process/shell permission denies before execution;
- confirmation-required tools return `needs_confirmation` until explicit
  confirmation is supplied;
- blocked or non-allowlisted tools deny before execution;
- unknown descriptors, unknown statuses, unknown reason codes, unknown
  failure classes, malformed requests, and sensitive fields fail closed;
- timeout and cancellation map only to fixed sanitized classifications;
- rollback/cleanup are represented as fixed states and must never perform real
  side effects in this phase;
- reports never contain raw inputs or raw outputs; and
- all tests use deterministic fixture objects only.

## Required Tests

If approved, focused tests must cover:

- descriptor, policy, request, decision, audit, execution result, lifecycle,
  rollback, cleanup, and failure-class schema validation;
- rejection of command, script, shell, PowerShell, credential, token, signed
  URL, download, network, path, process, env, raw output, stdout/stderr,
  exception, stack trace, and oversized fields;
- allowlisted read-only fixture execution;
- mutating/destructive fixture tools requiring confirmation;
- blocked, unallowlisted, unpermissioned, Windows, process, shell, and
  network-denied tools;
- timeout and cancellation classification without real timers if a deterministic
  fixture clock is sufficient;
- rollback/cleanup state construction without real side effects;
- fixture unavailable and unknown failure paths degrading or blocking with
  fixed reason/failure codes;
- optional Observability mapping from sanitized tool report-shaped values only;
  and
- report serialization free of raw paths, URLs, credentials, commands,
  scripts, raw tool input, raw tool output, stack traces, env values, process
  identifiers, usernames, tester identifiers, and raw payloads.

## Required Verification

After approval and implementation, run:

```powershell
npm.cmd run build -w @jarvis-k/contracts
npm.cmd run build -w @jarvis-k/capabilities
npx.cmd vitest run packages/contracts/test/tool-protocol.test.ts packages/capabilities/test/tool-governance.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke tests are not required unless the implementation changes Core
Host composition, Desktop IPC, preload, UI, settings, provider visibility,
defaults, or user-facing behavior; those changes are not authorized by this
request.

## Stop Conditions

Stop and return to Product/Security/Release approval if:

- implementation requires real shell, PowerShell, Windows, process,
  filesystem, network, browser, clipboard, screen, OCR, voice, model, helper,
  Memory, SQLite, or Desktop IPC execution;
- a report would expose raw inputs, raw outputs, stdout/stderr, paths, URLs,
  credentials, signed URLs, tokens, env values, commands, scripts, exception
  messages, stack traces, process IDs, hostnames, usernames, tester IDs, or
  raw payloads;
- fixture execution cannot remain deterministic and side-effect free;
- policy cannot fail closed for unknown or malformed input;
- rollback/cleanup semantics require real side effects;
- Observability mapping would require persistent telemetry or raw diagnostics;
- any change would alter frozen Memory, Model Lifecycle, or Observability
  semantics; or
- any change would require UI/IPC, default, installer, update, release, or
  product SLO behavior.

## Role Requests

**Product.** Approve exactly this Phase 14.1 Tool Execution alpha
implementation scope: provider-neutral contracts, policy gates, fixture-only
execution lifecycle, sanitized results, timeout/cancellation/failure
classification, rollback/cleanup state, and focused tests. Exclude real tool
execution, model-driven invocation, UI/IPC, Memory integration, defaults,
tester workflows, product SLOs, and release behavior.

**Security.** Approve exactly this bounded, fail-closed, fixture-only,
no-runtime Tool Execution implementation scope with no shell, PowerShell,
Windows, process, filesystem, network, browser, clipboard, screen, OCR, voice,
model, helper, Memory, SQLite, persistent telemetry, raw output, credentials,
paths, commands, scripts, env values, stack traces, or destructive side
effects. Require allowlists, blocked IDs, permissions, confirmation gates,
sanitized failure classes, timeout/cancellation classification, and
rollback/cleanup states with no real side effects.

**Release.** Approve implementation and fixture evidence only. Do not approve
installer, update, default, Desktop IPC, UI, settings, provider visibility,
tool marketplace, telemetry persistence, release-channel exposure, public
tester workflow, product SLO, or production-readiness changes.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | APPROVED | Exact Phase 14.1 provider-neutral fixture-only Tool Execution implementation scope |
| Security | APPROVED | Exact bounded, fail-closed, no-runtime/no-OS/no-network Tool Execution boundary |
| Release | APPROVED | Implementation and fixture evidence only; no default, UI/IPC, telemetry, or release behavior |

Approval text recorded from the 2026-08-05 implementation window:

- Product: APPROVE exactly this Phase 14.1 Tool Execution alpha
  implementation scope
- Security: APPROVE exactly this bounded, fail-closed, fixture-only,
  no-runtime/no-OS/no-network Tool Execution boundary
- Release: APPROVE implementation and fixture evidence only; no
  installer/update/default/UI/IPC/telemetry/release changes

These approvals authorize only the implementation and fixture evidence listed
here. They do not authorize real tool execution, model-driven invocation,
Core/Core Host runtime wiring, Desktop IPC, UI, Memory integration, filesystem
or network tools, persistent telemetry, default behavior, or release changes.

## Implementation Evidence

Phase 14.1 implemented the approved provider-neutral, fixture-only Tool
Execution alpha foundation within the authorized surface:

- `packages/contracts/src/tool-protocol.ts` now defines bounded lifecycle
  statuses, fixed reason codes, fixed failure classes, rollback and cleanup
  states, bounded counters, timeout/cancellation flags, and sanitized
  execution result envelopes.
- Tool arguments now reject restricted execution, secret, path, process, env,
  raw output, stdout/stderr, exception, stack, URL, Windows path, UNC path,
  bearer token, and key-like values.
- `packages/capabilities/src/tool-governance.ts` keeps fixture execution as
  the only executable mode, adds explicit fail-closed policy gates for
  filesystem, screen, clipboard, network-like, Windows, shell/process,
  confirmation, allowlist, blocklist, permissions, and disabled fixture
  execution, and returns sanitized execution envelopes only.
- The fixture executor adds deterministic simulation options for timeout,
  cancellation, sandbox/scope violation, rollback failure, cleanup failure,
  and sensitive-output detection without timers, OS calls, filesystem calls,
  process spawning, network access, browser access, Memory, model runtime,
  helper runtime, IPC, UI, telemetry persistence, or side effects.
- Focused contract and capability tests cover schema validation, sensitive
  input rejection, fixture execution, degraded fixture availability,
  confirmation-missing classification, disabled execution gates, timeout,
  cancellation, sandbox/scope violation, rollback, cleanup, sensitive-output
  classification, bounded counters, and serialized report sanitization.

No Core runtime route, Core Host composition, Desktop IPC, preload, UI,
settings, provider registry, Memory repository, SQLite migration, model
runtime, helper runtime, browser control, network client, filesystem tool,
process spawning, installer, updater, release metadata, persistent telemetry,
default behavior, or release behavior was changed by this implementation.

## Verification Evidence

Commands run on 2026-08-05:

```powershell
npm.cmd run build -w @jarvis-k/contracts
npm.cmd run build -w @jarvis-k/capabilities
npx.cmd vitest run packages/contracts/test/tool-protocol.test.ts packages/capabilities/test/tool-governance.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Results:

- Contracts build: passed.
- Capabilities build: passed.
- Focused contract and capability tests: passed, 2 files / 14 tests.
- Full `npm.cmd run verify`: passed, including 140 test files / 759 tests,
  typecheck, dependency boundary check, sensitive artifact guard, and full
  build.
- Standalone `check:boundaries`: passed.
- Standalone `check:sensitive-artifacts`: passed.

## Next Gate

After commit and push, wait for CI on `main`.

Any real execution runner, Core/Core Host integration, Desktop IPC, UI,
network/filesystem/process capability, persistent telemetry, model-driven
invocation, Memory integration, or release behavior requires a new exact-scope
Product/Security/Release approval.
