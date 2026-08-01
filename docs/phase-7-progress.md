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

## Wave 7.2: Artifact Role Inventory

- Status: complete.
- Added a provider-local artifact role inventory for the selected upstream
  revision.
- Recorded only upstream repository filenames and role decisions; no file
  content, LFS metadata, SHA-256 digest, cache, signed URL, or download path
  was recorded.
- Corrected the pooling config path in the artifact plan from the Phase 6
  placeholder `pooling.json` to the observed upstream path
  `1_Pooling/config.json`.
- Marked the current minimum required pin set as model weights, model config,
  tokenizer config, tokenizer vocabulary, and pooling config.
- Kept additional observed repository paths under deferred review for the later
  artifact pinning wave.
- No artifact SHA-256 digest, artifact pin approval, model download, model
  file, cache, runtime dependency, provider registration, composition change,
  or real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact inventory tests: PASS, 4 tests.
- Local embedding artifact plan tests: PASS, 4 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 56 test files and 284 tests.

## Wave 7.3: Artifact Required Set Decision

- Status: complete.
- Added a provider-local artifact required-set decision guard for the selected
  upstream revision.
- Expanded the artifact plan from the Phase 7.2 minimum set to the full
  required pin set for model weights, model config, sentence-transformers
  config, generation config, sentence-transformers modules, tokenizer config,
  tokenizer graph, tokenizer merges, tokenizer vocabulary fallback, and pooling
  config.
- Marked `.gitattributes` and `README.md` as excluded from runtime artifact
  pinning.
- The required-set guard keeps downloads disabled, pinning disabled, and digest
  values absent while confirming that every artifact plan path is covered.
- No artifact SHA-256 digest, artifact pin approval, model download, model
  file, cache, runtime dependency, provider registration, composition change,
  or real embedding execution was added in this wave.

### Current Gate

- Local embedding artifact required-set decision tests: PASS, 6 tests.
- Local embedding artifact plan and approval tests: PASS, 8 tests.
- `npm run build -w @jarvis-k/inference-adapter-embedding-local`: PASS.
- `npm run check:boundaries`: PASS.
- `npm run check:sensitive-artifacts`: PASS.
- `npm run typecheck`: PASS.
- `npm run verify`: PASS, 57 test files and 290 tests.

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
