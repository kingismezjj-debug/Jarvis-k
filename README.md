# Jarvis-K

Jarvis-K is an Electron, React, and TypeScript desktop agent runtime. The
current baseline is **Phase 12.3 Developer-Alpha Hardening plus Phase 7.37
Model Artifact Path Handoff and Helper Load plus Phase 7.38 Helper Embed
Preflight plus Phase 7.39 Diagnostic Harness Preflight plus Phase 7.40
Diagnostic Execution Runner plus Phase 7.41 Provider Execution Wiring
Preflight plus Phase 7.42 Provider Execution Wiring plus Phase 7.43 Provider
Execution Acceptance Diagnostic plus Phase 8.3 Memory Vector Execution
Preflight plus Phase 8.4 Memory Vector Migration Preflight plus Phase 8.5
Memory SQLite Vector Migration plus Phase 8.6 Memory Vector Write
Preflight plus Phase 8.7 Memory SQLite Fixture Vector Write plus Phase 8.8
Memory Vector Query Preflight plus Phase 8.9 Memory SQLite Fixture Vector
Query plus Phase 8.10 Memory Retrieval Routing Preflight plus Phase 8.11 Core
Memory Retrieval Routing Approval Gate plus Phase 8.12 Core Memory Retrieval
Read Routing plus Phase 8.13 Core Host Memory Retrieval Env Wiring Approval
Gate plus Phase 8.14 Core Host Fixture Memory Retrieval Env Wiring plus Phase
8.15 Provider Query Vector Approval Gate plus Phase 8.16 Provider-Backed Query
Vector plus Phase 8.17 Provider Query Vector Acceptance Preflight plus Phase
8.18 Provider Query Vector Acceptance Diagnostic plus Phase 8.19 Provider
Vector Write Approval Gate plus Phase 8.20 Provider Vector Write
Implementation plus Phase 8.21 Provider Vector Write Acceptance Diagnostic plus
Phase 8.22 Provider Vector Retrieval Preflight plus Phase 8.23 Provider
Vector Retrieval Routing plus Phase 8.24 Provider Vector Retrieval Acceptance
Preflight plus Phase 8.25 Provider Vector Retrieval Acceptance Diagnostic plus
Phase 8.26 Provider Vector Retrieval Developer-Alpha Usage Test Plan plus
Phase 8.27 Provider Vector Retrieval Developer-Alpha Implementation plus
Phase 8.28 Provider Vector Retrieval Developer-Alpha Runbook plus
Phase 8.29 Provider Vector Retrieval Developer-Alpha Usage Session plus
Phase 8.30 Provider Vector Retrieval Continuous Alpha Preflight plus
Phase 8.31 Provider Vector Retrieval Developer-Alpha Continuous Usage plus
Phase 8.32 Provider Vector Retrieval Continuous Alpha Acceptance plus
Phase 8.33 Continuous Alpha Operator Runbook and Promotion Gate plus
Phase 8.34 Tester Expansion Approval Packet plus
Phase 8.35 Bounded Tester Expansion Dry-Run Preflight plus
Phase 8.36 Bounded Tester Expansion Approval Request Preflight plus
Phase 8.37 Bounded Tester Expansion Execution Run**:
the
supervised runtime, React HUD, provider-neutral Voice Engine, browser
microphone capture, Xunfei RTASR adapter, encrypted local voice settings,
SQLite memory persistence, device capability inspection, model governance
ports, installability policy, resource diagnostics, dry-run model install
  preparation, deterministic fixture providers, provider-neutral
  developer-alpha guards, and the isolated Python Transformers helper are in
  place. The approved Phase 7.26 acceptance runner has verified a temporary
  real artifact load and benchmark; Phase 7.35 adds only explicit opt-in Core
  Host session factory wiring and supervised Python helper lifecycle health.
  Phase 7.36 adds a review-only preflight for future artifact path, helper
  load, and helper embed work. Phase 7.37 adds explicit opt-in Core Host
  artifact path handoff, SHA-256 verification, and helper `load` only. Product
  downloads, persistent model cache writes, helper `embed`, real provider
  execution, default opt-in, installers, updates, and rollback side effects
  remain disabled. Phase 7.38 adds only a preflight for a future helper
  `embed` implementation. Phase 7.39 adds only a fixture-transport diagnostic
  harness preflight and sanitized report shape. Phase 7.40 adds an isolated
  opt-in Core Host diagnostic runner that may call helper `embed` only for a
  sanitized local diagnostic report; product inference, Memory routing,
  vector persistence, UI visibility changes, downloads, and persistent cache
  writes remain disabled. Phase 7.41 adds only a provider execution wiring
  preflight for a future product path; provider execution, helper `embed`
  product wiring, vectors, Memory routing, UI visibility changes, downloads,
  and persistent cache writes remain blocked pending separate approval. Phase
  7.42 wires provider execution only behind
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`; default behavior,
  fixture fallback, Memory routing, vector persistence, UI visibility changes,
  downloads, and persistent cache writes remain blocked. Phase 7.43 adds a
  separate explicit opt-in acceptance diagnostic that verifies the Phase 7.42
  product command path via `agent.generateEmbeddings` and reports only
  sanitized counts and fixed reason codes; Memory routing, vector persistence,
  UI visibility changes, downloads, and persistent cache writes remain
  blocked. Phase 8.3 adds only a provider-neutral Memory vector schema
  proposal, rollback plan, port shape, and fixture-only safety preflight;
  SQLite migration, vector writes, Phase 7.43 vector persistence, Core
  retrieval defaults, UI behavior, and shell execution remain blocked. Phase
  8.4 adds only a review-only SQLite migration implementation approval
  preflight; migration implementation/execution, `packages/memory-sqlite`
  changes, index creation, vector writes, vector persistence, Core/UI behavior
  changes, and shell execution remain blocked. Phase 8.5 upgrades
  `packages/memory-sqlite` to schema version 3 with the vector table and
  indexes; vector write/query APIs, Phase 7.43 vector persistence, Core/UI
  behavior changes, provider visibility changes, and shell execution remain
  blocked. Phase 8.6 adds only a vector write implementation approval
  preflight; write methods, vector writes, real/Phase 7.43 vector persistence,
  Core retrieval routing, provider execution routing, UI behavior changes, and
  shell execution remain blocked. Phase 8.7 adds a fixture-only SQLite
  `writeEmbeddingRecord(record)` API that accepts only `fixture/` model IDs
  and stores vector payloads behind sanitized result codes; vector
  query/retrieval APIs, real/Phase 7.43 vector persistence, Core routing,
  provider execution routing, UI behavior changes, and shell execution remain
  blocked. Phase 8.8 adds only a review-only preflight for a future SQLite
  `querySimilar(query)` implementation; query execution, SQLite query methods,
  Core retrieval routing, provider execution routing, UI behavior changes,
  real vector persistence, raw vector/text exposure, and shell execution
  remain blocked. Phase 8.9 adds a fixture-only SQLite `querySimilar(query)`
  API that returns bounded match metadata from fixture vectors only; Core
  retrieval routing, provider execution routing, real vector persistence,
  UI/Desktop behavior changes, raw vector/text exposure, and shell execution
  remain blocked. Phase 8.10 adds only a review-only preflight for future Core
  retrieval routing; product routing, provider execution routing, UI/default
  opt-in changes, provider visibility changes, and raw vector/text exposure
  remain blocked. Phase 8.11 adds only an approval gate in `@jarvis-k/core`
  for future Core Memory retrieval read routing; `CoreRuntime` behavior,
  product recall injection, provider execution routing, Memory repository
  contract changes, Desktop/UI changes, vector persistence, and raw
  vector/text exposure remain blocked. Phase 8.12 adds the first opt-in
  fixture-only Core read route through an injected provider-neutral
  `EmbeddingMemoryRetrievalPort`; default behavior, Core Host env wiring,
  Desktop/UI behavior, provider execution routing, vector writes, real vector
  persistence, SQLite migrations, and raw vector/text exposure remain blocked.
  Phase 8.13 adds only a Core Host approval gate for future
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` env wiring; env reads,
  CoreRuntime construction changes, retrieval port injection, Desktop/UI
  behavior changes, provider execution routing, vector writes, real vector
  persistence, SQLite migrations, and raw vector/text exposure remain blocked.
  Phase 8.14 wires the Core Host env opt-in to the Core read route using only
  a fixture retrieval port and fixture query vector resolver; real provider
  output as query vectors, Memory vector writes, real vector persistence,
  Desktop/UI controls, provider visibility/default opt-in changes, SQLite
  migrations, and raw vector/text exposure remain blocked. Phase 8.15 adds
  only a Core Host approval gate for a future provider-backed query-vector
  resolver; env reads, provider execution routing for retrieval, helper
  `embed` calls, raw vectors, vector persistence, Memory vector writes,
  Desktop/UI controls, provider visibility/default opt-in changes, SQLite
  migrations, and shell execution remain blocked. Phase 8.16 implements the
  provider-backed query-vector resolver only behind the separate explicit
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1` opt-in and only
  when the existing Memory retrieval, local embedding provider, and provider
  execution gates are also enabled. It uses bounded sanitized query text,
  validates provider vector shape, and degrades to no-recall on failure;
  Memory vector writes, vector persistence, Desktop/UI controls, provider
  visibility/default opt-in changes, SQLite migrations, raw vector/text
  exposure, and shell execution remain blocked. Phase 8.17 adds only a Core
  Host preflight for a future local acceptance diagnostic of the Phase 8.16
  product path; acceptance env reads, runtime Python reads, model artifact
  path reads, artifact verification, helper startup, provider execution,
  helper `embed`, raw vectors, vector persistence, Memory vector writes,
  Desktop/UI changes, provider visibility/default opt-in changes, SQLite
  migrations, and shell execution remain blocked pending separate approval.
  Phase 8.18 adds the approved one-shot Core Host acceptance diagnostic for
  that product path behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE=1` plus
  the existing retrieval/provider execution gates. It verifies pinned local
  artifacts before helper load/embed and reports only sanitized recall
  metadata; Memory vector writes, vector persistence, Desktop/UI changes,
  provider visibility/default opt-in changes, SQLite migrations, downloads,
  persistent caches, raw vector/text/diagnostic exposure, and shell execution
  remain blocked. Phase 8.19 adds only a Core Host approval gate for future
  provider-backed Memory vector writes; env reads, provider execution routing
  for writes, helper `embed` for stored vectors, Memory vector writes,
  vector persistence, SQLite migrations, UI/Desktop changes, provider
  visibility/default opt-in changes, raw vector/text/diagnostic exposure, and
  shell execution remain blocked pending separate implementation approval.
  Phase 8.20 implements the approved explicit opt-in Core Host repository
  wrapper that can write provider-backed vectors for newly accepted minimized
  user messages only when every retrieval/provider execution gate is enabled;
  default behavior, historical batch indexing, Desktop/UI controls, provider
  visibility/default opt-in behavior, SQLite schema/indexes, raw
  vector/text/diagnostic exposure, downloads, persistent model caches, and
  shell execution remain blocked. Phase 8.21 adds a separate explicit opt-in
  local acceptance diagnostic for the Phase 8.20 product path; it uses a
  temporary Memory database, inspects only row count and dimensions for the
  newly accepted message vector, and reports only sanitized write metadata and
  fixed reason codes. Phase 8.22 adds only a review-only preflight for future
  provider-written vector retrieval behind a separate planned opt-in; Core Host
  routing, CoreRuntime behavior, Desktop/UI behavior, provider visibility,
  default opt-in, raw vector/text exposure, SQLite migrations, and shell
  execution remain blocked. Phase 8.23 implements provider-written vector
  retrieval only behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS=1` plus the existing
  retrieval, provider query-vector, provider vector-write, local embedding
  provider, and provider execution gates. Core remains provider-neutral through
  an injected exact model allowlist; default behavior, Desktop/UI controls,
  provider visibility/default opt-in changes, raw vector/text/diagnostic
  exposure, SQLite migrations, artifact access, downloads, persistent caches,
  historical batch indexing, and shell execution remain blocked. Phase 8.24
  adds only a preflight for a future provider-vector retrieval acceptance
  diagnostic behind a separate planned opt-in; env reads, Python/model path
  reads, artifact verification, helper startup/embed, temporary or persistent
  vector writes, provider-written vector retrieval execution, Desktop/UI
  changes, provider visibility/default opt-in changes, raw vector/text/
  diagnostic exposure, downloads, persistent caches, SQLite migrations, and
  shell execution remain blocked pending separate approval. Phase 8.25 adds
  the approved one-shot provider-vector retrieval acceptance diagnostic behind
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1` plus
  all existing retrieval/provider execution gates. It verifies artifacts before
  product-path execution, uses a temporary Memory database, writes one fixed
  diagnostic message, sends one fixed diagnostic query, and reports only
  sanitized recall metadata. The standalone no-env run degraded before
  artifact access, and the separately approved temporary-artifact chained run
  passed artifact verification, provider-vector write/read, sanitized recall,
  and cleanup. Default behavior, Desktop/UI controls, provider
  visibility/default opt-in, downloads outside the approved diagnostic,
  persistent caches, historical batch indexing, SQLite migrations, raw
  vector/text/path/diagnostic exposure, and shell execution remain blocked.
  Phase 8.26 adds only a Core Host plan gate for a future controlled local
  developer-alpha usage test, reserving a separate explicit opt-in and
  recording prerequisite gates, source minimization, rollback, sanitized
  telemetry, degraded fallback, and no-default-behavior-change requirements.
  It does not read env values, access artifacts, execute provider retrieval,
  write persistent provider vectors, change UI/Desktop/provider visibility, or
  change default behavior. Phase 8.27 implements the approved explicit
  developer-alpha gate for provider-vector write/read usage. Provider-backed
  vector writes and provider-written vector reads now require
  `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA=1` plus the
  existing Memory retrieval, provider query-vector, provider vector-write,
  provider vector-read, local embedding provider, and provider execution gates.
  Missing gates fail closed to disabled writes and fixture-only/no-recall
  retrieval. A narrow SQLite exact-source rollback helper can delete
  allowlisted provider vector rows for the test window without schema
  migration or raw vector/text exposure. Default behavior, Desktop/UI controls,
  provider visibility/default opt-in, installer/update/release policy,
  persistent model caches, historical batch indexing, raw vectors/text/paths/
  diagnostics, unapproved downloads, and shell execution remain blocked.
  Phase 8.28 adds the documentation-only runbook, environment checklist,
  rollback checklist, sanitized telemetry expectations, and stop conditions
  for a future controlled local developer-alpha usage test. It does not run a
  real usage session, create a maintenance wrapper, write provider vectors,
  change Core Host/Core/Desktop/UI/provider behavior, run migrations, or
  change release policy. Phase 8.29 adds a one-shot usage-session runner that
  keeps one supervised Core Host child alive, sends two bounded synthetic
  messages, verifies only sanitized vector metadata, and performs exact-source
  rollback. Its implementation, full verification, and relevant desktop
  smokes pass. After separate temporary Python environment and temporary
  approved artifact materialization approvals, a one-time artifact-backed
  developer-alpha usage session passed with sanitized provider-vector
  write/read, exact-source rollback, and cleanup evidence. Default behavior,
  UI/provider visibility, historical indexing, persistent model caches, and
  release behavior remain unchanged. Phase 8.30 adds only a Core Host
  preflight for the next continuous-alpha decision, covering sanitized
  observation, disable, exact-source rollback, bounded usage, source
  minimization, no-recall fallback, stop conditions, fixture fallback, release
  scope, and clean verification evidence. It does not read env values, access
  artifacts, start helpers, write or query provider vectors, change
  Core/Desktop/UI/provider visibility/default behavior, run migrations, create
  persistent caches, broaden tester scope, or enable shell execution. Phase
  8.31 adds a bounded Core Host session API and explicit command that can keep
  one supervised child alive for at most five minimized messages, expose only
  sanitized observations, stop on gate revocation or degraded recall by
  default, and perform exact-source rollback on stop/disable. It remains
  explicit opt-in and does not change Desktop/UI/provider visibility/default
  behavior, fixture fallback, release policy, SQLite schema/indexes, or
  historical Memory indexing. The bounded command was not run during
  implementation. Phase 8.32 adds and runs a one-time temporary-artifact
  acceptance path for the bounded continuous session. It materializes only the
  approved pinned artifact set into a temporary directory, verifies SHA-256
  digests, runs against a temporary Memory database, performs exact-source
  rollback, and cleans up. The acceptance passed as developer-alpha evidence
  only and does not change defaults, UI/provider visibility, release policy,
  persistent cache policy, SQLite schema/indexes, or historical Memory
  indexing. Phase 8.33 adds only an operator runbook and promotion gate for
  future continuous-alpha expansion approval. It defines sanitized
  observation, stop, disable, exact-source rollback, source minimization,
  redaction, cleanup verification, fail-closed, and release-gate criteria
  before any broader tester request. It does not expand testers, access
  artifacts, start helpers, execute provider-vector write/read, change
  Desktop/UI/provider visibility/default behavior, create persistent caches,
  migrate SQLite, batch-index historical Memory, or define a product SLO.
  Phase 8.34 adds only a tester expansion approval packet and
  release-readiness checklist for possible bounded small-cohort
  developer-alpha review. It proposes at most 3 testers, 5 minimized messages
  per tester, and a 2-hour window, but does not approve or execute expansion,
  read env values, access artifacts, start helpers, execute provider-vector
  paths, change defaults/UI/provider visibility/release policy, or create a
  product SLO. Phase 8.35 adds only a bounded tester expansion operator
  checklist and dry-run preflight. It records candidate roster policy, env
  gate checklist, rollback dry-run procedure, sanitized report schema, stop
  conditions, and release gate checklist while still blocking tester
  invitations, real usage, env reads, artifact access, helper execution,
  provider-vector execution, UI/default/provider visibility changes, SQLite
  migrations, release policy changes, and product SLOs. Phase 8.36 adds only
  the bounded tester expansion product/security/release approval-request
  preflight for a later execution run. It generates sanitized approval request
  text and fixed bounds, but does not approve expansion, send invitations, run
  usage, read env values, access artifacts, start helpers, execute
  provider-vector paths, change defaults/UI/provider visibility/release
  policy, run SQLite migrations, or create a product SLO. Phase 8.37 adds the
  bounded tester expansion execution runner and explicit command surface. It
  can delegate at most 3 tester windows with at most 5 minimized messages each
  to the existing continuous developer-alpha session only when the approved
  env/runtime/model/database chain is configured, and stops before later tester
  windows after the first blocked or degraded session. In the current shell
  that chain is not configured, so the real product-path run was not started.

