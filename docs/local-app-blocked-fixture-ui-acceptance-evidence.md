# Local App Blocked Fixture UI Acceptance Evidence

Recorded: 2026-08-09

## Scope

Validated the fail-closed UI path for a non-allowlisted local app target in
Command Router product mode:

```text
localApp.open intent for non-allowlisted target
  -> deterministic fixture router
  -> fixture allowlist block
  -> no selected tool
  -> no tool execution
  -> no Windows process launch
```

## Acceptance Path

```powershell
node tests/desktop-command-router-local-app-blocked-smoke.mjs
```

The smoke test starts Electron with a temporary user-data directory, enables
Command Router product mode through Settings, submits `open vscode`, and
asserts:

- `brainIntent: localApp.open`
- `selectedProvider: intent-router.deterministic.fixture`
- `directAction: disabled`
- `toolLoopSelectedTool: none`
- `toolLoopSafety: blocked`
- `toolLoopResult: not_run`
- no new `Code` process IDs appeared

## Artifacts

- screenshot:
  `artifacts/jarvis-k-command-router-local-app-blocked-smoke.png`
- metrics:
  `artifacts/jarvis-k-command-router-local-app-blocked-smoke-metrics.json`

## Safety Boundaries

This acceptance did not enable VS Code launch, arbitrary app launch, shell,
PowerShell execution, browser execution, network access, Qwen runtime execution,
provider calls, or model-driven tool execution.

## Next Step

Recommended next product step remains fixture-only unless explicitly approved:

```text
Command Router Text/Voice Manual Acceptance Checklist
  -> run the three UI smoke paths manually once in the packaged desktop window
  -> confirm status copy, safety projection, and TTS eligibility
  -> record one human-observed acceptance note
```

The checklist is now recorded in:

```text
docs/command-router-text-voice-manual-acceptance-checklist.md
```
