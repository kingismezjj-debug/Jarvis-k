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
