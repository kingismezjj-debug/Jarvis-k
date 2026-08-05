# Phase 12.5 Model Lifecycle Runtime/Cache Approval Request

Recorded on 2026-08-05 after the approved Phase 12.4 file-backed lifecycle
implementation and the Phase 8 Memory alpha closeout.

## Status

`PENDING_RUNTIME_CACHE_APPROVAL`

This document is an approval request only. Creating this document, merging
it, or passing CI does not authorize runtime activity. No artifact may be
materialized, no real model directory may be read, no helper may be started,
and no temporary cache may be created until Product, Security, and Release
have each approved this exact scope.

## Context

Phase 12.4 completed and separately approved the Core Host file-backed model
lifecycle implementation. It proves digest-before-ready, interrupted-download
handling, failed-candidate cleanup, atomic activation, health-check gating,
restart/reopen recovery, previous-version preservation, rollback planning, and
sanitized lifecycle reports with fixture and isolated file-backed evidence.

That implementation approval did not authorize real artifact access, a real
model directory, helper execution, a temporary runtime cache, a persistent
cache, or a release behavior change. Phase 12.5 is the separate runtime/cache
approval boundary for one bounded developer-alpha acceptance window.

## Exact Approval Requested

Approve one local, single-operator, single-process developer-alpha runtime
window for the existing model lifecycle implementation. The window ends after
the bounded lifecycle evidence is captured and cleanup is verified, or
immediately at the first stop condition below.

The requested window may use only:

- the existing set of 10 fixed-digest model artifacts already approved for
  bounded developer-alpha evidence; no new artifact, model, revision, digest,
  manifest, or source is introduced;
- a controlled fetch or materialization of those artifacts into a unique
  system-temporary root;
- a temporary file-backed lifecycle/cache root below that same temporary root;
- the already approved local runtime and model-directory configuration,
  injected only into the one execution process;
- one supervised helper lifecycle for `health`, `load`, and `release` checks
  needed by lifecycle acceptance; and
- sanitized lifecycle evidence containing bounded phases, statuses, counts,
  cleanup/rollback state, preservation state, and fixed reason codes only.

The intended lifecycle path is:

1. verify the approvals, runtime gate, manifest policy, fixed artifact set,
   temporary-root containment, and persistent-cache prohibition;
2. create a unique temporary root and fetch or materialize only the approved
   fixed-digest artifacts;
3. verify each artifact digest before it becomes available or loadable;
4. install and atomically activate through the file-backed lifecycle manager;
5. run the bounded helper `health`, `load`, and `release` checks without
   invoking embedding or product inference;
6. observe active-version state after lifecycle-manager reopen;
7. exercise rollback only to a previously verified version if the bounded
   activation path requires it, preserving the last verified version until
   health-check completion; and
8. delete the temporary artifact, cache, activation journal, helper workspace,
   and other run-owned files, then verify cleanup.

This is a single acceptance window. It does not authorize retries that create a
second window, additional testers, a broader artifact set, or a persistent
cache. A naturally passing activation does not require an artificial failure
injection; rollback evidence may be recorded as `not_required` when no rollback
is needed.

## Required Safety Invariants

The approved window must preserve all of these invariants:

- no artifact is ready, loadable, or active before digest verification;
- a changed manifest, digest, revision, artifact source, or runtime identity
  blocks the window before materialization;
- a failed or interrupted candidate cannot replace the last verified active
  version;
- activation commits only after the bounded health check succeeds;
- rollback never deletes the last verified version before replacement health
  succeeds;
- all temporary writes remain inside the unique system-temporary root;
- no user-persistent model cache, install directory, or lifecycle journal is
  created;
- helper cancellation, timeout, health failure, load failure, or release
  failure stops the window and invalidates the result;
- sanitized reports contain no raw paths, URLs, credentials, signed URLs,
  model values, vectors, source text, digest values, or helper diagnostics; and
- cleanup failure, scope violation, sensitive-output detection, or uncertain
  cleanup fails closed and blocks acceptance.

## Explicitly Not Authorized

This request does not authorize:

- any artifact, model, revision, digest, manifest, or download source not
  already covered by the fixed approved set;
- arbitrary network access, credentials, signed URLs, or a production
  downloader;
- a user-persistent cache, installer location, automatic update location,
  cache migration, or cross-process/cross-run cache reuse;
- helper `embed`, local embedding inference, provider-vector execution,
  Memory routing, Memory writes, SQLite migration, historical indexing, or
  real product inference;
- provider registration, provider visibility, default opt-in, Desktop IPC,
  UI controls, user-facing lifecycle commands, or public tester workflows;
- installer packaging, runtime bundling, release-channel exposure, update
  policy, model lifecycle policy, product SLOs, or production readiness;
- shell, PowerShell, Windows, network, or tool execution based on model output;
  or
- retaining raw runtime logs, raw helper diagnostics, raw artifact metadata,
  or temporary files after the window.

## Preflight Before Any Runtime Action

