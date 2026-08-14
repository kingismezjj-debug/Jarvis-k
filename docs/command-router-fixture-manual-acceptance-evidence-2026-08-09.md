# Command Router Fixture Manual Acceptance Evidence

Recorded: 2026-08-09

## Scope

This evidence closes the current fixture-only Command Router product loop:

```text
Settings product switch
  -> deterministic fixture router
  -> safe UI projection
  -> allowlisted local-app dry run
  -> browser projection without execution
  -> non-allowlisted local-app fail closed
  -> optional local result playback
```

This evidence does not approve real Qwen routing, provider-driven tool
execution, browser launch, local app launch, shell execution, filesystem access,
network actions, or arbitrary process actions.

## Manual Acceptance

The user manually exercised the desktop UI after the Command Router product mode
and TTS local-playback fixes.

Observed text commands:

- `open notepad`
- `open GitHub`
- `open vscode`

Observed outcomes:

- `open notepad` completed through the fixture-only local-app allowlist path.
- The UI stated that no Windows process was launched.
- `open GitHub` was identified as `browser.open`.
- Browser direct execution remained disabled in fixture-only mode.
- `open vscode` was identified as `localApp.open`.
- The fixture allowlist blocked `vscode`.
- No real browser or local-app execution was accepted by the UI path.
- With `Local result playback` enabled, the user confirmed audible playback.

Manual TTS result:

```text
audible
```

Manual voice-command acceptance:

```text
not_tested_in_this_evidence
```

## Screenshot Evidence

The conversation includes a user-provided screenshot showing:

- Jarvis-K `ONLINE`;
- the `open notepad`, `open GitHub`, and `open vscode` text commands;
- fixture-only Command Router responses;
- `open notepad` dry-run copy stating no Windows process was launched;
- `open GitHub` direct execution disabled;
- `open vscode` allowlist block;
- local playback confirmed by the user's message immediately after the
  screenshot.

Local screenshot source path from the user attachment:

```text
C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-fc8ef344-f6b4-434a-b902-6fd904dea79f.png
```

## Automated Coverage

The automated fixture suite covers the same three command categories:

```powershell
node tests/desktop-command-router-fixture-suite.mjs
```

Expected coverage:

- `open notepad`:
  `localApp.open`, `FIXTURE_DRY_RUN`, no new Notepad process ID
- `open GitHub`:
  `browser.open`, `CONFIRMATION_REQUIRED`, no new common browser process ID
- `open vscode`:
  `localApp.open`, blocked, selected tool `none`, no new VS Code process ID

Current automated recheck:

```text
PASS, 3 smoke paths, duration 6318 ms
```

Artifacts refreshed by the recheck:

- `artifacts/jarvis-k-command-router-local-app-fixture-smoke.png`
- `artifacts/jarvis-k-command-router-local-app-fixture-smoke-metrics.json`
- `artifacts/jarvis-k-command-router-browser-fixture-smoke.png`
- `artifacts/jarvis-k-command-router-browser-fixture-smoke-metrics.json`
- `artifacts/jarvis-k-command-router-local-app-blocked-smoke.png`
- `artifacts/jarvis-k-command-router-local-app-blocked-smoke-metrics.json`

## TTS Coverage

TTS fix evidence is recorded separately:

```text
docs/tts-local-playback-priority-fix-evidence-2026-08-09.md
```

Relevant result:

- Doubao provider status was readable without exposing credentials.
- Doubao synthesis returned playable audio bytes in the sanitized diagnostic.
- The UI playback smoke reached `played`.
- Manual acceptance confirmed audible output after enabling
  `Local result playback`.

## Safety Boundaries

This acceptance did not enable:

- real Notepad or Calculator launch;
- browser launch or URL opening;
- VS Code launch or arbitrary app launch;
- shell, PowerShell, command prompt, filesystem, clipboard, or process tools;
- Qwen runtime execution;
- provider-backed planning;
- model-driven tool invocation;
- Memory write/schema migration/vector retrieval;
- microphone or ASR acceptance;
- default-on TTS or automatic playback;
- credential exposure, raw provider responses, raw audio bytes, or raw
  diagnostic payload persistence.

## Decision

Command Router fixture-only text acceptance is accepted for the current product
loop.

Next product step requires fresh exact-scope approval before enabling any real
local-app execution, even for Notepad or Calculator.
