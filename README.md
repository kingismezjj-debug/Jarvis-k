# Jarvis-K

A supervised Windows desktop assistant built with Electron, React and TypeScript.

[CURRENT_STATUS.md](CURRENT_STATUS.md) is the **only current product summary**: capabilities, validation scope, recovery limitations and release state. Version labels alone do not identify a tested artifact; use the commit and artifact hashes.

The previous Phase/status ledger is preserved in [historical README baselines](docs/history/readme-baselines-before-ui-3l-0.md). Historical acceptance applies only to its recorded commit, artifact and environment.

## Requirements

- Windows 10/11 for the desktop app and microphone testing
- Node.js `>=22.12.0`
- npm
- Git

## Quick Start

```powershell
npm.cmd ci
npm.cmd run verify
npm.cmd start
```

`npm start` and `npm run dev` both build all workspaces before launching Electron.
No separate manual build is required. A failed build stops startup; `electron .`
is a low-level built-output entry, not the supported clean-development command.
Use `npm.cmd` in Windows PowerShell when its policy blocks `npm.ps1`.
See the [short development baseline](docs/developer-onboarding.md).

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
- [Phase 8 closeout and Memory alpha product decision](docs/phase-8-closeout-memory-alpha-product-decision.md)
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
- [Phase 12.4 model lifecycle implementation approval request](docs/phase-12-4-model-lifecycle-implementation-approval-request.md)
- [Phase 12.5 model lifecycle runtime/cache approval and acceptance](docs/phase-12-5-model-lifecycle-runtime-cache-approval-request.md)
- [Phase 12.6 model lifecycle alpha closeout and freeze](docs/phase-12-6-model-lifecycle-alpha-closeout.md)
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
