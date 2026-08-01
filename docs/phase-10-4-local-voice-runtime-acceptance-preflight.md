# Phase 10.4 Local Voice Runtime Acceptance Preflight

Recorded on 2026-08-01.

## Scope

This wave adds a provider-neutral aggregate preflight for the local voice
preparation work. It combines the fixture benchmark plan, runtime isolation
boundary, and deferred license, packaging, and native dependency reviews.

The preflight is a handoff guard only. It does not approve or add a runtime,
capture real speech metrics, access artifacts, create a cache, execute audio,
register a provider, or change default behavior.

## Approval Result

An accepted result means only
`ready_for_runtime_backed_capture`. It means the review boundary is internally
consistent and ready for a separately approved runtime-backed capture stage.
It does not mean that a runtime is installed or that local STT/TTS execution is
available.

The policy requires:

- fixture benchmark evidence;
- runtime adapter isolation evidence;
- license, Windows packaging, and native dependency review remaining deferred
  until their own approval waves;
- real benchmark values remaining pending and unexposed;
- no network, credentials, runtime dependencies, downloads, model loading, or
  audio execution; and
- no provider registration, default opt-in, or execution enablement.

## Fail-Closed Behavior

Missing review evidence, captured or exposed metrics, dependency changes,
packaging/native review completion, execution flags, provider registration, or
dirty verification all block the preflight. The result exposes only fixed
status fields, booleans, and sanitized reason codes.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/voice
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave changes no Core Host
composition, Desktop IPC, startup supervision, provider visibility, or UI
behavior.
