# Chat Answer Text-Only Memory-Disabled Startup Gate Evidence

Recorded: 2026-08-08

## Scope

Implemented under the approved fixture-only Memory-disabled startup gate.
The gate is active only when both `JARVIS_K_ENABLE_FIXTURE_CHAT_ANSWER=1`
and `JARVIS_K_ENABLE_CHAT_ANSWER_TEXT_ONLY_ACCEPTANCE=1` are set.

## Evidence

- The Memory database path resolver is skipped while the text-only gate is
  active.
- `SqliteMemoryRepository` is not constructed while the text-only gate is
  active.
- Memory Alpha implementation, vector retrieval port, routing options, and
  session are omitted while the gate is active.
- `runtime.hydrateMemory()` is called only when the Memory implementation
  exists.
- Normal default behavior is preserved when either explicit gate is missing.

## Exclusions Preserved

No credential, secure-store, network, provider runtime, model runtime,
Memory/vector retrieval, tool execution, UI/IPC, telemetry, installer,
packaging, or release behavior was added.

## Verification

- Core Host build passed.
- Desktop build passed.
- 2 focused Core Host test files passed.
- 5 focused Core Host tests passed.
- Combined text-only fixture suite passed with 6 test files and 98 tests.
- Dependency boundary check passed.
- Sensitive artifact guard passed.
- `git diff --check` passed.