The Bailongma and Jarvis-ui source projects were migration references only.
They are not runtime dependencies.

## Status

- Phase 0/1 rollback reference: commit `1f3376a`
- Phase 2 voice baseline reference: commit `5d195ee`
- Current branch: `main`
- Phase 3 local memory persistence: complete
- Phase 4 local capability and model governance foundation: complete through
  inference preflight and provider configuration requirement reporting
- Phase 4.5 inference readiness and safety gates: complete
- Phase 5 fixture-backed inference execution: complete for embedding, intent
  routing, OCR, and reranking
- Phase 5 fixture-backed inference foundation: complete and ready for Phase 6
  real-provider planning
- Phase 6 local embedding provider readiness: started with fail-closed
  descriptor and configuration gates
- Phase 7 local embedding readiness guards: complete through the composition
  preflight; runtime execution remains disabled
- Phase 7 real Python Transformers helper: implemented inside the dedicated
  runtime package with offline local-file loading, CPU embedding execution,
  and child-process JSONL transport; provider composition remains disabled
- Phase 7.25 real artifact access approval: review-only handoff guard complete;
  real artifact access and runtime-backed benchmark capture remain blocked
- Phase 7.26 approved artifact benchmark: temporary artifact verification,
  real model load/embed, latency, quality, and cleanup passed; peak memory
  capture remains deferred
