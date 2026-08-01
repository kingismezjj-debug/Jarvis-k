# Phase 11.3 Visual Runtime Isolation Guard

## Status

Complete as a provider-neutral isolation guard preparation wave.

## Scope

This wave records the pending boundary for a future local OCR and vision
runtime adapter. It requires:

- an adapter-only runtime surface;
- supervised private child-process IPC;
- resource scheduler lease integration;
- sanitized failure mapping;
- an explicit screen-capture permission boundary;
- fixture OCR and vision fallbacks; and
- composition rooted in `apps/core-host`.

The descriptor is `provider_local_pending`. It does not create the future
runtime package, select a runtime, install dependencies, access model
artifacts, capture a screen, or execute OCR or vision.

## Approval Result

An accepted result means only
`ready_for_runtime_dependency_approval`. It does not approve:

- Python, CUDA, ONNX, Paddle, Transformers, llama.cpp, or native runtime
  dependencies;
- screen-capture permissions or Windows capture APIs;
- model downloads, model loading, or raw pixel persistence;
- OCR or vision execution;
- provider registration or default opt-in;
- network access or credentials;
- model output becoming operating-system commands; or
- Core Host, Desktop, IPC, or UI changes.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/capabilities
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke is not required because this wave changes no Core Host
composition, Desktop IPC, startup supervision, provider visibility, or UI
behavior.
