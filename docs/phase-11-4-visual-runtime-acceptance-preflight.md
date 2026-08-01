# Phase 11.4 Visual Runtime Acceptance Preflight

## Status

Complete as a provider-neutral aggregate preflight preparation wave.

## Scope

This wave aggregates the fixture benchmark boundary and visual runtime
isolation boundary with deferred license, Windows packaging, native dependency,
and screen-capture privacy/permission reviews.

An accepted result means only
`ready_for_runtime_backed_capture`.

## Safety Boundary

Real visual benchmark values remain pending and unexposed. The preflight keeps
network access, credentials, runtime dependencies, model downloads, model
loading, screen capture, OCR execution, vision execution, provider
registration, default opt-in, raw pixel persistence, raw pixel exposure, and
model-output command conversion disabled.

The preflight does not approve:

- a real OCR or vision runtime;
- Windows screen-capture APIs or permission prompts;
- model artifacts or caches;
- provider registration or execution enablement;
- Core Host routing;
- Desktop IPC; or
- UI controls.

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

## Next Hard Pause

Do not add real visual runtime dependencies, model artifacts, network
downloads, screen-capture APIs or permissions, model loading, OCR/vision
execution, provider registration, default opt-in, or user-facing controls
without separate product, privacy, and security approval.
