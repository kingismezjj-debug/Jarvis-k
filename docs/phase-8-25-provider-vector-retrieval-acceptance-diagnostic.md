# Phase 8.25 Provider Vector Retrieval Acceptance Diagnostic

Recorded on 2026-08-03 after Phase 8.24 provider-vector retrieval acceptance
preflight received separate product and security approval.

## Scope

This wave adds the one-shot Core Host diagnostic runner for provider-written
Memory vector retrieval behind:

```powershell
JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READ_ACCEPTANCE=1
```

The runner requires the existing explicit gates for Memory retrieval routing,
provider-backed query vectors, provider vector writes, provider vector reads,
local embedding provider composition, local embedding provider execution, the
approved local Python runtime, and the approved local model artifact directory.

When all gates are present, the diagnostic verifies the approved artifact
SHA-256 pin set, starts Core Host with a temporary Memory database, writes one
fixed diagnostic message through the existing Phase 8.20 provider vector-write
product path, sends a second fixed diagnostic message through the Phase 8.23
provider-vector retrieval route, and reports only sanitized recall metadata.

## Safety Boundary

The diagnostic report exposes only status, fixed reason codes, command-status
flags, recall status/mode, bounded match count, bounded query dimension count,
cleanup status, and unsafe-exposure booleans.

The runner does not print or persist raw vectors, raw message text, artifact
paths, private paths, signed URLs, credentials, raw helper diagnostics, model
files, or model cache paths. It does not download artifacts, write persistent
model caches, batch-index historical records, run SQLite schema/index
migrations, change Desktop IPC/UI behavior, change provider visibility, change
default opt-in behavior, or convert retrieval/model output into Windows or
PowerShell operations.

## Local Diagnostic Result

Completed locally in the current Codex process on 2026-08-03:

```powershell
npm.cmd run diagnostic:memory-retrieval:provider-vector-read-acceptance
```

- Result: sanitized `degraded`.
- Reason code: `acceptance_opt_in_missing`.
- Artifact digest verification: `not_run`.
- Product-path write/read commands: `not_run`.
- Raw vectors, raw text, private paths, raw diagnostics, downloads, persistent
  cache writes, SQLite migrations, UI/Desktop/provider visibility/default
  opt-in changes, historical batch indexing, and shell execution: all reported
  disabled.

The current Codex process did not have the required opt-in and local
runtime/artifact environment variables configured, so this run intentionally
stopped before reading Python/model paths, verifying artifacts, launching the
helper, writing temporary vectors, or querying provider-written vectors. A
true artifact-backed pass still requires rerunning this same diagnostic from
an approved shell with all required gates configured.

## Temporary Artifact Chained Diagnostic

After separate product and security approval, a chained diagnostic runner was
added:

```powershell
npm.cmd run diagnostic:memory-retrieval:provider-vector-read-temporary-artifact
```

The runner materializes only the approved pinned artifact set into a temporary
directory, verifies SHA-256 digests, passes the temporary directory only through
same-process diagnostic environment wiring, runs the existing Phase 8.25
provider-vector retrieval acceptance path, and removes the temporary directory
on exit.

The runner reports only sanitized status, fixed reason codes, artifact count,
aggregate artifact bytes, manifest-size match, cleanup status, and the nested
sanitized 8.25 diagnostic result. It does not print temporary artifact paths,
raw vectors, raw text, raw helper diagnostics, private paths, signed URLs, or
credentials.

The current local run stopped before artifact download because the resolved
Python runtime does not have the required `torch`, `transformers`, and
`safetensors` dependencies available:

- Result: sanitized `degraded`.
- Reason code: `runtime_dependencies_missing`.
- Artifact materialization: `not_run`.
- Artifact digest verification: `not_run`.
- Cleanup: `passed`.

True artifact-backed Phase 8.25 acceptance still requires a separately
approved temporary Python Transformers environment or an already approved
runtime with the required dependencies installed.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-acceptance-diagnostic.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run diagnostic:memory-retrieval:provider-vector-read-acceptance
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
node --check tests/memory-provider-vector-retrieval-temporary-artifact-acceptance.mjs
npm.cmd run diagnostic:memory-retrieval:provider-vector-read-temporary-artifact
```

- Memory provider vector retrieval acceptance diagnostic tests: PASS, 5 tests.
- Core Host build: PASS.
- Diagnostic script safety-degraded run: PASS with sanitized report.
- `npm.cmd run verify`: PASS, 124 test files and 646 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Temporary artifact chained diagnostic syntax check: PASS.
- Temporary artifact chained diagnostic local run: PASS as sanitized degraded,
  `runtime_dependencies_missing`, before artifact download.

## Next Hard Pause

Do not claim provider-vector retrieval acceptance is artifact-backed passed
until the diagnostic is rerun with the approved local Python runtime, approved
local model artifact directory, SHA-256 verification, temporary Memory
database, provider vector write, provider-vector retrieval read, sanitized
recall report, and cleanup all passing.

Do not create or install a temporary Python Transformers environment for this
diagnostic without separate product and security approval.

Do not enable provider-vector retrieval by default, batch-index historical
records, expose Desktop/UI controls, change provider visibility/default
opt-in, write persistent model caches, download artifacts, persist or expose
raw vectors/raw text/private paths/raw diagnostics, run SQLite schema/index
migrations, or convert retrieval/model output into Windows/PowerShell
operations without a separate approval.
