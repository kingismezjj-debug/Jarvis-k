# Phase 8.18 Provider Query Vector Acceptance Diagnostic

Recorded on 2026-08-03 as the separately approved implementation after the
Phase 8.17 provider query-vector acceptance preflight.

## Scope

This wave adds a one-shot Core Host acceptance diagnostic for the Phase 8.16
provider-backed Memory retrieval query-vector product path.

The diagnostic is gated by:

- product and security approval in the runner input;
- Phase 8.16 provider-backed query-vector wiring completion;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING=1`;
- `JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`;
- an approved `JARVIS_K_RUNTIME_PYTHON`; and
- an approved `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`.

After the gates pass, the diagnostic verifies the approved SHA-256 artifact
pin set, starts Core Host with temporary memory and model lifecycle paths, and
sends one fixed `agent.sendMessage` through the product command path. The
message path may resolve a provider-backed query vector and run one bounded
`querySimilar` read.

## Safety Boundary

The report exposes only sanitized status, fixed reason codes, recall status,
recall mode, recall match count, query dimension count, cleanup status, and
unsafe side-effect flags.

It does not expose raw vectors, raw message text, artifact paths, private
paths, signed URLs, credentials, raw helper diagnostics, artifact digests, or
stored Memory text.

The diagnostic does not write Memory vector records, persist Phase 7.43 or
real runtime vectors, change SQLite schema or indexes, change Desktop IPC,
change UI behavior, change provider visibility, change provider default
opt-in, download artifacts, write persistent model caches, or convert
retrieval/model output into Windows/PowerShell operations.

## Command

```powershell
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm.cmd run diagnostic:memory-retrieval:provider-query-vector-acceptance
```

When the local opt-in or runtime/model environment is absent, the script
returns a sanitized degraded report without launching Core Host or accessing
artifacts.

## Verification

Completed locally on 2026-08-03:

```powershell
npx vitest run apps/core-host/test/memory-retrieval-provider-query-vector-acceptance-diagnostic.test.ts
npm.cmd run build -w @jarvis-k/core-host
npm.cmd run diagnostic:memory-retrieval:provider-query-vector-acceptance
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector
```

- Memory retrieval provider query-vector acceptance diagnostic tests: PASS, 5
  tests.
- Core Host build: PASS.
- `npm.cmd run diagnostic:memory-retrieval:provider-query-vector-acceptance`
  without local opt-ins: DEGRADED safely with
  `acceptance_opt_in_missing`; no Core Host product command was called and no
  artifact digest verification was run.
- `npm.cmd run verify`: PASS, 118 test files and 609 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.

## Next Hard Pause

Do not write Memory vector records from real provider output, persist runtime
vectors, run additional real-provider acceptance beyond this diagnostic, add
Desktop IPC or UI controls for Memory retrieval, change provider visibility or
default opt-in behavior, change SQLite schema or indexes, expose raw vectors,
raw text, private paths, or raw diagnostics, or convert retrieval/model output
into Windows/PowerShell operations without a separate product and security
approval for that exact implementation wave.
