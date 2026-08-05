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

Push and GitHub Actions CI must pass before the implementation wave can be
marked complete.

## Next Hard Pause

Do not retry or broaden the bounded tester expansion until the degraded recall
from the second tester window has a reviewed disposition and a fresh approval
for the exact rerun window. Do not expand beyond 3 testers, 5 messages per
tester, or 2 hours without separate product, security, and release approval.
