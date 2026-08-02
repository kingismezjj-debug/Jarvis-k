# Current Architecture

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
Agent Core + Voice Engine + Capability governance
    |                  |                 |                    |
    | injected port    | injected port   | injected port      | injected ports
    v                  v                 v                    v
Xunfei RTASR adapter   Memory repository Device capability provider Model governance
                       |                 |                    |
                       v                 v                    v
                       SQLite memory     Node/Windows         Manifests, policy,
                       adapter           capability probe     operations,
                                                              resource leases
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
11. Core persistence flows through injected memory interfaces for startup
   hydration and accepted-message writes. Core does not depend on SQLite
   implementation details.
12. The desktop app does not open a local HTTP port.
13. `packages/memory` owns provider-neutral memory contracts, recall ports,
   summary records, and schemas.
14. `packages/memory-sqlite` owns database schema, migrations, deterministic
   ordering, file persistence, and snapshot restore behavior.
15. Memory health, export, and import are exposed through provider-neutral
   memory ports and `packages/contracts` commands. The UI maintenance surface
   uses snapshot JSON through the existing desktop bridge and never imports a
   concrete Memory adapter.
16. Conversation management is exposed through `packages/contracts` DTOs and
   Core commands. UI and Desktop consume protocol commands only; neither layer
   imports Memory or SQLite packages.
17. Device capability inspection and provider selection are exposed through
   provider-neutral `@jarvis-k/capabilities` ports and contracts DTOs. Concrete
   Node/Windows probing stays in `apps/core-host`.
18. Local model governance starts with model manifests, runtime mode
   recommendations, and provider plans. Real model runtimes, downloads, and
   GPU schedulers must remain behind provider and lifecycle ports.
19. Installable model manifests are separate from model candidates. Candidates
   can document audit targets while remaining disabled; manifests must be
   pinned, SHA-256 guarded, and policy checked before any lifecycle operation.
20. Model install preparation is currently a dry-run workflow. It can create
   supervised operation state and acquire/release resource leases, but it does
   not fetch artifacts, load models, or execute model runtimes.
21. `apps/core-host` composes the concrete file-system lifecycle skeleton,
   static manifest registries, installability planner, operation supervisor,
   and resource scheduler. Core depends only on the corresponding
   `@jarvis-k/capabilities` ports.
22. Runtime adapter discovery is provider-neutral. The current baseline
   advertises no real local runtime adapters until a runtime package is
   deliberately introduced and composed in `apps/core-host`.
23. Capability-specific inference stays behind separate provider ports for
   embedding, OCR, intent routing, and reranking. These ports fail closed until
   a concrete provider is intentionally composed.
24. Inference provider availability, configuration requirements, and execution
   preflight are observable through contracts DTOs before execution exists.
   These surfaces must never expose secrets, provider URLs, signed URLs, token
   material, or runtime-specific implementation details.
25. Phase 5 real-provider work must satisfy the Phase 4.5 readiness gates
   before adding downloads, model loading, or user-facing inference execution.
26. The fixture inference adapter is a test-only provider package. It can be
   composed by `apps/core-host` under `JARVIS_K_ENABLE_FIXTURE_INFERENCE=1`,
   but Core still sees only provider-neutral inference ports.
27. Inference execution reports operation state through the existing
   `ModelOperationSupervisor` port when it is injected. Provider failures are
   mapped to sanitized structured errors before they enter contracts, events,
   snapshots, or UI state.
28. Phase 5 completes the fixture-backed inference foundation for embedding,
   intent routing, OCR, and reranking. These fixture providers are regression
   and development adapters only; they prove the end-to-end execution contract
   while real model downloads, native runtimes, provider credentials, and real
   provider execution remain disabled.
29. Future real-provider work must replace a fixture provider only at the
   provider package and `apps/core-host` composition boundary. Contracts, Core,
   Desktop, and UI should keep the same DTO, command, operation supervision,
   and observation flow unless a new provider-neutral port is explicitly
   required.
30. Tool governance starts with provider-neutral descriptors, bounded primitive
    arguments, allowlists, permission scopes, confirmation decisions, sanitized
    audit records, and fixture-only execution. Real Windows, shell, network,
    model-driven, and operating-system side effects remain behind a later
    approval and execution boundary.
31. Local voice preparation starts with provider-neutral ASR and TTS playback
    ports, sanitized fixture availability reports, and fail-closed preflight.
    Real local speech runtimes, model artifacts, audio execution, provider
    registration, and default opt-in remain behind a later dedicated approval
    and implementation boundary.
32. Visual preparation starts with provider-neutral OCR, screen-capture, and
    vision ports, bounded binary DTOs, deterministic fixture providers, and a
    fail-closed preflight. Real screen capture, permission handling, visual
    runtimes, model artifacts, raw pixel persistence, provider registration,
    Core Host routing, Desktop IPC, and UI controls remain behind a later
    privacy and security approval boundary.
33. Phase 12 model lifecycle preparation remains a dry-run guard. Model
    manifests, digest verification, license review, sanitized operation state,
    and fixture execution are provider-neutral; installer bundling, automatic
    updates, rollback execution, filesystem/network lifecycle writes, model
    caches, and final Windows release policy remain deferred.
34. Developer-alpha hardening remains a provider-neutral preflight and
    in-memory fixture guard. Bounded operation state, sanitized diagnostics,
    restart recovery observation, fail-closed defaults, and fixture fallback
    are testable without enabling installer, update, rollback, filesystem,
    network, model-loading, provider-registration, Core Host, Desktop IPC, UI,
    or provider-visibility behavior.
35. The dedicated Transformers runtime package owns the Python helper,
    dependency manifest, and child-process JSONL transport. The helper loads
    only local artifacts with remote code and network access disabled, runs on
    CPU, and returns sanitized embedding DTOs. `apps/core-host` remains the
    only composition root; runtime implementation does not register or enable
    the provider.

## Restart policy

The supervisor emits lifecycle events, rejects pending requests with structured
errors, and restarts Core with bounded exponential backoff. A health probe runs
on a fixed interval. A failed health probe triggers the same controlled restart
path as an abnormal child exit.
