# Phase 6 Progress

Phase 6 starts from the Phase 5 fixture-backed inference foundation. The goal
is to introduce one real-provider path at a time while keeping Core, Desktop,
UI, contracts, and capabilities provider-neutral.

The first capability is embedding. It has the smallest DTO surface, no binary
image input, and is the lowest-risk path for proving real local inference
readiness before model downloads or native runtime execution are enabled.

## Wave 6.1: Local Embedding Provider Readiness

- Status: complete.
- Added `@jarvis-k/inference-adapter-embedding-local` as the dedicated package
  for the planned local embedding provider boundary.
- The provider currently reports `embedding.local.qwen3` as `unconfigured` and
  `disabled` for `Qwen/Qwen3-Embedding-0.6B`.
- Added an explicit configuration report covering the remaining real-provider
  gates: immutable model revision, artifact SHA-256, runtime adapter,
  packaging plan, license/redistribution review, and benchmark/resource
  profile.
- Added a fail-closed `UnavailableLocalEmbeddingProvider` so accidental direct
  use cannot execute a model.
- Registered the local embedding readiness descriptor in `apps/core-host`
  alongside the fixture providers. No execution provider is injected for the
  local embedding path.
- Updated dependency-boundary guards so Core cannot import the planned local
  adapter directly. `apps/core-host` remains the only concrete composition root.

### Current Gate

- Targeted local embedding adapter and boundary tests: PASS, 2 test files and
  12 tests.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 39 test files and 213 tests.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
- `npm run smoke:desktop:fixture-inference`: PASS.

## Remaining Phase 6 Work

- Choose and document the exact immutable model revision for
  `Qwen/Qwen3-Embedding-0.6B`.
- Decide the dedicated runtime adapter strategy without adding runtime
  dependencies to Core, Desktop, UI, contracts, or capabilities.
- Add model artifact manifest pins and SHA-256 digests before any download path
  is enabled.
- Add provider-specific preflight tests for blocked, degraded, and eventually
  available states.
- Add a real execution adapter only after packaging, license, redistribution,
  and benchmark gates are complete.
