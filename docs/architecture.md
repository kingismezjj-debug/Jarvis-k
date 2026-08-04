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
65. Core Host Memory retrieval env wiring has a separate approval gate.
    Phase 8.13 can review the future
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` env key, exact Core Host diff,
    constructor wiring plan, fixture-only retrieval port plan, fixture query
    vector resolver plan, default-disabled behavior, Desktop smoke plan,
    rollback plan, and sanitized recall observation plan. It does not read
    the env value, change Core Host startup behavior, modify `CoreRuntime`
    construction, inject retrieval ports or query vector resolvers, route
    provider execution, write Memory vectors, persist Phase 7.43 or real
    runtime vectors, run SQLite migrations, change Desktop IPC or UI behavior,
    change provider visibility or default opt-in, expose raw vectors, raw
    text, private paths, or raw diagnostics, or convert retrieval/model output
    into shell execution.
66. Core Host can wire the explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1` opt-in to the Phase 8.12
    Core read route. Phase 8.14 injects only a fixture
    `EmbeddingMemoryRetrievalPort` backed by
    `SqliteMemoryRepository.querySimilar(query)` and a fixed fixture query
    vector resolver that does not receive raw message text or call embedding
    provider execution. The route remains default-off and does not write
    Memory vectors, persist Phase 7.43 or real runtime vectors, run SQLite
    migrations, change Desktop IPC or UI behavior, change provider visibility
    or default opt-in, expose raw vectors, raw text, private paths, or raw
    diagnostics, or convert retrieval/model output into shell execution.
67. Provider-backed query-vector routing for Memory retrieval has a separate
    Core Host approval gate. Phase 8.15 can review the future
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR` opt-in, Phase
    7.42/7.43 provider execution prerequisites, Phase 8.12/8.14 retrieval
    prerequisites, query input sanitization, provider execution preflight,
    timeout and cancellation behavior, vector validation, fail-closed
    no-recall behavior, no-vector-persistence behavior, and rollback smoke
    coverage. It does not read env values, route provider execution for
    retrieval, call helper `embed`, return or expose raw vectors, write Memory
    vector data, persist Phase 7.43 or real runtime vectors, run SQLite
    migrations, change Desktop IPC or UI behavior, change provider visibility,
    fixture fallback, or default opt-in, expose raw text, private paths, or
    raw diagnostics, or convert retrieval/model output into shell execution.
68. Core Host can resolve Memory retrieval query vectors through the existing
    runtime-backed local embedding provider only when
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`,
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1`,
    `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`, and
    `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1` are all explicitly
    enabled. Phase 8.16 keeps the Memory query indexed under the fixture model
    ID, uses bounded sanitized query text, validates the returned vector
    shape and finite values, and fail-closes to no-recall degradation on any
    provider or validation failure. It does not write Memory vector records,
    persist Phase 7.43 or real runtime vectors, run SQLite migrations, change
    Desktop IPC or UI behavior, change provider visibility, fixture fallback,
    or default opt-in, expose raw vectors, raw text, private paths, or raw
    diagnostics, or convert retrieval/model output into shell execution.
69. Provider-backed Memory retrieval query-vector acceptance has a separate
    Core Host preflight. Phase 8.17 can review a future local diagnostic for
    the Phase 8.16 product path, including the explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE` env
    key, approved local runtime environment plan, artifact digest verification
    plan, sanitized report shape, no-vector-persistence rule, no-Memory-write
    rule, cleanup plan, and rollback plan. It does not read env values, read
    Python or model artifact paths, verify artifacts, start the helper, call
    provider execution or helper `embed`, return or expose raw vectors, write
    Memory vector data, persist Phase 7.43 or real runtime vectors, run SQLite
    migrations, change Desktop IPC or UI behavior, change provider visibility
    or default opt-in, expose raw text, private paths, signed URLs,
    credentials, or raw diagnostics, or convert retrieval/model output into
    shell execution.
