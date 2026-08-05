# Phase 13.1 Provider-Neutral Observability Implementation Approval Request

Recorded on 2026-08-05 after the Phase 12.6 Model Lifecycle alpha closeout.

## Status

`APPROVED_IMPLEMENTATION_SCOPE`

This request is for a narrow implementation and fixture-evidence wave. It
does not authorize a runtime/cache window, real artifact access, helper
execution, product telemetry, or any change to the frozen Model Lifecycle
alpha.

## Context

Phase 12 Model Lifecycle alpha is complete and frozen. Its existing lifecycle
reports and the existing Memory retrieval failure classifications are useful
diagnostic inputs, but the project does not yet have one provider-neutral,
bounded, fail-closed observation contract for lifecycle/helper outcomes.

Phase 13.1 establishes that contract as a guarded foundation. The first
implementation remains fixture-first and in-memory so the contract can be
validated without enabling a new execution path.

## Exact Scope Requested

Approve one implementation wave for:

- provider-neutral observation schemas and types in `@jarvis-k/contracts`;
- a pure, in-memory observation collector/aggregator in
  `@jarvis-k/capabilities`;
- fixed lifecycle/helper operation phases and bounded status summaries;
- fixed failure classification and stop-reason mapping;
- bounded counters and deduplicated reason/failure lists;
- fail-closed validation and sensitive-field rejection; and
- deterministic fixture cases covering normal, degraded, blocked, timeout,
  cancellation, and cleanup outcomes.

The implementation may consume already-sanitized fixture or report-shaped
values. It must not call the existing model lifecycle manager, launch a
helper, access a model directory, access a cache, access Memory, or add a
Core Host composition path.

## Contract Boundary

The contract may represent only these bounded values:

### Operation domains

- `model_lifecycle`
- `helper_session`

Existing Memory retrieval `failureClass` values remain governed by their
current contract and are not replaced or widened by this phase.

### Lifecycle phases

- `preflight`
- `artifact_verification`
- `install`
- `health_check`
- `load`
- `activation`
- `preservation`
- `rollback`
- `release`
- `cleanup`
- `complete`

### Status and outcome values

- operation status: `started`, `passed`, `degraded`, `blocked`, `failed`,
  `stopped`;
- health/load/release state: `not_started`, `passed`, `degraded`, `failed`;
- activation state: `not_attempted`, `committed`, `not_committed`, `failed`;
- preservation state: `not_checked`, `preserved`, `not_preserved`, `unknown`;
- rollback state: `not_started`, `not_required`, `passed`, `degraded`,
  `failed`; and
- cleanup state: `not_started`, `not_required`, `passed`, `degraded`,
  `failed`.

`unknown` or an unrecognized value cannot be promoted to a successful
observation.

### Fixed failure classes

The implementation may emit only these lifecycle/helper classes:

- `APPROVAL_OR_SCOPE_BLOCKED`
- `INPUT_VERIFICATION_FAILED`
- `HELPER_HEALTH_FAILED`
- `HELPER_LOAD_FAILED`
- `HELPER_RELEASE_FAILED`
- `TIMEOUT_OR_CANCELLATION`
- `ACTIVATION_FAILED`
- `PRESERVATION_FAILED`
- `ROLLBACK_FAILED`
- `CLEANUP_FAILED`
- `SENSITIVE_OUTPUT_DETECTED`
- `UNKNOWN_SANITIZED_FAILURE`

### Fixed stop reasons

- `approval_missing`
- `scope_violation`
- `timeout`
- `cancellation`
- `health_failed`
- `load_failed`
- `release_failed`
- `activation_failed`
- `preservation_failed`
- `rollback_failed`
- `cleanup_failed`
- `sensitive_output_detected`
- `unexpected_failure`

### Bounds and retention

- at most 64 observations per in-memory aggregation;
- at most 32 deduplicated reason codes and failure classes;
- bounded non-negative counters with a maximum value of 1,024;
- bounded opaque correlation identifiers, with no source text or path-derived
  identifiers; and
- no persistence after the aggregator is released.

The exact DTO names may follow local repository conventions, but the accepted
field set and bounds above are part of this approval boundary.

## Sanitization Invariants

The implementation must:

- accept only allowlisted enum values and bounded primitive fields;
- map unknown errors to `UNKNOWN_SANITIZED_FAILURE`;
- preserve status and counts without copying exception messages;
- reject or omit raw paths, URLs, credentials, signed URLs, environment
  values, digest values, model values, vectors, source text, raw helper
  output, and arbitrary exception objects;
- avoid path-derived or source-derived correlation identifiers;
- deduplicate fixed reason codes and failure classes deterministically; and
- fail closed when a sensitive field, out-of-range counter, unknown enum, or
  unbounded collection is supplied.

The resulting summary is diagnostic evidence only. It is not a log shipping
format, product analytics event, user-facing error payload, or production
SLO signal.

## Explicitly Not Authorized

This request does not authorize:

- changing `FileSystemModelLifecycleManager` activation, upgrade, rollback,
  preservation, or cleanup semantics;
- unfreezing Model Lifecycle alpha or opening another runtime/cache window;
- materializing, fetching, loading, embedding, or releasing a real model;
- starting or reusing a runtime helper, warm session, artifact directory,
  cache, activation journal, or temporary runtime root;
- Memory routing, Memory writes, vector retrieval, SQLite migration, or
  historical indexing;
- provider registration, provider visibility, default opt-in, Core Host
  composition, Desktop IPC, UI controls, or user-facing commands;
- persistent telemetry, files, SQLite, network export, dashboards, alerts,
  metrics backends, or product SLOs;
