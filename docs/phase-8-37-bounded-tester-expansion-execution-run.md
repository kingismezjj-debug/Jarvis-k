# Phase 8.37 Bounded Tester Expansion Execution Run

Recorded on 2026-08-05 after separate product, security, and release approval
for a bounded developer-alpha tester expansion execution run.

## Scope

This wave adds the bounded tester expansion execution runner and command
surface for continuous provider-vector retrieval developer-alpha evidence.

The runner allows at most 3 tester windows, at most 5 minimized synthetic or
explicitly consented messages per tester, and a 2 hour review window. It
requires Phase 8.36 preflight evidence and the separate product, security, and
release approvals before it will call the existing continuous developer-alpha
session path. If any tester session returns `blocked` or `degraded`, the
wrapper stops before invoking later tester windows and reports only sanitized
aggregate evidence.

The runner does not change default behavior, Desktop/UI behavior, provider
visibility, fixture fallback, release channel, installer/update policy, model
lifecycle policy, cache policy, upgrade/rollback policy, or product SLOs. It
does not batch-index historical Memory. It does not add a new provider, new
IPC surface, UI control, runtime dependency, downloader, cache, migration, or
Windows/PowerShell execution path.

## Execution Boundary

When the explicit env chain and approved local runtime/model values are
configured during a later operator run, the wrapper delegates each bounded
tester window to the existing Phase 8.31 continuous developer-alpha session.
That lower-level session is still responsible for:

- approved local model artifact SHA-256 verification;
- local embedding provider execution gate checks;
- source minimization and input bounds;
- resource lease, timeout, cancellation, and release behavior;
- provider vector shape and finite validation;
- sanitized recall observation;
- exact-source provider-vector rollback;
- fail-closed no-recall degradation.

The Phase 8.37 wrapper aggregates only sanitized counts, statuses, dimensions,
reason codes, rollback counts, and unsafe flags. It does not expose tester IDs,
raw tester messages, raw vectors, raw text, raw helper diagnostics, artifact
paths, Python paths, private paths, signed URLs, credentials, or raw Memory
records.

## Command

The explicit command is:

```powershell
npm.cmd run usage:memory-retrieval:bounded-tester-expansion
```

It is not part of default CI. It requires the full existing gate chain and
approved local runtime/model/database env values to be configured by the
operator during the approved window. With missing env values, it degrades
before artifact access or helper startup and prints only a sanitized report.

## Verification

Completed targeted local verification on 2026-08-05:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-bounded-tester-expansion-execution-run.test.ts
```

- Core Host build: PASS.
- Bounded tester expansion execution normal, blocked, degraded, rollback,
  missing-session-gate, and sensitive-output tests: PASS, 6 tests.
- `npm.cmd run verify`: PASS, including 133 test files and 700 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-degraded`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Approved Operator Attempts

### Configuration Attempts

On 2026-08-05, after explicit approval for the execution window, the command
was invoked twice before local runtime/model/database configuration was
available. The runner degraded before Core Host/helper startup and returned
only sanitized aggregate evidence:

- `status=degraded`;
- `accepted=false`;
- `tester_session_degraded`;
- `messageCount=0`;
- `providerVectorWriteCount=0`;
- no Memory database file was created;
- no helper process was started;
- no raw vectors, raw text, private paths, credentials, or diagnostics were
  exposed.

The first attempt also exposed a wrapper reason-mapping defect: a session that
had not started was reported as `tester_messages_invalid`. The mapping was
corrected to retain the sanitized `tester_session_degraded` result, and the
regression test passed. These were failed-closed configuration attempts, not
real bounded tester expansion sessions.

### Real Bounded Tester Run

After separate approval to temporarily materialize the already pinned
artifacts, the approved runtime and all required gates were injected only into
one execution process. All 10 artifacts passed digest verification and the
temporary artifact manifest size check. The real Phase 8.37 command then
started the provider-backed path and returned:

- `status=degraded`;
- `accepted=false`;
- `testerCount=2` and `acceptedTesterCount=1`;
- `messageCount=3`, `acceptedMessageCount=3`, and `observationCount=3`;
- `providerVectorWriteCount=3` with dimension `1024`;
- `recallMode=provider_vector`;
- `rollbackStatus=passed`, `rollbackDeletedCount=3`;
- `cleanupStatus=passed`;
- `tester_session_degraded`;
- the third tester window was not invoked after the second window degraded.

