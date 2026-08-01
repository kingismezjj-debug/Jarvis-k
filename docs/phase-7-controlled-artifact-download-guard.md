# Phase 7 Controlled Artifact Download and SHA-256 Verification Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave adds a fail-closed guard for future controlled artifact download and
SHA-256 verification requests inside
`@jarvis-k/inference-runtime-transformers-local`.

The guard does not download, hash, write, cache, read model artifacts, persist
URLs, expose digest values, register providers, or execute the runtime.

## Guarded Operations

- `prepare_download`: validates a future controlled download request from the
  `pending` cache state.
- `verify_download`: validates an externally computed SHA-256 result from the
  `verifying` cache state before a future cache manager can mark an artifact
  ready.

## Required Gates

- Artifact key must be a safe relative artifact key.
- Source URL must be HTTPS.
- Source URL must be unsigned and must not contain query, fragment, token,
  credential, signature, or expiry markers.
- Expected digest must be lowercase SHA-256 hex.
- `verify_download` requires an observed lowercase SHA-256 hex digest that
  matches the approved expected digest.
- Artifact pin, immutable revision, license and redistribution, download,
  cache write, SHA-256 verification, partial cleanup, and rollback approvals
  must all be present.
- The operation must match the cache state.
- Any request for direct network access, filesystem writes, downloads,
  execution, model artifact reads, signed URL persistence, credential
  persistence, source URL exposure, or digest value exposure is rejected.

## Hard Blocks

- `dryRunOnly` remains `true`.
- `networkAccessEnabled` remains `false`.
- `fileSystemWritesEnabled` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `modelArtifactsAccessed` remains `false`.
- `signedUrlsPersisted` remains `false`.
- `credentialMaterialPersisted` remains `false`.
- `digestValuesExposed` remains `false`.
- `sourceUrlsExposed` remains `false`.

## Non-Goals

- No real downloader.
- No filesystem cache implementation.
- No direct SHA-256 computation in the runtime package.
- No concrete artifact cache path.
- No model artifact.
- No signed URL storage.
- No provider registration.
- No local embedding execution.

The actual hashing implementation remains a later controlled executor concern;
this package only validates the externally supplied verification result and
keeps all side effects disabled.
