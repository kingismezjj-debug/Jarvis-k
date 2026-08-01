# Phase 7 Runtime Dependency Selection Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave selects the preferred future runtime dependency route before adding
any dependency. It does not add a dependency, select concrete package versions,
download model artifacts, or enable execution.

- Future runtime package: `@jarvis-k/inference-runtime-transformers-local`.
- Future package location: `packages/inference-runtime-transformers-local`.
- Composition root: `apps/core-host`.

## Selected Future Route

Preferred future route:

- `python_transformers_child_process`

Reason:

- It is the preferred future fidelity path for the selected Transformers
  embedding model.
- It keeps concrete runtime behavior outside Agent Core.
- It requires the dedicated runtime package and supervised child-process
  boundary before any execution can exist.

This selection does not approve dependency addition.

## Deferred Alternatives

- `transformers_js_child_process` remains deferred until tokenizer, pooling,
  and model compatibility are proven.
- `onnx_runtime_child_process` remains deferred until an approved model
  conversion and tokenizer/pooling parity plan exists.

Both alternatives still require separate dependency, native, packaging,
benchmark, and execution review before use.

## Dependency Guardrails

- Runtime dependencies may be added only to the dedicated runtime package.
- Protected packages must remain dependency-free:
  - contracts;
  - capabilities;
  - core;
  - desktop;
  - UI;
  - memory;
  - voice; and
  - provider packages outside the dedicated runtime package.
- Concrete composition remains only in `apps/core-host`.
- A supervised child-process boundary is required.
- A resource scheduler lease is required before model loading.
- License and NOTICE review is required before dependency addition.
- Native dependency and redistribution review is required before dependency
  addition.
- Benchmark approval is required before execution.
- Fallback provider behavior is required.

## Hard Blocks

- `dependencyAdditionApproved` remains `false`.
- `concretePackageVersionsSelected` remains `false`.
- `runtimeDependencyPackageAllowlist` remains empty.
- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `dependencyValuesExposed` remains `false`.

## Non-Goals

- No `package.json` dependency changes.
- No runtime package scaffold.
- No concrete package version pinning.
- No Python environment creation.
- No model download.
- No model cache.
- No provider registration.
- No local embedding execution.