- Phase 7.27 peak memory sampling diagnostic: provider-local probe hardened
  and verified against a temporary non-model child; real artifact-backed
  memory capture remains deferred
- Phase 7.28 provider composition approval gate: review-only handoff entered;
  local resource readiness remains deferred and provider composition remains
  disabled
- Phase 7.29 resource profile approval: product and security approvals granted
  for one acceptance diagnostic only; artifact/runtime rerun passed, but the
  valid real-model memory sample remains deferred
- Phase 7.30 memory sampling gap disposition: known diagnostic gap formally
  recorded; resource profile remains incomplete and provider composition
  remains blocked
- Phase 7.31 alternative resource evidence: approved diagnostic evidence now
  satisfies local resource readiness for composition review only; provider
  composition and execution remain disabled
- Phase 7.32 provider composition implementation review: exact composition
  review materials are ready for separate product and security approval;
  provider registration, visibility, execution, and default opt-in remain
  disabled
- Phase 7.33 provider composition implementation: runtime-backed local
  embedding is composed only behind `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`;
  default behavior, fixture fallback, model artifact access, model loading,
  and real local inference remain disabled
- Phase 7.34 runtime session factory preflight: Core Host review-only guard
  complete; real session factory implementation, Python helper launch,
  runtime Python environment reads, artifact access, cache writes, model
  loading, and real inference remain blocked pending separate product and
  security approval
