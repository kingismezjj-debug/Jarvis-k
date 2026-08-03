# Phase 8.20 Provider Vector Write Implementation

Recorded on 2026-08-03 as the separately approved implementation after the
Phase 8.19 provider vector write approval gate.

## Scope

This wave implements provider-backed Memory vector writes in `apps/core-host`
only behind the explicit opt-in
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`.

Writes can occur only when all of these gates are enabled:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`; and
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.

Core Host wraps the SQLite Memory repository at composition time. `CoreRuntime`
still sees only the provider-neutral `MemoryRepository` interface and still
calls `appendMessage(message)`. After a message is accepted and persisted, the
wrapper attempts a bounded provider vector write for eligible source messages.
Failures are swallowed as sanitized degradation and do not fail normal message
acceptance.

## Safety Boundary

The implementation indexes only newly accepted user messages that pass source
selection and text minimization. It does not batch-index historical messages.

SQLite still blocks non-fixture vector writes by default. `apps/core-host`
adds the approved local embedding model ID to the SQLite allowlist only when
all provider vector-write gates are enabled.

The wrapper minimizes text before embedding, bounds provider execution with a
timeout, validates model ID, vector count, dimensions, and finite vector
values, and writes only provider-neutral vector records through the existing
SQLite vector table. Duplicate writes degrade through the existing SQLite
duplicate-source policy.

The implementation does not expose raw vectors, raw text, private paths,
signed URLs, credentials, raw diagnostics, or artifact digests. It does not
download artifacts, write persistent model caches, run SQLite schema/index
migrations, add Desktop IPC or UI controls, change provider visibility, change
default opt-in behavior, change fixture fallback, or convert retrieval/model
output into Windows/PowerShell operations.

## Rollback

Unset `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES` to return Core
Host to the Phase 8.18 behavior. Snapshot restore/import continues to clear
vector rows, including approved provider vector rows.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-write-wiring.test.ts packages/memory-sqlite/test/sqlite-memory-repository.test.ts
npx vitest run apps/core-host/test/memory-provider-vector-write-wiring.test.ts packages/memory-sqlite/test/sqlite-memory-repository.test.ts apps/core-host/test/memory-provider-vector-write-approval-gate.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run build -w @jarvis-k/memory-sqlite
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
```

- Provider vector write wiring and SQLite allowlist/rollback tests: PASS, 29
  tests.
- Provider vector write wiring, SQLite allowlist/rollback, and Phase 8.19
  approval gate regression tests: PASS, 34 tests.
- Core Host build: PASS.
- Memory SQLite build: PASS.
- `npm.cmd run verify`: PASS, 120 test files and 621 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.

## Next Hard Pause

Do not enable provider-backed vector writes by default, batch-index historical
Memory records, expose Desktop IPC or UI controls for indexing, route provider
written vectors into default recall behavior, add a real-provider write
acceptance diagnostic, expose raw vectors/raw text/private paths/raw
diagnostics, change SQLite schema/indexes, persist credentials or signed URLs,
download artifacts, write persistent model caches, or convert retrieval/model
output into Windows/PowerShell operations without a separate product and
security approval for that exact implementation wave.
