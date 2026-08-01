# Phase 7.19 Runtime Helper Protocol Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave defines and validates the future dedicated runtime helper protocol
for the Transformers local runtime package. It covers:

- `health`;
- `load`;
- `embed`; and
- `shutdown`.

The protocol is a pure contract and guard layer. It does not launch a child
process, create a Python environment, import Transformers, download artifacts,
access a model cache, load a model, register a provider, or execute inference.

## Boundary

- Transport is private child-process IPC.
- The supervisor is `apps/core-host`.
- Every request carries a bounded `requestId` and `correlationId`.
- Every response preserves both identifiers.
- `load` and `embed` require a resource lease identifier.
- Startup, request, and shutdown timeout limits are explicit and bounded.
- Direct shell execution is forbidden.
- Model output remains limited to validated DTOs and cannot become raw Windows
  or PowerShell operations.

## Sanitization

The guard rejects unknown fields, invalid identifiers, path-like model IDs,
unsafe text, invalid timestamps, invalid embedding vectors, and arbitrary
error messages. Runtime failures map to a closed set of canonical error codes
and messages without forwarding raw helper output.

## Hard Blocks

- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `modelArtifactsAccessed` remains `false`.
- No child-process launcher is exported.
- No shell execution path is exported.
- No provider composition is changed.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, or startup
supervision.
