# Phase 8.32 Provider Vector Retrieval Continuous Alpha Acceptance

Recorded on 2026-08-04 after separate product, security, and release approval
for one local controlled acceptance run.

## Scope

This wave adds and runs a one-time temporary-artifact acceptance runner for the
Phase 8.31 bounded continuous developer-alpha provider-vector retrieval
session.

The runner is available through:

```powershell
npm.cmd run usage:memory-retrieval:developer-alpha:continuous:temporary-artifact
```

It materializes only the approved pinned local embedding artifact set into a
temporary directory, verifies SHA-256 digests, uses a temporary Memory
database, runs the existing Phase 8.31 continuous session product path, and
removes the temporary directory on completion or failure.

## Acceptance Result

The local acceptance run completed with this sanitized evidence:

- Status: `passed`.
- Artifact materialization: `passed`.
- Artifact digest verification: `passed`.
- Artifact count: 10.
- Aggregate artifact bytes: 1207470234.
- Manifest-size match: `true`.
- Continuous session status: `passed`.
- Message count: 2 bounded synthetic messages.
- Accepted message count: 2.
- Observation count: 2.
- Provider vector write count: 2.
- Provider vector dimension count: 1024.
- Recall status/mode: `ok` / `provider_vector`.
- Recall match count: 2.
- Query dimension count: 1024.
- Stop reason: `completed`.
- Exact-source rollback: `passed`, deleted 2 provider vector rows.
- Cleanup: `passed`.
- Temporary session directory count after cleanup: 0.

All safety flags reported false or disabled: raw vectors returned/logged,
raw text exposure, raw diagnostics exposure, private path exposure, signed URL
or credential persistence, persistent cache writes, SQLite schema migration,
Desktop IPC changes, UI behavior changes, provider visibility/default opt-in
changes, historical batch indexing, and model-output shell execution.

## Safety Boundary

The runner does not persist model artifacts, signed URLs, credentials, private
paths, raw vectors, raw text, or helper diagnostics. It does not change
Desktop IPC, UI behavior, provider visibility, default opt-in, fixture
fallback, release policy, installer/update policy, model lifecycle policy, or
SQLite schema/indexes.

The acceptance result is developer-alpha evidence only. It is not a product
SLO, not a formal release feature, and not an installer/update/default
configuration path.

## Verification

Completed locally on 2026-08-04:

```powershell
npm.cmd run usage:memory-retrieval:developer-alpha:continuous:temporary-artifact
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

- Temporary-artifact continuous acceptance: PASS.
- `npm.cmd run verify`: PASS, including 128 test files and 674 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

## Next Hard Pause

Do not promote continuous developer-alpha retrieval to broader testers,
default behavior, UI controls, provider visibility, persistent model caches,
historical Memory indexing, installer/update/release policy, product SLO, or
Windows/PowerShell action routing without separate product, security, and
release approval.
