# Phase 13.5 Observability Real-Runtime Acceptance Approval Request

Recorded on 2026-08-05 after Phase 13.4 attached the sanitized Observability
diagnostic surface to the local embedding helper diagnostic runner's
pre-runtime blocked/degraded paths and CI passed.

## Status

`PENDING_THREE_PARTY_APPROVAL`

This document requests one exact developer-alpha real-runtime acceptance
window for Observability evidence. It does not approve implementation work
beyond the minimum runner/session attachment needed for the window, and it
does not approve persistent telemetry, UI/IPC exposure, default changes,
release behavior, tester expansion, or a second runtime/cache run.

## Context

Phase 13.1 added the provider-neutral Observability contract and in-memory
collector. Phase 13.2 added Core Host fixture-only mapping from sanitized
model-lifecycle/helper report-shaped values into Observability observations.
Phase 13.3 added the diagnostic surface helper that converts an existing
in-memory `ObservabilitySummary` into a bounded diagnostic subreport. Phase
13.4 attached that subreport to
`runCoreHostLocalEmbeddingHelperEmbedDiagnostic` only on pre-runtime
blocked/degraded paths when explicitly requested.

Phase 13.5 is the proposed approval boundary for one real-runtime acceptance
window that proves Observability can describe the existing local embedding
helper diagnostic path with sanitized, bounded, in-memory evidence. The goal
is diagnostic confidence, not product enablement.

## Exact Approval Requested

Approve exactly one local, single-operator, single-process developer-alpha
runtime/helper diagnostic window that may:

- use the already approved local runtime and model artifact set from the
  existing provider-vector/model lifecycle acceptance lineage;
- materialize only the already fixed-digest model artifacts into a unique
  system-temporary root for this one process;
- use only a temporary helper workspace and temporary runtime/cache values
  below that same unique temporary root;
- run the existing local embedding helper diagnostic sequence for `health`,
  `load`, `embed`, `shutdown`, and resource release;
- create one in-memory Observability session for this same diagnostic window;
- observe only fixed stage/status/failure-class transitions for preflight,
  artifact verification, helper health, helper load, helper embed, shutdown,
  resource release, and cleanup;
- attach the resulting sanitized Observability diagnostic subreport to the
  existing runner report; and
- record only developer-alpha evidence containing bounded statuses, phases,
  counters, reason codes, failure classes, cleanup/release state, and
  `persisted=false`.

The window ends after the sanitized report and cleanup evidence are captured,
or immediately at the first stop condition below. A degraded, blocked, failed,
or uncertain-cleanup result consumes the approval and does not authorize a
rerun.

## Required Safety Invariants

The approved window must preserve all of these invariants:

- no helper, artifact, model directory, runtime Python, cache, or Memory path
  is touched until all three approval rows below are approved for this exact
  Phase 13.5 scope;
- artifact materialization is limited to the already approved fixed-digest
  artifact set;
- every artifact digest is verified before helper load or embed can proceed;
- all temporary writes stay inside a unique system-temporary root and are
  deleted before the window is considered complete;
- Observability collection remains in-memory only and is released before
  process exit;
- the diagnostic remains single-process, single-operator, and one-window;
- helper operations are limited to the existing diagnostic path and its
  cleanup/release behavior;
- Memory writes, SQLite migrations, provider visibility changes, UI/IPC,
  persistent telemetry, and release/default changes remain disabled;
- raw vectors, raw source text, raw helper output, raw exception messages,
  stack traces, paths, URLs, credentials, signed URLs, digests, environment
  values, process identifiers, hostnames, usernames, tester identifiers, and
  raw diagnostic payloads are never copied into the report; and
- unknown runtime failures map to fixed sanitized reason codes and failure
  classes.

## Explicitly Not Authorized

This request does not authorize:

- any second runtime/cache/helper window after this one completes or stops;
- increasing tester count, message count, or acceptance duration;
- using a model artifact, revision, digest, manifest, source, or downloader
  not already approved for developer-alpha evidence;
- persistent model cache, persistent telemetry, metrics files, logs, SQLite
  telemetry rows, dashboards, alerting, analytics, or network export;
- Memory retrieval routing, Memory writes, SQLite schema changes, historical
  indexing, provider-vector product-path execution, or product inference
  beyond the existing bounded helper diagnostic;
- Desktop IPC, preload, UI, settings, user-facing commands, provider
  visibility, provider registration, default opt-in, or release metadata
  changes;
- installer packaging, runtime bundling, automatic updates, release-channel
  exposure, product SLOs, production-readiness claims, or public tester
  workflows;
- warm reuse changes unless they are already explicitly enabled by the
  existing approved diagnostic configuration for this one process; or
- shell, PowerShell, Windows, network, or tool execution based on model,
  helper, diagnostic, Memory, or Observability output.

Any persistent telemetry, UI/IPC exposure, broader runtime instrumentation,
Memory integration, product-path retrieval run, tester expansion, release
behavior, or rerun after degraded/blocked evidence requires a new exact-scope
Product/Security/Release approval.

## Preflight Before Any Runtime Action

The operator must verify all of the following before touching runtime,
artifact, helper, model, cache, Memory, SQLite, filesystem materialization, or
network state:

- Product, Security, and Release rows below are all `APPROVED` for this exact
  Phase 13.5 scope;
- Phase 13.4 commit and CI evidence remain green;
- the target diagnostic is only
  `runCoreHostLocalEmbeddingHelperEmbedDiagnostic`;
- the existing Phase 13 Observability contracts, Core Host adapter, diagnostic
  surface, and runner attachment are present and verified;
