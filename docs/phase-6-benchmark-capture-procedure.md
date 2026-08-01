# Phase 6 Benchmark Capture Procedure

This procedure defines the approval boundary for a future local embedding
benchmark capture wave. It does not run benchmarks, record real metric values,
download artifacts, install runtime dependencies, or enable execution.

Current target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Runtime direction: provisional `transformers`
- Required profiles: Lite, Standard, Local Enhanced

## Procedure State

Benchmark capture is currently `pending`.

The provider-local guard can report whether a later benchmark capture wave is
ready for manual approval. Its summary does not expose upstream URLs,
revisions, artifact digests, artifact filenames, dependency versions, private
paths, real benchmark metric values, or benchmark input/output payloads.

## Required Checks

- Profiles confirmed: Lite, Standard, and Local Enhanced profiles are all in
  scope.
- Dataset defined: benchmark corpus and query set are defined before capture.
- Latency method defined: latency measurement methodology is defined before
  capture.
- Memory method defined: memory measurement methodology is defined before
  capture.
- Quality method defined: quality measurement methodology is defined before
  capture.
- Resource isolation defined: repeatability controls and resource isolation
  expectations are defined before capture.
- Failure degradation defined: benchmark startup, load, run, timeout, and
  cancellation failures report sanitized blocked or degraded states.
- Privacy sanitized: benchmark inputs, outputs, logs, and local paths are
  sanitized before approval.
- Metric values deferred: real latency, memory, and quality values stay out
  until a separately approved capture wave.
- Approval record local: benchmark capture approval records stay inside the
  local embedding adapter boundary.
- Downloads disabled: download paths remain disabled during procedure
  approval.
- Execution disabled: runtime registration, execution-provider composition,
  and local embedding execution remain disabled.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify
  gates pass.

## Required Profile Signals

Each approved profile must later capture:

- Latency profile.
- Memory profile.
- Quality profile.

The procedure may expose only whether those signals are required. It must not
expose actual values such as latency, memory usage, scores, input payloads, or
raw output text.

## Approval Output

A future benchmark capture wave may produce a provider-local benchmark
approval record only after all required checks pass. That record may mark
latency, memory, and quality profile capture for Lite, Standard, and Local
Enhanced, but it must keep `downloadEnabled: false` and
`executionEnabled: false` until a later explicit execution-enablement wave.

Readiness checks may consume the approved record, but benchmark approval must
not cause downloads, runtime loading, provider registration, or execution.

## Non-Goals

This procedure must not introduce:

- Real benchmark execution or metric values.
- Real benchmark inputs, outputs, logs, or private local paths.
- Real model downloads, artifacts, caches, or URLs.
- Signed URLs, credentials, tokens, or API keys.
- Runtime dependencies or dependency versions.
- Runtime registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Verification

Run at minimum:

- `npm run build -w @jarvis-k/inference-adapter-embedding-local`
- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- `npm run typecheck`
- `npm run verify`

Desktop smoke tests are required only if a later wave changes Core Host
composition, Desktop IPC, startup supervision, or provider visibility.
