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

## Local Runs

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

After separate approval for a one-time temporary Python Transformers
environment and separate approval for temporary approved artifact
materialization, a true artifact-backed developer-alpha usage session was run
locally on 2026-08-04. The run used only a temporary Python venv, temporary
approved artifact directory, and temporary Memory database. The report exposed
only sanitized status, aggregate counts, dimensions, rollback state, cleanup
state, and safety flags.

- Result: sanitized `passed`.
- Runtime dependency status: `passed`.
- Artifact materialization: `passed`.
- Artifact digest verification: `passed`.
- Artifact count: 10.
- Aggregate artifact bytes: 1207470234.
- Manifest-size match: `true`.
- Message count: 2 bounded synthetic messages.
- Accepted message count: 2.
- Provider vector write count: 2.
- Provider vector dimension count: 1024.
- Recall status/mode: `ok` / `provider_vector`.
- Recall match count: 1.
- Query dimension count: 1024.
- Exact-source rollback: `passed`, deleted 2 provider vector rows.
- Cleanup: `passed`.
- Raw vectors, raw text, raw diagnostics, private path exposure, signed URL or
  credential persistence, persistent cache writes, historical batch indexing,
  SQLite schema migration, provider visibility/default opt-in changes, and
  model-output shell execution: all reported disabled.

The temporary artifact directory, temporary Memory database, and temporary
Python environment were removed after the run.

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

The one-time local developer-alpha usage session has passed as diagnostic
evidence only. It remains disabled by default and must not be treated as a
general product feature, release path, installer path, broader tester path, or
product SLO.

Do not run another real developer-alpha usage session, use persistent model
caches, expose raw vectors/text/diagnostics, index historical Memory, run
SQLite migrations, change UI/default/provider visibility behavior, broaden
tester scope, or connect retrieval output to Windows/PowerShell execution
without separate product, security, and release approval.
