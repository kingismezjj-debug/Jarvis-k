# Phase 11.1 OCR, Screen, and Vision Contract Guards

## Status

Complete as a provider-neutral, fixture-only preparation wave.

## Scope

This wave adds the contracts and ports needed to discuss OCR, screen capture,
and vision analysis without adding a real screen-capture path or a real visual
model runtime.

The wave includes:

- bounded screen-capture request and result schemas;
- provider-neutral vision analysis request, label, and result schemas;
- injected `ScreenCaptureProvider` and `VisionAnalysisProvider` ports;
- a fail-closed local visual preflight in `@jarvis-k/capabilities`;
- a deterministic fixture screen-capture provider;
- a deterministic fixture vision provider; and
- normal, blocked, degraded, and sanitized-output tests.

The existing provider-neutral OCR contract and fixture provider remain the
regression path for text recognition.

## Safety Boundary

The preflight accepts only `ready_for_fixture_contract`. It does not approve:

- Windows or Electron screen capture;
- display/window permission handling;
- raw pixel persistence or exposure;
- real OCR or vision model loading;
- model downloads, caches, or runtime dependencies;
- network access or credentials;
- provider registration or default opt-in;
- model output being converted into operating-system commands;
- Core Host composition;
- Desktop IPC; or
- UI behavior.

The fixture screen provider returns deterministic image bytes in memory and
does not inspect a display, window, clipboard, filesystem, or operating-system
surface.

## Verification

Run:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke is not required because Core Host composition, Desktop IPC,
provider visibility, startup supervision, and UI behavior are unchanged.

## Next Hard Pause

Do not add real screen capture, permission prompts, OCR or vision runtime
dependencies, model artifacts, model loading, network access, provider
registration, Core Host routing, Desktop IPC, or UI controls without a separate
product, privacy, and security approval.
