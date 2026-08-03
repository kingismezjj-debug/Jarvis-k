# Phase 8.11 Core Memory Retrieval Routing Approval Gate

Recorded on 2026-08-03 as the independent Core read-routing approval gate
after the Phase 8.10 Memory retrieval routing preflight.

## Scope

This wave adds an approval-only gate in `@jarvis-k/core` for a future Core
Memory retrieval read-routing implementation. It records the planned Core turn
assembly surface, injected provider-neutral retrieval port, explicit opt-in
gate, sanitized recall payload, bounded result behavior, fixture fallback,
degraded fail-closed behavior, and rollback review.

The accepted gate status is only
`ready_for_core_retrieval_routing_implementation_approval`. It does not change
`CoreRuntime`, does not route retrieval into product behavior, does not change
the `MemoryRepository` contract, and does not add Desktop IPC, UI behavior, or
provider visibility changes.

## Approval Meaning

The gate confirms that product and security approvals exist for the next
implementation review, Phase 8.10 is ready, the Core turn assembly plan and
provider-neutral retrieval port were reviewed, the explicit opt-in gate
`JARVIS_K_ENABLE_MEMORY_RETRIEVAL_ROUTING` was reviewed, and fixture-only Core
routing tests, fail-closed behavior, fallback behavior, and rollback behavior
are planned.

It remains fail-closed if Core runtime behavior changes, retrieval routing is
implemented, provider execution is routed, the Memory repository contract
changes, Desktop IPC or UI behavior changes, provider visibility changes,
default opt-in changes, Phase 7.43 or real runtime vectors are persisted, raw
vectors/text/private paths/raw diagnostics are exposed, or retrieval output can
become shell execution.

## Hard Pause

The following remain deferred until separate explicit product and security
approval:

- implementing Core retrieval read routing in `CoreRuntime`;
- injecting Memory recall into product turn assembly;
- connecting provider execution output to Memory writes;
- persisting Phase 7.43 or real runtime vectors;
- changing Desktop IPC, UI defaults, provider visibility, or default opt-in;
- changing the provider-neutral `MemoryRepository` contract; and
- exposing raw vectors, raw text, private paths, or raw diagnostics.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/core
npx vitest run packages/core/test/memory-retrieval-routing-approval-gate.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, provider
execution behavior, or runtime product behavior.
