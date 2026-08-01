# Phase 7 Artifact Digest Approval Record Preparation

Phase 7.5 prepares the provider-local artifact digest approval record shape for
the selected revision and required artifact set. This wave creates pending
digest slots only. It does not record SHA-256 values, approve artifact pins,
download artifacts, install runtime dependencies, or enable execution.

Target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: Hugging Face model repository
- Selected revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`

## Prepared Record

The provider-local prepared record:

- Uses the selected immutable revision for every required artifact slot.
- Keeps every artifact status `pending`.
- Keeps every SHA-256 value absent.
- Marks each slot as prepared for later digest capture.
- Keeps `downloadEnabled: false`.

The prepared record may satisfy only a preparation check. It must not satisfy
artifact pin approval, readiness, download enablement, runtime registration, or
execution enablement.

## Guard Behavior

`isLocalEmbeddingArtifactDigestApprovalRecordPrepared()` accepts only records
that:

- Match the selected model and Hugging Face source.
- Remain `pending`.
- Keep downloads disabled.
- Cover every required artifact plan path and role.
- Use the selected immutable revision for every required artifact.
- Keep SHA-256 values absent.
- Mark every required slot as digest-capture prepared.

## Non-Goals

This wave does not introduce:

- Real SHA-256 digest values.
- Approved artifact pin records.
- File content, model files, tokenizer files, weights, or caches.
- Signed URLs, credentials, tokens, API keys, or auth headers.
- Runtime dependencies or dependency versions.
- Runtime registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Next Gate

The next low-coupling wave may record the actual SHA-256 digest values for the
prepared slots. That wave must stay provider-local, keep downloads disabled,
pass sensitive-artifact checks, and verify each digest against the selected
revision and required artifact set.
