# Stage 5 Product Alpha Manual Acceptance With Temporary Memory Approval Request

Recorded: 2026-08-08

## Status

`APPROVED_IMPLEMENTED_VERIFIED_TEMPORARY_DB`

This is a replacement exact-scope request for the Stage 5 local manual
acceptance window. It exists because normal `agent.runBrainCommand` records
accepted user and assistant messages through the existing local SQLite Memory
repository. The earlier no-Memory-write approval was not started or consumed.
The replacement window was then executed once and accepted using a temporary
local Memory DB.

## Exact Approval Text

```text
Product: APPROVE exactly this replacement one-window Stage 5 Product Alpha local manual acceptance scope using the implemented text BrainCommand path, one newly created temporary file-backed local Memory DB for ordinary conversation records only, bounded read-only Memory context projection, in-memory sanitized session history, blocked/degraded retry through the existing BrainCommand safety path, rollback-view clearing only, and explicitly enabled local result TTS only after a completed safe result; dangerous tools remain default-off and no new direct action behavior is introduced

Security: APPROVE exactly this bounded fail-closed replacement Stage 5 local manual acceptance window with one temporary Memory DB containing only the fixed benign test inputs and corresponding local assistant summaries, at most five BrainCommand calls and ten message records, no vector/provider write or retrieval activation, no schema migration beyond normal fresh DB initialization, no credential or secure-store access, no cloud/model runtime/network path, no browser/local-app/shell/filesystem/process action beyond that temporary DB, sanitized evidence only, verified DB cleanup, local browser speech-synthesis only after explicit opt-in, and immediate stop on any prohibited behavior

Release: APPROVE developer-alpha replacement local manual acceptance evidence only; no default behavior, real cloud provider or tool execution, persistent Memory retention or telemetry, installer/update, packaging, or release-channel changes
```

The three approvals above were recorded before execution. The replacement
window was then run once and consumed.

## Fixed Window

- One developer machine and one desktop session.
- One freshly created temporary Memory DB under the system temporary directory.
- At most five fixed, benign text BrainCommand calls and ten accepted message
  records total:
  1. one benign text status command;
  2. one benign read-only Memory recall/status command;
  3. one confirmation-required command while Brain open actions remain
     disabled;
  4. one retry through the Stage 5 retry control;
  5. one completed safe status result after explicitly enabling local TTS,
     then stop playback or let bounded playback complete.
- No microphone capture, final voice transcript, ASR/provider connection,
  heavy planner, local model, model lifecycle/cache, or provider diagnostic.
- Clear Stage 5 in-memory session history once, stop TTS, close the desktop,
  delete the temporary DB, and verify cleanup.

## Required Preconditions

- The original no-Memory-write Stage 5 manual acceptance window is recorded as
  not started and not consumed.
- Stage 5 builds, focused tests, boundary guard, sensitive-artifact guard,
  and whitespace check are green.
- All heavy-planner, Qwen/local runtime, provider-vector, provider-query, and
  Memory Alpha opt-in flags are unset.
- `JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS=1` is set for the desktop session.
- `JARVIS_K_STAGE5_LOCAL_ACCEPTANCE_NO_SECURE_STORE=1` is set so the desktop
  does not load voice credentials or query secure-store status during this
  text-only window.
- `JARVIS_K_MEMORY_DB_PATH` points to a new DB under the temporary window
  directory; no existing user DB may be used.
- TTS starts disabled. It is enabled only for the final completed safe result.

## Prohibited Actions

Do not:

- use a non-temporary user Memory DB, retain or export the temporary DB, or
  inspect its raw contents;
- exceed five BrainCommand calls or ten message records;
- enable Memory Alpha, vectors, provider retrieval, Memory import/export,
  Memory disable/rollback controls, or a schema migration;
- call or configure any provider, credential, secure-store, network, model,
  runtime helper, browser, local app, shell, process, or filesystem action
  other than the temporary DB lifecycle;
- collect raw command text, assistant summaries, raw Memory content,
  transcript, prompt/response, credential, endpoint, header, stack trace, or
  private path as evidence.

## Stop Conditions

Stop immediately, cancel TTS, close the desktop, remove the temporary DB, and
record only a sanitized failure category if:

- the temporary DB path is not newly created beneath the approved temporary
  directory;
- a sixth BrainCommand call or eleventh message record would be made;
- a provider/vector/retrieval/Memory Alpha/network/model/runtime/action path
  would be reached;
- browser/local-app execution is not blocked by the existing disabled-action
  gate;
- raw content would be retained outside the temporary DB or cleanup cannot be
  verified;
- any TTS starts without explicit opt-in, is not local browser speech
  synthesis, or cannot be stopped;
- default, telemetry, installer/update, packaging, or release behavior would
  change.

The replacement window is consumed after one session. Any rerun or expansion
requires another new exact-scope approval.

## Accepted Evidence

The window completed with:

- status: `accepted`;
- command count: `5`;
- message count: `10`;
- temporary DB created: `true`;
- temporary DB cleanup verified: `true`;
- session history before clear: `5`;
- session history after clear: `0`;
- retry safety path: `preserved`;
- rollback view: `cleared`;
- TTS status: `unavailable`;
- voice capture used: `false`;
- credential exposed: `false`;
- secure-store access disabled: `true`;
- provider runtime used: `false`;
- model runtime used: `false`;
- network accessed: `false`;
- vector retrieval activated: `false`;
- direct action attempted: `false`;
- telemetry changed: `false`;
- default behavior changed: `false`;
- release behavior changed: `false`.

No raw DB path, command text, assistant summary, transcript, or DB contents
were retained in evidence.

## Controlled Procedure After Approval

1. Re-run the existing Stage 5 preflight verification.
2. Create a new temporary directory and set `JARVIS_K_MEMORY_DB_PATH` inside
   it for one desktop session; set `JARVIS_K_DISABLE_BRAIN_OPEN_ACTIONS=1`
   and `JARVIS_K_STAGE5_LOCAL_ACCEPTANCE_NO_SECURE_STORE=1`.
3. Start the desktop with no provider/model/vector flags and execute only the
   five fixed steps.
4. Clear in-memory session history, stop local TTS, close the desktop, remove
   the temporary directory, and verify deletion.
5. Record only the accepted sanitized evidence. Do not rerun under this
   approval.
