# Phase 8.17 Provider Query Vector Acceptance Preflight

Recorded on 2026-08-03 as a Core Host preflight for a future provider-backed
Memory retrieval query-vector acceptance diagnostic after Phase 8.16.

## Scope

This wave adds only a preflight and approval handoff for a later local
acceptance diagnostic. The planned diagnostic would verify the Phase 8.16
product path with the already approved local Python Transformers environment
and approved local model artifact directory.

The preflight records the planned explicit acceptance env key:
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE`.

This phase does not read that env key, does not read `JARVIS_K_RUNTIME_PYTHON`,
does not read a model artifact path, does not verify artifacts, does not start
the helper, does not call provider execution, and does not call helper `embed`.

## Safety Boundary

The later diagnostic must return only a sanitized pass/degraded/fail report. It
must not print or persist raw vectors, raw message text, artifact paths,
private paths, signed URLs, credentials, or raw helper diagnostics.

Memory vector writes, Phase 7.43 vector persistence, real runtime vector
persistence, SQLite schema/index migration, Desktop IPC changes, UI behavior
changes, provider visibility changes, default opt-in changes, and
Windows/PowerShell execution remain blocked.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- reading `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE`;
- reading the local Python runtime path or model artifact directory;
- running SHA-256 artifact verification for this diagnostic;
- starting the runtime helper for this diagnostic;
- calling provider execution or helper `embed` through the retrieval product
  path;
- returning, logging, exposing, or persisting raw vectors;
- writing Memory vector records from real provider output;
- changing Desktop IPC, UI behavior, provider visibility, or default opt-in;
- changing SQLite schema or indexes; and
- converting retrieval/model output into Windows or PowerShell operations.

## Verification

```powershell
npx vitest run apps/core-host/test/memory-retrieval-provider-query-vector-acceptance-preflight.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```
