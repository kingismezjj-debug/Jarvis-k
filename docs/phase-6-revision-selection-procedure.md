# Phase 6 Revision Selection Procedure

This procedure defines how Jarvis-K may later choose an immutable upstream
revision for the planned local embedding provider without accidentally
enabling downloads, artifact pinning, runtime registration, or execution.

Current target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: `huggingface`
- Runtime direction: provisional `transformers`

## Procedure State

Revision selection is currently `pending`.

The project now has a provider-local procedure guard in
`@jarvis-k/inference-adapter-embedding-local`. The guard can report whether a
future candidate revision is ready for manual approval, but it does not expose
the candidate revision in its public summary output.

## Required Checks

- Scope confirmed: the wave is explicitly about revision selection for the
  planned embedding provider.
- Source verified: the source remains the planned Hugging Face model boundary.
- Revision immutable: the candidate is not `main`, `master`, `latest`, `HEAD`,
  or another floating branch.
- Downloads disabled: no download path is enabled while selecting a revision.
- Artifact pinning deferred: SHA-256 digests and artifact pinning stay in a
  later approved wave.
- Approval record local: the revision approval record stays inside the local
  embedding adapter boundary.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify
  gates pass.

## Non-Goals

This procedure must not introduce:

- Real model downloads.
- Real model artifacts or caches.
- Real artifact SHA-256 digests.
- Signed URLs, credentials, tokens, or API keys.
- Runtime dependencies.
- Runtime registration.
- Execution provider composition.
- Explicit execution enablement.

## Approval Output

A future revision-selection wave may produce an approved provider-local
revision record only after the required checks pass. That approval record must
keep `downloadEnabled: false`.

The approval record may be used by readiness checks, but it must not cause
artifact downloads, runtime loading, or provider execution.

## Verification

Run at minimum:

- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- `npm run typecheck`
- `npm run verify`

Run desktop smoke tests only if the wave touches Core Host composition,
Desktop IPC, startup supervision, or provider visibility in the desktop path.
