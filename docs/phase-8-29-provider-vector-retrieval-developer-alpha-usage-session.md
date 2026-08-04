# Phase 8.29 Provider Vector Retrieval Developer-Alpha Usage Session

Recorded on 2026-08-04 after separate product, security, and release approval.

## Scope

This wave adds a one-shot, local, single-developer usage-session runner for
the provider-vector Memory path. The runner sends exactly two bounded synthetic
messages by default, keeps the Core Host process alive for the session,
collects only sanitized recall metadata, verifies provider-vector metadata,
deletes the test-window provider vectors by exact source ID, and closes the
Core Host child process.

The runner is available through:

```powershell
npm.cmd run usage:memory-retrieval:developer-alpha
```

The runner does not populate environment variables, download artifacts,
materialize a model, print paths, print raw messages, print raw vectors, or
persist raw helper diagnostics.

## Safety Behavior

The runner requires:

- product, security, and release approval flags in the runner;
- the Phase 8.27 implementation;
- all explicit developer-alpha/provider/retrieval env gates;
- an approved Python executable and local model artifact directory;
- an explicit `JARVIS_K_MEMORY_DB_PATH`;
- SHA-256 verification through the existing local embedding artifact verifier;
- bounded messages, with a maximum of five;
- exact-source rollback after the Core Host session closes.

The child environment is allowlisted. It includes only required system values,
approved Jarvis-K gates, the approved runtime/model values, and the explicit
Memory database path. It does not forward arbitrary environment values.

The report exposes only status, counts, recall mode, dimensions, cleanup state,
rollback counts, fixed reason codes, and safety flags.

## Rollback

After the Core Host child closes, the runner:

1. inspects only vector row count and dimension metadata for accepted message
   source IDs;
2. deletes each exact `modelId + sourceType + sourceId` provider vector row;
3. reports only aggregate write/delete counts;
4. marks cleanup degraded if any exact deletion fails.

Message IDs are retained only in process memory for rollback and are never
included in the report.

## Current Run

The first local invocation was intentionally run with the current PowerShell
environment unchanged. It built the runner and returned this sanitized result:

```json
{
  "phase": "8.29",
  "status": "degraded",
  "accepted": false,
  "reasonCodes": ["developer_alpha_opt_in_missing"],
  "rawVectorsExposed": false,
  "rawTextExposed": false,
  "rawDiagnosticsExposed": false,
  "privatePathExposed": false,
  "downloadsEnabled": false,
  "persistentCacheWritesEnabled": false,
  "sqliteSchemaMigrationEnabled": false
}
```

No helper was started, no model artifact was accessed, no Memory vector was
written, and no raw output was exposed.

## Verification

Completed local verification on 2026-08-04:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-developer-alpha-usage.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-env-wiring
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Targeted developer-alpha usage tests: PASS, 5 tests.
- `npm.cmd run verify`: PASS, including 126 test files and 662 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Current Hard Pause

The real developer-alpha usage session has not passed yet. It remains blocked
until the operator supplies the approved Python executable, approved local
model artifact directory, explicit Memory database path, and all required
developer-alpha env gates in a fresh PowerShell session.

Do not use placeholder paths, download artifacts, persist a model cache, expose
raw vectors/text/diagnostics, index historical Memory, run SQLite migrations,
change UI/default/provider visibility behavior, or connect retrieval output to
Windows/PowerShell execution.
