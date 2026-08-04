# Phase 8.28 Provider Vector Retrieval Developer-Alpha Runbook

Recorded on 2026-08-04 after Phase 8.27 completed local verification, push,
and CI.

## Scope

This wave adds the operator runbook, environment checklist, rollback checklist,
and safety checklist for the controlled local developer-alpha provider-vector
retrieval usage test.

This is documentation only. It does not change Core Host, Core, Desktop, UI,
provider visibility, model lifecycle, installer/update policy, SQLite schema,
runtime dependencies, downloads, cache behavior, or default opt-in behavior.

## Preconditions

Before a developer-alpha usage test run, confirm:

- Phase 8.27 commit `c7d7172` is present and CI is green.
- The workspace is clean or all unrelated local changes are intentionally
  excluded from the run.
- The approved Python Transformers runtime exists on the machine.
- The approved local embedding model artifact directory exists on the machine.
- The model artifact directory contains only the approved pinned artifact set.
- The tester uses only synthetic or explicitly accepted test-window messages.
- Historical Memory batch indexing remains disabled.
- No Desktop/UI/provider visibility/default behavior change is enabled.
- No raw vectors, raw text, private paths, signed URLs, credentials, or raw
  helper diagnostics will be printed, copied, committed, or persisted outside
  the approved Memory vector rows.

## Environment Checklist

Use a fresh PowerShell session for the test window. Do not paste real private
paths into docs, commits, screenshots, or chat logs.

```powershell
# Run from the Jarvis-K repository root.

$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES='1'
$env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER='1'
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION='1'

$env:JARVIS_K_RUNTIME_PYTHON = Read-Host 'Approved python.exe path'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR = Read-Host 'Approved local model artifact directory'
```

Confirm that all gates are configured without printing values:

```powershell
$keys = @(
  'JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA',
  'JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING',
  'JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR',
  'JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES',
  'JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS',
  'JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER',
  'JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION',
  'JARVIS_K_RUNTIME_PYTHON',
  'JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR'
)

$keys | ForEach-Object {
  $value = [Environment]::GetEnvironmentVariable($_)
  [pscustomobject]@{
    key = $_
    configured = [bool]($value -and $value.Trim().Length -gt 0)
  }
} | ConvertTo-Json -Compress
```

Confirm the runtime and model directory exist without printing either path:

```powershell
[pscustomobject]@{
  pythonExists = Test-Path -LiteralPath $env:JARVIS_K_RUNTIME_PYTHON -PathType Leaf
  modelDirExists = Test-Path -LiteralPath $env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR -PathType Container
} | ConvertTo-Json -Compress
```

Expected result:

```json
{"pythonExists":true,"modelDirExists":true}
```

## Usage Window Checklist

For the first developer-alpha usage window:

- Start with a small synthetic conversation.
- Send one to five short user messages that are safe to index.
- Avoid credentials, tokens, signed URLs, private file paths, personal data,
  sensitive source material, and large pasted documents.
- Keep source text bounded and intentional; do not use historical Memory
  backfill.
- Confirm normal conversation behavior continues if retrieval degrades to
  no-recall.
- Record only sanitized observations: status, reason codes, recall mode,
  recall match count, vector write count, rollback delete count, and whether
  cleanup completed.
- Do not record raw message text, raw vectors, artifact paths, helper logs,
  stack traces, signed URLs, or credentials.

## Rollback Checklist

To stop the developer-alpha path for the current shell:

```powershell
Remove-Item Env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_DEVELOPER_ALPHA -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_WRITES -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_VECTOR_READS -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_PROVIDER_QUERY_VECTOR -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION -ErrorAction SilentlyContinue
Remove-Item Env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER -ErrorAction SilentlyContinue
```

For provider vectors written during the test window, use the Phase 8.27
exact-source rollback helper through a separately approved maintenance or
diagnostic wrapper. Deletion must be limited to the test-window source IDs and
the approved local embedding model ID. Do not run raw SQL in normal operator
flow, do not delete historical Memory vectors outside the test window, and do
not print raw source text or vector payloads.

## Stop Conditions

Stop the usage test and keep the workspace verifiable if any of these occur:

- Artifact digest verification fails.
- The helper load or embed path returns a sanitized failure reason.
- Retrieval does not degrade to no-recall on failure.
- Any raw vector, raw text, private path, signed URL, credential, or raw helper
  diagnostic appears in logs, reports, screenshots, committed files, or chat.
- Provider vectors are written for messages outside the approved test window.
- Historical batch indexing is observed.
- Desktop/UI/provider visibility/default opt-in behavior changes.
- SQLite schema/index migration is requested or observed.
- Retrieval/model output is connected to Windows or PowerShell execution.

## Verification

Required checks for this documentation wave:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

- `npm.cmd run verify`: PASS, including 125 test files and 657 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

No desktop smoke is required for this wave because it changes documentation
only. The next implementation or diagnostic wave that touches Core Host,
Desktop, IPC, provider visibility, or UI must run the relevant desktop smokes.

## Next Hard Pause

Do not run a real developer-alpha usage session, create a maintenance wrapper
for rollback deletion, write persistent provider vectors outside a bounded
test window, expose a UI control, broaden tester scope, change release policy,
or promote the feature toward default behavior without separate product,
security, and release approval.
