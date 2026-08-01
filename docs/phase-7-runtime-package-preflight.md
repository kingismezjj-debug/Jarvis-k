# Phase 7 Runtime Package Preflight Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave approves the dedicated runtime package boundary before any real
runtime package is scaffolded. It does not create the package, add runtime
dependencies, download model artifacts, or enable execution.

- Future runtime package: `@jarvis-k/inference-runtime-transformers-local`.
- Future package location: `packages/inference-runtime-transformers-local`.
- Composition root: `apps/core-host`.

## Boundary Policy

- The future runtime package must be private.
- Package scaffolding is deferred to a later wave.
- Workspace registration is deferred to a later wave.
- Runtime behavior implementation is deferred to a later wave.
- Concrete composition must happen only through `apps/core-host`.

## Public Surface Policy

The future package may expose only adapter-oriented surfaces:

- runtime adapter descriptor;
- runtime adapter factory;
- runtime health probe; and
- sanitized error mapping.

It must not expose:

- model artifact paths;
- downloaders;
- process launchers; or
- provider policy.

## Import Policy

- The only currently approved workspace import is `@jarvis-k/contracts`.
- Protected packages and apps must not import or host runtime dependencies.
- The future runtime package must not import Core, Desktop, UI, memory, voice,
  fixture providers, or the local embedding provider package.
- Runtime dependency imports remain blocked until a separate dependency
  approval wave.

## Safety Policy

- Runtime execution, when later approved, must use a supervised child-process
  boundary.
- A resource scheduler lease is required before model loading.
- Direct shell execution is forbidden.
- Model output may become only validated intent, never raw Windows or
  PowerShell actions.
- Errors and logs must be sanitized.

## Hard Blocks

- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `preflightValuesExposed` remains `false`.

## Non-Goals

- No runtime package scaffold.
- No root workspace registration.
- No runtime dependency selection.
- No model download.
- No model cache.
- No provider registration.
- No local embedding execution.