The first tester window passed its two bounded messages. The second window
degraded after its first message, so the runner stopped before later windows
as designed. The temporary artifact directory and Memory DB were deleted after
the run; no persistent cache, raw vector, raw text, private path, credential,
signed URL, or raw helper diagnostic was retained.

## Degraded Recall Review and Disposition

Reviewed on 2026-08-05 after the real run. The rerun is **not reapproved**.

The sanitized evidence shows that the failure was inside the provider-vector
recall path rather than artifact access or rollback:

- `providerVectorWriteCount=3` with dimension `1024` confirms that all three
  accepted source messages produced provider-vector writes.
- `queryDimensionCount=1024` confirms that the degraded tester reached valid
  provider query-vector generation.
- `rollbackStatus=passed` and `rollbackDeletedCount=3`, plus
  `cleanupStatus=passed`, confirm that the safety cleanup boundary held.
- A no-match SQLite query is represented as an `ok` result with an empty
  match list, so `status=degraded` is consistent with query execution failure
  or a Core Host retrieval exception, not merely zero matches.

The exact lower-level failure was intentionally not retained because raw helper
diagnostics are outside the Phase 8.37 evidence boundary. Repeated cold-start
and release of the Python helper for each provider embed remains a plausible
runtime contributor, but it is not proven. The existing fixture SQLite
write/query/reopen/rollback tests pass, so a basic file-backed lifecycle defect
is not currently supported by local evidence.

During this review, aggregate recall reporting was corrected so a later
`degraded` observation cannot be overwritten by an earlier or later `ok`
observation. The correction is report-only and does not make the failed run
acceptable.

Before any future exact rerun window, require a new sanitized diagnosis of the
provider-vector query failure class, passing local verification and CI for this
report correction, and fresh product, security, and release approval. Do not
materialize artifacts or broaden tester scope on the basis of this review.

## Retrieval Stabilization Evidence

Completed on 2026-08-05 as a local stabilization wave. This work did not
materialize model artifacts, start a real helper, enable warm reuse for a real
run, or change the existing approval disposition.

The retrieval path now retains a fixed sanitized `failureClass` in Core
recall observations while preserving the existing bounded `reasonCode`
contract. The only exposed classes are:

- `QUERY_EMBEDDING_TIMEOUT`;
- `QUERY_EMBEDDING_FAILED`;
- `VECTOR_QUERY_EXECUTION_FAILED`;
- `VECTOR_QUERY_RESULT_INVALID`;
- `HELPER_LIFECYCLE_FAILED`;
- `MEMORY_RETRIEVAL_ROUTING_FAILED`.

Unknown errors map to the routing-failed class. Raw error messages, helper
diagnostics, paths, vectors, and source text are never copied into the
observation or alpha reports. Alpha and bounded tester reports retain only
deduplicated fixed `recallFailureClasses`.

A file-backed 1024-dimensional regression now covers the full local lifecycle:
write one approved provider vector, close SQLite, reopen the same file, query
with the same model and dimension, delete the exact source, reopen again, and
confirm an `ok` zero-match result after rollback. A second regression runs the
same 1024-dimensional query through the Core Host env wiring with a real
`SqliteMemoryRepository` and a deterministic injected embedding provider.

Helper session warm reuse was implemented as an explicit opt-in under
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_SESSION_REUSE`. The default remains disabled
and therefore preserves the existing per-request cold lifecycle. When
explicitly enabled, one in-process helper session and resource lease can serve
sequential embeds; helper failure invalidates and releases both, and `close()`
is idempotent. No cross-process or persistent cache reuse is introduced.

Current local evidence after this wave:

- `npm.cmd run verify`: PASS, 134 test files and 712 tests;
- `npm.cmd run check:boundaries`: PASS;
- `npm.cmd run check:sensitive-artifacts`: PASS;
- Core Host/Desktop retrieval and local embedding smoke tests: PASS.

The real provider-vector rerun remains paused. Before enabling warm reuse or
running the minimum real retrieval window, obtain fresh product, security, and
release approval for that exact scope.

The implementation wave was pushed after local verification, and GitHub
Actions CI passed for the resulting commit.

## Fresh Minimum Diagnostic Window Approval Request

Requested on 2026-08-05 after the retrieval stabilization wave. This is a
new approval request for one exact diagnostic window; it does not reuse the
approval that preceded the degraded real run. Product, Security, and Release
provided explicit approval for this exact scope on 2026-08-05.

### Exact Requested Scope

- one tester window only;
- one minimized synthetic message only;
- temporary Memory DB in the system temporary directory, deleted on exit;
- only the already approved fixed-digest model artifact set;
- temporary artifact and helper workspace only, deleted on exit;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_SESSION_REUSE=1` for this diagnostic
  process only, with no cross-process or persistent cache reuse;
