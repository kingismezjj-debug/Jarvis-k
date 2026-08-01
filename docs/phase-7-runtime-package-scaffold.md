# Phase 7 Runtime Package Scaffold

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave creates the dedicated runtime package scaffold with a fake
fail-closed runtime surface. It does not add Python, Transformers, ONNX, CUDA,
Paddle, llama.cpp, model download, model cache, provider registration, or local
embedding execution.

- Runtime package: `@jarvis-k/inference-runtime-transformers-local`.
- Package location: `packages/inference-runtime-transformers-local`.
- Composition root remains: `apps/core-host`.

## Package Contents

The new package contains:

- `package.json` with only `@jarvis-k/contracts` as a workspace dependency.
- `tsconfig.json`.
- `src/index.ts`.
- A fake runtime descriptor.
- A fake runtime health report.
- A fake unavailable runtime adapter surface.
- Sanitized runtime error mapping.
- Tests proving fail-closed behavior.

## Public Surface

The package exposes only adapter-oriented scaffolding:

- descriptor creation;
- health report creation;
- unavailable fake runtime adapter factory; and
- sanitized error mapping.

The package does not expose:

- model artifact paths;
- downloaders;
- process launchers;
- provider policy;
- Python environment setup;
- package version selection; or
- model execution entry points.

## Integration

- The root workspace list includes the new package.
- Root build, typecheck, test, and verify paths include the new package.
- `package-lock.json` includes the new private workspace.
- The dependency boundary checker now includes the runtime package and permits
  only `@jarvis-k/contracts` workspace imports from its source.

## Runtime Behavior

- Runtime status is `unavailable`.
- `canLoad` always returns `false`.
- `load` always throws a sanitized unavailable error.
- The health report records:
  - `fakeRuntimeOnly: true`;
  - `runtimeDependenciesIntroduced: false`;
  - `downloadEnabled: false`;
  - `executionEnabled: false`; and
  - `modelArtifactsAccessed: false`.

## Hard Blocks

- No real runtime dependency.
- No Python environment.
- No model artifact access.
- No model download.
- No model cache.
- No runtime registration in `apps/core-host`.
- No execution provider composition.
- No local embedding execution.

## Non-Goals

- No dependency addition approval.
- No tokenizer/config runtime integration.
- No artifact cache manager.
- No controlled artifact download.
- No benchmark metric capture.
- No provider registration.
