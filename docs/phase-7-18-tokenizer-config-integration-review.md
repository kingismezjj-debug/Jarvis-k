# Phase 7.18 Tokenizer and Config Integration Review

Recorded on 2026-08-01 for the planned local embedding runtime.

## Scope

This wave adds a provider-local compatibility review for the future
`Qwen/Qwen3-Embedding-0.6B` runtime path. It reviews the roles and contracts
needed to interpret model configuration, sentence-transformers configuration,
tokenizer configuration and assets, and pooling configuration together.

The review is a guard and approval record only. It does not parse model files,
download artifacts, install runtime dependencies, access a model cache, load a
model, register a provider, or execute local embedding inference.

## Review Boundary

The review requires explicit evidence for:

- model configuration;
- sentence-transformers configuration;
- sentence-transformers module ordering and scope;
- tokenizer configuration;
- tokenizer asset and fallback behavior;
- pooling configuration;
- text-batch input contract;
- sanitized embedding-vector output contract;
- pooling parity plan;
- normalization parity plan; and
- dedicated runtime boundary ownership.

The review is consumed by the runtime strategy's
`runtime.model_tokenizer_pin` gate. A runtime strategy cannot be approved when
the tokenizer/config integration review is missing, pending, or regressed.

## Hard Blocks

- `runtimeDependenciesIntroduced` remains `false`.
- `downloadEnabled` remains `false`.
- `executionEnabled` remains `false`.
- Compatibility values are not exposed through the review summary.
- No URLs, SHA-256 values, artifact filenames, model files, cache paths, or
  private local paths are included in the review output.
- Core, Desktop, UI, contracts, and capabilities remain provider-neutral.

## Approval Result

The approved review records the compatibility boundary and implementation
responsibilities without claiming that a runtime has been implemented. The
runtime package must later prove the reviewed tokenizer, pooling, normalization,
input, and output behavior with runtime-backed tests before benchmark capture.

## Verification

Run at minimum:

```powershell
npm.cmd run build -w @jarvis-k/inference-adapter-embedding-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required for this wave because Core Host
composition, Desktop IPC, startup supervision, and provider visibility do not
change.