- sanitized counts, statuses, dimensions, existing reason codes, and fixed
  `failureClass` values only;
- exact-source provider-vector rollback followed by cleanup verification;
- immediate stop on any blocked or degraded session, retrieval failure,
  invalid result, helper lifecycle failure, rollback failure, or cleanup
  failure;
- no second tester window after the first window returns anything other than
  `passed`.

This request does not authorize unapproved artifact downloads, persistent
model caches, raw vectors, raw text, raw helper diagnostics, private paths,
credentials, signed URLs, SQLite migrations, historical indexing, UI or
Desktop changes, provider visibility or default changes, release policy
changes, product SLOs, or shell/Windows execution. It also does not authorize
tester invitations or any expansion beyond this one-window diagnostic.

### Separate Role Requests

**Product.** Approve exactly one developer-alpha diagnostic window with one
minimized synthetic message. Keep the result internal developer-alpha
evidence only; do not expose a tester workflow, change defaults or UI, alter
provider visibility, index historical Memory, or declare a product SLO.

**Security.** Approve temporary use of the already fixed-digest artifact set,
temporary helper/artifact workspace, temporary Memory DB, and explicit warm
session reuse for this single diagnostic process. Permit only temporary
materialization of the already approved fixed-digest artifact set; require
digest
verification, source minimization, sanitized failure classification,
timeout/cancellation/release, exact-source rollback, cleanup verification,
fail-closed no-recall degradation, and immediate stop on any failure. Prohibit
unapproved downloads, persistent caches, raw output, private paths,
credentials, signed URLs, raw diagnostics, migrations, historical indexing,
and shell/Windows operations.

**Release.** Approve this run as non-release developer-alpha evidence only.
Exclude installer packaging, automatic updates, default configuration,
public user documentation as an enabled feature, release-channel exposure,
model lifecycle policy, cache policy, upgrade/rollback policy, and product
SLO changes.

### Approval Evidence

| Role | Status | Required evidence |
| --- | --- | --- |
| Product | APPROVED | Explicit approval for the exact one-window, one-message scope received in the current task |
| Security | APPROVED | Explicit approval for temporary artifacts/helper/DB and opt-in warm reuse under the restrictions above received in the current task |
| Release | APPROVED | Explicit approval for developer-alpha evidence only and all release exclusions above received in the current task |

The approval evidence clears the approval gate for this exact window. Runtime
and model availability, temporary artifact materialization, helper startup,
and the one-window execution remain separate operator steps. No broader
tester scope is approved.

## Approved Minimum Diagnostic Run

Executed on 2026-08-05 after the three approvals above. The temporary
artifact runner used only the approved fixed-digest artifact plan and deleted
its temporary root after the process exited.

- artifact materialization: `passed`;
- artifact digest verification: `passed`;
- artifact count: `10`;
- manifest-size check: `passed`;
- tester windows invoked: `1`;
- accepted tester windows: `1`;
- messages submitted: `1`;
- accepted messages: `1`;
- observations: `1`;
- provider-vector writes: `1`;
- provider-vector dimension: `1024`;
- recall status: `ok`;
- recall mode: `provider_vector`;
- recall failure classes: none;
- query dimension: `1024`;
- recall matches: `1`;
- exact-source rollback: `passed`, deleted `1`;
- session cleanup: `passed`;
- temporary artifact, cache, Memory DB, and helper workspace cleanup:
  `passed`.

The run returned `status=passed` and `accepted=true`. No second tester
window was invoked, no raw output was retained, and no release, UI, default,
provider-visibility, migration, historical-indexing, persistent-cache, or
product-SLO behavior changed. This is developer-alpha diagnostic evidence
only and does not approve broader tester expansion.

## Next Hard Pause

The approved minimum diagnostic window passed. Keep Phase 8.37 in
developer-alpha evidence scope and do not expand beyond 1 tester window and
1 minimized synthetic message without a new separate Product, Security, and
Release approval. Any future degraded recall, rollback failure, cleanup
failure, or unsafe output remains an immediate stop condition.
