# Phase 7 Benchmark Capture Approval Guard

Recorded on 2026-08-01 for the planned local embedding provider.

## Scope

This wave approves the benchmark capture method only. It does not approve any
real benchmark metric value.

The later benchmark result wave must still run the real runtime, capture
latency, memory, quality, and resource profiles, and approve the measured
profiles before local embedding execution can be enabled.

## Approved Capture Inputs

- `sanitized_bilingual_smoke`: small bilingual smoke corpus and query set.
- `retrieval_regression`: fixed retrieval expectation set.
- `resource_stress`: repeatability and resource-pressure scenarios.

The input sets must be sanitized before they are committed or logged.

## Approved Methods

- Latency method: cold and warm runs.
- Memory method: peak process memory.
- Quality method: fixed retrieval expectations.
- Resource isolation: scheduler lease and repeatable host state.
- Failure degradation: sanitized profile failure.
- Privacy: benchmark inputs, outputs, paths, logs, and failure details must be
  sanitized.

## Hard Blocks

- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `metricValuesCaptured` remains `false`.
- `metricValuesExposed` remains `false`.
- No latency, memory, quality score, model file, model cache, signed URL,
  provider credential, or local private path is recorded.

## Code Boundary

- `createLocalEmbeddingBenchmarkCaptureProcedure()` remains pending by default.
- `createApprovedLocalEmbeddingBenchmarkCaptureApprovalRecord()` approves only
  the capture method and input-set boundary.
- `isLocalEmbeddingBenchmarkCaptureApprovalRecordApproved()` rejects records
  that contain captured metric values, enabled downloads, enabled execution, or
  an incomplete input/profile set.
- `isLocalEmbeddingBenchmarkApprovalRecordApproved()` remains the separate
  readiness gate for real captured benchmark profiles.

## Non-Goals

- No real model execution.
- No model download.
- No runtime dependency.
- No provider registration.
- No benchmark metric values.
