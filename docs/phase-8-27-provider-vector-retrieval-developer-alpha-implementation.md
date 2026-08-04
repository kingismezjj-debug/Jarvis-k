# Phase 8.27 Provider Vector Retrieval Developer-Alpha Implementation

Recorded on 2026-08-04 after separate product, security, and release approval
for controlled local developer-alpha usage testing.

## Scope

This wave implements the reserved developer-alpha opt-in:

```powershell
JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA=1
```

Provider-vector Memory write/read usage now requires that developer-alpha gate
plus the existing explicit gates for Memory retrieval routing, provider query
vectors, provider vector writes, provider vector reads, local embedding
provider composition, and local embedding provider execution. Missing or
non-exact developer-alpha opt-in keeps provider vector writes disabled and
keeps provider-vector reads out of the Core Host retrieval mode.

The implementation remains local developer-alpha only. It does not change
Desktop/UI behavior, provider visibility, fixture fallback, default opt-in,
release channel, installer behavior, model lifecycle policy, persistent model
cache policy, update policy, or rollback policy.

## Rollback

`packages/memory-sqlite` now exposes a narrow rollback helper:

```text
deleteEmbeddingRecordsForSource({ modelId, sourceType, sourceId })
```

The helper deletes only exact `modelId + sourceType + sourceId` vector rows
from the existing `memory_embeddings` table. It uses the existing model
allowlist, existing schema version, and existing indexes; no SQLite
schema/index migration is added. The result returns only `status`,
`deletedCount`, and fixed reason codes. It does not read or expose vector
payloads or Memory source text.

## Safety Boundary

This wave does not download artifacts, write persistent model caches, persist
credentials or signed URLs, expose private paths, expose raw vectors, expose
raw text, expose raw helper diagnostics, run SQLite schema/index migrations,
batch-index historical Memory, change Desktop IPC, change UI behavior, change
provider visibility, change default opt-in, enter installer/update/release
policy, or convert retrieval/model output into Windows or PowerShell
operations.

The existing local embedding provider execution path remains responsible for
artifact digest verification, helper load/embed supervision, resource leases,
timeouts, cancellation, vector shape/finite validation, and sanitized error
mapping when the approved runtime/model env is supplied.

## Verification

Targeted verification completed locally on 2026-08-04:

```powershell
npm.cmd run build:memory
npm.cmd run build:memory-sqlite
npx vitest run apps/core-host/test/core-memory-retrieval-env-wiring.test.ts apps/core-host/test/memory-provider-vector-write-wiring.test.ts apps/core-host/test/memory-provider-vector-retrieval-developer-alpha-plan.test.ts packages/memory-sqlite/test/sqlite-memory-repository.test.ts
```

- Memory build: PASS.
- Memory SQLite build: PASS.
- Developer-alpha gate, provider-vector write/read, rollback delete, degraded,
  blocked, and sensitive-output tests: PASS, 49 tests.

Full required verification completed locally on 2026-08-04:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- `npm.cmd run verify`: PASS, including 125 test files and 657 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not promote this developer-alpha path to a broader product feature, UI
control, default configuration, installer path, model lifecycle flow,
automatic update flow, or release policy without separate product, security,
and release approval.
