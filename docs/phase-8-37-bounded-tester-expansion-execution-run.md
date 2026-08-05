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

## Approved Operator Attempt

On 2026-08-05, after explicit approval for the execution window, the command
was invoked twice. The local process environment still had no configured gate
chain, approved Python runtime, approved local model artifact directory, or
explicit Memory DB path. The runner therefore degraded before Core Host/helper
startup and returned only sanitized aggregate evidence:

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
regression test passed. This was a failed-closed configuration attempt, not a
real bounded tester expansion session.

Push and GitHub Actions CI must pass before the implementation wave can be
marked complete.

## Next Hard Pause

Do not retry the real bounded tester expansion command until an operator
configures the full approved gate chain, approved Python runtime, approved
local model artifact directory, and explicit Memory DB path for the approved
window. Do not use temporary artifact materialization or downloads without a
separate approval. Do not expand beyond 3 testers, 5 messages per tester, or
2 hours without separate product, security, and release approval.
