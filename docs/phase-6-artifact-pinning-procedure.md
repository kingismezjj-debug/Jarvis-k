# Phase 6 Artifact Pinning Procedure

This procedure defines how Jarvis-K may later move from an approved immutable
revision to approved artifact pins and SHA-256 digests for the planned local
embedding provider.

Current target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: `huggingface`
- Runtime direction: provisional `transformers`

## Procedure State

Artifact pinning is currently `pending`.

The project now has a provider-local procedure guard in
`@jarvis-k/inference-adapter-embedding-local`. The guard can report whether a
future artifact pinning wave is ready for manual approval, but it does not
expose revision values, SHA-256 digests, artifact filenames, or URLs in its
public summary output.

## Required Checks

- Revision approved: an immutable upstream revision has already been approved.
- Required artifacts confirmed: every required artifact role is known before
  recording pins.
- Digests verified: SHA-256 digests are verified for every required artifact.
- Signed URLs absent: signed URLs, credentials, and secret-bearing URLs are
  not committed.
- Downloads disabled: download paths remain disabled until all artifact pins
  are approved.
- Approval record local: artifact pin approval records stay inside the local
  embedding adapter boundary.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify
  gates pass.

## Non-Goals

This procedure must not introduce:

- Real model downloads.
- Real model artifacts or caches.
- Signed URLs, credentials, tokens, or API keys.
- Runtime dependencies.
- Runtime registration.
- Execution provider composition.
- Explicit execution enablement.

## Approval Output

A future artifact-pinning wave may produce approved provider-local artifact
pin records only after the required checks pass. Those approval records must
keep `downloadEnabled: false` until a later explicit download-enablement wave.

Artifact pin approval may be used by readiness checks, but it must not cause
downloads, runtime loading, or provider execution.

## Verification

Run at minimum:

- `npm run check:boundaries`
- `npm run check:sensitive-artifacts`
- `npm run typecheck`
- `npm run verify`

Run desktop smoke tests only if the wave touches Core Host composition,
Desktop IPC, startup supervision, or provider visibility in the desktop path.
