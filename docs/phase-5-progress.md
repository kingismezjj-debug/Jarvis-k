# Phase 5 Progress

Phase 5 starts from the Phase 4.5 readiness gates. The first slice is a
fixture-backed embedding provider that proves the execution path without real
model downloads, native runtime dependencies, provider credentials, signed
URLs, or external network access.

## Wave 5.1: Fixture Embedding Provider

- Status: complete.
- Added `@jarvis-k/inference-adapter-fixture` as a dedicated test-only
  provider package.
- The provider implements the provider-neutral `EmbeddingInferenceProvider`
  port and returns deterministic fixture vectors for
  `jarvis-fixture/local-embedding-smoke`.
- Added provider descriptor and configuration requirement reports. The
  provider reports available only when
  `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1`; otherwise it remains unconfigured.
- Added `agent.generateEmbeddings` to contracts and Core. Core fetches the
  manifest, runs inference preflight, and calls the injected embedding provider
  only when preflight allows execution.
- Composed the fixture provider in `apps/core-host` only behind the explicit
  environment flag.
- Updated dependency-boundary guards so Core cannot import the concrete
  fixture adapter directly.

### Current Gate

- Targeted fixture/core/contracts/boundary tests: PASS, 4 test files and 59
  tests.
- `npm run check:boundaries`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 37 test files and 201 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- Fixture-enabled Core Host IPC check: PASS for provider listing,
  requirements, preflight, and deterministic embedding generation.
