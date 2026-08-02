# Phase 7.36 Model Load and Inference Preflight

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a Core Host preflight guard for the next possible model artifact
path, helper `load`, and helper `embed` implementation stage.

The guard is approval preparation only. It does not read model artifact paths,
pass a model directory to the helper, call helper `load`, call helper `embed`,
access artifacts, write caches, download artifacts, load a model, execute real
local embedding inference, expose raw vectors, change provider registration,
change default opt-in behavior, or change UI visibility.

## Review Boundary

The preflight requires evidence for:

- Core Host remaining the only composition root;
- provider shell remaining explicit opt-in only;
- Phase 7.35 helper lifecycle wiring being complete;
- runtime Python environment handling already approved;
- approved manifest availability;
- approved artifact pin review;
- model artifact path policy review;
- digest verification before model load;
- helper `load` request and response contract review;
- helper `embed` request and response contract review;
- resource lease before helper load;
- sanitized error mapping;
- fixture fallback preservation;
- startup, restart, and rollback review;
- separate product approval requirement; and
- separate security approval requirement.

When complete, the preflight can return only
`ready_for_model_load_inference_approval`. That status is a handoff for a
future product and security approval; it is not permission to read paths, load,
embed, or expose model-backed vectors.

## Safety Boundary

The guard fixes these outputs to `false`:

- product approval granted;
- security approval granted;
- model artifact path read;
- model directory passed to helper;
- helper `load` called;
- helper `embed` called;
- model artifact access enabled;
- cache writes enabled;
- downloads enabled;
- model load enabled;
- real inference enabled;
- raw embedding vectors exposed;
- provider registration changed;
- default opt-in enabled;
- UI visibility changed;
- raw diagnostics exposed;
- private path exposure enabled;
- signed URL or credential persistence enabled; and
- model output shell execution enabled.

Degraded results mean review evidence is incomplete while side effects remain
blocked. Blocked results mean an unsafe side effect, approval mutation, or
visibility/diagnostic regression was requested.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-model-load-inference-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

Desktop smoke tests are not required for this wave because Core Host startup,
provider composition, Desktop IPC, UI visibility, and execution behavior do not
change.

All commands above passed for this wave.

## Next Hard Pause

Do not read model artifact paths, pass a model directory to the helper, call
helper `load`, call helper `embed`, access artifacts, write caches, download
artifacts, load the real model, expose raw runtime diagnostics, expose raw
embedding vectors, change provider registration behavior, change default
opt-in behavior, change UI visibility, or enable real local embedding
inference without separate product and security approval for that exact
model-load and inference implementation.
