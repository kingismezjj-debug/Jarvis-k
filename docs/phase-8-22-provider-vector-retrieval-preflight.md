# Phase 8.22 Provider Vector Retrieval Preflight

Recorded on 2026-08-03 as the review-only preflight after the approved real
Phase 8.21 provider vector-write acceptance run.

## Scope

This wave adds only an approval/preflight gate for a future implementation
that may query provider-written Memory vector records through the existing
retrieval route.

The planned future opt-in is
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1`. The future
implementation must still require Memory retrieval routing, provider-backed
query vectors, provider-backed vector writes, local embedding provider
composition, and local embedding provider execution to be explicitly enabled.

The preflight reviews:

- Phase 7.43 provider execution acceptance evidence;
- Phase 8.16 provider-backed query vector routing;
- Phase 8.18 provider-backed query vector acceptance evidence;
- Phase 8.20 provider-backed vector writes;
- Phase 8.21 provider-backed vector write acceptance evidence;
- same-model ID alignment between query vectors and stored provider vectors;
- bounded recall limits and sanitized recall metadata;
- fail-closed fallback to the existing fixture/no-recall paths; and
- rollback smoke planning.

## Safety Boundary

This wave does not read env values, change Core Host routing, change
`CoreRuntime`, query provider-written vectors, call provider execution for
reads, call helper `embed`, write Memory vectors, run SQLite schema/index
migrations, change Desktop IPC, change UI behavior, change provider
visibility, change default opt-in, or change fixture fallback.

The preflight report exposes only booleans, reviewed area names, status, and
fixed reason codes. It does not expose raw vectors, raw text, private paths,
signed URLs, credentials, raw diagnostics, artifact digests, or runtime output.

## Real 8.21 Evidence

The approved real Phase 8.21 diagnostic completed locally with:

- temporary Python runtime dependency setup: passed;
- temporary artifact fetch and SHA-256 verification: passed;
- Core Host diagnostic path: completed;
- status: passed;
- write status: accepted;
- record count: 1;
- dimension count: 1024;
- cleanup: passed;
- unsafe exposure flags: all false.

No raw vectors, raw text, raw diagnostics, private paths, signed URLs, or
credentials were printed or persisted.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-preflight.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Memory provider vector retrieval preflight tests: PASS, 5 tests.
- Core Host build: PASS.
- `npm.cmd run verify`: PASS, 122 test files and 632 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Phase 8.21 real diagnostic cleanup check: PASS, 0 leftover
  `jarvis-k-phase-8-21-real-*` temporary directories.

## Next Hard Pause

Do not implement provider-written vector retrieval, read the new opt-in env,
change Core Host retrieval routing, change CoreRuntime behavior, query
provider-written vectors in product flow, call provider execution for reads,
persist additional vectors, add Desktop/UI controls, change provider
visibility/default opt-in, run SQLite schema/index migrations, expose raw
vectors/raw text/private paths/raw diagnostics, download artifacts, write
persistent model caches, or convert retrieval/model output into
Windows/PowerShell operations without separate product and security approval
for that exact implementation wave.
