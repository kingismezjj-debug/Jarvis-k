# Command Router Real Local App Allowlist Closeout

Recorded: 2026-08-09

## Status

`ACCEPTED_DEVELOPER_ALPHA`

The Command Router real local-app allowlist branch is closed for the approved
developer-alpha scope.

## Accepted Product Surface

Accepted path:

```text
typed command
  -> default-off Command Router product mode
  -> deterministic fixture router
  -> initial fixture dry-run projection
  -> explicit UI confirmation button
  -> native confirmation dialog
  -> Core revalidates product mode and exact allowlist
  -> launch only Notepad or Calculator
  -> sanitized UI result
```

Allowed launch targets:

- `notepad`
- `calculator`
- `calc` as an alias for Calculator

Blocked path verified:

- `open vscode` routes as `localApp.open` but remains blocked by the fixture
  allowlist, with no confirmation prompt and no VS Code launch.

## Manual Acceptance

Manual acceptance document:

```text
docs/command-router-real-local-app-allowlist-manual-acceptance-2026-08-09.md
```

User-reported accepted result:

```text
Result matched expectations; manual acceptance was perfect.
```

Recorded outcome:

- visible Notepad launch after UI confirmation and native confirmation;
- visible Calculator launch after UI confirmation and native confirmation;
- VS Code remained blocked;
- no unexpected windows or processes were reported.

## Automated Evidence

Primary implementation evidence:

```text
docs/command-router-real-local-app-allowlist-implementation-evidence-2026-08-09.md
```

Latest focused validation:

```powershell
npx.cmd vitest run packages/core/test/runtime.test.ts apps/core-host/test/brain-action-allowlist-adapter.test.ts
npm.cmd run build:core
npm.cmd run build:core-host
node tests/desktop-command-router-calculator-fixture-smoke.mjs
node tests/desktop-command-router-local-app-blocked-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Latest recorded result:

```text
PASS, 2 focused test files, 76 tests
PASS, core build
PASS, core-host build
PASS, calculator fixture smoke; confirm prompt visible; newCalculatorProcessIds []
PASS, vscode blocked fixture smoke; newCodeProcessIds []
PASS, fixture suite; 4 smoke paths; duration 8193 ms
```

## Safety Boundary

This closeout does not approve or claim support for:

- arbitrary local app launch;
- VS Code, Paint, WeChat, browser, or URL opening from Command Router product
  mode;
- shell, PowerShell, cmd, Terminal, WSL, scripts, batch files, shortcuts, or
  arbitrary executable paths;
- command-line arguments;
- file open/save dialogs;
- filesystem, clipboard, network, screen, or process management tools;
- Qwen runtime execution;
- provider-backed planning or model-driven tool invocation;
- Memory write/schema migration/vector retrieval;
- microphone/ASR acceptance;
- default-on TTS or automatic playback;
- credential access or raw diagnostic persistence.

## Next Step

The next product step is not allowlist expansion. It is Voice Command Router
manual acceptance preparation:

```text
microphone/PTT
  -> ASR final transcript
  -> existing BrainCommand / Command Router path
  -> deterministic fixture route
  -> same UI safety projection
  -> same Notepad/Calculator confirmation requirement
  -> same VS Code blocked behavior
```

Any voice acceptance window needs its own bounded approval and evidence because
it touches microphone capture, ASR provider state, transcript flow, and optional
TTS.

Prepared approval/evidence window:

```text
docs/command-router-voice-manual-acceptance-approval-request-2026-08-09.md
docs/command-router-voice-manual-acceptance-evidence-2026-08-09.md
```
