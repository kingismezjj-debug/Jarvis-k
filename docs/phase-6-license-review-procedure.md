# Phase 6 License Review Procedure

This procedure defines the approval boundary for a future local embedding
license review. It does not approve a real license decision, install runtime
dependencies, download artifacts, or enable execution.

Current target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: `huggingface`
- Runtime direction: provisional `transformers`

## Procedure State

License review is currently `pending`.

The provider-local guard can report whether a later manual review wave is
ready for approval. Its summary does not expose upstream URLs, revisions,
artifact digests, artifact filenames, dependency versions, private paths, or
real license decisions.

## Required Checks

- Model weights reviewed: model-weight license terms are reviewed before
  approval.
- Runtime dependencies reviewed: runtime dependency licenses are reviewed
  before approval.
- Tokenizer components reviewed: tokenizer and config component licenses are
  reviewed before approval.
- Native dependencies reviewed: native dependency redistribution obligations
  are reviewed before approval.
- Redistribution terms reviewed: packaged and cached artifact redistribution
  terms are reviewed before approval.
- NOTICE bundle defined: required NOTICE and LICENSE bundle contents are
  defined before approval.
- Approval record local: license review approval records stay inside the local
  embedding adapter boundary.
- Downloads disabled: download paths remain disabled during license review
  approval.
- Execution disabled: runtime registration, execution-provider composition,
  and local embedding execution remain disabled.
- Verification clean: boundary, sensitive-artifact, typecheck, and verify
  gates pass.

## Approval Output

A future review wave may produce a provider-local license approval record only
after all required checks pass. That approval record must remain local to the
embedding adapter boundary and must keep `downloadEnabled: false` until a
later explicit download-enablement wave.

Readiness checks may consume the approved record, but license approval must
not cause downloads, runtime loading, provider registration, or execution.

## Non-Goals

This procedure must not introduce:

- Real license approval decisions.
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
