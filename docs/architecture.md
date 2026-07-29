# Phase 1 Architecture

```text
React renderer
    |
    | context-isolated preload bridge
    v
Electron supervisor
    |
    | validated Node child-process IPC
    v
Agent Core
```

## Decisions

1. Contracts are versioned at protocol version 1 and validated at every process
   boundary.
2. Electron owns windows, IPC exposure, child-process supervision, timeouts, and
   restart policy. It does not own agent business behavior.
3. Core owns the phase 1 in-memory state snapshot and is the only writer to that
   state.
4. The renderer owns display-only state and always requests a fresh snapshot
   after load.
5. Supervisor event sequence IDs stay monotonic across Core restarts.
6. Core persistence is intentionally deferred until the SQLite repository is
   introduced in phase 3.
7. The desktop app does not open a local HTTP port.

## Restart policy

The supervisor emits lifecycle events, rejects pending requests with structured
errors, and restarts Core with bounded exponential backoff. A health probe runs
on a fixed interval. A failed health probe triggers the same controlled restart
path as an abnormal child exit.
