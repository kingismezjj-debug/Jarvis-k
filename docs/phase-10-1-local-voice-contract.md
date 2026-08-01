# Phase 10.1 Local Voice Capability Contract

Recorded on 2026-08-01.

## Scope

This wave adds a provider-neutral local voice capability descriptor and a
fixture-only capability report in `packages/voice`. It covers the existing
provider-neutral ASR and TTS playback coordination ports without composing a
real local speech provider.

The preflight is a preparation guard only. It does not install a speech
runtime, create a model cache, load a model, access a microphone or speaker,
download artifacts, register a provider, or execute audio.

## Contract Boundary

The reviewed local voice boundary requires:

- provider-neutral ASR and TTS playback ports;
- a future dedicated provider-local runtime package;
- concrete composition only in `apps/core-host`;
- supervised child-process ownership and private IPC;
- resource scheduler lease requirements;
- sanitized failure reporting;
- a deterministic fixture fallback; and
- no credentials, network access, runtime dependencies, model downloads,
  model loading, execution, registration, or default opt-in in this wave.

The fixture capability report exposes only availability and a sanitized reason
code. It does not carry transcript text, audio bytes, credentials, URLs, cache
paths, or private paths.

## Approval Result

An accepted preflight result means only
`ready_for_fixture_contract`. It does not mean that a local STT or TTS runtime
is installed, available, registered, or allowed to execute.

Partial fixture availability is represented as `degraded` and remains a
fixture observation, not a production-provider status.

## Deferred Gates

The following require a separate product, security, and implementation wave:

- selecting a local STT or TTS runtime;
- adding runtime or native dependencies;
- model or voice artifact selection and downloads;
- audio capture/playback execution outside the existing browser fixture path;
- real provider registration or default behavior changes;
- resource limits and benchmark acceptance for local speech; and
- UI or Desktop controls for local-provider selection.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/voice
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, startup supervision, provider visibility, or
UI behavior.