70. The provider-backed Memory retrieval query-vector acceptance diagnostic is
    implemented only as a one-shot Core Host runner behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE=1` plus
    the existing Memory retrieval, provider query-vector, local embedding
    provider, and provider execution opt-ins. Phase 8.18 verifies the approved
    local artifact digest set before product-path execution, sends one fixed
    `agent.sendMessage`, reads only sanitized `memoryRecall` metadata, and
    cleans up its temporary memory/model lifecycle paths. It does not write
    Memory vector records, persist Phase 7.43 or real runtime vectors, run
    SQLite migrations, change Desktop IPC or UI behavior, change provider
    visibility or default opt-in, expose raw vectors, raw text, private paths,
    signed URLs, credentials, or raw diagnostics, or convert retrieval/model
    output into shell execution.
71. Provider-backed Memory vector writes have a separate Core Host approval
    gate. Phase 8.19 can review a future explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES` opt-in, source
    record selection, source text minimization, vector validation,
    model/provider allowlisting, duplicate/update policy, rollback deletion,
    and sanitized failure mapping. It does not read env values, implement
    provider vector writes, route provider execution for stored Memory
    vectors, call helper `embed` for writes, write Memory vector records,
    persist Phase 7.43 or real runtime vectors, run SQLite migrations, change
    Desktop IPC or UI behavior, change provider visibility or default opt-in,
    expose raw vectors, raw text, private paths, signed URLs, credentials, or
    raw diagnostics, or convert retrieval/model output into shell execution.
72. Provider-backed Memory vector writes are implemented as a Core Host
    repository wrapper behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES=1` plus the
    existing Memory retrieval, local embedding provider, and provider
    execution gates. Core still depends only on the provider-neutral
    `MemoryRepository`; after `appendMessage` succeeds, the wrapper may
    minimize eligible user-message text, call the existing local embedding
    provider execution path with bounded timeout, validate the provider vector,
    and write an allowlisted vector record through SQLite. SQLite still blocks
    non-fixture model IDs by default; `apps/core-host` supplies the approved
    local embedding model allowlist only when every provider vector-write gate
    is enabled. Failures do not block message acceptance. This does not batch
    index history, change default retrieval behavior, change Desktop IPC or UI
    behavior, change provider visibility/default opt-in, run SQLite
    migrations, expose raw vectors, raw text, private paths, signed URLs,
    credentials, or raw diagnostics, or convert retrieval/model output into
    shell execution.
73. Provider-backed Memory vector write acceptance is implemented only as a
    one-shot Core Host diagnostic runner behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE=1` plus
    the existing Memory retrieval, provider vector-write, local embedding
    provider, and provider execution opt-ins. Phase 8.21 verifies the approved
    local artifact digest set before product-path execution, sends one fixed
    `agent.sendMessage`, and inspects only temporary SQLite vector metadata for
    the newly accepted message. It reports only write status, record count,
    dimension count, cleanup status, fixed reason codes, and unsafe flags. It
    does not batch-index history, write persistent model caches, expose raw
    vectors, expose raw text, expose private paths, expose signed URLs or
    credentials, expose raw diagnostics, change Desktop IPC or UI behavior,
    change provider visibility/default opt-in, run SQLite schema migrations, or
    convert retrieval/model output into shell execution.
74. Provider-written Memory vector retrieval has a separate review-only
    preflight. Phase 8.22 can review the future explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS` opt-in,
    same-model ID alignment between provider query vectors and stored provider
    vectors, bounded recall limits, sanitized recall metadata, fallback to
    existing fixture/no-recall modes, and rollback smoke planning. It does not
    read env values, change Core Host retrieval routing, change CoreRuntime,
    query provider-written vectors, call provider execution for reads, call
    helper `embed`, write Memory vectors, run SQLite schema migrations, change
    Desktop IPC or UI behavior, change provider visibility/default opt-in,
    expose raw vectors, raw text, private paths, signed URLs, credentials, or
    raw diagnostics, or convert retrieval/model output into shell execution.
75. Provider-written Memory vector retrieval is implemented only behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1` plus the
    existing Memory retrieval, provider query-vector, provider vector-write,
    local embedding provider, and provider execution opt-ins. `apps/core-host`
    is responsible for selecting the exact approved local embedding model ID
    for reads. Core remains provider-neutral and accepts non-fixture retrieval
    models only when an injected `provider_vector` route includes an exact
    allowed model ID. Incomplete gates fall back to fixture-only retrieval.
    This does not run a real acceptance diagnostic, batch-index history,
    persist additional vectors, run SQLite migrations, change Desktop IPC or
    UI behavior, change provider visibility/default opt-in, expose raw vectors
    or raw text, access artifacts, download artifacts, write persistent model
    caches, or convert retrieval/model output into shell execution.
