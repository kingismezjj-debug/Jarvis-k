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
36. Real artifact access and runtime-backed benchmark capture have a separate
    provider-local approval gate. Completing its review evidence only creates
    an explicit approval handoff; it does not grant network access, filesystem
    cache writes, model loading, provider registration, execution enablement,
    or default opt-in changes. The fixture provider remains the fallback until
    the separate approval and composition stages are completed.
37. The approved Phase 7.26 acceptance runner may transiently fetch the pinned
    public artifact set into a temporary directory, verify it twice, run the
    isolated helper benchmark, and remove the directory on exit. This runner
    remains outside product composition; it never registers the provider,
    changes default opt-in, persists signed URLs or credentials, or retains
    model files.
38. Peak memory acceptance remains provider-local and acceptance-only. Its
    Windows probe reports only a sanitized `PeakWorkingSetSize` sample from
    the supervised helper process; it must not enter contracts, Core,
    Desktop, UI, provider visibility, or default opt-in behavior.
39. Provider composition has a separate provider-local review-only gate. The
    gate consumes runtime acceptance, adapter isolation, composition preflight,
    and readiness evidence, but never grants composition approval itself. A
    pending local resource profile keeps the handoff deferred; only a later
    completed resource profile plus separate composition approval may change
    `apps/core-host`, register the provider, or enable execution.
40. The local embedding resource profile has its own product and security
    approval gate. It may record only bounded sanitized sampling state and
    fixed failure reason codes. A completed resource profile and both approvals
    still produce only a handoff for composition review; they do not register
    the provider, enable execution, expose metrics, or change default opt-in.
41. The real helper lifecycle memory sampling gap is formally dispositioned as
    a deferred local diagnostic limitation. This disposition does not complete
    the resource profile, satisfy readiness, grant composition, expose resource
    values, register the provider, enable execution, or change default opt-in.
42. Approved alternative resource evidence may satisfy the local resource
    requirement only for provider composition review. It is limited to bounded
    sampling attempts, successful runtime benchmark completion, cleanup, and a
    sanitized failure reason code. It does not create a product SLO, enter UI
    or Core, grant composition approval, register the provider, enable
    execution, or change default opt-in.
43. Provider composition implementation has its own provider-local review guard.
    It can mark Phase 7.31 alternative resource evidence confirmation, exact
    `apps/core-host` diff review, explicit opt-in behavior, fixture fallback,
    sanitized errors, resource leases, startup/restart, provider visibility,
    rollback, and desktop smoke planning as ready for separate product and
    security approval. It does not grant composition,
    change `apps/core-host`, register the provider, enable execution, expose
    provider visibility, load a runtime, access artifacts, write caches, or
    change default opt-in.
44. Runtime-backed local embedding composition is implemented only in
    `apps/core-host` behind `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`.
    The opt-in composition can register the approved local embedding manifest,
    Transformers runtime descriptor, provider descriptor, and provider shell,
    but the default session factory still fails closed before Python helper
    launch, model artifact access, cache writes, model loading, or real
    embedding generation. Fixture embedding remains the explicit regression
    fallback and keeps the embedding execution port when fixture inference is
    enabled.
45. The local embedding runtime session factory has a separate Core Host
    preflight before implementation. That preflight can reach only
    `ready_for_runtime_session_factory_approval`; it does not read
    `JARVIS_K_RUNTIME_PYTHON`, read model artifact paths, launch the helper,
    access artifacts, write caches, load models, expose raw diagnostics,
    change provider registration/default opt-in behavior, or enable real local
    embedding inference.
46. The approved local embedding runtime session factory lifecycle is wired
    only inside `apps/core-host` and only behind
    `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`. It may read
    `JARVIS_K_RUNTIME_PYTHON`, launch the dedicated helper for a sanitized
    health handshake, and shut it down on release. It must not pass model
    artifact paths, call helper `load` or `embed`, access artifacts, write
    caches, load models, expose raw diagnostics, change default opt-in
    behavior, or enable real local embedding inference without a later
    approval.
47. Model artifact path handoff, helper `load`, and helper `embed` have a
    separate Core Host preflight before implementation. That preflight can
    reach only `ready_for_model_load_inference_approval`; it does not read
    artifact paths, pass model directories, access artifacts, write caches,
    download artifacts, load models, expose raw vectors or diagnostics, change
    provider registration/default opt-in/UI visibility, or enable real local
    embedding inference.
48. The approved model artifact path handoff and helper load step is
    implemented only inside `apps/core-host` under explicit local embedding
    provider opt-in. Core Host reads `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`,
    verifies the approved artifact SHA-256 pin set before launching the helper,
    passes the verified directory only through private helper load handoff, and
    keeps helper `embed`, real vectors, provider registration/default opt-in
    changes, UI visibility changes, downloads, persistent cache writes, raw
    diagnostics, and Windows/PowerShell operations blocked.