- Phase 7.35 runtime session factory lifecycle: explicit opt-in Core Host
  wiring reads `JARVIS_K_RUNTIME_PYTHON`, starts the supervised Python helper
  for health, and shuts it down on release; model artifact path reads, helper
  load/embed calls, model loading, and real inference remain blocked
- Phase 7.36 model load and inference preflight: Core Host review-only guard
  complete; model artifact path reads, model directory handoff, helper
  load/embed calls, model loading, raw vector exposure, and real inference
  remain blocked pending separate product and security approval
- Phase 7.37 model artifact path handoff and helper load: explicit opt-in Core
  Host implementation reads the approved local model directory, verifies the
  pinned artifact digests, and calls helper `load`; helper `embed`, real
  vectors, default opt-in changes, UI visibility changes, downloads, and
  persistent cache writes remain blocked
- Phase 7.38 helper embed implementation preflight: Core Host review-only
  guard complete; helper `embed`, real vectors, Memory routing, vector
  persistence, product inference, default opt-in changes, UI visibility
  changes, downloads, and persistent cache writes remain blocked pending
  separate product and security approval
- Phase 7.39 helper embed diagnostic harness preflight: Core Host review-only
  guard and sanitized report shape complete; helper `embed`, real vectors,
  model artifact access, Memory routing, vector persistence, product
  inference, default opt-in changes, UI visibility changes, downloads, and
  persistent cache writes remain blocked pending separate product and security
  approval
- Phase 7.40 helper embed diagnostic execution: isolated Core Host diagnostic
  runner added behind `JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC=1`;
  it can verify approved local artifacts and call helper `embed` only for a
  sanitized diagnostic report. The current local environment was not opted in,
  so local script verification degraded without helper launch or artifact
  access. Product execution, Memory routing, vector persistence, provider
  default opt-in changes, UI visibility changes, downloads, and persistent
  cache writes remain blocked.
- Phase 7.41 provider execution wiring preflight: Core Host review-only guard
  complete for future provider execution wiring; `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`
  is reserved for a later separately approved implementation. Provider
  execution, session factory embed, helper `embed` product calls, product
  vectors, Memory routing, vector persistence, default opt-in changes, UI
  visibility changes, downloads, and persistent cache writes remain blocked.
- Phase 7.42 provider execution wiring: explicit opt-in Core Host wiring can
  call helper `embed` through the runtime-backed local embedding provider only
  when `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1` is set alongside
  the existing provider/runtime/model environment gates. Default behavior,
  fixture fallback, Memory routing, vector persistence, UI visibility changes,
  downloads, and persistent cache writes remain blocked.
- Phase 7.43 provider execution acceptance diagnostic: a separate explicit
  opt-in local diagnostic can verify the Phase 7.42 product command path
  through `agent.generateEmbeddings` after SHA-256 artifact verification and
  temporary Core Host startup. Reports expose only sanitized status, fixed
  reason codes, vector count, dimension count, operation phase, and cleanup
  status. Memory routing, vector persistence, UI/default opt-in changes,
  downloads, and persistent cache writes remain blocked.
- Phase 8.1 embedding memory retrieval: provider-neutral contract and fixture
  preflight complete; production indexing and retrieval remain disabled
- Phase 8.2 retrieval benchmark harness: fixture-only measurement complete;
  real-provider metrics remain deferred
- Phase 8.3 memory vector execution preflight: provider-neutral schema
  proposal, rollback plan, port shape, and fixture-only safety checks
  complete; SQLite migration and real vector writes remain deferred
- Phase 8.4 memory vector migration preflight: review-only migration
  implementation approval handoff complete; SQLite implementation, migration
  execution, index creation, and vector persistence remain deferred
- Phase 8.5 memory SQLite vector migration: schema version 3 table/index
  migration complete; vector write/query APIs and vector persistence remain
  deferred
- Phase 8.6 memory vector write preflight: write implementation approval
  handoff complete; vector write methods, vector writes, and vector
  persistence remain deferred
- Phase 8.7 memory SQLite fixture vector write: fixture-only
  `writeEmbeddingRecord(record)` implementation complete in
  `packages/memory-sqlite`; query/retrieval APIs, real vector persistence,
  Core routing, provider execution routing, UI behavior changes, and shell
  execution remain deferred
- Phase 8.8 memory vector query preflight: review-only SQLite
  `querySimilar(query)` implementation approval handoff complete; query
  execution, SQLite query methods, Core retrieval routing, provider execution
  routing, UI behavior changes, and real vector persistence remain deferred
- Phase 8.9 memory SQLite fixture vector query: fixture-only
  `querySimilar(query)` implementation complete in `packages/memory-sqlite`;
  Core retrieval routing, provider execution routing, real vector persistence,
  Desktop/UI behavior changes, raw vector/text exposure, and shell execution
  remain deferred
- Phase 8.10 memory retrieval routing preflight: review-only Core routing
  approval handoff complete; Core runtime behavior, provider execution
  routing, UI/default opt-in changes, provider visibility changes, and raw
  vector/text exposure remain deferred
- Phase 8.11 Core memory retrieval routing approval gate: approval-only Core
  read-routing handoff complete; Core runtime behavior, product recall
  injection, provider execution routing, Memory repository contract changes,
  Desktop/UI changes, vector persistence, and raw vector/text exposure remain
  deferred
- Phase 8.12 Core memory retrieval read routing: opt-in fixture-only Core
  read route complete through injected `EmbeddingMemoryRetrievalPort`; Core
  Host env wiring, Desktop/UI behavior, provider execution routing, vector
  writes, real vector persistence, SQLite migrations, and raw vector/text
  exposure remain deferred
- Phase 8.13 Core Host memory retrieval env wiring approval gate:
  approval-only Core Host env wiring handoff complete; env reads, CoreRuntime
  construction changes, retrieval port injection, Desktop/UI behavior changes,
  provider execution routing, vector writes, real vector persistence, SQLite
  migrations, and raw vector/text exposure remain deferred
- Phase 8.14 Core Host fixture memory retrieval env wiring: explicit opt-in
  env wiring complete for fixture-only `EmbeddingMemoryRetrievalPort` reads;
  real provider output as query vectors, Memory vector writes, real vector
  persistence, Desktop/UI controls, provider visibility/default opt-in changes,
  SQLite migrations, and raw vector/text exposure remain deferred
- Phase 8.15 provider query vector approval gate: approval-only Core Host
  handoff complete for a future provider-backed query-vector resolver; env
  reads, provider execution routing for retrieval, helper `embed` calls, raw
  vectors, vector persistence, Memory vector writes, Desktop/UI controls,
  provider visibility/default opt-in changes, SQLite migrations, and shell
  execution remain deferred
- Phase 8.16 provider-backed query vector: explicit opt-in Core Host resolver
  complete using the existing local embedding provider execution path only
  when every retrieval/provider execution gate is enabled; Memory vector
  writes, vector persistence, Desktop/UI controls, provider visibility/default
  opt-in changes, SQLite migrations, raw vector/text exposure, and shell
  execution remain deferred
- Phase 8.17 provider query vector acceptance preflight: preflight-only Core
  Host diagnostic approval handoff complete; acceptance env reads, runtime
  Python reads, model artifact path reads, artifact verification, helper
  startup, provider execution, helper `embed`, raw vectors, vector
  persistence, Memory vector writes, Desktop/UI changes, provider
  visibility/default opt-in changes, SQLite migrations, and shell execution
  remain deferred
