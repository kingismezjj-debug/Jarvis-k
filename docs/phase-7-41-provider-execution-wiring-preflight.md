# Phase 7.41 Provider Execution Wiring Preflight

Recorded on 2026-08-02 for the planned local embedding runtime.

## Scope

This wave adds a Core Host review-only guard for a future runtime-backed local
embedding provider execution wiring step.

The guard does not modify provider execution, session factory behavior,
provider registration, default opt-in, UI visibility, Desktop IPC, Memory
retrieval, Memory schema/index state, downloads, persistent cache writes,
artifact access, helper launch, helper `load`, helper `embed`, or vector
handling.

## Review Boundary

The preflight requires evidence for:

- `apps/core-host` remaining the only concrete composition root;
- provider composition remaining explicit opt-in;
- future provider execution having a separate explicit opt-in:
  `JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`;
- Phase 7.38 helper embed preflight being complete;
- Phase 7.39 diagnostic harness preflight being complete;
- Phase 7.40 diagnostic runner being complete;
- the diagnostic runner remaining separate from the product execution path;
- exact Core Host provider execution diff review;
- session factory embed wiring review;
- digest verification before provider embed;
- helper `load` before provider embed;
- resource lease lifecycle review;
- request validation boundary review;
- embedding result schema boundary review;
- vector shape and finite-value validation review;
- vector redaction from logs;
- timeout, cancellation, and release behavior;
- sanitized error mapping;
- operation supervisor boundary;
- fixture fallback preservation;
- startup, restart, rollback, and desktop smoke planning;
- separate product approval requirement; and
- separate security approval requirement.

When complete, the preflight can return only
`ready_for_provider_execution_approval`. That status is a handoff for a future
product and security approval; it is not permission to wire helper `embed` into
the product provider path.

## Safety Boundary

The guard fixes these outputs to `false`:

- product approval granted;
- security approval granted;
- provider execution enabled;
- session factory embed enabled;
- helper `embed` called;
- embedding vectors returned to product flows;
- vectors routed to Memory;
- vectors persisted;
- vectors logged or exposed;
- Memory schema migration enabled;
- provider registration changed;
- default opt-in enabled;
- UI visibility changed;
- downloads enabled;
- persistent cache writes enabled;
- diagnostic opt-in reused for product execution;
- model artifact access during preflight;
- raw diagnostics exposed;
- private path exposure enabled;
- signed URL or credential persistence enabled; and
- model output shell execution enabled.

## Verification

Completed locally on 2026-08-02:

```powershell
npm.cmd run build -w @jarvis-k/core-host
npx vitest run apps/core-host/test/local-embedding-provider-execution-wiring-preflight.test.ts
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run smoke:desktop
npm.cmd run smoke:desktop:fixture-inference
npm.cmd run smoke:desktop:local-embedding-composition
```

- Core Host provider execution wiring preflight tests: PASS, 4 tests.
- `npm.cmd run build -w @jarvis-k/core-host`: PASS.
- `npm.cmd run verify`: PASS, 106 test files and 525 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not wire helper `embed` into the provider execution path, enable
`JARVIS_K_ENABLE_LOCAL_EMBEDDING_PROVIDER_EXECUTION`, return real embedding
vectors to product flows, route vectors to Memory, persist vectors, run a
Memory schema/index migration, change provider registration/default opt-in
behavior, change UI visibility, add downloads, write persistent model caches,
or create installer/update behavior without separate product and security
approval for that exact implementation wave.
