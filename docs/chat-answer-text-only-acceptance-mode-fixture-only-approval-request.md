# Chat Answer Text-Only Acceptance Mode Fixture-Only Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_IMPLEMENTED_FIXTURE_EVIDENCE`

Two separate Chat Answer text-only manual acceptance windows were stopped
before fixed text inputs because the ordinary desktop UI continued to expose
the microphone/voice controls. The isolated windows correctly kept ASR
unconfigured, but the visible control led to an avoidable scope exit.

This request adds a bounded fixture-only text acceptance mode to make that
boundary visible and fail closed in the existing UI before any microphone or
ASR path can be reached.

## Exact Implementation Scope

- add one default-off Core/desktop-to-renderer feature flag for the existing
  Chat Answer fixture manual acceptance mode;
- when that flag is active, disable or hide only the existing microphone/PTT
  controls and voice-mode actions;
- render one localized, non-interactive status message that voice is not
  available in this text-only acceptance mode;
- prevent voice capture start, voice mode change, and final transcript
  dispatch from the existing UI event handlers while the mode is active;
- preserve the existing text input, BrainCommand, fixture Chat Answer,
  result, safety, session-history, and optional local TTS controls;
- keep normal Jarvis-K behavior unchanged when the flag is absent;
- add focused UI/source/replay tests for disabled voice controls, text-input
  preservation, and default-off behavior; and
- add sanitized fixture evidence only.

## Explicit Exclusions

This scope does not authorize:

- microphone permission access, capture, ASR provider configuration,
  secure-store access, transcript dispatch, or voice runtime;
- real provider, model, planner, helper, cache, credential, endpoint, or
  network access;
- Memory/vector access or persistence;
- browser, local-app, shell, filesystem, process, or tool execution;
- changes to voice settings, provider storage, TTS provider configuration,
  default voice behavior, or normal product voice UX;
- new general UI/IPC surfaces outside the existing feature-flag projection;
- telemetry, installer, update, packaging, or release changes.

## Acceptance Conditions

Fixture/replay tests must prove:

1. the mode is default-off;
2. the mode flag projects only into the existing renderer state;
3. microphone/PTT and voice mode controls are unavailable while active;
4. voice event handlers do not call capture or BrainCommand dispatch while
   active;
5. text input remains usable;
6. bounded Chat Answer result rendering remains usable;
7. local result TTS eligibility remains unchanged for safe completed text
   results;
8. no credential, network, provider, model, Memory, tool, or direct action
   path is accessed; and
9. normal voice controls remain unchanged when the flag is absent.

## Requested Approval Lines

```text
Product: APPROVE exactly this Chat Answer text-only acceptance mode fixture-only implementation scope with a default-off existing-UI flag that disables/hides microphone and voice controls, preserves text BrainCommand, fixture Chat Answer, safety/result projection, and optional local TTS, and introduces no real provider or direct action behavior

Security: APPROVE exactly this bounded fail-closed Chat Answer text-only acceptance mode fixture-only scope with no microphone/ASR, credential, secure-store, network, provider, model, Memory/vector, tool, filesystem, process, or side-effect access; existing UI state projection, localized status copy, tests, and sanitized evidence only

Release: APPROVE implementation and fixture/replay UI evidence only; no normal default voice behavior change, no UI/IPC expansion outside the default-off acceptance flag, no telemetry, installer/update, packaging, or release-channel changes
```
