# Qwen3-0.6B Artifact Pinning + Generation Helper Scope

Date: 2026-08-06

## Scope

This step defines the Qwen3-0.6B Fast Router artifact pinning surface and
generation-helper protocol surface without enabling real model generation.

## Artifact Pinning

- Model candidate: `Qwen/Qwen3-0.6B`
- Required artifact keys are represented in
  `packages/inference-adapter-qwen-router/src/artifact-plan.ts`.
- `downloadEnabled` remains `false`.
- `QWEN_FAST_ROUTER_APPROVED_ARTIFACT_DIGESTS` now contains the approved
  seven-file digest set captured for revision
  `c1899de289a04d12100db370d81485cdf75e47ca`.
- `createPinnedQwenFastRouterArtifactPlan()` returns a pinned plan with
  `downloadEnabled: false`; downloads and runtime execution remain separate
  gates.

## Generation Helper

- The Transformers local runtime helper protocol now accepts a `generate`
  operation with:
  - `sessionId`
  - `resourceLeaseId`
  - `modelId`
  - sanitized `prompt`
  - bounded `maxOutputChars`
  - deterministic `temperature: 0`
- The TypeScript client can send `generate` requests through the existing
  private child-process IPC transport.
- The Python helper validates `generate` requests, then returns
  `GENERATION_EXECUTION_DISABLED`.
- No Qwen artifact is downloaded, loaded, cached, or executed in this scope.

## Core Host Adapter

- `apps/core-host/src/qwen-fast-router-generation-port.ts` adapts the bounded
  runtime helper `generate` call to the Qwen Fast Router generation port.
- The adapter is not instantiated by Core Host startup.
- Qwen remains registered only as a diagnostic, unconfigured provider until the
  separate runtime/cache gates are satisfied.

## Remaining Gates

- Temporary artifact materialization into system temp only.
- Runtime helper execution approval for one acceptance window.
- Model lifecycle ready signal before Core Host may wire the provider as
  available.
