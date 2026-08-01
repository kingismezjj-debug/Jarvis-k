# Phase 7 Artifact Cache and Download Manager Dry-Run

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave adds a dry-run artifact cache and download manager state machine to
the dedicated runtime package. It does not perform network access, filesystem
writes, real downloads, cache mutation, model artifact access, or local
embedding execution.

- Runtime package: `@jarvis-k/inference-runtime-transformers-local`.
- Package location: `packages/inference-runtime-transformers-local`.
- Composition root remains: `apps/core-host`.

## State Machine

The dry-run manager defines these states:

- `pending`;
- `downloading`;
- `verifying`;
- `ready`;
- `corrupted`;
- `cleanup_required`; and
- `rollback_ready`.

It previews these transitions only:

- `pending` + `start_download` -> `downloading`;
- `downloading` + `mark_download_complete` -> `verifying`;
- `verifying` + `mark_verification_passed` -> `ready`;
- `verifying` + `mark_verification_failed` -> `corrupted`;
- `corrupted` + `request_cleanup` -> `cleanup_required`;
- `cleanup_required` + `complete_cleanup` -> `pending`;
- `ready` + `request_rollback` -> `rollback_ready`; and
- `rollback_ready` + `complete_rollback` -> `ready`.

Invalid transitions fail closed and keep the current state.

## Cache Policy

- Cache location policy is `user_cache_provider_namespace`.
- No concrete cache path is committed.
- No model artifact is committed.
- No signed URL is persisted.
- No credential material is persisted.
- Digest verification is required.
- Partial download cleanup is required.
- Rollback support is required.
- Uninstall does not delete models by default.

## Verification Policy

- Digest algorithm is `sha256`.
- Verification is required before a future artifact can become ready.
- Unverified artifacts must be rejected.
- Activation requires every artifact to be verified.
- Digest values are not exposed by this dry-run manager.

## Hard Blocks

- `dryRunOnly` remains `true`.
- `networkAccessEnabled` remains `false`.
- `fileSystemWritesEnabled` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `modelArtifactsAccessed` remains `false`.
- `cacheValuesExposed` remains `false`.

## Non-Goals

- No real download.
- No filesystem write.
- No cache directory creation.
- No signed URL handling.
- No artifact digest value storage.
- No model artifact access.
- No provider registration.
- No local embedding execution.
