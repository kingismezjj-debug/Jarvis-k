# Command Router Voice Manual Acceptance Approval Request

Recorded: 2026-08-09

## Status

`PRODUCT_SECURITY_RELEASE_APPROVED_ACCEPTED`

This request prepares one bounded developer-alpha manual acceptance window for
the voice-to-Command-Router path. It does not start the desktop session, open
the microphone, connect ASR, launch apps, or consume approval by itself.

Preflight verification passed on 2026-08-09. The manual voice window was then
completed by the user and accepted in sanitized evidence.

## Recorded Approvals

Product approval was recorded on 2026-08-09:

```text
Product: APPROVE exactly this one-window Command Router voice manual acceptance scope using the existing microphone/PTT capture, secure-store-backed ASR final transcript flow, one newly created temporary local Memory DB for automatic BrainCommand records only, the existing default-off Command Router product mode, deterministic fixture routing only, explicit UI confirmation plus native confirmation, and exactly the already accepted Notepad and Calculator local app targets; verify VS Code remains blocked, with no browser, URL, shell, PowerShell, filesystem, network behavior beyond the existing ASR provider path, arbitrary process, provider planner, Qwen runtime, allowlist expansion, installer, packaging, or release-channel behavior
```

Security approval was recorded on 2026-08-09:

```text
Security: APPROVE exactly this bounded fail-closed Command Router voice manual acceptance window with secure-store-only ASR credential loading and no credential exposure, one temporary local Memory DB with verified cleanup, no raw transcript/provider/audio persistence in evidence, no provider diagnostics outside the existing ASR path, no cloud planner, no Qwen/model runtime, no Memory vector retrieval, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond bounded launch verification, and only explicit Notepad and Calculator process launch after both UI confirmation and native confirmation; stop immediately on any prohibited behavior
```

Release approval was recorded on 2026-08-09:

```text
Release: APPROVE developer-alpha Command Router voice manual acceptance evidence only; no default behavior change, no allowlist expansion, no persistent Memory retention, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that arbitrary voice app control is supported
```

## Purpose

Verify that spoken commands enter the same accepted Command Router safety path
as typed commands:

```text
microphone/PTT
  -> ASR final transcript
  -> agent.runBrainCommand with source voice
  -> default-off Command Router product mode enabled by the user
  -> deterministic fixture router
  -> fixture dry-run projection
  -> explicit UI confirmation for Notepad/Calculator only
  -> native confirmation dialog
  -> sanitized result
```

## Exact Scope

The window authorizes exactly one local desktop session using:

- existing microphone capture/PTT controls;
- existing secure-store-backed ASR provider loading only;
- one newly created temporary local Memory DB for automatic voice transcript
  BrainCommand records only;
- existing default-off Command Router product mode;
- deterministic fixture routing only;
- the already accepted Notepad/Calculator real local-app allowlist after
  explicit UI confirmation and native confirmation;
- sanitized evidence only.

Allowed spoken commands:

- one Notepad open request;
- one Calculator open request;
- one VS Code open request to verify blocked behavior.

Allowed real side effects:

- Notepad launch only after `Confirm launch notepad` and native confirmation;
- Calculator launch only after `Confirm launch calculator` and native
  confirmation;
- temporary Memory DB creation and verified cleanup for this window.

## Required Product Approval Text

```text
Product: APPROVE exactly this one-window Command Router voice manual acceptance scope using the existing microphone/PTT capture, secure-store-backed ASR final transcript flow, one newly created temporary local Memory DB for automatic BrainCommand records only, the existing default-off Command Router product mode, deterministic fixture routing only, explicit UI confirmation plus native confirmation, and exactly the already accepted Notepad and Calculator local app targets; verify VS Code remains blocked, with no browser, URL, shell, PowerShell, filesystem, network behavior beyond the existing ASR provider path, arbitrary process, provider planner, Qwen runtime, allowlist expansion, installer, packaging, or release-channel behavior
```

## Required Security Approval Text

```text
Security: APPROVE exactly this bounded fail-closed Command Router voice manual acceptance window with secure-store-only ASR credential loading and no credential exposure, one temporary local Memory DB with verified cleanup, no raw transcript/provider/audio persistence in evidence, no provider diagnostics outside the existing ASR path, no cloud planner, no Qwen/model runtime, no Memory vector retrieval, no browser or URL opening, no shell/PowerShell/cmd/terminal/script execution, no arbitrary executable path or command-line arguments, no filesystem/clipboard/process enumeration beyond bounded launch verification, and only explicit Notepad and Calculator process launch after both UI confirmation and native confirmation; stop immediately on any prohibited behavior
```

