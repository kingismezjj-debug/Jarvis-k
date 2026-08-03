# Phase 8.24 Provider Vector Retrieval Acceptance Preflight

Recorded on 2026-08-03 after Phase 8.23 provider-written vector retrieval
routing was implemented and verified.

## Scope

This wave adds only a preflight and approval handoff for a future local
acceptance diagnostic of provider-written Memory vector retrieval.

The planned future diagnostic opt-in is
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1`. A later
separately approved diagnostic may use a temporary Memory database, verify the
approved local artifact digest set, write one provider vector for a fixed
diagnostic message through the existing product path, then send a second fixed
diagnostic message through the Phase 8.23 provider-vector retrieval route and
inspect only sanitized recall metadata.

The preflight reviews:

- Phase 7.43 provider execution acceptance evidence;
- Phase 8.18 provider query-vector acceptance evidence;
- Phase 8.21 provider vector-write acceptance evidence;
- Phase 8.23 provider vector retrieval routing;
- explicit acceptance env gating;
- temporary Memory database scope;
- provider vector write-then-read plan;
- same-model ID read/write alignment;
- approved artifact digest verification plan;
- sanitized recall report shape;
- cleanup plan; and
- rollback plan.

## Safety Boundary

This phase does not read the acceptance env, read Python paths, read model
artifact paths, verify artifacts, call provider execution, call helper `embed`,
write temporary or persistent Memory vectors, query provider-written vectors,
run SQLite schema/index migrations, change Desktop IPC/UI behavior, change
provider visibility/default opt-in, expose raw vectors/raw text/private paths
or raw diagnostics, download artifacts, write persistent model caches, persist
signed URLs or credentials, or convert retrieval/model output into Windows or
PowerShell operations.

The preflight report exposes only booleans, reviewed area names, status, and
fixed reason codes.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-acceptance-preflight.test.ts
npm.cmd run build -w @jarvis-k/core-host
```

- Memory provider vector retrieval acceptance preflight tests: PASS, 5 tests.
- Core Host build: PASS.
- `npm.cmd run verify`: PASS, 123 test files and 641 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not implement or run the real provider-vector retrieval acceptance
diagnostic, read `JARVIS_K_RUNTIME_PYTHON` or
`JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`, verify/access model artifacts, start the
Python helper, call helper `embed`, write temporary Memory vectors, query
provider-written vectors in a diagnostic, download artifacts, write persistent
model caches, expose raw vectors/raw text/private paths/raw diagnostics, change
Desktop/UI/provider visibility/default opt-in, run SQLite schema/index
migrations, or convert retrieval/model output into Windows/PowerShell
operations without separate product and security approval for that exact
diagnostic wave.
