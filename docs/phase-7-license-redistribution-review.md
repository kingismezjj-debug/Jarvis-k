# Phase 7 License and Redistribution Review

Recorded on 2026-08-01 for `Qwen/Qwen3-Embedding-0.6B`.

## Scope

- Reviewed immutable revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Public Hugging Face metadata for that revision reports
  `license:apache-2.0`.
- The approved manifest records `license: Apache-2.0` and
  `licenseRisk: yellow`.
- This wave approves only the current pinned model artifact set and its
  redistribution/NOTICE guard.

## Approved Review Boundary

- Model weights: reviewed for the current pinned artifact set.
- Tokenizer/config artifacts: reviewed for the current pinned artifact set.
- Redistribution terms: approved for the current pinned artifact set.
- NOTICE/LICENSE bundle: required before packaging or redistribution.
- Runtime dependencies: `none_added`.
- Native dependencies: `none_added`.
- Downloads remain disabled.
- Local embedding execution remains disabled.

## Explicit Non-Coverage

This approval does not approve future runtime packages, native helper binaries,
ONNX/Paddle/Transformers/Python/CUDA dependencies, installer bundling, model
cache layout, provider registration, benchmark claims, or local embedding
execution.

Any later wave that adds runtime or native dependencies must open a separate
license and redistribution review for those dependencies.

## Code Boundary

- `createLocalEmbeddingLicenseApprovalRecord()` remains pending by default.
- `createApprovedLocalEmbeddingLicenseApprovalRecord()` is the explicit
  provider-local approval factory for the current pinned artifact set.
- `isLocalEmbeddingLicenseApprovalRecordApproved()` now requires:
  - matching model id, source, license, and manifest revision;
  - confirmed public metadata license;
  - model weight and tokenizer/config review;
  - redistribution terms review;
  - NOTICE bundle definition;
  - runtime and native dependency scope set to `none_added`;
  - `downloadEnabled: false`;
  - manifest risk of `green` or `yellow`.

## Verification Notes

The review record intentionally contains no URL, signed URL, credential, model
file, cache path, runtime dependency, provider registration, or execution
enablement.
