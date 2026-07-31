# Phase 3 Architecture

```text
React renderer
    |
    | context-isolated preload bridge
    v
Electron desktop host
    |
    | validated command IPC
    | bounded binary audio IPC
    | encrypted settings via safeStorage
v
Core Host child process
    |
    | composition root for providers and persistence
    v
Agent Core + Voice Engine
    |                  |
    | injected port    | injected port
    v                  v
Xunfei RTASR adapter   Memory repository
                       |
                       v
                       SQLite memory adapter
```

## Decisions

1. Contracts are versioned at protocol version 1 and validated at every process
   boundary.
2. Electron owns windows, IPC exposure, child-process supervision, timeouts, and
   restart policy. It does not own agent business behavior.
3. Electron stores voice-provider credentials with `safeStorage` and sends them
   only through private child-process IPC.
4. `apps/core-host` is the only concrete composition root. Core never imports a
   provider adapter.
5. Voice Engine owns voice state, PTT, continuous listening, transcript
   finalization, TTS coordination, and recovery policy through injected ports.
6. Browser capture owns microphone, AudioContext, AudioWorklet, PCM conversion,
   40 ms frame aggregation, and capture metrics.
7. Xunfei signing, parsing, connection reuse, retry, and RTASR-specific segment
   behavior stay inside `packages/voice-adapter-xunfei`.
8. Core owns the in-memory state snapshot and is the only writer to that state.
9. The renderer owns display-only state and always requests a fresh snapshot
   after load.
10. Supervisor event sequence IDs stay monotonic across Core restarts.
11. Core persistence is intentionally deferred until the SQLite repository is
   introduced in phase 3. Core can depend on memory interfaces, but not on
   SQLite implementation details.
12. The desktop app does not open a local HTTP port.
13. `packages/memory` owns provider-neutral memory contracts and schemas.
14. `packages/memory-sqlite` owns database schema, deterministic ordering, file
   persistence, and snapshot restore behavior.

## Restart policy

The supervisor emits lifecycle events, rejects pending requests with structured
errors, and restarts Core with bounded exponential backoff. A health probe runs
on a fixed interval. A failed health probe triggers the same controlled restart
path as an abnormal child exit.