- Phase 8.18 provider query vector acceptance diagnostic: explicit opt-in Core
  Host one-shot diagnostic runner complete for the Phase 8.16 product path;
  Memory vector writes, vector persistence, Desktop/UI changes, provider
  visibility/default opt-in changes, SQLite migrations, downloads, persistent
  caches, raw vector/text/diagnostic exposure, and shell execution remain
  deferred
- Phase 8.19 provider vector write approval gate: approval-only Core Host
  handoff complete for future provider-backed Memory vector writes; env reads,
  provider execution routing for writes, helper `embed` for stored vectors,
  Memory vector writes, vector persistence, SQLite migrations, UI/Desktop
  changes, provider visibility/default opt-in changes, raw vector/text/
  diagnostic exposure, and shell execution remain deferred
- Phase 8.20 provider vector write implementation: explicit opt-in Core Host
  repository wrapper complete for newly accepted minimized user messages;
  default behavior, historical batch indexing, Desktop/UI controls, provider
  visibility/default opt-in changes, SQLite schema/indexes, raw vector/text/
  diagnostic exposure, downloads, persistent model caches, and shell execution
  remain deferred
- Phase 8.21 provider vector write acceptance diagnostic: explicit opt-in
  one-shot Core Host diagnostic complete for the Phase 8.20 product path using
  a temporary Memory database and sanitized vector metadata only; default
  behavior, historical batch indexing, Desktop/UI controls, provider
  visibility/default opt-in, raw vector/text/diagnostic exposure, downloads,
  persistent caches, and shell execution remain deferred
- Phase 8.22 provider vector retrieval preflight: review-only gate complete
  for future provider-written vector retrieval; env reads, Core Host routing
  changes, CoreRuntime changes, product reads from provider vector records,
  Desktop/UI controls, provider visibility/default opt-in changes, raw
  vector/text/diagnostic exposure, SQLite migrations, and shell execution
  remain deferred
- Phase 8.23 provider vector retrieval routing: explicit opt-in Core Host
  routing complete for provider-written vectors using exact same-model
  alignment; default behavior, Desktop/UI controls, provider visibility/default
  opt-in changes, raw vector/text/diagnostic exposure, SQLite migrations,
  artifact access, downloads, persistent caches, historical batch indexing,
  and shell execution remain deferred
- Phase 8.24 provider vector retrieval acceptance preflight: review-only
  handoff complete for a future real local diagnostic of provider-written
  retrieval; env reads, artifact verification, helper embed, temporary or
  persistent vector writes, provider-written retrieval execution, Desktop/UI
  changes, provider visibility/default opt-in changes, raw vector/text/
  diagnostic exposure, downloads, persistent caches, SQLite migrations, and
  shell execution remain deferred
- Phase 8.25 provider vector retrieval acceptance diagnostic: one-shot
  diagnostic runner complete behind explicit opt-in; the approved
  temporary-artifact chained diagnostic passed with SHA-256 verification,
  provider-vector write/read, sanitized recall, and cleanup
- Phase 8.26 provider vector retrieval developer-alpha usage test plan: Core
  Host plan-only gate complete; implementation and enablement remain blocked
  pending separate product, security, and release approval
- Phase 8.27 provider vector retrieval developer-alpha implementation:
  explicit opt-in developer-alpha gate complete for bounded provider-vector
  write/read usage; default behavior, Desktop/UI controls, provider
  visibility/default opt-in, release policy, persistent model caches,
  historical indexing, raw outputs, and shell execution remain deferred
- Phase 8.28 provider vector retrieval developer-alpha runbook:
  documentation-only usage runbook, env checklist, rollback checklist, stop
  conditions, and sanitized telemetry expectations complete
- Phase 8.29 provider vector retrieval developer-alpha usage session:
  one-shot local usage runner complete; approved artifact-backed session
  passed with sanitized provider-vector write/read, exact-source rollback, and
  cleanup evidence
- Phase 8.30 provider vector retrieval continuous alpha preflight: Core Host
  preflight complete for sanitized observation, disable, rollback, bounded
  usage, source minimization, fail-closed no-recall, and release scope
- Phase 8.31 provider vector retrieval developer-alpha continuous usage:
  explicit opt-in bounded continuous session API complete; real execution
  remained blocked until the separate Phase 8.32 acceptance approval
- Phase 8.32 provider vector retrieval continuous alpha acceptance:
  temporary-artifact continuous acceptance passed as developer-alpha evidence
  only with SHA-256 verification, temporary Memory DB, exact-source rollback,
  cleanup, and no default/UI/provider/release behavior changes
- Phase 8.33 continuous alpha operator runbook and promotion gate:
  documentation, preflight, and fixture-only promotion gate complete for
  future tester expansion approval; no tester expansion, artifact access,
  helper execution, provider-vector execution, default behavior change,
  SQLite migration, persistent cache, historical indexing, raw output
  exposure, shell execution, release policy change, or product SLO
- Phase 8.34 tester expansion approval packet: packet-only approval proposal
  and release-readiness checklist complete for possible bounded small-cohort
  developer-alpha review; no tester expansion, real usage session, env reads,
  artifact access, helper execution, provider-vector execution, default/UI/
  provider visibility change, persistent cache, SQLite migration, historical
  indexing, release policy change, shell execution, or product SLO
- Phase 8.35 bounded tester expansion dry-run preflight: operator checklist,
  env gate checklist, rollback dry-run checklist, sanitized report schema,
  stop conditions, and release gate checklist complete; no tester invitations,
  tester expansion, real usage session, env reads, artifact access, helper
  execution, provider-vector execution, default/UI/provider visibility change,
  persistent cache, SQLite migration, historical indexing, release policy
  change, shell execution, or product SLO
- Phase 8.36 bounded tester expansion approval request preflight:
  product/security/release approval request packet complete for a later
  bounded execution run; no tester invitations, tester expansion, real usage
  session, env reads, artifact access, helper execution, provider-vector
  execution, default/UI/provider visibility change, persistent cache, SQLite
  migration, historical indexing, release policy change, shell execution, or
  product SLO
- Phase 8.37 bounded tester expansion execution run: bounded execution runner
  and explicit command surface complete; current shell lacks approved
  gate/runtime/model/database env values, so real execution was not started.
  Default behavior, Desktop/UI/provider visibility, fixture fallback,
  historical indexing, persistent cache, SQLite migration, release policy,
  shell execution, raw output exposure, and product SLO remain unchanged
- Phase 9.1 tool governance: provider-neutral contract and fixture executor
  complete; real OS execution remains disabled
- Phase 10.1 local voice capability contract: provider-neutral preflight and
  fixture preparation complete; real local STT/TTS execution remains disabled
- Phase 10.2 local voice fixture benchmark harness: deterministic fixture
  measurements complete; real speech metrics and execution remain deferred
- Phase 10.3 local voice runtime isolation: pending adapter boundary and
  fail-closed approval guard complete; runtime dependencies remain deferred
- Phase 10.4 local voice runtime acceptance preflight: deferred review
  aggregate complete; runtime-backed capture remains blocked
