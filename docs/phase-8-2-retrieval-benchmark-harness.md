# Phase 8.2 Retrieval Benchmark Harness

Recorded on 2026-08-01 as the second low-risk preparation wave for embedding
memory retrieval.

## Scope

This wave adds a provider-neutral, fixture-only benchmark harness for the
embedding memory retrieval contract. It plans bounded test cases and evaluates
sanitized fixture results for recall-at-k, mean reciprocal rank, and degraded
case count.

The harness consumes already-validated retrieval DTOs. It does not invoke an
embedding model, read a Memory database, create a vector index, write vectors,
persist metric values, or access raw memory text.

## Approval Meaning

The harness output is explicitly marked `fixture_only`,
`executionDeferred`, and `realRuntimeMetricsCaptured: false`. Its metric
values describe only deterministic fixture cases and are not evidence for
real-provider quality, latency, memory, or resource acceptance.

## Hard Pause

Real benchmark capture remains deferred until the separate runtime and Memory
approval gates pass. Do not add model-backed retrieval, SQLite schema/index
migrations, vector writes, Core composition, or user-facing retrieval output
in this wave.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, or provider visibility.