- the fixed artifact manifest and digests match the already approved records;
- the runtime Python, helper script, model directory, temporary artifact root,
  helper workspace, and any runtime/cache values resolve only for this process;
- every temporary root resolves below a unique system-temporary directory;
- no persistent cache, telemetry sink, IPC route, UI surface, provider default,
  release flag, installer path, or updater path is configured;
- cleanup and process-termination handling is installed before
  materialization; and
- the planned report schema contains only the sanitized evidence fields listed
  below.

Missing approval, missing gate evidence, dirty or changed runtime inputs,
unexpected artifact identity, uncontained paths, persistent cache detection,
or an unexpected capability blocks the window before runtime action.

## Stop Conditions

Stop immediately and do not retry within this approval when any of the
following occurs:

- approval, preflight, manifest, digest, runtime identity, helper identity, or
  temporary-root containment verification fails;
- artifact materialization, digest verification, helper startup, helper
  `health`, helper `load`, helper `embed`, helper `shutdown`, resource
  release, Observability release, or cleanup fails;
- an unapproved helper operation, Memory route, SQLite migration, product
  inference route, provider registration, UI/IPC path, telemetry sink,
  installer, updater, release path, network export, or shell execution is
  attempted;
- any report or subreport would expose raw paths, URLs, credentials, signed
  URLs, digests, model values beyond the existing approved model identifier,
  vectors, source text, helper diagnostics, exception messages, stack traces,
  env values, commands, scripts, process IDs, hostnames, usernames, tester
  IDs, or raw payloads;
- Observability summary validation fails, counters exceed bounds, enum values
  are unknown, correlation validation fails, or sensitive-output detection
  triggers;
- cleanup is incomplete, uncertain, or cannot be independently verified; or
- the result is degraded or blocked and would require another runtime/cache
  attempt to continue.

The final result may be `passed`, `degraded`, or `blocked`. Only `passed` with
verified cleanup can support Phase 13 alpha closeout. `degraded` and `blocked`
are stopped-run evidence and require a fresh approval before any rerun.

## Sanitized Evidence Contract

The post-window report may contain only:

- phase/scope identifier and bounded status;
- existing runner booleans for accepted state, helper embed called, vector
  values exposed, raw inputs exposed, persistence disabled, and default/UI
  behavior unchanged;
- bounded counts for diagnostic cases, passed/degraded/failed cases,
  observations, rejected observations, started/passed/degraded/blocked/failed/
  stopped observations, timeouts, reason codes, and failure classes;
- fixed phase/status values for preflight, artifact verification, helper
  health, helper load, helper embed, shutdown/release, and cleanup;
- fixed sanitized reason codes and failure classes;
- cleanup/release state;
- `persisted=false` and `rawDiagnosticsExposed=false`; and
- an optional `observability` subreport that matches the Phase 13.3 diagnostic
  surface contract and omits correlation IDs.

The evidence must not include raw paths, URLs, credentials, signed URLs,
digests, vector values, source text, raw helper output, raw runtime logs,
exception messages, stack traces, environment values, arbitrary diagnostics,
commands, scripts, process identifiers, hostnames, usernames, tester
identifiers, raw Memory rows, or raw diagnostic payloads.

## Required Local Verification

Before any runtime window, the implementation must pass:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx.cmd vitest run apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts
npx.cmd vitest run apps/core-host/test/observability-core-host-integration.test.ts
npx.cmd vitest run apps/core-host/test/observability-diagnostic-surface.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

After the approved window, run:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke tests are not required unless the implementation changes
Desktop IPC, UI, preload, settings, provider visibility, defaults, or
user-facing behavior; those changes are not authorized by this request.

## Role Requests

**Product.** Approve exactly one developer-alpha Observability real-runtime
acceptance window for the existing local embedding helper diagnostic runner.
Allow a single sanitized in-memory Observability summary and diagnostic
subreport as internal evidence only. Exclude product enablement, tester
expansion, Memory integration, UI/IPC, defaults, provider visibility, product
SLOs, and release behavior.

**Security.** Approve exactly this bounded temporary artifact/cache/runtime/
helper scope for one local process, with fixed-digest artifacts,
digest-before-load, system-temporary containment, in-memory-only
Observability collection, bounded schemas, sensitive-output rejection,
fixed failure classification, timeout/cancellation/release handling, and
verified cleanup. Exclude persistent cache, persistent telemetry, raw output,
private paths, credentials, signed URLs, arbitrary network access, Memory,
SQLite migrations, UI/IPC, and shell/Windows execution.

**Release.** Approve developer-alpha runtime evidence only. Exclude installer
packaging, runtime bundling, automatic updates, default configuration,
provider visibility, Desktop IPC, UI, telemetry persistence, release-channel
exposure, public documentation as an enabled feature, product SLOs, and
production readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | PENDING | Exactly one Observability real-runtime helper diagnostic window |
| Security | PENDING | Exactly this temporary artifact/cache/runtime/helper and in-memory Observability scope |
| Release | PENDING | Developer-alpha evidence only; no installer, update, default, UI/IPC, telemetry, or release changes |

No runtime action may begin until all three rows are explicitly approved for
this exact Phase 13.5 scope.

## Next Gate

After all three approvals are recorded, implement only the minimum attachment
needed to create, observe, summarize, attach, and release an in-memory
Observability session around the existing helper diagnostic window. Then run
the required local verification, execute exactly one approved runtime window,
record sanitized evidence and cleanup results in this document, commit and
push, and wait for CI.

Any failure, degraded result, blocked result, uncertain cleanup, sensitive
output, or need for broader instrumentation stops the phase and requires a
fresh Product/Security/Release approval before rerun or expansion.
