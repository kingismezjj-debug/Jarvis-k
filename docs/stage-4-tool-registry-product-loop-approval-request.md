# Stage 4 Tool Registry Product Loop Approval Request

Recorded: 2026-08-07

## Status

`APPROVED_IMPLEMENTED_FIXTURE_REPLAY_EVIDENCE`

This request opens only the developer-alpha fixture/replay product loop. It
does not authorize real tool execution, cloud/model runtime, Memory writes,
network, filesystem, process, installer, update, default, telemetry, or
release behavior.

## Exact Approval Text

```text
Product: APPROVE exactly this Stage 4 Tool Registry Product Loop developer-alpha fixture/replay implementation scope with the existing BrainCommand spine, bounded tool descriptors, route/safety/result UI event projection, and no new direct action behavior

Security: APPROVE exactly this bounded, fail-closed Stage 4 fixture/replay Tool Registry Product Loop scope with in-memory sanitized descriptors/events only, no credential/model/runtime/network/filesystem/process/Memory-write access, and no planner or UI path bypassing existing safety gates

Release: APPROVE implementation and fixture/replay UI evidence only; no default behavior, real tool execution, new provider runtime, persistent telemetry, installer/update, packaging, or release changes
```

## Allowed Scope

- bounded descriptors for the existing eight tool ids;
- in-memory registry and schemas;
- sanitized Core Host event projection;
- developer-alpha UI/IPC display and replay path;
- route, safety, confirmation, fallback, degraded, error, retry, and rollback
  display states;
- focused tests and fixture evidence only.

## Explicit Exclusions

- no browser or local-app process launch;
- no shell, PowerShell, filesystem, network, Memory write, cloud provider,
  Qwen runtime, planner API, voice runtime, OCR, or TTS runtime;
- no default behavior change;
- no persistent telemetry or session storage;
- no installer, updater, packaging, or release behavior.

## Recorded Approval

The exact Product, Security, and Release approvals above were recorded in chat
on 2026-08-07 before implementation.

## Implementation Evidence

Implemented under the approved fixture/replay boundary:

- `BrainCommandResultSchema` now has an optional `toolProductLoop` projection;
- the projection contains only bounded descriptors, selected tool id, safety
  decision, fixture replay status, lifecycle steps, retry/rollback state, and
  evidence flags;
- the registry is fixed to the existing BrainCommand spine tool ids:
  `browser.open`, `localApp.open`, `chat.answer`, `memory.search`,
  `memory.status`, `model.status`, `observability.status`, and
  `system.settings`;
- `localApp.open` is supported as an existing camelCase Brain tool id while
  still rejecting unsafe leading identifier shapes;
- CoreRuntime produces the projection with in-memory fixture dry-run replay and
  existing policy gates;
- the UI renders route, selected tool, safety, fixture result, confirmation,
  rollback, lifecycle, and evidence flags in the Brain Dispatch panel.

No new action execution, IPC command, provider runtime, network path,
filesystem/process path, Memory write, credential access, persistence,
telemetry, installer, updater, packaging, or release behavior was added.

## Verification

Focused verification:

```powershell
npm.cmd run build:contracts
npm.cmd run build:capabilities
npm.cmd run build:core
npm.cmd run build:core-host
npm.cmd run build:ui
npm.cmd run build:desktop
npx.cmd vitest run packages/contracts/test/tool-protocol.test.ts packages/contracts/test/protocol.test.ts packages/core/test/runtime.test.ts apps/ui/test/app-voice-ui-source.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
git diff --check
npm.cmd run smoke:desktop:ui-interaction
```

Results:

- contracts, capabilities, core, core-host, UI, and desktop builds passed;
- focused Vitest window passed: 112 tests;
- dependency boundary guard passed;
- sensitive artifact guard passed;
- `git diff --check` passed.
- desktop UI interaction smoke passed and verified `browser.open`,
  `CONFIRMATION_REQUIRED` safety, and `CONFIRMATION_REQUIRED` fixture result
  in the Tool Product Loop panel.

## GLM Diagnostic Status

The third GLM diagnostic window remains pending and was not run as part of
Stage 4. No credential configuration or provider/API call was performed.
