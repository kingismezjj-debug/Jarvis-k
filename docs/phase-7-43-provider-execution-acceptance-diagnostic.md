# Phase 7.43 Provider Execution Acceptance Diagnostic

Recorded on 2026-08-02 for the runtime-backed local embedding provider.

## Scope

This wave adds a one-shot Core Host acceptance diagnostic for the Phase 7.42
provider execution wiring.

The diagnostic is gated by:

- product and security approval in the runner input;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1`;
- `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION=1`;
- an approved `JARVIS_K_RUNTIME_PYTHON`;
- an approved `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`.

After the gates pass, the diagnostic verifies the approved SHA-256 artifact
pin set, starts Core Host with temporary memory and model lifecycle paths, and
sends `agent.generateEmbeddings` through the product command path.

## Safety Boundary

The report exposes only sanitized status, fixed reason codes, vector count,
dimension count, operation phase, and cleanup status.

It does not expose raw vector values, raw input text, artifact paths, private
paths, signed URLs, credentials, raw helper diagnostics, or artifact digests.

The diagnostic does not route vectors to Memory, persist vectors, change the
Memory schema or indexes, change provider default opt-in behavior, change UI
visibility, download artifacts, write persistent model caches, create
installer/update/rollback behavior, or convert model output into
Windows/PowerShell operations.

## Command

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION_ACCEPTANCE='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm.cmd run diagnostic:local-embedding:provider-execution-acceptance
```

When the local opt-in or runtime/model environment is absent, the script
returns a sanitized degraded report without launching Core Host or accessing
artifacts.

## Verification

Completed locally on 2026-08-02:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/local-embedding-provider-execution-acceptance-diagnostic.test.ts
npx vitest run apps/core-host/test/local-embedding-provider-execution-acceptance-diagnostic.test.ts apps/core-host/test/local-embedding-composition.test.ts apps/core-host/test/local-embedding-runtime-session-factory.test.ts
npm.cmd run diagnostic:local-embedding:provider-execution-acceptance
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Core Host build: PASS.
- Core Host provider execution acceptance diagnostic tests: PASS, 4 tests.
- Core Host local embedding composition, runtime session factory, and provider
  execution acceptance diagnostic tests: PASS, 20 tests.
- `npm.cmd run diagnostic:local-embedding:provider-execution-acceptance`
  without the local opt-ins: DEGRADED safely with
  `acceptance_opt_in_missing`; no Core Host product command was called and no
  artifact digest verification was run.
- Approved temporary Python Transformers environment and temporary artifact
  run: PASS. The run created only temporary directories, installed the pinned
  runtime requirements there, downloaded the approved artifact set, verified
  SHA-256 pins, and removed the temporary root after completion.
- Temporary artifact verification: PASS, 10 artifacts and 1,207,470,234 bytes.
- Runtime-backed product-path acceptance through `agent.generateEmbeddings`:
  PASS with sanitized `vectorCount: 1`, `dimensionCount: 1024`,
  `operationPhase: completed`, and `cleanupStatus: passed`.
- `npm.cmd run verify`: PASS, 107 test files and 532 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.
- Temp cleanup check after the approved runtime-backed acceptance run: PASS,
  0 leftover Phase 7.43 temporary directories.

## Next Hard Pause

Do not route embedding vectors to Memory, persist vectors, run a Memory
schema/index migration, expose local embedding controls in UI, change provider
default opt-in behavior, add downloads, write persistent model caches, create
installer/update/rollback behavior, or convert model output into
Windows/PowerShell operations without a separate product and security approval
for that exact implementation wave.
