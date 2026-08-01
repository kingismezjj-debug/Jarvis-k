# Phase 7 Artifact Role Inventory

Phase 7.2 records the upstream artifact role inventory for the selected local
embedding revision. This wave identifies which repository paths must be pinned
later, but it does not record SHA-256 digests, download artifacts, install
runtime dependencies, or enable execution.

Target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: Hugging Face model repository
- Selected revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`

## Read-Only Inventory Source

The upstream file list was collected from the Hugging Face model API for the
selected revision. Only repository filenames were read; no file content, model
weight, LFS object, digest, cache, or signed download URL was fetched or
recorded.

Observed repository paths:

- `.gitattributes`
- `1_Pooling/config.json`
- `config.json`
- `config_sentence_transformers.json`
- `generation_config.json`
- `merges.txt`
- `model.safetensors`
- `modules.json`
- `README.md`
- `tokenizer.json`
- `tokenizer_config.json`
- `vocab.json`

## Required For Pinning

The current minimum required pin set is:

- `model.safetensors`: model weights.
- `config.json`: model config.
- `tokenizer_config.json`: tokenizer config.
- `tokenizer.json`: tokenizer vocabulary.
- `1_Pooling/config.json`: pooling config.

The Phase 6 placeholder pooling path has been corrected from `pooling.json` to
the observed upstream path `1_Pooling/config.json`.

## Deferred Review

The following observed paths remain under review for whether they must become
required pins in a later artifact pinning wave:

- `.gitattributes`
- `config_sentence_transformers.json`
- `generation_config.json`
- `merges.txt`
- `modules.json`
- `README.md`
- `vocab.json`

Deferred review is not approval to omit these files. It means the later
artifact pinning wave must decide whether each path is required, optional, or
documentation-only for the chosen runtime implementation.

## Non-Goals

This wave does not introduce:

- SHA-256 digests or artifact pin approvals.
- File content, model files, tokenizer files, weights, or caches.
- Signed URLs, credentials, tokens, API keys, or LFS object metadata.
- Runtime dependencies or dependency versions.
- Runtime registration or execution-provider composition.
- Local embedding execution or explicit execution enablement.
- Changes to Core, Desktop, UI, contracts, or capabilities dependency policy.

## Next Gate

The next low-coupling wave should decide the full required artifact set for
the selected runtime strategy. SHA-256 digest recording should happen only
after that required set is approved and must keep downloads disabled until a
separate download-enablement wave.
