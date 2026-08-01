# Phase 7 Windows Packaging Approval Guard

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave approves the Windows packaging policy for the future local embedding
runtime. It does not create an installer, package runtime dependencies, download
model artifacts, or enable execution.

- Future runtime package: `@jarvis-k/inference-runtime-transformers-local`.
- Future package location: `packages/inference-runtime-transformers-local`.
- Composition root: `apps/core-host`.

## Installer Policy

- Installer creation remains disabled.
- Installer bundling is deferred.
- Model artifacts must not be bundled.
- The runtime package must not be bundled in this wave.
- NOTICE and license bundles are required before future installer creation.
- Install and installed-size budgets are reviewed as packaging gates, not as
  committed package output.

## Model Cache Policy

- Cache location policy is a user-cache provider namespace.
- No concrete cache path may be committed.
- No model artifact may be committed.
- No signed URL may be persisted.
- Digest verification is required before any future artifact use.
- Partial downloads must be cleaned up after failed verification.
- Uninstall must not delete downloaded models by default.

## Update and Rollback Policy

- Updates must be atomic across the versioned runtime package and approved
  manifest.
- Rollback support is required.
- The previous version must be retained until the replacement passes health
  checks.
- Failed updates must clean up partial artifacts.
- Health checks are required before activation.

## Hard Blocks

- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- `packagingValuesExposed` remains `false`.

## Readiness Gate

The `runtime.packaging` gate now requires both:

- `packagingReviewed: true`; and
- an approved Windows packaging approval record matching the planned provider,
  model, runtime package boundary, package location, and composition root.

Pending or mismatched records fail closed.

## Non-Goals

- No installer.
- No runtime package.
- No runtime dependency.
- No model download.
- No model cache.
- No provider registration.
- No local embedding execution.
