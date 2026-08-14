# Browser Open Fixture Projection UI Acceptance Evidence

Recorded: 2026-08-09

## Scope

Validated the browser side of Command Router product mode without enabling any
real browser launch:

```text
browser.open intent
  -> deterministic fixture router
  -> visible safety projection
  -> confirmation-required tool loop
  -> no browser process launch
```

## Acceptance Path

```powershell
node tests/desktop-command-router-browser-fixture-smoke.mjs
```

The smoke test starts Electron with a temporary user-data directory, enables
Command Router product mode through the Settings UI, submits `open GitHub`, and
asserts:

- `brainIntent: browser.open`
- `selectedProvider: intent-router.deterministic.fixture`
- `directAction: disabled`
- `toolLoopSelectedTool: browser.open`
- `toolLoopSafety: CONFIRMATION_REQUIRED`
- `toolLoopResult: CONFIRMATION_REQUIRED`
- no new `msedge`, `chrome`, `firefox`, or `brave` process IDs appeared

## Artifacts

- screenshot:
  `artifacts/jarvis-k-command-router-browser-fixture-smoke.png`
- metrics:
  `artifacts/jarvis-k-command-router-browser-fixture-smoke-metrics.json`

## Safety Boundaries

This acceptance did not enable real browser execution, URL opening, network
access, Qwen runtime execution, provider calls, or model-driven tool execution.

## Follow-Up

The non-allowlisted local app fail-closed path is now covered by:

```powershell
node tests/desktop-command-router-local-app-blocked-smoke.mjs
```

See `docs/local-app-blocked-fixture-ui-acceptance-evidence.md`.
