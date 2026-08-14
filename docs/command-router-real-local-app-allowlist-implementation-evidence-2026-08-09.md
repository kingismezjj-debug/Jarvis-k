# Command Router Real Local App Allowlist Implementation Evidence

Recorded: 2026-08-09

## Status

`IMPLEMENTED_AND_MANUALLY_ACCEPTED`

Product, Security, and Release approvals were recorded in:

```text
docs/command-router-real-local-app-allowlist-approval-request-2026-08-09.md
```

## Implemented Scope

Implemented the approved developer-alpha real local-app allowlist path:

```text
open notepad / open calculator
  -> fixture-only Command Router route
  -> dry-run result remains first
  -> explicit UI confirmation button appears
  -> native confirmation dialog
  -> Core revalidates product mode and exact allowlist
  -> action adapter launches only Notepad or Calculator
  -> sanitized launch result returned to UI
```

The original command submission still does not launch a process. Real launch is
only reachable through the separate confirmation command:

```text
agent.confirmCommandRouterLocalAppLaunch
```

## Safety Gates

The implementation includes:

- Command Router product mode must be enabled;
- deterministic fixture routing remains the product-mode route source;
- only normalized `notepad`, `calculator`, and `calc` are accepted;
- `calc` is normalized to `calculator`;
- unknown targets return sanitized `blocked`;
- the UI confirmation button appears only after an allowlisted fixture dry-run;
- clicking the button opens a native confirmation dialog;
- cancelled confirmation does not call Core launch;
- Core revalidates allowlist even after UI confirmation;
- launch result evidence is sanitized;
- no command-line arguments are passed from user/model text;
- the adapter launches with `shell: false`;
- no browser, URL, shell, PowerShell, filesystem, clipboard, network, Qwen, or
  provider-planner behavior was added.

## Primary Files

- `packages/contracts/src/protocol.ts`
- `packages/core/src/runtime.ts`
- `apps/ui/src/hooks/use-jarvis.ts`
- `apps/ui/src/App.tsx`
- `tests/desktop-command-router-local-app-fixture-smoke.mjs`

## Tests And Builds

Focused tests:

```powershell
npx.cmd vitest run packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/ui/test/app-voice-ui-source.test.ts
```

Result:

```text
PASS, 4 files, 136 tests
```

Builds:

```powershell
npm.cmd run build:contracts
npm.cmd run build:core
npm.cmd run build:ui
npm.cmd run build:core-host
npm.cmd run build:desktop
```

Result:

```text
PASS
```

Fixture suite recheck:

```powershell
node tests/desktop-command-router-fixture-suite.mjs
```

Result:

```text
PASS, 3 smoke paths, duration 6678 ms
```

The allowlisted fixture smoke now also verifies the real-launch confirmation
button appears for `open notepad`, while still confirming no new Notepad process
appears during the dry-run smoke.

## UI Prompt Visibility Follow-Up

After live use, the confirmation affordance was not obvious enough from the
conversation view. The UI was adjusted so the same explicit confirmation control
is rendered as a bottom prompt directly above the command input whenever the
latest deterministic fixture result is an allowlisted `localApp.open` route.

The visibility condition remains bounded:

- Command Router product mode must be enabled;
- the latest result must be `localApp.open`;
- dispatch must be `completed`;
- the selected tool must be `localApp.open`;
- safety must be `ALLOWED` or the fixture execution result must be
  `FIXTURE_DRY_RUN`;
- the normalized target must be exactly `notepad`, `calculator`, or `calc`.

The prompt still does not launch automatically. The user must click
`Confirm launch notepad` or `Confirm launch calculator`, then accept the native
confirmation dialog before Core receives the real-launch confirmation command.

Follow-up validation:

```powershell
npx.cmd vitest run apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/use-jarvis-inference-source.test.ts packages/core/test/runtime.test.ts
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-local-app-fixture-smoke.mjs
```

Result:

```text
PASS, 3 focused test files, 103 tests
PASS, UI build
PASS, desktop build
PASS, local app fixture smoke; confirm prompt visible; newNotepadProcessIds []
```

Smoke screenshot:

```text
artifacts/jarvis-k-command-router-local-app-fixture-smoke.png
```

Jarvis-K was restarted after the UI prompt visibility fix. New main Electron
process:

```text
47568
```

## Visible Window Launch Follow-Up

Live confirmation showed that Notepad processes were launched by Jarvis-K
core-host, but the user did not see a Notepad window. Process inspection showed
multiple `notepad.exe` children with the Jarvis-K core-host as parent, which
meant the launch path was reached but the interactive window was hidden.

Root cause:

```text
apps/core-host/src/brain-action-allowlist-adapter.ts
defaultLaunch(..., windowsHide: true)
```

Fix:

- keep `detached: true`;
- keep `shell: false`;
- keep `stdio: "ignore"`;
- keep empty launch args for local apps;
- pass `windowsHide: false` for approved interactive app launches;
- add unit coverage that Notepad launches request `windowsHide: false`.

Follow-up validation:

```powershell
npx.cmd vitest run apps/core-host/test/brain-action-allowlist-adapter.test.ts packages/core/test/runtime.test.ts
npm.cmd run build:core-host
```

Result:

```text
PASS, 2 focused test files, 75 tests
PASS, core-host build
```

Jarvis-K was restarted after the visible-window launch fix. New processes:

```text
main Electron PID: 50920
core-host PID: 22812
```

## Calculator And VSCode Routing Follow-Up

Live use showed `open calculator` and `open vscode` being surfaced as
`browser.open` with `TARGET_NOT_ALLOWLISTED`. This was a routing-layer issue,
not an action-launch issue.

Findings:

- `calculator` and `calc` were missing from the deterministic local-app keyword
  recognition path;
- the running core-host had been rebuilt, but `packages/core/dist/runtime.js`
  was still an older build, so live runtime behavior could lag behind source
  changes.

Fix:

- add ASCII local-app keyword recognition for `calculator` and `calc`;
- keep `vscode` recognized as `localApp.open`;
- keep real-launch allowlist limited to Notepad and Calculator;
- keep `open vscode` blocked as a local-app fixture target, with no confirmation
  button and no process launch;
- add a runtime test for `open calculator`;
- add a desktop smoke for `open calculator`;
- include the calculator smoke in the Command Router fixture suite.

Follow-up validation:

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

Jarvis-K was restarted after the routing fix. New processes:

```text
main Electron PID: 19368
core-host PID: 18392
```

## Manual Acceptance

Manual real-launch acceptance was completed by the user after the implementation
and routing follow-up fixes.

Manual acceptance tracking document:

```text
docs/command-router-real-local-app-allowlist-manual-acceptance-2026-08-09.md
```

Accepted manual path:

- Command Router product mode enabled;
- `open notepad` produced the confirmation prompt;
- user clicked `Confirm launch notepad`;
- user accepted the native confirmation dialog;
- visible Notepad launch matched expectation;
- `open calculator` produced the confirmation prompt;
- user clicked `Confirm launch calculator`;
- user accepted the native confirmation dialog;
- visible Calculator launch matched expectation;
- `open vscode` remained blocked with no VS Code launch.

User-reported decision:

```text
结果符合预期 手工验收完美
```

## Safety Boundary Still In Force

This implementation does not enable:

- browser launch or URL opening;
- VS Code or arbitrary local app launch;
- shell, PowerShell, cmd, Terminal, WSL, scripts, batch files, or shortcuts;
- file open/save dialogs;
- filesystem reads/writes;
- clipboard access;
- process management beyond the approved launch path;
- network access;
- Qwen runtime execution;
- provider-backed planning or model-driven tool invocation;
- Memory write/schema migration/vector retrieval;
- microphone/ASR acceptance;
- default-on TTS or automatic playback;
- credential access or raw diagnostic persistence.