The operator must verify all of the following before touching the runtime,
model directory, artifact source, or temporary filesystem:

- Product, Security, and Release rows below are all `APPROVED` for this exact
  Phase 12.5 scope;
- the Phase 12.4 implementation commit and CI evidence remain green;
- the fixed artifact set and manifests match the already approved records;
- the runtime and helper are local, pinned, and configured for this process
  only;
- the target cache root resolves below a newly created system-temporary root;
- no persistent cache, installer, update, release, or default-enable flag is
  present;
- helper capabilities are restricted to `health`, `load`, and `release`;
- no Memory or provider-vector route is composed into the process; and
- cleanup and process-termination handling is installed before materialization.

Missing approval, missing gate evidence, dirty or changed inputs, an
uncontained path, or an unexpected capability blocks the window. Preflight
must report only a fixed status and reason code.

## Stop Conditions

Stop immediately and do not continue to another artifact or lifecycle stage
when any of the following occurs:

- approval, manifest, revision, digest, device, or source verification fails;
- artifact fetch, resume, write, inventory, or digest verification fails;
- any write escapes the unique temporary root or a persistent cache is
  detected;
- helper startup, `health`, `load`, `release`, timeout, cancellation, or
  process cleanup fails;
- an unapproved helper operation, `embed`, inference, Memory, provider, UI,
  Desktop, installer, update, or release path is attempted;
- activation or rollback would remove the last verified version before a
  successful health check;
- a report contains raw paths, URLs, credentials, digest values, model values,
  vectors, source text, or helper diagnostics; or
- temporary cleanup is incomplete, uncertain, or cannot be verified.

The final result may be `passed`, `degraded`, or `blocked`. `degraded` and
`blocked` are evidence of a stopped run, not acceptance, and require a fresh
approval before any rerun.

## Sanitized Evidence Contract

The post-window report may contain only:

- scope identifier and bounded run status;
- counts for approved artifacts, verified artifacts, lifecycle operations,
  helper checks, activation, rollback, and cleanup;
- fixed phase/status values;
- `previousVersionPreserved` and `persistentCacheDetected` booleans;
- `rollbackStatus` as `passed`, `not_required`, `degraded`, or `blocked`; and
- deduplicated fixed reason codes.

Lifecycle reason codes must remain within the existing sanitized contract,
including:

- `MODEL_ARTIFACT_FETCH_FAILED`;
- `MODEL_ARTIFACT_SHA256_MISMATCH`;
- `MODEL_ARTIFACT_INVENTORY_WRITE_FAILED`;
- `MODEL_INSTALLATION_BLOCKED`;
- `MODEL_HEALTH_CHECK_FAILED`;
- `MODEL_ACTIVATION_COMMIT_FAILED`;
- `MODEL_FAILED_UPDATE_CLEANED`;
- `MODEL_CLEANUP_FAILED`;
- `MODEL_VERSION_NOT_VERIFIED`;
- `MODEL_ROLLBACK_VERSION_NOT_VERIFIED`;
- `MODEL_NO_PREVIOUS_VERSION`;
- `MODEL_ROLLBACK_COMMITTED`; and
- `MODEL_ACTIVATION_COMMITTED`.

Unknown runtime failures must map to a fixed sanitized failure class. Raw
exception messages and helper output must never be copied into the report.

## Role Requests

**Product.** Approve exactly one local developer-alpha model lifecycle
runtime/cache acceptance window using only the existing 10 fixed-digest
artifacts, with no Memory route, no user-facing behavior, no default change,
no tester expansion, and no product SLO.

**Security.** Approve the one-window use of a controlled artifact
fetch/materialization, a system-temporary file-backed cache, the pre-approved
runtime/model directory configuration, and helper `health/load/release` only.
Require digest-before-ready, temporary-root containment, atomic activation,
previous-version preservation, fail-closed stop behavior, sanitized
classification, timeout/cancellation/release, and verified cleanup. Do not
approve persistent cache, credentials, arbitrary network access, `embed`,
Memory, raw diagnostics, or unbounded retries.

**Release.** Approve developer-alpha runtime/cache evidence only. Exclude
installer packaging, runtime bundling, automatic updates, default
configuration, user-facing lifecycle controls, release-channel exposure,
model lifecycle policy, cache policy, upgrade/rollback policy, and production
readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | PENDING | One exact local runtime/cache acceptance window with the fixed artifact set |
| Security | PENDING | Temporary artifact/cache/runtime/helper scope with digest, containment, cleanup, and fail-closed controls |
| Release | PENDING | Developer-alpha evidence only; no installer, update, default, or release-channel changes |

Until all three rows are `APPROVED`, the only permitted work is review,
documentation, tests, and CI. The next operator action after approval must
re-read this document, confirm the exact approval text, and perform the
preflight before any runtime or filesystem side effect.

## Verification Before Approval Handoff

The approval request is ready for handoff only after:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

The request itself does not consume the approval or execute a runtime window.
