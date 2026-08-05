# Phase 12.4 Model Lifecycle Implementation Approval Request

Recorded on 2026-08-05 after Phase 8 Memory alpha closeout and the approved
minimum runtime acceptance window passed.

## Status

`PENDING_PRODUCT_SECURITY_RELEASE_APPROVAL`

This document requests approval for a narrow model lifecycle implementation
wave. It is not approval for a real model download, a real model activation,
local embedding inference, installer packaging, or release-channel behavior.

## Context

The project already has:

- provider-neutral model registry, download, lifecycle, and operation ports;
- manifest installability checks for immutable revisions, SHA-256 digests,
  license risk, and device capability;
- a Core Host file-backed lifecycle manager with injected artifact fetching;
- deterministic in-memory lifecycle fixtures for install, verification,
  upgrade planning, and rollback planning; and
- a dedicated local embedding runtime whose real artifact and helper execution
  remain separately gated.

Phase 8 is closed for the bounded Memory alpha scope. The next productization
stage is model lifecycle, with observability following it.

## Requested Implementation Scope

If Product, Security, and Release approve this exact implementation wave, the
next change set may:

- harden the existing file-backed lifecycle manager behind the `apps/core-host`
  composition boundary;
- preserve immutable `modelId + revision` storage identity and require a
  verified SHA-256 manifest before an artifact becomes available or loadable;
- make partial-download cleanup, failed-update cleanup, and previous-version
  preservation explicit and deterministic;
- define atomic version activation: a new version becomes active only after
  manifest verification and a bounded health check;
- define rollback planning and execution behavior for a failed activation while
  keeping the prior verified version available until the health check completes;
- expose only sanitized operation phases, bounded progress, status, outcome,
  reason codes, and cleanup/rollback flags;
- use injected artifact fetchers and isolated temporary directories in
  regression tests;
- add file-backed lifecycle tests for interrupted download, digest mismatch,
  failed activation, rollback, release, remove, and restart/reopen behavior;
- keep the model lifecycle default-disabled and provider-neutral; and
- update the lifecycle contract and approval documentation without changing
  the Memory alpha runtime boundary.

## Required Safety Contract

The implementation must keep these invariants:

- no artifact is ready or loadable before digest verification;
- a failed or interrupted update cannot replace the last verified version;
- `.part` and failed-version data are removed or reported for bounded cleanup;
- rollback never deletes the last verified version before the replacement
  health check passes;
- signed URLs, credentials, private paths, raw model values, and raw runtime
  diagnostics are not persisted or returned;
- operation reports contain no model file bytes, raw paths, or digest values;
- Core remains provider-neutral and `apps/core-host` remains the composition
  root;
- fixture fallback and existing default-disabled behavior remain unchanged;
  and
- all failure paths fail closed without provider registration or default opt-in.

## Explicitly Not Authorized

This request does not authorize:

- downloading or materializing a real model artifact;
- reading a real model artifact outside an already approved runtime window;
- starting the Python helper, loading a model, or running real inference;
- creating or mutating a user-persistent model cache;
- network access, credentials, signed URLs, or a production downloader;
- installer creation, runtime bundling, automatic updates, or release-channel
  changes;
- public tester workflows, new UI or Desktop IPC controls, provider visibility,
  or default opt-in;
- SQLite schema changes, historical Memory indexing, tool execution, voice,
  OCR, or vision work; or
- a product SLO or a claim of production readiness.

Real cache use, real artifact download/materialization, model activation, and
helper/provider execution require a later separate runtime approval with
exact paths, artifact scope, health checks, cleanup, and rollback evidence.

## Verification Required Before Approval Is Consumed

The implementation wave must pass:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Focused coverage must include the existing lifecycle, manifest policy, fixture
harness, and new file-backed restart/rollback tests. Reports must remain
sanitized under the sensitive-artifact guard.

## Role Requests

**Product.** Approve the narrow developer-alpha model lifecycle contract,
including verified version activation, previous-version preservation, bounded
rollback, and no default/public behavior change.

**Security.** Approve isolated file-backed lifecycle implementation and
temporary regression storage only. Require digest-before-ready, atomic
activation, failed-update cleanup, rollback preservation, source/path
minimization, sanitized diagnostics, and fail-closed behavior. Do not approve
real artifact access, credentials, network downloads, or persistent cache use
in this wave.

**Release.** Approve implementation and fixture evidence only. Exclude
installer packaging, runtime bundling, automatic updates, release-channel
exposure, default configuration, and production readiness.

## Approval Record

| Role | Status | Approval target |
| --- | --- | --- |
| Product | PENDING | Developer-alpha lifecycle contract and bounded rollback behavior |
| Security | PENDING | Temporary file-backed implementation, digest and cleanup invariants |
| Release | PENDING | Non-release implementation evidence only |

The next action after all three approvals is the focused implementation and
regression wave. No real model lifecycle runtime action is implied by this
request.