- installer packaging, runtime bundling, automatic updates, release-channel
  exposure, or release policy changes; or
- using model or observation output for shell, PowerShell, Windows, network,
  or tool execution.

Any change to the frozen Model Lifecycle implementation or any runtime use of
this contract requires a separate exact-scope approval.

## Implementation Surface

The approved implementation, if all three roles approve, is limited to:

- `packages/contracts`: provider-neutral Observability schemas/types and
  exports;
- `packages/capabilities`: pure in-memory collector/aggregator, sanitizer,
  fixed mappings, and fixture helpers;
- focused contract/capability tests for bounds, redaction, classification,
  aggregation, fail-closed behavior, and fixture outcomes; and
- this approval record and its verification evidence.

No `apps/core-host`, `apps/desktop`, `apps/ui`, runtime package, Memory
package, SQLite package, model artifact, helper script, or release metadata
may be changed in this wave.

## Required Verification

After approval and implementation, the evidence must include:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

The focused tests must cover:

- valid bounded summaries for every approved phase and status;
- degraded, blocked, timeout, cancellation, and cleanup-stop mapping;
- helper health/load/release state aggregation;
- activation, preservation, rollback, and cleanup aggregation;
- unknown-error mapping without raw exception text;
- rejection of raw paths, URLs, credentials, digests, model values, vectors,
  source text, helper diagnostics, and unbounded fields;
- counter, collection, and correlation bounds; and
- release/reset of the in-memory collector with no persistence.

Passing implementation tests do not authorize any runtime/cache acceptance
window. The implementation evidence must remain fixture-only.

## Implementation Evidence

The approved Phase 13.1 implementation is complete within the authorized
surface:

- `packages/contracts/src/observability-protocol.ts` adds strict
  provider-neutral observation and summary schemas with fixed lifecycle/helper
  domains, phases, statuses, stop reasons, failure classes, reason codes, and
  bounded counters.
- `packages/capabilities/src/observability-aggregator.ts` adds a pure
  in-memory collector, sanitizer, fixed failure classifier, correlation guard,
  bounds enforcement, and release/reset behavior.
- `packages/capabilities/src/observability-fixture.ts` adds deterministic
  fixture-only coverage for normal, degraded, blocked, timeout, cancellation,
  and cleanup outcomes.
- Focused tests cover contracts, aggregation, classification, sanitization,
  bounds, release/reset, and fixture fail-closed behavior.

No `apps/core-host`, `apps/desktop`, `apps/ui`, runtime package, Memory
package, SQLite package, model artifact, helper script, or release metadata
was changed.

Local verification passed on 2026-08-05:

```powershell
npx.cmd vitest run packages/contracts/test/observability-protocol.test.ts packages/capabilities/test/observability-aggregator.test.ts packages/capabilities/test/observability-fixture.test.ts
npm.cmd run verify
```

Focused Observability tests passed with 3 test files and 13 tests. Full
repository verification passed with 138 test files and 736 tests, plus
typecheck, build, dependency boundaries, and the sensitive-artifact guard.

## Stop Conditions

Stop the implementation wave and return to approval if:

- a required contract field needs raw data to be useful;
- a proposed adapter needs `apps/core-host` or a real runtime call;
- a test requires real artifacts, a model directory, a helper, Memory, SQLite,
  network, persistent telemetry, or a user-facing surface;
- an unknown value would be treated as successful;
- a report would retain raw exception text or sensitive metadata;
- the collector cannot enforce the stated bounds; or
- any change would alter the frozen Model Lifecycle semantics.

## Role Requests

**Product.** Approve exactly the Phase 13.1 provider-neutral Observability
contract, sanitizer, and in-memory fixture aggregator described here. Approve
bounded lifecycle/helper diagnostics only; exclude runtime execution, Memory,
provider behavior, UI/IPC, product telemetry, product SLOs, defaults, and
release changes.

**Security.** Approve exactly the contract and fixture implementation with
allowlisted enums, bounded fields, fail-closed validation, fixed failure
classification, sensitive-field rejection, no persistence, no network, no
artifact/model/helper access, and no raw paths, URLs, credentials, digests,
model values, vectors, source text, or helper diagnostics.

**Release.** Approve implementation and fixture evidence only. Do not unfreeze
Model Lifecycle alpha and do not approve any runtime/cache window, installer,
update, default, UI/IPC, provider-visibility, release-channel, or release
metadata change.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | APPROVED | Exact Phase 13.1 contract, sanitizer, and fixture-only aggregator scope |
| Security | APPROVED | Exact bounded, fail-closed, non-persistent, no-runtime data boundary |
| Release | APPROVED | Implementation/fixture evidence only; no runtime or release behavior |

The following explicit approvals were received on 2026-08-05:

| Role | Approval evidence |
| --- | --- |
| Product | `APPROVE exactly this Phase 13.1 provider-neutral Observability implementation scope` |
| Security | `APPROVE exactly this bounded, fail-closed, non-persistent, no-runtime Observability scope` |
| Release | `APPROVE implementation and fixture evidence only; no runtime, lifecycle, UI/IPC, default, or release changes` |

These approvals authorize only the implementation and fixture evidence
listed here. They do not authorize runtime execution, Model Lifecycle
unfreeze, persistence, telemetry export, or any later integration.

## Next Gate

The three approvals are now recorded. Implement only the listed
`packages/contracts` and `packages/capabilities` surface, run the required
verification, commit and push the implementation, and wait for CI. Any later
integration with Core Host, lifecycle runtime, helper, Memory, UI, IPC,
telemetry persistence, or release behavior requires a new exact-scope
Product/Security/Release approval.