76. Provider-written Memory vector retrieval acceptance has a separate Core
    Host preflight. Phase 8.24 can review a future diagnostic behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1` that
    would use only a temporary Memory database, approved artifact digest
    verification, one provider vector write, one provider-vector retrieval
    read, sanitized recall metadata, and cleanup. The preflight itself does
    not read env values, read Python or model artifact paths, verify artifacts,
    start the helper, call helper `embed`, write temporary or persistent
    vectors, query provider-written vectors, run SQLite migrations, change
    Desktop IPC/UI behavior, change provider visibility/default opt-in, expose
    raw vectors or raw text, download artifacts, write persistent model
    caches, or convert retrieval/model output into shell execution.
77. Provider-written Memory vector retrieval acceptance is implemented only as
    a one-shot Core Host diagnostic behind
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1` plus
    the existing retrieval, provider query-vector, provider vector-write,
    provider vector-read, local embedding provider, and provider execution
    gates. Phase 8.25 verifies approved local artifact digests before
    product-path execution, uses only a temporary Memory database, writes one
    fixed diagnostic message, sends one fixed diagnostic query through the
    provider-vector retrieval route, and reports only sanitized recall
    metadata. The standalone no-env local run degraded before artifact access,
    while the separately approved temporary-artifact chained run completed
    with artifact verification, provider-vector write/read, sanitized recall,
    and cleanup all passing. This does not enable default retrieval,
    batch-index history, persist model caches, run SQLite migrations, change
    Desktop IPC/UI/provider visibility/default opt-in, expose raw vectors/raw
    text/private paths/raw diagnostics, download unapproved artifacts, or
    convert retrieval/model output into shell execution.
78. The temporary-artifact Phase 8.25 chained diagnostic is acceptance-only.
    It may materialize only the approved pinned local embedding artifact set
    into a temporary directory, verify SHA-256 digests, pass that temporary
    directory only through same-process diagnostic environment wiring, run the
    existing provider-vector retrieval acceptance path, and remove the
    temporary directory on exit. It does not print artifact paths, raw vectors,
    raw text, raw helper diagnostics, signed URLs, credentials, or private
    paths. With a separately approved temporary Python Transformers
    environment, it passed artifact materialization, SHA-256 verification,
    provider-vector write/read, sanitized recall reporting, and cleanup.
