# Phase 3 Upgrade Plan

Started on 2026-07-30.

## Goal

Introduce durable local memory without coupling agent logic, UI, Electron, or
voice providers to a concrete database implementation.

## Architecture Direction

```text
UI
  -> Desktop IPC
    -> apps/core-host composition root
      -> CoreRuntime
        -> @jarvis-k/memory port
          -> @jarvis-k/memory-sqlite adapter
```

## Dependency Rules

1. `@jarvis-k/memory` owns provider-neutral memory repository contracts,
   validation schemas, and snapshot shapes.
2. `@jarvis-k/memory-sqlite` owns SQLite schema, migrations, ordering, and
   file persistence behavior.
3. `@jarvis-k/core` can depend on `@jarvis-k/memory` interfaces only.
4. `apps/core-host` is the only place allowed to compose Core with a concrete
   memory adapter.
5. UI, Desktop, Voice Engine, and provider adapters must not import SQLite.
6. Default CI must run with in-memory or temporary databases and no secrets.

## Waves

### Wave 3.1: Durable Message Memory

- Add Memory repository interface and schemas.
- Add SQLite-backed message persistence adapter.
- Hydrate Core message state from an injected repository.
- Persist accepted user messages through the injected repository.
- Cover deterministic ordering, snapshot restore, and Core injection behavior.
- Extend dependency boundary checks.

### Wave 3.2: Conversation Metadata

- Add conversation records and active-conversation selection.
- Persist conversation titles and timestamps.
- Keep UI-facing protocol changes DTO-only in `contracts`.

### Wave 3.3: Recall And Summaries

- Add bounded recent-message recall.
- Add summary records behind Memory interfaces.
- Keep summarization provider selection out of Core.

### Wave 3.4: Maintenance And Recovery

- Add database health checks, export/import hooks, and corruption recovery path.
- Add desktop-visible degraded state only through existing snapshot/event
  contracts.

## Exit Gate

- `npm run typecheck` passes.
- Memory and Core tests pass.
- `npm run check:boundaries` passes.
- `npm run verify` passes.
- No credentials, signed URLs, or provider policy are added to memory code.
