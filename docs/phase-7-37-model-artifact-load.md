# Phase 7.37 Model Artifact Path Handoff and Helper Load

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave implements the separately approved Core Host model artifact path
handoff and helper `load` step for the runtime-backed local embedding provider.

The implementation remains explicit opt-in only. It reads
`JARVIS_K_LOCAL_EMBEDDING_MODEL_DIR` only inside `apps/core-host` after
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER=1` has selected the runtime-backed
provider path. Core Host verifies every approved local embedding artifact
against the pinned SHA-256 plan before launching the supervised Python helper
and before sending the private helper `load` request.

The helper load request may carry the local model directory through private
child-process IPC. The helper does not echo the directory in responses. The
existing internal helper environment fallback remains only for previously
approved smoke and acceptance scripts.

## Safety Boundary

This wave allows only:

- reading the approved local model artifact directory env value in
  `apps/core-host`;
- reading local artifact files for SHA-256 verification;
- launching the already approved supervised Python helper after verification;
- passing the verified directory to helper `load`;
- receiving the sanitized helper load session identifier; and
- releasing the helper and resource lease on failure or completion.

This wave still blocks:

- network download;
- persistent cache writes;
- signed URL, credential, token, or private path persistence;
- raw diagnostics exposure;
- helper `embed`;
- returning real embedding vectors;
- provider registration/default opt-in behavior changes;
- UI default visibility changes; and
- converting model output into Windows or PowerShell operations.

Failure modes map to sanitized runtime errors and trigger helper shutdown plus
resource lease release through the existing provider `finally` path.

## Verification

The following gates passed for this wave:

```powershell
npm.cmd run build -w @jarvis-k/inference-runtime-transformers-local
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-runtime-session-factory.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-protocol.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-client.test.ts packages/inference-runtime-transformers-local/test/runtime-helper-process-transport.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

`npm.cmd run verify` passed with 102 test files and 509 tests.

## Next Hard Pause

Do not call helper `embed`, expose real embedding vectors, route real local
embedding output into product retrieval or tool flows, change provider
registration/default opt-in behavior, change UI visibility, add persistent
model cache writes, download artifacts, or change Windows execution behavior
without a separate product and security approval for that exact execution
wave.