- Phase 11.1 OCR, screen, and vision contract guards: provider-neutral
  fixture preparation complete; real visual capture and model execution remain
  disabled
- Phase 11.2 visual fixture benchmark harness: deterministic fixture
  measurement complete; real visual metrics and execution remain deferred
- Phase 11.3 visual runtime isolation: pending adapter boundary complete;
  runtime dependencies, screen capture, and model execution remain deferred
- Phase 11.4 visual runtime acceptance preflight: deferred review aggregate
  complete; runtime-backed capture remains blocked
- Phase 12.1 model lifecycle and Windows packaging preflight: dry-run guard
  complete; installer, update, and rollback decisions remain deferred
- Phase 12.2 model lifecycle fixture harness: in-memory install, upgrade, and
  rollback planning complete; side effects remain disabled
- Phase 12.3 developer-alpha hardening: provider-neutral preflight and
  deterministic fixture guard complete; release side effects remain disabled
- Real local model downloads and model runtime execution are not enabled yet

## Requirements

- Windows 10/11 for the desktop app and microphone testing
- Node.js `>=22.12.0`
- npm
- Git

## Quick Start

```powershell
npm install
npm run verify
npm run start
```

`npm run start` launches the built Electron app. Use `npm run dev` when you
want to build and launch in one command.

## Voice Setup

1. Launch Jarvis-K with `npm run start`.
2. Open the voice service settings from the left sidebar settings button.
3. Enter Xunfei RTASR `AppID` and a rotated `APIKey`.
4. Save. Electron stores the configuration with `safeStorage`; credentials are
   sent to Core Host through private child-process IPC.
5. Press and hold the microphone button, speak for at least one second, then
   release.

The UI shows `VOICE FRAMES`, `VOICE RMS`, `VOICE PEAK`, and
`VOICE TRANSCRIPT` to help distinguish microphone capture issues from provider
recognition issues.

Never put real provider credentials in source, `.env`, Git history, issue
comments, screenshots, or chat logs.

## Commands

```powershell
npm run typecheck
npm test
npm run check:boundaries
npm run check:sensitive-artifacts
npm run build
npm run verify
npm run smoke:desktop
npm run smoke:desktop:fixture-inference
npm run smoke:desktop:local-embedding-composition
npm run smoke:runtime-transformers
npm run smoke:runtime-transformers:fixture
npm run diagnostic:local-embedding:helper-embed
npm run diagnostic:local-embedding:provider-execution-acceptance
npm run diagnostic:memory-retrieval:provider-query-vector-acceptance
npm run diagnostic:memory-retrieval:provider-vector-write-acceptance
npm run diagnostic:memory-retrieval:provider-vector-read-acceptance
npm run diagnostic:memory-retrieval:provider-vector-read-temporary-artifact
npm run usage:memory-retrieval:developer-alpha
npm run acceptance:runtime-transformers:approved-artifact
```

The Transformers runtime smoke requires an approved Python environment path:

```powershell
$env:JARVIS_K_RUNTIME_PYTHON='C:\path\to\python.exe'
npm run smoke:runtime-transformers
```

The runtime-backed local embedding provider remains explicit opt-in. The
Phase 7.37 model-load-only path requires a separately approved local artifact
directory:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
```

The Phase 7.42 provider execution path requires the same gates plus the
separate execution opt-in:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
```

The Phase 7.40 helper embed diagnostic runner is separate from provider
execution and requires its own explicit opt-in:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm run diagnostic:local-embedding:helper-embed
```

The diagnostic report is sanitized and must not expose raw inputs, vectors,
artifact paths, private paths, signed URLs, credentials, or raw helper output.

The Phase 7.43 provider execution acceptance diagnostic is separate from the
Phase 7.40 helper diagnostic and verifies the product command path:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm run diagnostic:local-embedding:provider-execution-acceptance
```

It uses temporary memory/model lifecycle paths and prints only a sanitized
pass/degraded/fail report.

The Phase 8.18 provider-backed Memory retrieval query-vector acceptance
diagnostic verifies the Phase 8.16 product path through `agent.sendMessage`:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm run diagnostic:memory-retrieval:provider-query-vector-acceptance
```

It uses temporary memory/model lifecycle paths and prints only sanitized recall
metadata and fixed reason codes. It does not write Memory vectors or persist
runtime vectors.

The Phase 8.20 provider-backed Memory vector write path remains explicit
opt-in and indexes only newly accepted minimized user messages:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
```

It does not batch-index historical records, add UI controls, expose raw
vectors/text, or change default opt-in behavior.

The Phase 8.21 provider-backed Memory vector write acceptance diagnostic
verifies the Phase 8.20 product path through `agent.sendMessage`:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITE_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm run diagnostic:memory-retrieval:provider-vector-write-acceptance
```

It uses a temporary Memory database and prints only sanitized write metadata
and fixed reason codes. It does not batch-index historical records or expose
raw vectors/text.

The Phase 8.23 provider-written Memory vector retrieval path remains explicit
opt-in and reads only vectors written under the approved local embedding model
ID:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
```

It does not run by default, batch-index historical records, add UI controls,
expose raw vectors/text, or change provider visibility.

The Phase 8.25 provider-written Memory vector retrieval acceptance diagnostic
verifies the Phase 8.23 read route with one provider vector write followed by
one provider-vector retrieval read:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm run diagnostic:memory-retrieval:provider-vector-read-acceptance
```

It uses a temporary Memory database and prints only sanitized recall metadata
and fixed reason codes. It does not batch-index historical records, expose raw
vectors/text/paths, write persistent caches, run SQLite migrations, or change
default behavior.

The temporary-artifact Phase 8.25 chained diagnostic materializes only the
approved pinned artifact set into a temporary directory, verifies SHA-256
digests, and then runs the same provider-vector retrieval acceptance path in
one process:

```powershell
npm run diagnostic:memory-retrieval:provider-vector-read-temporary-artifact
```

It never prints the temporary artifact path, raw vectors, raw text, raw helper
diagnostics, signed URLs, or credentials, and it removes the temporary
directory on exit. If the configured Python runtime lacks the approved
Transformers dependencies, it stops before downloading artifacts with a
sanitized `runtime_dependencies_missing` reason. The approved temporary
Python environment run passed artifact materialization, SHA-256 verification,
provider-vector write/read, sanitized recall, and cleanup.

The Phase 8.26 provider-vector retrieval developer-alpha usage test plan
reserved a future explicit opt-in and did not enable it:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA='1'
```

That plan-only wave did not read the env key, expose UI controls, change
provider visibility, batch-index history, or change default behavior. The
separate Phase 8.27 implementation and Phase 8.29 usage-session approvals now
govern the controlled local alpha path described below.

The approved Phase 8.29 developer-alpha usage runner requires all existing
retrieval/provider gates, the developer-alpha gate, an approved runtime/model
pair, and an explicit Memory database path. Configure values in a fresh
PowerShell session without printing private paths only after separate product,
security, and release approval for an additional usage session:

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON = Read-Host 'Approved python.exe path'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR = Read-Host 'Approved local model artifact directory'
$env:JARVIS_K_MEMORY_DB_PATH = Read-Host 'Explicit Memory database path'

