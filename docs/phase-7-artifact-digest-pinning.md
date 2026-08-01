# Phase 7 Artifact Digest Pinning

Recorded on 2026-08-01 for `Qwen/Qwen3-Embedding-0.6B`.

## Scope

- Approved revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Required artifact set:
  `model.safetensors`, `config.json`,
  `config_sentence_transformers.json`, `generation_config.json`,
  `modules.json`, `tokenizer_config.json`, `tokenizer.json`,
  `merges.txt`, `vocab.json`, and `1_Pooling/config.json`.
- Downloads remain disabled in application code.
- Local embedding runtime and execution remain disabled.
- No model file, model cache, signed URL, provider credential, runtime
  dependency, provider registration, or benchmark result is committed.

## Capture Method

- `model.safetensors`: used Hugging Face `X-Linked-ETag` for the selected
  immutable revision. This is the LFS SHA-256 object id. The weight file was
  not downloaded or stored in the repository.
- `tokenizer.json`: used Hugging Face `X-Linked-ETag`, then downloaded the
  11,423,705 byte public artifact into a temporary directory and verified the
  same SHA-256 with both `Get-FileHash` and .NET SHA256.
- Remaining text/config artifacts: downloaded from the selected immutable
  revision into a temporary directory and verified with both `Get-FileHash` and
  .NET SHA256.
- The temporary directory was outside the repository under the Windows temp
  path. It was removed after capture and was not committed.

## Approved Artifact Digests

| Artifact | SHA-256 |
| --- | --- |
| `model.safetensors` | `0437e45c94563b09e13cb7a64478fc406947a93cb34a7e05870fc8dcd48e23fd` |
| `config.json` | `b5bf1f51fc45be473a54718cef92448d90a1be001bf9b9a44b8c7f10a19feaa9` |
| `config_sentence_transformers.json` | `10667c72ddb772627bf1780cb7f86af8e2ae0032b8c243c731172064105c6961` |
| `generation_config.json` | `28396d421a2108acce96383f6a7de78008f7f1b17f807958f3c14c51dbfb65fb` |
| `modules.json` | `84e40c8e006c9b1d6c122e02cba9b02458120b5fb0c87b746c41e0207cf642cf` |
| `tokenizer_config.json` | `253153d0738ceb4c668d2eff957714dd2bea0b56de772a9fdccd96cbf517e6a0` |
| `tokenizer.json` | `def76fb086971c7867b829c23a26261e38d9d74e02139253b38aeb9df8b4b50a` |
| `merges.txt` | `8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5` |
| `vocab.json` | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` |
| `1_Pooling/config.json` | `37bf193fa101f19101bfad9c31d3eb0f786e247b7b1e5cb7f007d730eed1ddbd` |

## Code Boundary

- `createLocalEmbeddingArtifactPlan()` remains unpinned by default.
- `createPreparedLocalEmbeddingArtifactDigestApprovalRecord()` remains pending
  and digest-free.
- `createPinnedLocalEmbeddingArtifactPlan()` is the explicit provider-local
  factory for the approved digest set.
- `createApprovedLocalEmbeddingArtifactPinApprovalRecord()` is the explicit
  provider-local approval record for those pins.
- Approved artifact pin checks now require `digestCapturePrepared: true` on
  every approved artifact, so an approval cannot skip the digest-capture
  preparation boundary.

## Remaining Blockers

- Manifest approval still needs to consume the approved revision and digest
  policy.
- License, redistribution, NOTICE/LICENSE, tokenizer/config, runtime
  dependency, native dependency, packaging, process isolation, and benchmark
  gates are still pending.
- Runtime implementation, provider registration, download enablement, and local
  execution remain blocked until later explicit waves.
