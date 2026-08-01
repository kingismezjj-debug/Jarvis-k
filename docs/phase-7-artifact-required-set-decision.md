# Phase 7 Artifact Required Set Decision

Phase 7.3 decides which observed upstream repository paths must enter the
later artifact digest pinning wave. This wave records only required/excluded
decisions. It does not record SHA-256 digests, download artifacts, install
runtime dependencies, or enable execution.

Target:

- Provider id: `embedding.local.qwen3`
- Model id: `Qwen/Qwen3-Embedding-0.6B`
- Source: Hugging Face model repository
- Selected revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`

## Required For Pinning

The following observed paths are required for later digest pinning:

- `model.safetensors`: model weights.
- `config.json`: model config.
- `config_sentence_transformers.json`: sentence-transformers config.
- `generation_config.json`: upstream generation config, retained for model
  package audit parity even though embedding execution should not generate
  text.
- `modules.json`: sentence-transformers module layout.
- `tokenizer_config.json`: tokenizer config.
- `tokenizer.json`: tokenizer vocabulary and tokenizer graph.
- `merges.txt`: tokenizer merge data.
- `vocab.json`: tokenizer vocabulary fallback data.
- `1_Pooling/config.json`: pooling config.

## Excluded From Runtime Pinning

The following observed paths are not required runtime pins:

- `.gitattributes`: repository metadata.
- `README.md`: documentation.

Exclusion from runtime pinning does not authorize deletion from upstream or
downstream packaging. It only means these paths are not required model-runtime
artifacts for the planned local embedding execution path.

## Guard Behavior

The provider-local required-set decision guard requires:

- Selected revision matches the approved immutable revision.
- Every required artifact plan path has a required-set decision.
- Downloads remain disabled.
- Pinning remains disabled.
- Digest values remain absent.
- Every decision item keeps `digestRecorded: false` and
  `downloadEnabled: false`.

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

The next low-coupling wave may prepare artifact digest capture procedure rules
for the required set. Actual SHA-256 values should be recorded only in a
separately approved artifact digest pinning wave, with downloads still disabled
until a later explicit download-enablement wave.
