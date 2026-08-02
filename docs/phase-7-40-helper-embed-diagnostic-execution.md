# Phase 7.40 Helper Embed Diagnostic Execution

Recorded on 2026-08-02 for the planned local embedding runtime.

## Approval

The user directly approved Phase 7.40 as a bounded helper `embed` diagnostic
execution wave.

This approval allows a real helper `embed` call only through the isolated Core
Host diagnostic runner and only when the dedicated diagnostic opt-in and the
approved runtime/model environment are present.

## Scope

This wave adds a Core Host diagnostic runner for the local embedding helper.
The runner can:

- require Phase 7.38 and Phase 7.39 preflight evidence;
- require product and security approval flags;
- require `JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC=1`;
- read `JARVIS_K_RUNTIME_PYTHON`;
- read `JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR`;
- verify the approved SHA-256 artifact pin set before helper launch;
- acquire and release a resource lease;
- start the supervised Python Transformers helper;
- call helper `health`, `load`, `embed`, and `shutdown`; and
- return only a sanitized diagnostic report.

The runner is not wired into product inference. It does not change provider
registration, default opt-in behavior, provider visibility, Desktop IPC, UI,
Memory retrieval, Memory schema/index state, downloads, or persistent cache
writes.

## Sanitized Report

The report may expose only:

- phase and mode;
- provider and public model id;
- status and fixed reason codes;
- bounded case/pass/degraded/fail counts;
- helper step status for digest verification, load, embed, and cleanup; and
- fixed safety booleans that remain false for vectors, raw input, Memory,
  product inference, visibility, downloads, caches, diagnostics, credentials,
  private paths, and shell execution.

The report must not expose raw input text, vector values, artifact paths,
private paths, SHA-256 values, signed URLs, credentials, raw helper diagnostics,
model files, or runtime stdout/stderr.

## Local Diagnostic Command

The command is opt-in and reports sanitized degraded status when the local
runtime environment is not configured:

```powershell
$env:JARVIS_K_ENABLE_LOCAL_EMBEDDING_EMBED_DIAGNOSTIC='1'
$env:JARVIS_K_RUNTIME_PYTHON='<approved-python-executable>'
$env:JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR='<approved-local-artifact-directory>'
npm.cmd run diagnostic:local-embedding:helper-embed
```

Do not use unapproved Python environments or model artifact directories.

## Verification

Completed locally on 2026-08-02:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/local-embedding-helper-embed-diagnostic-runner.test.ts
node tests/local-embedding-helper-embed-diagnostic.mjs
npm.cmd run diagnostic:local-embedding:helper-embed
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Core Host helper embed diagnostic runner tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `node tests/local-embedding-helper-embed-diagnostic.mjs`: PASS as sanitized
  degraded report with `diagnostic_opt_in_missing`; no helper launch, artifact
  access, load, or embed occurred.
- `npm.cmd run diagnostic:local-embedding:helper-embed`: PASS as sanitized
  degraded report with `diagnostic_opt_in_missing`; no helper launch, artifact
  access, load, or embed occurred.
- `npm.cmd run verify`: PASS, 105 test files and 521 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not wire helper `embed` into the provider execution path, return real
embedding vectors to product flows, route vectors to Memory, persist vectors,
run a Memory schema/index migration, change provider registration/default
opt-in behavior, change UI visibility, add downloads, write persistent model
caches, or create installer/update behavior without separate product and
security approval for that exact implementation wave.
