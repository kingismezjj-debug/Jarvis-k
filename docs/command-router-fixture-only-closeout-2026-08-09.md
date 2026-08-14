# Command Router Fixture-Only Closeout

Recorded: 2026-08-09

## Status

`ACCEPTED_FIXTURE_ONLY_TEXT_PATH`

The Command Router fixture-only product loop is accepted for the current text
path. Voice command acceptance remains out of scope for this closeout.

## Completed Product Surface

The accepted surface now includes:

- default-off Command Router product mode in Settings;
- deterministic fixture router provider:
  `intent-router.deterministic.fixture`;
- safe Brain Dispatch projection for router provider, route status, confidence,
  and direct action state;
- allowlisted local-app dry-run path for:
  - `notepad`
  - `calculator`
  - `calc`
- browser intent projection without browser execution;
- non-allowlisted local-app fail-closed behavior;
- Tool Product Loop safety/result/lifecycle visibility;
- optional local result playback after completed safe results;
- local playback priority over cloud audio when `Local result playback` is
  explicitly enabled.

## Accepted Manual Evidence

Manual acceptance evidence:

```text
docs/command-router-fixture-manual-acceptance-evidence-2026-08-09.md
```

Accepted manual text commands:

- `open notepad`
- `open GitHub`
- `open vscode`

Manual result:

- fixture-only text path accepted;
- local result playback manually confirmed audible;
- voice command path not tested in this evidence.

## Automated Evidence

Command Router fixture suite:

```powershell
node tests/desktop-command-router-fixture-suite.mjs
```

Latest recorded result:

```text
PASS, 3 smoke paths, duration 6318 ms
```

Covered paths:

- `open notepad`:
  `localApp.open`, `FIXTURE_DRY_RUN`, no new Notepad process ID
- `open GitHub`:
  `browser.open`, `CONFIRMATION_REQUIRED`, no new common browser process ID
- `open vscode`:
  `localApp.open`, blocked, selected tool `none`, no new VS Code process ID

TTS playback fix evidence:

```text
docs/tts-local-playback-priority-fix-evidence-2026-08-09.md
```

## Current Safety Boundary

The accepted state still does not enable:

- real local-app launch;
- browser launch or URL opening;
- shell, PowerShell, command prompt, filesystem, clipboard, or process tools;
- Qwen runtime execution;
- provider-backed planning;
- model-driven tool invocation;
- Memory write/schema migration/vector retrieval;
- microphone or ASR acceptance;
- default-on TTS or automatic playback;
- credential exposure, raw provider responses, raw audio bytes, or raw
  diagnostic payload persistence.

## Primary Implementation And Evidence Files

- `packages/contracts/src/protocol.ts`
- `packages/core/src/runtime.ts`
- `apps/core-host/src/index.ts`
- `apps/desktop/src/main.ts`
- `apps/desktop/src/preload.ts`
- `apps/desktop/src/supervisor.ts`
- `apps/ui/src/hooks/use-jarvis.ts`
- `apps/ui/src/App.tsx`
- `tests/desktop-command-router-fixture-suite.mjs`
- `tests/desktop-command-router-local-app-fixture-smoke.mjs`
- `tests/desktop-command-router-browser-fixture-smoke.mjs`
- `tests/desktop-command-router-local-app-blocked-smoke.mjs`
- `tests/desktop-tts-playback-smoke.mjs`
- `tests/tts-provider-status-diagnostic.cjs`
- `tests/tts-provider-synthesis-diagnostic.cjs`

## Decision

The fixture-only Command Router text path is complete enough to stop adding
fixture-only safety/display work in this loop.

The next product step should be an approval request only. Do not implement real
local-app execution until Product, Security, and Release approval is explicitly
recorded.