79. Provider-vector retrieval developer-alpha usage testing has a separate
    Core Host plan-only gate. Phase 8.26 reserves a future explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA` opt-in
    and records the prerequisite gate chain, single-developer alpha scope,
    source minimization, retention and rollback, sanitized telemetry, degraded
    fallback, and no-default-behavior-change requirements. The gate does not
    read env values, access artifacts, start the helper, call provider
    execution, write or query provider vectors, change Desktop IPC/UI/provider
    visibility/default opt-in, run SQLite migrations, expose raw vectors/raw
    text/private paths/raw diagnostics, download artifacts, write persistent
    caches, or convert retrieval/model output into shell execution.
80. Provider-vector retrieval developer-alpha usage is implemented only behind
    the explicit
    `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA=1` gate
    plus the existing Memory retrieval routing, provider query-vector,
    provider vector-write, provider vector-read, local embedding provider, and
    provider execution opt-ins. Missing gates fail closed: provider-vector
    writes remain disabled and provider-vector reads fall back to fixture-only
    routing. `packages/memory-sqlite` owns the exact-source rollback helper for
    deleting allowlisted provider vector rows from the existing
    `memory_embeddings` table. The helper returns only sanitized status,
    deleted counts, and fixed reason codes. This does not add a schema/index
    migration, Desktop IPC/UI/provider visibility/default opt-in change,
    installer/update/release change, persistent model cache, historical batch
    indexing, raw vector/text/path/diagnostic exposure, artifact download, or
    shell execution path.
81. Provider-vector retrieval developer-alpha usage testing must follow the
    Phase 8.28 runbook before a real local usage session is attempted. The
    runbook is documentation-only: it may define preconditions, env checklists,
    sanitized telemetry, rollback checklists, and stop conditions, but it does
    not enable execution, create maintenance wrappers, write provider vectors,
    run schema migrations, expose Desktop/UI controls, broaden release scope,
    print private paths, or change default behavior.
82. Phase 8.29 owns the one-shot developer-alpha usage-session runner inside
    the Core Host boundary. The runner sends only bounded synthetic messages,
    uses an allowlisted child environment, verifies the approved local model
    artifact before runtime access, observes only sanitized vector metadata,
    and deletes exact test-window provider vector rows after the supervised
    child closes. Missing gates, missing runtime/model/database configuration,
    helper failure, cleanup failure, unsafe exposure, schema migration,
    historical indexing, UI/default/provider visibility changes, and shell
    execution fail closed. The runner does not create a new provider, alter
    Core contracts, or enable default behavior.
83. Continuous developer-alpha provider-vector retrieval has a separate Core
    Host preflight before any longer-lived usage path. Phase 8.30 can review
    observation, disable, exact-source rollback, bounded usage, source
    minimization, sanitized telemetry, no-recall fallback, stop conditions,
    fixture fallback, release scope, and clean verification evidence. The
    preflight does not read env values, access artifacts, start helpers,
    execute provider vector write/read paths, change Core/Desktop/UI/provider
    visibility/default behavior, run SQLite migrations, create persistent
    caches, expose raw vectors/text/private paths/raw diagnostics, broaden
    tester scope, or enable shell execution.
84. Phase 8.31 provides a bounded Core Host developer-alpha session API
    behind the existing explicit gate chain and the Phase 8.30 preflight
    approval flag. One supervised child can serve at most five minimized
    messages per session; the session exposes only sanitized observation
    metadata, supports operator disable/stop, stops on gate revocation or
    degraded recall by default, and performs exact-source rollback after child
    shutdown. The API and command do not alter Desktop IPC, UI behavior,
    provider visibility, default opt-in, fixture fallback, release policy,
    SQLite schema/indexes, or historical Memory indexing.
85. Phase 8.32 acceptance can temporarily materialize only the approved pinned
    local embedding artifact set, verify SHA-256 digests, run the bounded
    continuous developer-alpha session against a temporary Memory database,
    and remove the temporary directory after completion. The acceptance report
    is sanitized developer-alpha evidence only; it does not persist model
    artifacts, create a cache policy, broaden tester scope, alter Desktop/UI
    behavior, change provider visibility/default opt-in, migrate SQLite, index
    historical Memory, or define a product SLO.
86. Phase 8.33 adds only an operator runbook and promotion gate for continuous
    developer-alpha provider-vector retrieval. The gate defines observation,
    stop, disable, rollback, source minimization, redaction, cleanup,
    fail-closed, and release-gate criteria before any tester expansion can be
    requested. It does not run provider execution, access artifacts, broaden
    tester scope, change Desktop/UI/provider visibility/default behavior,
    create persistent caches, migrate SQLite, index historical Memory, or
    change release policy.
87. Phase 8.34 adds only a tester expansion approval packet and release
    readiness checklist for possible bounded small-cohort developer-alpha
    review. The packet proposes a maximum tester count, message count, time
    window, consent/minimization policy, sanitized observation, stop, rollback,
    and non-release checklist. It does not approve or execute expansion, read
    env values, access artifacts, start helpers, run provider-vector write/read
    paths, change Desktop/UI/provider visibility/default behavior, migrate
    SQLite, index historical Memory, alter installer/update/model lifecycle
    policy, or define a product SLO.
88. Phase 8.35 adds only a bounded tester expansion operator checklist and
    dry-run preflight. It records candidate roster policy, env gate checklist,
    rollback dry-run procedure, sanitized report schema, stop conditions, and
    release gate checklist while still blocking tester invitations, tester
    expansion, real usage sessions, env reads, artifact access, helper
    execution, provider-vector write/read execution, Desktop/UI/provider
    visibility/default behavior changes, SQLite migrations, historical
    indexing, release policy changes, and product SLOs.

## Restart policy

The supervisor emits lifecycle events, rejects pending requests with structured
errors, and restarts Core with bounded exponential backoff. A health probe runs
on a fixed interval. A failed health probe triggers the same controlled restart
path as an abnormal child exit.
