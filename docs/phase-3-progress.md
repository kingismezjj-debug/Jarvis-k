# Phase 3 Progress

## 2026-07-30

### Wave 3.1: Durable Message Memory

- Status: in progress.
- Started with repository boundary review from phase 2.6.
- Planned a low-coupling Memory layer before adding broader capability or
  model-routing features.
- Added `@jarvis-k/memory` with provider-neutral repository interfaces and
  snapshot schema.
- Added `@jarvis-k/memory-sqlite` with SQLite schema creation, message
  persistence, deterministic ordering, file-backed restore, and snapshot
  restore.
- Integrated Core with an optional `MemoryRepository` injection for startup
  hydration and accepted-message persistence.
- Composed the SQLite adapter only in `apps/core-host`.
- Extended workspace scripts and dependency boundary checks for the new Memory
  packages.

### Current Gate

- `npm run typecheck`: PASS.
- Targeted Memory/Core tests: PASS.
- `npm test`: PASS, 20 test files and 88 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS with isolated smoke user data and temporary
  memory database.

## 2026-07-31

### Wave 3.2: Conversation Metadata

- Status: complete.
- Added provider-neutral conversation metadata schemas to `@jarvis-k/memory`.
- Extended `MemoryRepository` with conversation upsert/update/list and
  active-conversation selection ports.
- Added SQLite `conversations` and `memory_settings` persistence with
  `PRAGMA user_version` migration.
- Backfilled conversation metadata from legacy message-only databases.
- Updated message append behavior so conversation timestamps are maintained in
  the same transaction as message persistence.
- Kept Core dependent only on `@jarvis-k/memory`; no SQLite import was added
  outside the existing `apps/core-host` composition root.

### Current Gate

- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 93 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.

## 2026-07-31

### Wave 3.3: Recall And Summaries

- Status: complete.
- Added provider-neutral recent-message recall and summary record ports to
  `@jarvis-k/memory`.
- Extended snapshots with summary records while preserving older snapshot
  inputs through defaults.
- Added SQLite `summaries` persistence with schema version 2 migration.
- Added bounded recent-message recall that returns the retained recent window
  in chronological order.
- Kept summary storage provider-neutral; no model, provider, or summarization
  selection logic was added to Core.

### Current Gate

- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 96 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.

## 2026-07-31

### Wave 3.4: Maintenance And Recovery

- Status: complete.
- Added provider-neutral memory health, export snapshot, and import snapshot
  hooks to `@jarvis-k/memory`.
- Added SQLite health checks using `PRAGMA integrity_check`.
- Added corruption/unavailable database handling that reports degraded memory
  health instead of exposing adapter-specific details.
- Added explicit snapshot import recovery for corrupt file-backed SQLite
  databases.
- Updated Core hydration so memory initialization or health-check failures put
  Core into degraded snapshot health instead of forcing the core-host child
  process to exit.
- Updated message write failure handling so Core health becomes degraded when
  memory persistence fails.
- Kept recovery visibility on existing `CoreSnapshot.health` and
  `system.health` status contracts.

### Current Gate

- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 103 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.

## 2026-07-31

### Post Phase 3: Memory Degraded Smoke Coverage

- Status: complete.
- Added `npm run smoke:desktop:memory-degraded`.
- Covered desktop startup with a corrupt SQLite memory file.
- Verified Core stays online with degraded snapshot and memory health instead
  of restarting.
- Verified `agent.ping` reports degraded health and message writes fail with
  structured `MEMORY_WRITE_FAILED` errors while memory remains unavailable.

### Current Gate

- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.

## 2026-07-31

### Post Phase 3: Conversation Smoke Coverage

- Status: complete.
- Extended desktop smoke coverage across the conversation UI and memory-backed
  Core command path.
- Covered active-conversation message sending through the renderer, new
  conversation creation, rename, conversation selection, and active-message
  filtering.
- Added Core restart assertions to prove conversation metadata and filtered
  messages are restored from the temporary SQLite database.
- Added stable test IDs for conversation UI controls.

### Current Gate

- Targeted UI typecheck/build/tests: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.

## 2026-07-31

### Post Phase 3: Conversation UI

- Status: complete.
- Updated the React HUD to consume conversation state from `CoreSnapshot`.
- Removed the renderer's hardcoded `primary` message target; typed messages
  now use the active conversation through Core.
- Added compact conversation tabs plus new, select, and rename controls.
- Added memory health visibility to the runtime activity panel.
- Kept UI commands flowing through `@jarvis-k/contracts` and the existing
  desktop bridge.

### Current Gate

- Targeted UI typecheck/build/tests: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 108 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.

## 2026-07-31

### Post Phase 3: Memory Protocol Surface

- Status: complete.
- Added provider-neutral conversation and memory-health DTOs to
  `@jarvis-k/contracts`.
- Extended `CoreSnapshot` with conversations, active conversation selection,
  and optional memory health.
- Added Core commands for memory health, conversation listing, creation,
  selection, and renaming.
- Made `agent.sendMessage` able to use the active conversation when
  `conversationId` is omitted, while keeping explicit conversation IDs
  supported.
- Kept UI/Desktop boundaries unchanged; new behavior flows through existing
  validated command IPC.

### Current Gate

- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 107 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.

## 2026-07-31

### Post Phase 3: Memory Snapshot Maintenance Surface

- Status: complete.
- Added provider-neutral memory summary and snapshot DTOs to
  `@jarvis-k/contracts`.
- Added `agent.exportMemorySnapshot` and `agent.importMemorySnapshot`
  commands so maintenance stays on the validated protocol surface.
- Updated Core to delegate snapshot export/import through the injected
  `MemoryRepository`, then refresh its in-memory messages, conversations, and
  active conversation state.
- Added compact React HUD controls for exporting snapshot JSON, editing it, and
  importing it through the existing desktop bridge.
- Extended desktop smoke coverage to export and re-import a memory snapshot
  containing two messages and two conversations.

### Current Gate

- `npm run typecheck`: PASS.
- `npm test`: PASS, 20 test files and 111 tests.
- `npm run check:boundaries`: PASS.
- `npm run verify`: PASS.
- `npm run smoke:desktop`: PASS.
- `npm run smoke:desktop:memory-degraded`: PASS.
