# Phase 8.23 Provider Vector Retrieval Routing

Recorded on 2026-08-03 after the Phase 8.22 review-only preflight and the
approved real Phase 8.21 provider vector-write acceptance evidence.

## Scope

This wave implements provider-written Memory vector retrieval routing behind
the separate explicit opt-in
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1`.

The provider-vector read path is enabled only when all of these gates are also
enabled:

- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`; and
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`.

When the full gate set is present, `apps/core-host` configures the Core Memory
retrieval route to query provider-written vectors using the approved local
embedding model ID. Core remains provider-neutral: it receives only an injected
retrieval port, a copied query vector from the existing resolver, an explicit
mode, and an exact allowed model ID.

## Safety Boundary

Default behavior remains disabled. If the provider-vector read gate is absent
or incomplete, Core Host keeps the existing fixture-only retrieval model ID and
fixture fallback behavior.

Core accepts non-fixture Memory retrieval models only when the injected route is
in `provider_vector` mode and the result model ID exactly matches the injected
allowed model ID. Mismatched models degrade to no-recall without blocking
message acceptance.

This phase does not run a real local diagnostic, download artifacts, write a
persistent model cache, persist additional vectors, batch-index historical
records, run SQLite schema/index migrations, change Desktop IPC or UI behavior,
change provider visibility/default opt-in, expose raw vectors/raw text/private
paths/raw diagnostics, or convert retrieval/model output into Windows or
PowerShell operations.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/core-memory-retrieval-env-wiring.test.ts packages/core/test/runtime.test.ts
```

- Core Host retrieval env wiring and provider-vector read tests: PASS.
- Core runtime Memory retrieval routing regression tests: PASS.
- Targeted total: PASS, 2 test files and 43 tests.
- `npm.cmd run build -w @jarvis-k/core`: PASS.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 122 test files and 636 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not run a real provider-vector retrieval acceptance diagnostic, access model
artifacts, download artifacts, persist model caches, expose raw vectors or raw
text, add Desktop/UI controls, batch-index history, change provider
visibility/default opt-in, or move provider-written retrieval into a default
product path without separate product and security approval.