49. Helper `embed` implementation has a separate Core Host preflight before
    any execution change. The preflight reviews session handoff, resource
    lease use, input bounds, dimension checks, vector sanitization, timeouts,
    cancellation, sanitized errors, operation supervision, and fixture
    fallback, but still blocks helper `embed`, vector return, Memory routing,
    vector persistence, product inference, provider registration/default
    opt-in/UI changes, downloads, persistent cache writes, raw diagnostics,
    private path exposure, and Memory schema migrations.
50. Helper `embed` diagnostic harness preparation is a separate preflight and
    remains fixture-transport-only. Its sanitized report shape may expose only
    bounded counts, fixed reason codes, and cleanup status. It still blocks
    helper `embed`, real vectors, raw input persistence, vector
    persistence/logging, model artifact access, product inference, Memory
    routing, Memory schema migrations, provider registration/default opt-in/UI
    changes, downloads, persistent cache writes, private paths, signed URLs,
    credentials, raw diagnostics, and model-output shell execution.
51. Helper `embed` diagnostic execution is isolated to a Core Host diagnostic
    runner with a dedicated explicit opt-in. It may verify approved local
    artifacts, acquire a resource lease, call helper `health`, `load`,
    `embed`, and `shutdown`, and return only sanitized counts, step status,
    fixed reason codes, and cleanup status. It does not wire helper `embed`
    into product inference, return vectors to Core/UI/Memory, persist raw
    inputs or vectors, change provider registration/default opt-in/UI
    visibility, download artifacts, write persistent caches, expose private
    paths or raw diagnostics, or convert model output into shell execution.
52. Provider execution wiring has a separate Core Host preflight before any
    product-path helper `embed` implementation. The preflight reserves a
    future execution-specific opt-in and reviews the exact Core Host diff,
    session factory embed wiring, digest verification, helper load ordering,
    resource lease lifecycle, schema validation, vector sanitization,
    sanitized errors, operation supervision, fixture fallback, and smoke
    planning. It does not enable provider execution, call helper `embed`,
    return vectors to product flows, route vectors to Memory, persist vectors,
    change provider registration/default opt-in/UI visibility, access
    artifacts, download artifacts, write persistent caches, expose raw
    diagnostics or private paths, or convert model output into shell
    execution.
53. Runtime-backed local embedding provider execution is implemented only in
    `apps/core-host` behind the additional explicit opt-in
    `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`. The session
    factory verifies approved artifacts, loads the helper, validates requests,
    calls helper `embed`, validates model ID, vector count, dimensions, input
    IDs, vector shape, and finite values, maps failures to sanitized errors,
    and releases helper sessions and resource leases. Default behavior, fixture
    fallback, UI visibility, Memory vector routing, vector persistence,
    downloads, persistent caches, installer/update behavior, and
    Windows/PowerShell actions remain unchanged.
54. Provider execution acceptance is a separate local diagnostic behind
    `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE=1` plus the
    provider and execution opt-ins. It verifies approved artifact digests,
    starts Core Host with temporary memory/model lifecycle paths, and calls the
    existing `agent.generateEmbeddings` product command path. The report may
    expose only sanitized status, fixed reason codes, vector count, dimension
    count, operation phase, and cleanup state. It does not route vectors to
    Memory, persist vectors, change provider visibility/default opt-in
    behavior, add downloads or persistent caches, expose raw diagnostics or
    private paths, or convert model output into Windows/PowerShell actions.
55. Memory vector execution preparation remains provider-neutral in
    `packages/memory`. Phase 8.3 defines only a proposed vector table/index
    shape, rollback plan, vector write/query port, and fixture-only safety
    preflight. It does not change SQLite schema, add vector indexes, persist
    Phase 7.43 runtime vectors, alter Core default retrieval, expose UI
    behavior, or convert retrieval output into Windows/PowerShell actions.
56. Memory vector migration preparation has a separate review-only approval
    handoff. Phase 8.4 can mark a future SQLite migration implementation plan,
    rollback plan, backup/restore plan, health check plan, export/import
    regression plan, and fixture safety tests as ready for separate approval,
    but it does not implement or execute a migration, change
    `packages/memory-sqlite`, create indexes, write vectors, persist Phase
    7.43 runtime vectors, alter Core/UI behavior, or expose raw vectors,
    private paths, or raw diagnostics.
