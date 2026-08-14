# Command Router Real Local App Allowlist Manual Acceptance

Recorded: 2026-08-09

## Status

`ACCEPTED`

This document records the accepted manual checkpoint for the approved
developer-alpha real local-app allowlist path. Automated tests prove routing,
confirmation prompt visibility, and fail-closed fixture behavior. The user
confirmed the real Notepad and Calculator launch paths after clicking the UI
confirmation control and native confirmation dialog.

## Scope

Allowed real launches:

- Notepad from `open notepad`;
- Calculator from `open calculator` or `open calc`.

Blocked examples:

- `open vscode`;
- browser or URL opening;
- shell, PowerShell, cmd, terminal, scripts, arbitrary executable paths, and
  command-line arguments.

## Current Build

Latest restarted Jarvis-K processes after the routing fix:

```text
main Electron PID: 19368
core-host PID: 18392
```

Latest relevant build artifacts:

```text
packages/core/dist/runtime.js: rebuilt after calculator/calc route fix
apps/core-host/dist/index.js: rebuilt after visible-window launch fix
```

## Automated Readiness Evidence

Commands run:

```powershell
npx.cmd vitest run packages/core/test/runtime.test.ts apps/core-host/test/brain-action-allowlist-adapter.test.ts
npm.cmd run build:core
npm.cmd run build:core-host
node tests/desktop-command-router-calculator-fixture-smoke.mjs
node tests/desktop-command-router-local-app-blocked-smoke.mjs
node tests/desktop-command-router-fixture-suite.mjs
```

Result:

```text
PASS, 2 focused test files, 76 tests
PASS, core build
PASS, core-host build
PASS, calculator fixture smoke; confirm prompt visible; newCalculatorProcessIds []
PASS, vscode blocked fixture smoke; newCodeProcessIds []
PASS, fixture suite; 4 smoke paths; duration 8193 ms
```

Artifacts:

```text
artifacts/jarvis-k-command-router-local-app-fixture-smoke.png
artifacts/jarvis-k-command-router-calculator-fixture-smoke.png
artifacts/jarvis-k-command-router-browser-fixture-smoke.png
artifacts/jarvis-k-command-router-local-app-blocked-smoke.png
```

## Manual Acceptance Steps

1. Confirm Command Router product mode is enabled in Settings.
2. In Conversation, submit `open notepad`.
3. Confirm the bottom prompt says `Confirm launch notepad`.
4. Click `Confirm launch notepad`.
5. Accept the native confirmation dialog.
6. Verify a visible Notepad window opens.
7. Verify the UI launch result says:

```text
Real launch: completed / notepad / ALLOWLISTED_TARGET_OPENED
```

8. Submit `open calculator`.
9. Confirm the bottom prompt says `Confirm launch calculator`.
10. Click `Confirm launch calculator`.
11. Accept the native confirmation dialog.
12. Verify a visible Calculator window opens.
13. Verify the UI launch result says:

```text
Real launch: completed / calculator / ALLOWLISTED_TARGET_OPENED
```

14. Submit `open vscode`.
15. Verify it is routed as `localApp.open` but blocked by fixture allowlist.
16. Verify there is no `Confirm launch vscode` prompt and no VS Code launch.

## User Observation

User-reported result:

```text
Notepad visible window opened: yes
Calculator visible window opened: yes
VSCode remained blocked: yes
UI launch result text: matched expected completed allowlist launch path
Unexpected windows/processes: none reported
Decision: accepted
```

User summary:

```text
结果符合预期 手工验收完美
```

## Stop Conditions

Stop and record evidence if any of these occur:

- any app launches before the confirmation button and native dialog are both
  accepted;
- any target other than Notepad or Calculator launches;
- `open vscode` shows a confirm prompt;
- the route provider is not `intent-router.deterministic.fixture`;
- direct action is attempted during the initial fixture dry-run;
- shell, PowerShell, browser, URL, filesystem, network, provider/model runtime,
  Memory vector retrieval, or credential access appears in the result path.