npm run usage:memory-retrieval:developer-alpha
```

The runner sends only two bounded synthetic messages by default, prints only
sanitized status/count metadata, and performs exact-source rollback. It must
not be run with placeholder paths, historical indexing, raw output exposure,
persistent model caches, SQLite migrations, UI/provider visibility changes, or
default opt-in changes. The first approved real local session passed as
diagnostic evidence; another real session requires separate approval.

Phase 8.31 adds a bounded continuous-session API and an explicit command
example. It keeps one supervised Core Host child alive for at most five
minimized messages, supports operator stop/disable, stops on gate revocation
or degraded recall by default, and performs exact-source rollback:

```powershell
npm run usage:memory-retrieval:developer-alpha:continuous
```

This command remains disabled unless the full existing gate chain, approved
runtime/model values, explicit Memory database path, and Phase 8.30 preflight
approval flag are present. It was not executed during Phase 8.31
implementation. A real artifact-backed session requires a separate acceptance
approval.

Phase 8.32 adds the one-time temporary-artifact acceptance command:

```powershell
npm run usage:memory-retrieval:developer-alpha:continuous:temporary-artifact
```

The approved local run passed with approved artifact materialization,
SHA-256 verification, two bounded synthetic messages, provider-vector
write/read, exact-source rollback, and cleanup. It remains developer-alpha
evidence only and must not be treated as default behavior, product SLO,
installer/update policy, UI control, provider visibility, or broader tester
enablement.

The fixture smoke creates only a temporary random model outside the repository
and removes it after the run. It does not download or access a real model.

Real Xunfei connectivity acceptance is opt-in:

```powershell
$env:JARVIS_K_REAL_PROVIDER_ACCEPTANCE='1'
npm run acceptance:xunfei
```

The real-provider acceptance script requires credentials to be saved through
the local settings window first. It must not be enabled in default CI.

## Workspace

- `packages/contracts`: protocol DTOs, schemas, IPC channel names, and bridge
  types only.
- `packages/capabilities`: provider-neutral device capability, model
  governance, installability, operation supervision, and resource scheduling
  ports.
- `packages/inference-adapter-fixture`: deterministic test-only embedding,
  intent routing, OCR, and reranking providers with no downloads, native
  runtime, or network access.
- `packages/inference-adapter-embedding-local`: Phase 6 fail-closed local
  embedding provider readiness descriptor and configuration gate reports.
- `packages/inference-runtime-transformers-local`: provider-local artifact
  guards, Python Transformers helper, and supervised child-process transport.
- `packages/memory`: provider-neutral memory ports and schemas.
- `packages/memory-sqlite`: SQLite-backed message, conversation, summary,
  health, export/import, fixture vector query/write, and sanitized vector
  metadata persistence.
- `packages/voice`: platform-neutral Voice Engine state machine and session
  policies.
- `packages/voice-capture-browser`: browser microphone, AudioContext,
  AudioWorklet, PCM conversion, frame aggregation, and capture diagnostics.
- `packages/voice-adapter-xunfei`: Xunfei signing, RTASR WebSocket behavior,
  parsing, retry, buffering, and finalization.
- `packages/core`: application runtime and snapshots using injected memory,
  voice, capability, and model governance interfaces.
- `apps/core-host`: concrete composition root for Core, Voice Engine, memory,
  device capability, and model governance adapters.
- `apps/desktop`: Electron security boundary, supervision, safeStorage
  settings, and IPC.
- `apps/ui`: React display state and user intents.

## Documentation

- [Architecture](docs/architecture.md)
- [Developer onboarding](docs/developer-onboarding.md)
- [Security](SECURITY.md)
- [Phase 4 completion](docs/phase-4-completion.md)
- [Phase 4 progress](docs/phase-4-progress.md)
- [Phase 4.5 inference readiness](docs/phase-4.5-inference-readiness.md)
- [Phase 5 completion](docs/phase-5-completion.md)
- [Phase 5 progress](docs/phase-5-progress.md)
- [Phase 6 progress](docs/phase-6-progress.md)
- [Phase 7 progress](docs/phase-7-progress.md)
- [Phase 7.18 tokenizer/config integration review](docs/phase-7-18-tokenizer-config-integration-review.md)
- [Phase 7.19 runtime helper protocol](docs/phase-7-19-runtime-helper-protocol.md)
- [Real Python Transformers runtime](docs/phase-7-24-real-python-transformers-runtime.md)
- [Phase 7.25 real artifact access approval](docs/phase-7-25-real-artifact-access-approval.md)
- [Phase 7.26 real artifact benchmark](docs/phase-7-26-real-artifact-benchmark.md)
- [Phase 7.27 peak memory sampling diagnostic](docs/phase-7-27-memory-sampling-diagnostic.md)
- [Phase 7.28 provider composition approval gate](docs/phase-7-28-provider-composition-approval-gate.md)
- [Phase 7.29 resource profile product and security approval](docs/phase-7-29-resource-profile-product-security-approval.md)
- [Phase 7.30 memory sampling gap disposition](docs/phase-7-30-memory-sampling-gap-disposition.md)
- [Phase 7.31 alternative resource evidence](docs/phase-7-31-alternative-resource-evidence.md)
- [Phase 7.32 provider composition implementation review](docs/phase-7-32-provider-composition-implementation-review.md)
- [Phase 7.33 provider composition implementation](docs/phase-7-33-provider-composition-implementation.md)
- [Phase 7.34 runtime session factory preflight](docs/phase-7-34-runtime-session-factory-preflight.md)
- [Phase 7.35 runtime session factory lifecycle](docs/phase-7-35-runtime-session-factory-lifecycle.md)
- [Phase 7.36 model load and inference preflight](docs/phase-7-36-model-load-inference-preflight.md)
- [Phase 7.37 model artifact path handoff and helper load](docs/phase-7-37-model-artifact-load.md)
- [Phase 7.38 helper embed implementation preflight](docs/phase-7-38-helper-embed-preflight.md)
- [Phase 7.39 helper embed diagnostic harness preflight](docs/phase-7-39-helper-embed-diagnostic-harness-preflight.md)
- [Phase 7.40 helper embed diagnostic execution](docs/phase-7-40-helper-embed-diagnostic-execution.md)
- [Phase 7.41 provider execution wiring preflight](docs/phase-7-41-provider-execution-wiring-preflight.md)
- [Phase 7.42 provider execution wiring](docs/phase-7-42-provider-execution-wiring.md)
- [Phase 7.43 provider execution acceptance diagnostic](docs/phase-7-43-provider-execution-acceptance-diagnostic.md)
- [Phase 7.20 controlled artifact cache executor](docs/phase-7-20-controlled-artifact-cache-executor.md)
- [Phase 7.21 runtime adapter isolation guard](docs/phase-7-21-runtime-adapter-isolation-guard.md)
- [Phase 7.22 runtime acceptance preflight](docs/phase-7-22-runtime-acceptance-preflight.md)
- [Phase 7.23 composition preflight](docs/phase-7-23-composition-preflight.md)
- [Phase 8.1 embedding retrieval contract](docs/phase-8-1-embedding-retrieval-contract.md)
- [Phase 8.2 retrieval benchmark harness](docs/phase-8-2-retrieval-benchmark-harness.md)
- [Phase 8.3 memory vector execution preflight](docs/phase-8-3-memory-vector-execution-preflight.md)
- [Phase 8.4 memory vector migration preflight](docs/phase-8-4-memory-vector-migration-preflight.md)
- [Phase 8.5 memory SQLite vector migration](docs/phase-8-5-memory-sqlite-vector-migration.md)
- [Phase 8.6 memory vector write preflight](docs/phase-8-6-memory-vector-write-preflight.md)
- [Phase 8.7 memory SQLite fixture vector write](docs/phase-8-7-memory-sqlite-fixture-vector-write.md)
- [Phase 8.8 memory vector query preflight](docs/phase-8-8-memory-vector-query-preflight.md)
- [Phase 8.9 memory SQLite fixture vector query](docs/phase-8-9-memory-sqlite-fixture-vector-query.md)
- [Phase 8.10 memory retrieval routing preflight](docs/phase-8-10-memory-retrieval-routing-preflight.md)
- [Phase 8.11 Core memory retrieval routing approval gate](docs/phase-8-11-core-memory-retrieval-routing-approval-gate.md)
- [Phase 8.12 Core memory retrieval read routing](docs/phase-8-12-core-memory-retrieval-read-routing.md)
- [Phase 8.13 Core Host memory retrieval env wiring approval gate](docs/phase-8-13-core-host-memory-retrieval-env-wiring-approval-gate.md)
- [Phase 8.14 Core Host fixture memory retrieval env wiring](docs/phase-8-14-core-host-fixture-memory-retrieval-env-wiring.md)
- [Phase 8.15 provider query vector approval gate](docs/phase-8-15-provider-query-vector-approval-gate.md)
- [Phase 8.16 provider-backed query vector](docs/phase-8-16-provider-backed-query-vector.md)
- [Phase 8.17 provider query vector acceptance preflight](docs/phase-8-17-provider-query-vector-acceptance-preflight.md)
- [Phase 8.18 provider query vector acceptance diagnostic](docs/phase-8-18-provider-query-vector-acceptance-diagnostic.md)
- [Phase 8.19 provider vector write approval gate](docs/phase-8-19-provider-vector-write-approval-gate.md)
- [Phase 8.20 provider vector write implementation](docs/phase-8-20-provider-vector-write-implementation.md)
- [Phase 8.21 provider vector write acceptance diagnostic](docs/phase-8-21-provider-vector-write-acceptance-diagnostic.md)
- [Phase 8.22 provider vector retrieval preflight](docs/phase-8-22-provider-vector-retrieval-preflight.md)
- [Phase 8.23 provider vector retrieval routing](docs/phase-8-23-provider-vector-retrieval-routing.md)
- [Phase 8.24 provider vector retrieval acceptance preflight](docs/phase-8-24-provider-vector-retrieval-acceptance-preflight.md)
- [Phase 8.25 provider vector retrieval acceptance diagnostic](docs/phase-8-25-provider-vector-retrieval-acceptance-diagnostic.md)
- [Phase 8.26 provider vector retrieval developer-alpha usage test plan](docs/phase-8-26-provider-vector-retrieval-developer-alpha-plan.md)
- [Phase 8.27 provider vector retrieval developer-alpha implementation](docs/phase-8-27-provider-vector-retrieval-developer-alpha-implementation.md)
- [Phase 8.28 provider vector retrieval developer-alpha runbook](docs/phase-8-28-provider-vector-retrieval-developer-alpha-runbook.md)
- [Phase 8.29 provider vector retrieval developer-alpha usage session](docs/phase-8-29-provider-vector-retrieval-developer-alpha-usage-session.md)
- [Phase 8.30 provider vector retrieval continuous alpha preflight](docs/phase-8-30-provider-vector-retrieval-continuous-alpha-preflight.md)
- [Phase 8.31 provider vector retrieval developer-alpha continuous usage](docs/phase-8-31-provider-vector-retrieval-developer-alpha-continuous-usage.md)
- [Phase 8.32 provider vector retrieval continuous alpha acceptance](docs/phase-8-32-provider-vector-retrieval-continuous-alpha-acceptance.md)
- [Phase 8.33 continuous alpha operator runbook and promotion gate](docs/phase-8-33-continuous-alpha-operator-runbook-promotion-gate.md)
- [Phase 8.34 tester expansion approval packet](docs/phase-8-34-tester-expansion-approval-packet.md)
- [Phase 8.35 bounded tester expansion dry-run preflight](docs/phase-8-35-bounded-tester-expansion-dry-run-preflight.md)
- [Phase 8.36 bounded tester expansion approval request preflight](docs/phase-8-36-bounded-tester-expansion-approval-request-preflight.md)
- [Phase 8.37 bounded tester expansion execution run](docs/phase-8-37-bounded-tester-expansion-execution-run.md)
- [Phase 9.1 tool governance contract](docs/phase-9-1-tool-governance-contract.md)
- [Phase 10.1 local voice capability contract](docs/phase-10-1-local-voice-contract.md)
- [Phase 10.2 local voice fixture benchmark harness](docs/phase-10-2-local-voice-benchmark-harness.md)
- [Phase 10.3 local voice runtime isolation](docs/phase-10-3-local-voice-runtime-isolation.md)
- [Phase 10.4 local voice runtime acceptance preflight](docs/phase-10-4-local-voice-runtime-acceptance-preflight.md)
- [Phase 11.1 OCR, screen, and vision contract guards](docs/phase-11-1-visual-contract-guards.md)
- [Phase 11.2 visual fixture benchmark harness](docs/phase-11-2-visual-fixture-benchmark-harness.md)
- [Phase 11.3 visual runtime isolation](docs/phase-11-3-visual-runtime-isolation.md)
- [Phase 11.4 visual runtime acceptance preflight](docs/phase-11-4-visual-runtime-acceptance-preflight.md)
- [Phase 12.1 model lifecycle and Windows packaging preflight](docs/phase-12-1-model-lifecycle-preflight.md)
- [Phase 12.2 model lifecycle fixture harness](docs/phase-12-2-model-lifecycle-fixture-harness.md)
- [Phase 12.3 developer-alpha hardening](docs/phase-12-3-developer-alpha-hardening.md)
- [Phase 4 model candidate audit](docs/phase-4-model-candidate-audit.md)
- [Phase 3 progress](docs/phase-3-progress.md)
- [Phase 2 results](docs/phase-2-results.md)
- [Phase 2 progress](docs/phase-2-progress.md)

## Boundaries

Run `npm run check:boundaries` before committing. Important rules:

- Contracts must not import runtime packages.
- Capabilities must stay provider-neutral and must not import Electron, React,
  SQLite, WebSocket, Python, CUDA, ONNX, or concrete model runtimes.
- Memory interfaces must stay provider-neutral; SQLite implementation details
  stay inside `packages/memory-sqlite`.
- Voice Engine must not import Electron, browser APIs, WebSocket libraries,
  credentials, Core, UI, or concrete providers.
- Xunfei-specific behavior must stay inside `packages/voice-adapter-xunfei`.
- Core must use injected interfaces for voice, memory, capabilities, and model
  governance.
- `apps/core-host` is the only concrete provider composition root.
- Desktop owns IPC, supervision, and security boundaries.
- UI sends intents and renders state; it must not own provider policy.
