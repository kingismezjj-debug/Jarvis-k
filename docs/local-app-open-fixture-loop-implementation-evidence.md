# Local App Open Fixture Loop Implementation Evidence

Recorded: 2026-08-09

## Scope

Implemented the next fixture-only product step after the Command Router product
mode:

```text
localApp.open intent
  -> deterministic fixture allowlist check
  -> fixture-only dry-run result
  -> UI/TTS-eligible response
  -> no Windows process launch
```

## Implemented

- Command Router product mode now recognizes allowlisted local app targets as a
  fixture dry-run path.
- Current fixture allowlist:
  - `notepad`
  - `calculator`
  - `calc`
- Allowlisted local app requests complete with:
  - `dispatchStatus: completed`;
  - `toolProductLoop.execution.resultCode: FIXTURE_DRY_RUN`;
  - `directActionAttempted: false`;
  - TTS eligibility through the existing Product Alpha local playback gate.
- Non-allowlisted local app targets fail closed before tool selection.
- Browser intents remain projected only; no browser execution was enabled.

## Safety Boundaries

This change did not enable:

- real Windows process launch;
- shell, PowerShell, filesystem, browser, network, clipboard, screen, or process
  tools;
- real Qwen runtime/cache/materialization;
- provider/API calls;
- model-driven tool invocation;
- Memory vector retrieval;
- ASR or cloud TTS provider acceptance.

The action executor is not invoked in Command Router product mode for the
local-app fixture loop. The result is a sanitized dry-run projection only.

## Primary Files

- `packages/core/src/runtime.ts`
- `packages/core/test/runtime.test.ts`
- `apps/ui/src/App.tsx`
- `apps/ui/test/app-voice-ui-source.test.ts`

## Verification

Focused runtime verification:

```powershell
npx.cmd vitest run packages/core/test/runtime.test.ts
npm.cmd run build:core
```

Both passed locally after implementation.

Focused desktop UI acceptance:

```powershell
node tests/desktop-command-router-local-app-fixture-smoke.mjs
```

This passed locally and captured:

- screenshot:
  `artifacts/jarvis-k-command-router-local-app-fixture-smoke.png`
- metrics:
  `artifacts/jarvis-k-command-router-local-app-fixture-smoke-metrics.json`
- `newNotepadProcessIds: []`

The UI acceptance path enables Command Router product mode, submits
`open notepad`, verifies `localApp.open`, verifies
`FIXTURE_DRY_RUN`, verifies the selected router is
`intent-router.deterministic.fixture`, verifies direct action remains disabled,
and checks that no new Notepad process appeared.

## Follow-Up

The browser projection and non-allowlisted local app fail-closed UI paths are
now covered by:

```powershell
node tests/desktop-command-router-browser-fixture-smoke.mjs
node tests/desktop-command-router-local-app-blocked-smoke.mjs
```

A later real Notepad or Calculator allowlist window requires fresh exact-scope
approval.
