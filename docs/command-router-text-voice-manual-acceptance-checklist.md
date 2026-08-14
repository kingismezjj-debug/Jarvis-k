# Command Router Text/Voice Manual Acceptance Checklist

Recorded: 2026-08-09

## Purpose

This checklist is for the fixture-only Command Router product loop. It does not
approve real Qwen routing, provider calls, browser launch, local app launch,
shell execution, network access, or model-driven tool execution.

## Automated Preflight

Run the suite once before manual acceptance:

```powershell
npm.cmd run smoke:desktop:command-router-fixture-suite
```

Equivalent no-build command when the desktop build is already current:

```powershell
node tests/desktop-command-router-fixture-suite.mjs
```

Current local suite result:

```text
PASS, 4 smoke paths, duration 8193 ms
```

Expected automated coverage:

- `open notepad`:
  `localApp.open`, `FIXTURE_DRY_RUN`, confirm prompt visible, no new Notepad
  process before confirmation
- `open calculator`:
  `localApp.open`, `FIXTURE_DRY_RUN`, confirm prompt visible, no new
  Calculator process before confirmation
- `open GitHub`:
  `browser.open`, `CONFIRMATION_REQUIRED`, no new browser process
- `open vscode`:
  `localApp.open`, blocked, selected tool `none`, no new VS Code process

## Manual UI Path

1. Start Jarvis-K desktop from the current build.
2. Open Settings.
3. Confirm Command Router product mode is default off.
4. Enable Command Router product mode.
5. Confirm the Settings panel still says fixture-only deterministic routing,
   Qwen status-only with no runtime/helper/artifact/cache/provider call, no
   browser execution, and approved local app launches limited to
   Notepad/Calculator after confirmation.
6. Return to Conversation.
7. Submit `open notepad`.
8. Confirm Brain Dispatch shows:
   - intent `localApp.open`
   - router `intent-router.deterministic.fixture`
   - direct action `disabled`
   - result `FIXTURE_DRY_RUN`
   - a visible Confirm Launch control for Notepad
9. Click the UI Confirm Launch control, then accept the native confirmation.
10. Confirm the sanitized launch result is completed for Notepad.
11. Submit `open GitHub`.
12. Confirm Brain Dispatch shows:
    - intent `browser.open`
    - router `intent-router.deterministic.fixture`
    - direct action `disabled`
    - safety/result `CONFIRMATION_REQUIRED`
13. Submit `open vscode`.
14. Confirm Brain Dispatch shows:
    - intent `localApp.open`
    - selected tool `none`
    - safety `blocked`
    - result `not_run`
    - fixture allowlist blocked the target

## Voice Path

Only run this if microphone capture is already available in the window. Keep the
same fixture-only safety expectations as text input.

1. With Command Router product mode enabled, press push-to-talk.
2. Speak a Notepad open request.
3. Confirm the routed result matches the `open notepad` text path.
4. Speak a GitHub open request.
5. Confirm the routed result matches the `open GitHub` text path.
6. Speak a VS Code open request.
7. Confirm the routed result matches the `open vscode` text path.

## Failure Conditions

Stop and record evidence if any of these occur:

- a browser, VS Code, terminal, shell, or PowerShell window opens;
- Notepad or Calculator opens without both UI confirmation and native
  confirmation;
- the router provider is anything other than
  `intent-router.deterministic.fixture`;
- direct action is shown as attempted;
- Qwen runtime or provider-backed execution is shown as enabled;
- non-allowlisted local apps select a tool or run a fixture result;
- UI copy suggests arbitrary app or browser execution was enabled.

## Evidence Note Template

```text
Date:
Build/source:
Automated suite:
Manual text path:
Manual voice path:
Observed process launches:
Screenshots/artifacts:
Decision:
```

## Current Automated Evidence

- `docs/local-app-open-fixture-loop-implementation-evidence.md`
- `docs/browser-open-fixture-projection-ui-acceptance-evidence.md`
- `docs/local-app-blocked-fixture-ui-acceptance-evidence.md`
