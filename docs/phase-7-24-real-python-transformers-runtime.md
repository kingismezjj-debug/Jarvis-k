# Phase 7.24 Real Python Transformers Runtime

Recorded on 2026-08-02 for the dedicated local embedding runtime package.

## Scope

This wave implements the real Python Transformers child-process runtime
without registering the provider or changing the product composition root. It
includes:

- a supervised Node child-process JSONL transport;
- a Python helper with `health`, `load`, `embed`, and `shutdown`;
- local-file-only Transformers model loading;
- `trust_remote_code=False`;
- CPU-only model execution;
- attention-mask mean pooling followed by L2 normalization; and
- sanitized protocol errors with no raw helper diagnostics crossing the
  boundary.

The model directory is supplied to the helper process by the future concrete
composition root and never travels in the runtime protocol or result DTOs.

## Dependency Boundary

- Python dependencies are listed only in
  `packages/inference-runtime-transformers-local/runtime/requirements.txt`.
- TypeScript runtime code imports only the Node child-process builtin and
  provider-local protocol types.
- No Python, Transformers, Torch, or native dependency is added to contracts,
  capabilities, Core, Desktop, UI, or the public provider registry.
- The helper receives a minimal environment and does not inherit arbitrary
  parent-process environment values.

## Artifact and Network Boundary

- `local_files_only=True` is required for tokenizer and model loading.
- `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1` are set for the helper.
- No downloader, cache writer, signed URL, credential, or remote model path is
  exposed.
- A real model directory is not committed or created by the repository smoke.
- The runtime fixture smoke creates a random tiny BERT model in a temporary
  directory, verifies load and embed, and removes it afterward.

## Composition Boundary

- `apps/core-host` remains the only concrete composition root.
- The runtime helper transport is available for explicit composition but is
  not registered by default.
- The fixture inference provider remains the product fallback.
- Provider visibility, UI behavior, Core commands, Desktop IPC, and default
  opt-in remain unchanged.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run verify
```

Runtime-backed smoke commands require an explicitly supplied Python
executable. The repository fixture smoke uses only a temporary synthetic model
and does not access a real model artifact.
