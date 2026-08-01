# Phase 6 Go/No-Go Checklist

Phase 6 is the first real-provider readiness phase after the Phase 5
fixture-backed inference baseline. The current target is the planned local
embedding provider:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Capability: `embedding`
- Runtime direction: provisional `transformers`
- Execution state: not composed, not registered, not enabled

This document is the handoff checklist for deciding whether Phase 6 may move
from planning guards into real model revision, artifact pinning, runtime
packaging, benchmark execution, and eventually provider execution.

## Current Safe State

- `@jarvis-k/inference-adapter-embedding-local` exists as a dedicated
  provider-local package.
- The provider descriptor remains `unconfigured` and `disabled`.
- The runtime adapter is fail-closed and not registered in `apps/core-host`.
- The manifest draft is audit-only and cannot be parsed as a `ModelManifest`.
- Artifact plan and approval records are default `pending` and
  `downloadEnabled: false`.
- Benchmark approval records are default `pending`, `downloadEnabled: false`,
  and `executionEnabled: false`.
- Configuration report output exposes sanitized blockers only.
- The readiness checklist exposes gate status without revision values,
  SHA-256 digests, URLs, artifact filenames, model files, or metric values.
- Core, Desktop, UI, contracts, and capabilities remain provider-neutral.

## Guard Inventory

- `model.manifest`: blocked until an approved immutable manifest exists.
- `model.revision`: blocked until a matching approved revision record exists.
- `model.artifact_sha256`: blocked until artifact digests are recorded in an
  approved manifest.
- `artifact.pins`: blocked until required artifacts have matching approved
  revision and SHA-256 pin records.
- `runtime.strategy`: blocked until the runtime dependency, packaging,
  process isolation, tokenizer/config pinning, and benchmark gates are
  approved.
- `runtime.adapter`: blocked until a dedicated runtime adapter is selected and
  validated.
- `runtime.packaging`: blocked until Windows packaging and resource behavior
  are reviewed.
- `license.redistribution_review`: blocked until license and redistribution
  review records are approved.
- `benchmarks.local_resource_profile`: blocked until Lite, Standard, and
  Local Enhanced benchmark profiles are approved.
- Composition: blocked until readiness passes, runtime is registered,
  execution provider is composed, and explicit enablement is approved.

## No-Go Rules

Do not add any of the following in Phase 6 without an explicit later approval
and a new verified wave:

- Real Hugging Face download logic.
- Signed URLs, access tokens, API keys, credentials, or secret-derived values.
- Real model artifacts, tokenizer files, config files, caches, or weights.
- Real upstream revision pins or SHA-256 digests in docs/tests unless the wave
  is explicitly the approved pinning wave.
- Python, CUDA, ONNX, Paddle, Transformers, native runtime, or helper process
  dependencies outside a dedicated runtime package.
- Runtime dependencies in Core, Desktop, UI, contracts, or capabilities.
- Provider execution registration in `apps/core-host`.
- Any Core dependency on SQLite, Electron, React, `ws`, concrete providers, or
  concrete model runtimes.
- UI business policy or provider strategy.
- Desktop provider strategy beyond IPC, safeStorage, security boundary, and
  supervision.

## Go Criteria For Real Revision Selection

Real revision selection can start only when all of the following are true:

- The work is explicitly scoped as a revision-selection wave.
- The selected source and model id match the planned provider boundary.
- The revision is immutable and not a floating branch such as `main`,
  `master`, `latest`, or `HEAD`.
- The revision approval record remains provider-local.
- No artifact download path is enabled during revision selection.
- No model artifact or digest is committed during revision selection.
- `npm run check:sensitive-artifacts`, `npm run check:boundaries`, and
  `npm run verify` pass.

## Go Criteria For Artifact Pinning

Artifact pinning can start only after revision selection is approved, and only
when all of the following remain true:

- Every required artifact has a named role and explicit approval state.
- Every required artifact pin is tied to the approved immutable revision.
- Every digest is a verified SHA-256 value for the exact artifact.
- No signed URL or credential-bearing URL is committed.
- Downloads remain disabled until all pins are reviewed.
- The pin approval record remains provider-local.
- `npm run check:sensitive-artifacts`, `npm run check:boundaries`, and
  `npm run verify` pass.

## Go Criteria For Runtime Work

Runtime implementation can start only after revision, artifact pins, license
review, packaging review, and benchmark acceptance are approved.

- Runtime dependencies must live in a dedicated package such as
  `@jarvis-k/inference-runtime-transformers-local`.
- Core, Desktop, UI, contracts, and capabilities must not import runtime
  dependencies.
- Any helper process or native dependency must have a Windows packaging and
  supervision plan.
- The runtime adapter must implement existing ports rather than adding
  provider policy to Core.
- `apps/core-host` remains the only concrete composition root.

## Go Criteria For Execution Enablement

Execution can be enabled only after all readiness and composition gates pass:

- Approved manifest.
- Approved immutable revision.
- Approved artifact pins and digests.
- Approved runtime strategy and runtime adapter.
- Approved Windows packaging review.
- Approved license and redistribution review.
- Approved benchmark/resource profile.
- Runtime registered in the composition root.
- Execution provider composed in the composition root.
- Explicit execution enablement approved.

Until every item passes, the local embedding provider must remain visible only
as `unconfigured` and `disabled`.

## Verification Gate

Every future Phase 6 wave should run the smallest useful targeted tests and
then the appropriate project gates. For real-provider readiness work, the
default gate remains:

- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- `npm run typecheck`
- `npm run verify`

Run desktop smoke tests when touching Core Host composition, Desktop IPC,
startup supervision, or provider visibility in the desktop path.
