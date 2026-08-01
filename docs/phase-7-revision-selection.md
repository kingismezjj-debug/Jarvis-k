# Phase 7 Revision Selection

Phase 7.1 selects the first real immutable upstream revision for the planned
local embedding provider. This wave records only the revision commit and keeps
downloads, artifact pinning, runtime dependencies, provider registration, and
execution disabled.

Target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: Hugging Face model repository
- Runtime direction: provisional `transformers`

## Selected Revision

Selected upstream revision:

```text
97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3
```

The revision was selected from the upstream repository with this read-only
verification command:

```powershell
git ls-remote https://huggingface.co/Qwen/Qwen3-Embedding-0.6B HEAD refs/heads/main
```

At selection time, both `HEAD` and `refs/heads/main` resolved to the selected
commit. The selected value is an immutable commit id, not a floating branch
name.

## Approval Record

The provider-local selected revision is recorded by
`createApprovedLocalEmbeddingRevisionApprovalRecord()` in
`@jarvis-k/inference-adapter-embedding-local`.

The record remains:

- `status: approved`
- `source: huggingface`
- `downloadEnabled: false`

Readiness checks may use this record to satisfy `model.revision` only when a
future approved manifest contains the same revision. This approval does not
create or approve a manifest by itself.

## Non-Goals

This wave does not introduce:

- Artifact SHA-256 digests.
- Artifact filenames or model files.
- Model downloads, caches, or URLs beyond the source repository identity.
- Signed URLs, credentials, tokens, or API keys.
- Runtime dependencies or dependency versions.
- Runtime registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Next Gate

The next low-coupling wave is artifact pin selection. It must verify required
artifact roles and SHA-256 digests for the selected revision while keeping
downloads disabled until a later explicit download-enablement wave.
