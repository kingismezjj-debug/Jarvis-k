# Phase 4 Windows Executor Alpha L4 Evidence

Recorded: 2026-08-11

## Scope

This evidence records the architecture-reviewed Phase 4 Windows Executor Alpha
manual acceptance result. This is the current product-roadmap Phase 4, separate
from the older model-governance Phase 4 history.

The accepted path is:

```text
official React UI
-> deterministic rules router
-> Task Runtime
-> SQLite TaskRepository injected by Core Host
-> Desktop Host Windows execution
-> real result verification
-> UI task timeline/status projection
```

## Completion Level

Level: L4 User-Facing Integration.

Reason: the user manually accepted the official UI path on Windows after six
fixed real Windows commands passed through Task Runtime and Desktop Host with
visible status/results.

Not L5: installer/update, packaging, release-channel exposure, compatibility
matrix, and broader release hardening are not in scope.

## Manual Acceptance

Result: PASS.

User-reported Windows manual acceptance: six fixed commands passed.

Accepted commands:

```text
1. open notepad
2. write Jarvis-K smoke text in notepad
3. minimize notepad
4. restore notepad
5. focus notepad
6. open calculator
```

Manual acceptance note:

```text
Notepad write now reuses the existing Notepad window opened by the prior step.
It does not open a second Notepad window for the write step.
```

## Fixture Boundary

Formal product route source: `intent-router.deterministic.rules`.

Fixture status:

```text
fixtureProductPathUsed: false
deterministic fixture did not enter the formal product execution path
fixture remains test-only
```

## Automated Evidence

Latest focused smoke evidence:

```text
npm run smoke:desktop:task-runtime-notepad-write
PASS
newProcessCount: 0
existingNotepadReused: true
notepadWriteVerified: true
rawWriteTextPersistedInTask: false
fixtureProductPathUsed: false
taskPersistedAfterRestart: true
```

Latest fixed-suite smoke evidence:

```text
npm run smoke:desktop:windows-executor-five-task-suite
PASS
fixedTaskCount: 6
consecutivePass: true
routeSource: intent-router.deterministic.rules
fixtureProductPathUsed: false
taskPersistedAfterRestart: true
notepadWriteReusedExistingProcess: true
notepadProcessObserved: true
calculatorProcessObserved: true
rawWriteTextPersistedInTask: false
```

Evidence artifact files:

```text
artifacts/jarvis-k-task-runtime-notepad-write-smoke-metrics.json
artifacts/jarvis-k-windows-executor-five-task-suite-smoke-metrics.json
```

## Boundaries Preserved

```text
Desktop Host owns real Windows execution.
Core uses injected provider-neutral TaskRepository.
SQLite TaskRepository is composed by Core Host.
UI accesses task state through Contracts/IPC.
No arbitrary executable path or shell route was added.
No allowlist expansion beyond the accepted fixed targets for this slice.
Low-risk explicit known-app operations show execution status rather than
requiring double confirmation.
```
