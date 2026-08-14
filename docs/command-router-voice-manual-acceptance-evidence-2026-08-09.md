# Command Router Voice Manual Acceptance Evidence

Recorded: 2026-08-09

## Status

`ACCEPTED`

Approval request:

```text
docs/command-router-voice-manual-acceptance-approval-request-2026-08-09.md
```

This evidence file records sanitized results for the bounded one-window Voice
Command Router manual acceptance. Raw spoken text, raw ASR transcript, provider
payloads, audio bytes, and credentials are intentionally not recorded.

## Approved Scope

Product, Security, and Release approval recorded on 2026-08-09 in:

```text
docs/command-router-voice-manual-acceptance-approval-request-2026-08-09.md
```

Expected approved path:

```text
microphone/PTT
  -> ASR final transcript
  -> voice BrainCommand
  -> deterministic Command Router fixture route
  -> fixture dry-run projection
  -> explicit UI confirmation plus native confirmation for Notepad/Calculator
  -> sanitized result
```

## Preflight Result

Passed on 2026-08-09. No microphone, ASR session, desktop manual window, or
real voice flow was started during preflight.

Planned commands:

```powershell
npx.cmd vitest run packages/core/test/runtime.test.ts packages/voice/test/engine.test.ts apps/ui/test/use-jarvis-inference-source.test.ts apps/ui/test/app-voice-ui-source.test.ts apps/ui/test/ptt-capture-coordinator.test.ts
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
node tests/desktop-command-router-fixture-suite.mjs
```

Recorded result:

```text
focused tests: PASS, 5 files, 131 tests
core build: PASS
core-host build: PASS
ui build: PASS
desktop build: PASS
fixture suite: PASS, 4 smoke paths, duration 8657 ms
```

Fixture suite path summary:

```text
open notepad: localApp.open fixture dry-run; confirm prompt visible; newNotepadProcessIds []
open calculator: localApp.open fixture dry-run; confirm prompt visible; newCalculatorProcessIds []
open GitHub: browser.open projection; no new browser process IDs
open vscode: localApp.open blocked; newCodeProcessIds []
```

## Window Metadata

User completed the manual window after preflight.

```text
startedAt: user-operated manual window after preflight
endedAt: user reported completion
desktop main PID: existing developer desktop session
core-host PID: existing developer desktop session
temporary Memory DB path bucket: temporary/local acceptance DB per approved window
temporary Memory DB cleanup: not independently inspected by assistant
Command Router product mode: enabled for manual acceptance
router provider: intent-router.deterministic.fixture
local TTS: not used as acceptance criterion
```

## Manual Observations

Record classifications only. Do not record raw spoken text, raw ASR transcript,
audio bytes, provider payloads, credentials, or screenshots containing secrets.

```text
microphone capture started: yes, user-reported
microphone capture stopped: yes, user-reported
ASR final transcript appeared: yes, user-reported after rerun
voice BrainCommand source observed: yes, user-reported as working
Notepad fixture dry-run observed: yes, user-reported
Notepad confirm prompt observed: yes, user-reported
Notepad native confirmation accepted: yes, user-reported
Notepad visible window opened: yes, user-reported
Calculator fixture dry-run observed: yes, user-reported
Calculator confirm prompt observed: yes, user-reported
Calculator native confirmation accepted: yes, user-reported
Calculator visible window opened: yes, user-reported
VSCode routed as localApp.open: yes, user-reported as working after rerun
VSCode remained blocked: yes, user-reported
Confirm launch vscode absent: yes, user-reported by expected behavior
Unexpected windows/processes: none reported
Decision: accepted
```

Degraded/recovered note:

```text
Initial voice attempt fell back to chat.answer unavailable/deterministic fallback.
No unsafe side effect was reported. User retried and then reported the voice
Command Router path was working.
```

## Safety Flags

Expected values are `false` unless explicitly marked otherwise.

```text
credential exposed: false
raw transcript persisted in evidence: false
raw audio persisted: false
raw provider payload persisted: false
browser or URL launched: false
shell/PowerShell/cmd/terminal invoked: false
arbitrary executable path used: false
command-line arguments used: false
filesystem action beyond temporary Memory DB: false
clipboard access: false
process enumeration beyond bounded launch verification: false
Qwen/model runtime used: false
provider planner used: false
Memory vector retrieval used: false
allowlist expanded: false
telemetry expanded: false
installer/update/packaging/release change: false
```

## Result

`accepted`

Final decision:

```text
decision: accepted
reason: user reported the bounded voice Command Router path is now working
follow-up: close out Voice Command Router manual acceptance and prepare the next product step, Qwen fast router product binding preparation, without enabling Qwen runtime
```

## Cleanup

User did not report cleanup failures.

Required:

- close the isolated desktop session;
- leave user-launched Notepad/Calculator windows alone unless the user asks to
  close them;
- remove the temporary Memory DB;
- record cleanup status only.
