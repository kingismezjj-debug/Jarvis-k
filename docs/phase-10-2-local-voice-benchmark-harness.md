# Phase 10.2 Local Voice Fixture Benchmark Harness

Recorded on 2026-08-01.

## Scope

This wave adds a deterministic, provider-neutral benchmark harness in
`packages/voice`. It evaluates only fixture observations for PTT finalization,
continuous-listening recovery, TTS interruption handling, degraded provider
behavior, and resource overlap.

The harness does not capture wall-clock latency, memory values, audio bytes,
transcript text, provider logs, model output, or real runtime metrics.

## Output Boundary

Plans and reports are marked `fixture_only` and keep:

- raw audio persistence disabled;
- raw transcript persistence disabled;
- metric persistence disabled;
- real provider execution disabled; and
- real audio execution disabled.

Reports contain bounded case counts, success counts, a sanitized outcome, and a
resource-overlap flag. They do not echo observation objects or arbitrary input
fields.

Empty observations fail closed. Any failed case or resource overlap produces a
failed fixture report. Partial provider behavior produces a degraded fixture
report without enabling production behavior.

## Deferred Gates

The following remain outside this wave:

- real STT/TTS runtime selection or installation;
- model or voice artifact access;
- real microphone or speaker execution;
- latency, memory, quality, or resource metrics from a real provider;
- provider registration or execution enablement; and
- UI/Desktop benchmark controls.

## Verification

Run:

```powershell
npm.cmd run build -w @jarvis-k/voice
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave changes no Core Host,
Desktop, IPC, provider visibility, or UI behavior.
