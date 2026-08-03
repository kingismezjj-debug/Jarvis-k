# Phase 8.21 Provider Vector Write Acceptance Diagnostic

Recorded on 2026-08-03 as the separately approved local acceptance diagnostic
after the Phase 8.20 provider vector write implementation.

## Scope

This wave adds a one-shot Core Host diagnostic runner behind the explicit
opt-in `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE=1`.
It verifies the Phase 8.20 product path by sending one fixed
`agent.sendMessage` command through Core Host and checking that the newly
accepted message produced provider-backed vector metadata in a temporary
Memory database.

The diagnostic also requires all product gates used by the write path:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`; and
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.

The runner reads only the approved local Python executable and approved local
model directory environment values needed by the existing local embedding
session factory. It verifies the pinned artifact SHA-256 set before Core Host
startup.

## Safety Boundary

The acceptance runner uses a temporary Memory database and removes the
temporary root after completion. It does not batch-index historical records,
change default behavior, expose Desktop IPC or UI controls, change provider
visibility, or alter fixture fallback.

The report is sanitized and includes only status, fixed reason codes,
write status, record count, dimension count, cleanup status, and unsafe
side-effect flags. The SQLite inspection reads `COUNT(*)` and maximum
dimension metadata for the accepted message source only; it does not read
vector payloads or source text.

The diagnostic does not download artifacts, write persistent model caches,
persist credentials or signed URLs, expose raw vectors, expose raw text,
expose raw diagnostics, run SQLite schema/index migrations, or convert
retrieval/model output into Windows/PowerShell operations.

## Rollback

Unset `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE` to
disable this diagnostic. The Phase 8.20 provider vector write implementation
remains separately gated by
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES`.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-write-acceptance-diagnostic.test.ts packages/memory-sqlite/test/sqlite-memory-repository.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run build -w @jarvis-k/memory-sqlite
npm.cmd run diagnostic:memory-retrieval:provider-vector-write-acceptance
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Memory provider vector-write acceptance and SQLite metadata regression tests:
  PASS, 30 tests.
- Core Host build: PASS.
- Memory SQLite build: PASS.
- Default diagnostic without acceptance opt-in: PASS with sanitized
  `acceptance_opt_in_missing` degradation and no product-path command call.
- Approved real local acceptance diagnostic: PASS. The run created only
  temporary Python/runtime/cache/artifact directories, downloaded the approved
  artifact set, verified SHA-256 pins, completed the Core Host product path,
  wrote one provider vector record in a temporary Memory database, reported
  `writeStatus: accepted`, `recordCount: 1`, `dimensionCount: 1024`, and
  removed the temporary root after completion.
- `npm.cmd run verify`: PASS, 121 test files and 627 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not enable provider-backed vector writes by default, run a real local
acceptance diagnostic with artifact access, route provider-written vectors into
default recall behavior, add Desktop/UI indexing controls, batch-index
historical Memory records, persist vectors outside the approved product path,
change SQLite schema/indexes, expose raw vectors/raw text/private paths/raw
diagnostics, download artifacts, write persistent model caches, or convert
retrieval/model output into Windows/PowerShell operations without a separate
product and security approval for that exact wave.
