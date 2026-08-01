# Phase 7 Manifest Approval

Recorded on 2026-08-01 for `Qwen/Qwen3-Embedding-0.6B`.

## Scope

- Approved revision:
  `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3`.
- Approved required artifact digest set is the Phase 7.6 pin set.
- Manifest-level artifact set digest:
  `093578fd106d15504eb05b94422105146d6428947ea32aa79e7c7a0627f54200`.
- Total required artifact size:
  `1,207,470,234` bytes.
- License risk remains `yellow`; this wave does not approve redistribution,
  NOTICE/LICENSE packaging, native/runtime dependency scope, or benchmarks.

## Manifest Digest Method

The manifest `sha256` is a stable digest of the approved artifact pin set, not
a replacement for per-file artifact digests.

The digest input is the compact JSON payload containing:

- model id;
- approved immutable revision;
- required artifact keys and SHA-256 values sorted by key.

This lets the manifest tie itself to the exact approved artifact set while the
per-artifact digest pins remain the source of truth for file verification.

## Code Boundary

- `createLocalEmbeddingManifestDraft()` remains audit-only and cannot parse as
  a contracts `ModelManifest`.
- `createApprovedLocalEmbeddingManifest()` is the explicit provider-local
  factory for the contracts-valid approved manifest.
- `createApprovedLocalEmbeddingManifestApprovalRecord()` records that manifest
  without enabling downloads.
- `isLocalEmbeddingManifestApprovalRecordApproved()` requires:
  - approved immutable revision evidence;
  - approved artifact plan and artifact pin approval evidence;
  - matching artifact-set digest;
  - `downloadEnabled: false`.

## Non-Goals

- No model file, model cache, signed URL, provider credential, dependency,
  runtime adapter, provider registration, packaging change, benchmark value, or
  local embedding execution is added.
- The provider remains reported as `unconfigured` and `disabled` until later
  gates explicitly pass.
