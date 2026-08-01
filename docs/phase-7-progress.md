# Phase 7 Progress

Phase 7 starts from the Phase 6 local embedding readiness baseline. The goal
is to move from provider-local planning guards into real-provider developer
alpha readiness one narrow wave at a time.

The first capability remains embedding. The planned local embedding provider
must stay `unconfigured` and `disabled` until every readiness, runtime,
packaging, license, benchmark, and composition gate passes.

## Wave 7.1: Immutable Revision Selection

- Status: complete.
- Selected the immutable upstream revision for `Qwen/Qwen3-Embedding-0.6B`:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Verified by read-only upstream ref lookup:
  `git ls-remote https://huggingface.co/Qwen/Qwen3-Embedding-0.6B HEAD refs/heads/main`.
- Added a provider-local approved revision record factory that keeps
  `downloadEnabled: false`.
- The approved revision can satisfy only the `model.revision` gate when a
  later approved manifest uses the same revision.
- No artifact SHA-256 digest, artifact filename, model download, model file,
  cache, runtime dependency, provider registration, composition change, or real
  embedding execution was added in this wave.

### Current Gate

- Local embedding revision approval tests: PASS, 5 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 55 test files and 280 tests.

## Remaining Phase 7 Work

- Pin required artifacts and SHA-256 digests for the selected revision.
- Complete license, redistribution, NOTICE/LICENSE, runtime dependency, native
  dependency, and tokenizer/config review.
- Define and approve benchmark capture inputs, methods, resource isolation,
  and failure reporting before recording real metric values.
- Implement the dedicated runtime package only after artifact, license,
  packaging, and benchmark gates are approved.
- Register runtime and execution providers only in `apps/core-host`, behind
  explicit enablement and preflight checks.
