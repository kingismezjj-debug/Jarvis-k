# Phase 8.26 Provider Vector Retrieval Developer-Alpha Usage Test Plan

Recorded on 2026-08-04 after Phase 8.25 provider-vector retrieval acceptance
passed with the approved temporary artifact-backed chained diagnostic.

## Scope

This wave adds a Core Host plan-only gate for moving provider-vector retrieval
from acceptance evidence toward a controlled developer-alpha usage test.

The plan reserves the future explicit developer-alpha opt-in:

```powershell
JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA=1
```

That future opt-in is not read in this wave. The gate records the prerequisite
env chain, tester scope, source-selection and minimization policy, retention
and rollback plan, sanitized telemetry boundary, degraded fallback behavior,
and no-default-behavior-change expectations.

## Usage Test Boundary

The developer-alpha usage test plan is limited to a local single-developer
alpha. A later separately approved implementation may use only newly accepted
messages that satisfy source selection and minimization rules. It must not
batch-index historical Memory, change UI defaults, expose provider visibility,
or change default conversation behavior.

The plan requires all of these future explicit gates before any non-diagnostic
usage test can be enabled:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES`
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS`
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER`
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`
- `JARVIS_K_RUNTIME_PYTHON`
- `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`

The planned rollback action is to unset the developer-alpha env gate and
delete provider vectors written during the approved test window. The plan
allows only sanitized counts and fixed reason codes as telemetry.

## Safety Boundary

This wave does not read env values, read runtime Python paths, read model
artifact paths, access artifacts, start the helper, call helper `embed`, run
provider execution, write provider vectors, query provider vectors, write
persistent Memory vector data, run SQLite schema/index migrations, change
Desktop IPC, change UI behavior, change provider visibility, change default
opt-in, download artifacts, write persistent caches, expose raw vectors, expose
raw text, expose private paths, expose raw diagnostics, persist credentials or
signed URLs, or convert retrieval/model output into Windows or PowerShell
operations.

## Verification

Completed locally on 2026-08-04:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-developer-alpha-plan.test.ts
```

- Core Host build: PASS.
- Developer-alpha usage test plan normal/degraded/blocked/sanitized-output
  tests: PASS, 6 tests.

## Next Hard Pause

Do not implement or enable the developer-alpha usage test path without
separate product, security, and release approval.

Do not read `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA`,
start non-diagnostic provider execution, access model artifacts, write
persistent provider vectors, expose UI controls, change provider visibility,
batch-index historical Memory, write persistent model caches, run SQLite
migrations, expose raw vectors/raw text/private paths/raw diagnostics, or
convert retrieval/model output into Windows/PowerShell operations without that
separate approval.