## Required Release Approval Text

```text
Release: APPROVE developer-alpha Command Router voice manual acceptance evidence only; no default behavior change, no allowlist expansion, no persistent Memory retention, no telemetry expansion, no installer/update/packaging/release-channel changes, and no production-facing claim that arbitrary voice app control is supported
```

## Explicit Exclusions

This request does not approve:

- additional local apps;
- browser or URL opening;
- shell, PowerShell, cmd, Terminal, WSL, scripts, batch files, shortcuts, or
  arbitrary executable paths;
- command-line arguments;
- file open/save dialogs;
- filesystem, clipboard, screen, or general process-management tools;
- provider diagnostics outside the existing ASR path;
- Qwen runtime execution;
- provider-backed planning or model-driven tool invocation;
- Memory vector retrieval or persistent Memory retention;
- raw transcript, audio, provider response, credential, or transport evidence;
- cloud TTS, automatic TTS, telemetry, installer/update, packaging, or release
  behavior.

## Required Preconditions

Before opening the window:

```powershell
npx.cmd vitest run packages/core/test/runtime.test.ts packages/voice/test/engine.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/ptt-capture-coordinator.test.ts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Required preflight result:

- all focused tests pass;
- builds pass;
- fixture suite still covers Notepad, Calculator, browser projection, and VS
  Code blocked behavior;
- no real Qwen, planner, browser, shell, Memory vector retrieval, or allowlist
  expansion flags are enabled.

## Controlled Procedure After Approval

1. Start one isolated desktop session with a newly created temporary Memory DB.
2. Confirm Command Router product mode is off by default.
3. Enable Command Router product mode in Settings.
4. Confirm the router status is `intent-router.deterministic.fixture`.
5. Confirm local result TTS is disabled and do not enable it in this window.
6. Use PTT once for a Notepad open request.
7. Verify the final transcript appears and Brain Dispatch source is `voice`.
8. Verify the Notepad result first appears as fixture dry-run with direct action
   disabled.
9. Click `Confirm launch notepad`, accept the native dialog, and verify a
   visible Notepad window opens.
10. Use PTT once for a Calculator open request.
11. Verify the Calculator result first appears as fixture dry-run with direct
    action disabled.
12. Click `Confirm launch calculator`, accept the native dialog, and verify a
    visible Calculator window opens.
13. Use PTT once for a VS Code open request.
14. Verify VS Code routes as `localApp.open` but remains blocked, with no
    confirmation prompt and no VS Code launch.
15. Close the desktop session.
16. Verify the temporary Memory DB is removed.
17. Record only sanitized evidence.

## Stop Conditions

Stop immediately, close the desktop session, and record only a sanitized failure
category if any of these occur:

- microphone capture starts without user PTT action or cannot stop cleanly;
- ASR fails in a way that would require exposing credentials, raw provider
  payloads, or raw transcript evidence;
- the router provider is not `intent-router.deterministic.fixture`;
- any app launches before both UI confirmation and native confirmation;
- any target other than Notepad or Calculator launches;
- `open vscode` shows a confirmation prompt or launches VS Code;
- browser, URL, shell, PowerShell, cmd, terminal, scripts, filesystem,
  clipboard, network behavior beyond the existing ASR path, Qwen/model runtime,
  provider planner, or Memory vector retrieval appears;
- telemetry, installer/update, packaging, or release behavior changes.

## Accepted Evidence Shape

Record only:

- window status: `accepted`, `blocked`, or `degraded`;
- preflight pass/fail summary;
- temporary Memory DB created/removed classification;
- microphone capture started/stopped classification;
- ASR final transcript appeared classification, without raw transcript text;
- voice BrainCommand source observed classification;
- router provider classification;
- Notepad confirmation and visible launch classification;
- Calculator confirmation and visible launch classification;
- VS Code blocked classification;
- false flags for credential exposure, raw transcript/audio/provider evidence,
  browser/URL launch, shell, PowerShell, arbitrary app, Qwen/model runtime,
  provider planner, Memory vector retrieval, telemetry, packaging, and release
  changes.

This window is consumed after one session. Any rerun, command expansion, app
allowlist expansion, real Qwen router activation, provider planner use, or TTS
playback requires a new exact-scope approval.
