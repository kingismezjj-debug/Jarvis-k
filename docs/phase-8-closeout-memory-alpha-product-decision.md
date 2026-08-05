# Phase 8 Closeout and Memory Alpha Product Decision

Recorded on 2026-08-05 after the Phase 8.37 minimum diagnostic run passed.

## Decision Summary

| Area | Decision |
| --- | --- |
| Phase 8 technical status | `CLOSED` for the bounded developer-alpha retrieval scope |
| Phase 8.37 evidence | Passed one tester window with one minimized synthetic message |
| Memory alpha product status | `PROPOSED`, pending separate implementation approval |
| Release status | Developer-alpha only; no release or default opt-in |

Phase 8 is technically stable enough to stop adding preflight material. The
successful diagnostic does not approve broader tester expansion or product
release.

## Closeout Evidence

- 10 fixed-digest artifacts materialized and verified successfully.
- Provider-vector retrieval passed at 1024 dimensions.
- One message produced one provider-vector write and one recall match.
- Sanitized `failureClass` reporting is available; no failure class was
  reported in the passing run.
- Exact-source rollback deleted one test-window vector.
- Temporary artifact, cache, Memory DB, and helper workspace cleanup passed.
- `npm.cmd run verify`: 134 test files and 712 tests passed.
- Boundary checks, sensitive-artifact checks, push, and GitHub Actions CI
  passed.

## Proposed Memory Alpha

Approve a narrowly controlled, single-user local Memory alpha with:

- explicit opt-in through the existing Core Host gate chain;
- a complete Memory write, provider-vector retrieval, turn-assembly, disable,
  and exact-source rollback loop;
- fixture fallback and fail-closed no-recall behavior;
- source minimization and sanitized counts, statuses, dimensions, reason codes,
  and fixed `failureClass` values only;
- only newly accepted local Memory records during an approved alpha session;
- no raw vectors, raw helper diagnostics, private paths, credentials, signed
  URLs, or model output routed to shell/Windows actions.

The alpha remains an operator/developer workflow. It does not add a default
configuration, public tester workflow, UI control, provider visibility change,
product SLO, or release-channel behavior.

## Explicit Exclusions

This decision does not approve:

- broader tester expansion or longer usage windows;
- persistent model caches or model lifecycle/installer/update policy;
- SQLite schema/index migrations or historical Memory re-indexing;
- new Desktop IPC, UI behavior, provider registration, or default opt-in;
- tool execution, local voice, OCR, vision, or release packaging.

## Approval Needed

Before implementing the Memory alpha product slice, obtain separate:

- **Product approval** for the single-user opt-in closed loop, retention and
  disable behavior, and the absence of a product SLO;
- **Security approval** for local data handling, source minimization, helper and
  model boundaries, sanitized diagnostics, rollback, and cleanup;
- **Release approval** to keep the work developer-alpha only and exclude
  installer, update, default, lifecycle, cache, and release-channel changes.

This document is a product decision proposal, not an implementation approval.

## Memory Alpha Implementation Approval Request

Requested on 2026-08-05. This is a new approval request and is separate from
the earlier Phase 8.37 execution approval.

### Authorized Implementation Scope

If all three roles approve, the next wave may:

- finalize the single-user Memory alpha contract, retention, disable, and
  rollback behavior;
- implement the Memory write, provider-vector retrieval, turn-assembly, and
  fail-closed fallback loop behind the existing explicit opt-in gates;
- keep Core provider-neutral and place concrete composition in Core Host;
- add focused Core Host, deterministic fixture, file-backed SQLite, and
  sanitized failure-classification tests;
- use temporary test databases and injected/fixture providers for verification;
- keep the current default-disabled and developer-alpha release boundary.

### Not Authorized by This Request

This implementation approval does not authorize:

- real model artifact materialization or download;
- starting the Python helper or running real provider inference;
- a real Memory alpha usage session or new tester window;
- persistent model caches, model lifecycle, installer, update, or rollback
  policy changes;
- SQLite schema/index migrations or historical Memory re-indexing;
- new Desktop IPC, UI controls, provider visibility, or default opt-in;
- raw vectors, raw text, helper diagnostics, private paths, credentials, or
  signed URLs;
- shell/Windows actions, tool execution, local voice, OCR, vision, or release
  packaging.

### Required Role Confirmations

| Role | Status | Approval target |
| --- | --- | --- |
| Product | PENDING | Single-user opt-in closed loop, retention/disable behavior, no product SLO |
| Security | PENDING | Local data handling, source minimization, Core Host boundary, sanitized diagnostics, rollback and cleanup |
| Release | PENDING | Developer-alpha implementation/evidence only; no default, lifecycle, cache, installer, update, or release-channel changes |

No implementation work may begin until all three rows are explicitly
`APPROVED`. Approval of this request will still require a separate approval
before any real runtime or local Memory alpha acceptance session.

## Next Implementation Wave

1. Finalize the Memory alpha contract and retention/disable policy.
2. Implement the closed loop behind the existing explicit opt-in gates.
3. Add focused Core Host and file-backed acceptance coverage.
4. Run one approved local acceptance window, then review promotion separately.
