# Phase 7.38 Helper Embed Implementation Preflight

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a Core Host preflight guard for the next possible helper
`embed` implementation stage.

The guard is approval preparation only. It does not call helper `embed`, return
embedding vectors, route vectors to Memory, persist vectors, expose vectors in
logs or diagnostics, enable product inference, change provider registration,
change default opt-in behavior, or change UI visibility.

## Review Boundary

The preflight requires evidence for:

- `apps/core-host` remaining the only concrete composition root;
- runtime-backed local embedding remaining explicit opt-in only;
- Phase 7.35 helper lifecycle being complete;
- Phase 7.37 artifact digest verification and helper `load` being complete;
- approved runtime Python and model directory env handling;
- approved manifest availability;
- helper `embed` request and response contract review;
- loaded session identifier handoff review;
- resource lease before helper `embed`;
- input batch and text bounds;
- embedding dimension validation;
- vector finite-value and shape sanitization;
- timeout and cancellation behavior;
- sanitized error mapping;
- operation supervisor boundary;
- fixture fallback preservation;
- separate product approval requirement; and
- separate security approval requirement.

When complete, the preflight can return only
`ready_for_helper_embed_approval`. That status is a handoff for a future
product and security approval; it is not permission to call helper `embed` or
let vectors enter product flows.

## Safety Boundary

The guard fixes these outputs to `false`:

- product approval granted;
- security approval granted;
- helper `embed` called;
- embedding vectors returned;
- vectors routed to Memory;
- vectors persisted;
- vectors logged or exposed;
- product inference enabled;
- provider registration changed;
- default opt-in enabled;
- UI visibility changed;
- raw diagnostics exposed;
- private path exposure enabled;
- signed URL or credential persistence enabled;
- model output shell execution enabled;
- downloads enabled;
- persistent cache writes enabled; and
- Memory schema migration enabled.

Degraded results mean review evidence is incomplete while side effects remain
blocked. Blocked results mean an unsafe side effect, approval mutation,
visibility regression, diagnostic leak, cache/download mutation, or Memory
migration was requested.

## Verification

The following gates passed for this wave:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npm.cmd test -- apps/core-host/test/local-embedding-helper-embed-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

`npm.cmd run verify` passed with 103 test files and 513 tests.

## Next Hard Pause

Do not call helper `embed`, expose real embedding vectors, route vectors to
Memory or product inference flows, persist vectors, change provider
registration/default opt-in behavior, change UI visibility, add downloads,
write persistent model caches, or run a Memory schema/index migration without
separate product and security approval for that exact helper embed
implementation wave.