57. The SQLite Memory schema can create the Phase 8.5 vector table and indexes
    at schema version 3 inside `packages/memory-sqlite`. This is schema
    readiness only: no vector write/query repository API is exposed, snapshots
    remain provider-neutral, restore clears vector rows, Phase 7.43 runtime
    vectors are not persisted, Core/UI behavior is unchanged, and raw vectors,
    private paths, raw diagnostics, and model-output command conversion remain
    blocked.
58. Memory vector writes have a separate implementation approval handoff.
    Phase 8.6 can review the future SQLite write API, validation rules,
    duplicate handling, sanitized failure mapping, rollback expectation, and
    fixture safety tests, but it does not implement write methods, enable
    vector writes, change `packages/memory-sqlite`, persist Phase 7.43 or real
    runtime vectors, route writes to Core retrieval/product flows, change
    provider execution or UI behavior, or expose raw vectors, private paths, or
    raw diagnostics.
59. The SQLite Memory repository can write fixture-only embedding records
    through `writeEmbeddingRecord(record)`. The method validates
    provider-neutral records, accepts only `fixture/` model IDs, stores the
    vector payload inside the existing schema v3 `memory_embeddings` table,
    and returns sanitized result codes. It does not expose a query/retrieval
    API, persist Phase 7.43 or real runtime vectors, route provider execution
    output to Memory, change Core/Desktop/UI behavior, expose raw vectors or
    private paths, or convert retrieval/model output into shell execution.
60. SQLite vector query implementation has a separate review-only approval
    handoff. Phase 8.8 can review the future `querySimilar(query)` method,
    vector deserialization plan, fixture-only cosine scoring, bounded result
    ordering, sanitized failure mapping, and fixture safety tests, but it does
    not implement query methods, enable retrieval execution, change
    `packages/memory-sqlite`, persist Phase 7.43 or real runtime vectors,
    route retrieval into Core/product flows, change Desktop/UI behavior, or
    expose raw vectors, raw text, private paths, or raw diagnostics.
61. The SQLite Memory repository can query fixture-only embedding records
    through `querySimilar(query)`. The method validates provider-neutral
    queries, accepts only `fixture/` model IDs, reads bounded candidates from
    schema v3 `memory_embeddings`, scores them with deterministic cosine
    similarity in memory, and returns sanitized match metadata only. It does
    not route retrieval into Core/product flows, connect provider execution
    output to Memory, persist Phase 7.43 or real runtime vectors, change
    Desktop/UI behavior, expose raw vectors or raw text, or convert
    retrieval/model output into shell execution.
62. Memory retrieval routing has a separate review-only approval handoff.
    Phase 8.10 can review a future Core recall injection plan, fixture fallback
    behavior, bounded routing guards, and sanitized recall observation shape,
    but it does not change Core runtime behavior, route retrieval into
    product flows, change provider execution or visibility, change UI
    defaults, persist Phase 7.43 or real runtime vectors, or expose raw
    vectors, raw text, private paths, or raw diagnostics.
63. Core Memory retrieval read routing has its own approval gate inside
    `@jarvis-k/core`. Phase 8.11 can approve the future Core turn assembly
    surface, injected provider-neutral retrieval port, explicit opt-in gate,
    sanitized recall payload, bounded fixture-only result behavior,
    fail-closed degraded mode, fixture fallback, and rollback plan, but it
    does not change `CoreRuntime`, route retrieval into product behavior,
    change the `MemoryRepository` contract, connect provider execution output
    to Memory, change Desktop IPC or UI behavior, change provider visibility
    or default opt-in, persist Phase 7.43 or real runtime vectors, expose raw
    vectors, raw text, private paths, or raw diagnostics, or convert
    retrieval/model output into shell execution.
64. `CoreRuntime` can perform an opt-in fixture-only Memory retrieval read
    after `agent.sendMessage` accepts a user message. Phase 8.12 uses only an
    injected `EmbeddingMemoryRetrievalPort` and an injected fixture query
    vector resolver, accepts only `fixture/` model IDs, bounds recall matches
    to five sanitized metadata entries, and fail-closes to no-recall degraded
    observations without blocking message acceptance. It does not read raw
    message text for vector generation, call provider execution, write Memory
    vectors, persist Phase 7.43 or real runtime vectors, change the
    `MemoryRepository` contract, change Core Host composition, change Desktop
    IPC or UI behavior, change provider visibility or default opt-in, expose
    raw vectors, raw text, private paths, or raw diagnostics, or convert
    retrieval/model output into shell execution.

## Restart policy

The supervisor emits lifecycle events, rejects pending requests with structured
errors, and restarts Core with bounded exponential backoff. A health probe runs
on a fixed interval. A failed health probe triggers the same controlled restart
path as an abnormal child exit.
