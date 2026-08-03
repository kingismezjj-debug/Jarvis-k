# Phase 8.10 Memory Retrieval Routing Preflight

Recorded on 2026-08-03 as a Core routing implementation approval handoff
after the Phase 8.9 fixture-only SQLite vector query implementation.

## Scope

This wave adds a provider-neutral retrieval routing preflight in
`@jarvis-k/memory`. It defines the future Core recall injection plan, fixture
fallback review, bounded routing guards, sanitized recall observation shape,
and fixture-only safety reporting for normal, blocked, degraded, and
sanitized-output cases.

The accepted preflight status is only `ready_for_core_routing_approval`. It
does not change Core runtime behavior, does not route retrieval into product
flows, and does not change provider execution, provider visibility, or UI
defaults.

## Approval Meaning

The preflight confirms that the fixture write API, fixture query API, and
provider-neutral routing plan were reviewed, the fallback plan was reviewed,
bounded recall injection behavior was reviewed, and fixture-only routing tests
are present.

It remains fail-closed if any Core retrieval routing, provider execution
routing, UI or provider visibility change, default opt-in change, Phase 7.43
vector persistence, real runtime vector persistence, raw vector exposure, raw
text exposure, private path exposure, raw diagnostic exposure, or shell
execution is observed.

## Hard Pause

The following remain deferred until a separate explicit product and security
approval:

- connecting Memory retrieval to Core product behavior;
- changing Core runtime behavior or provider visibility;
- changing UI defaults or Desktop IPC behavior;
- connecting provider execution output to Memory writes;
- persisting Phase 7.43 or real runtime vectors; and
- exposing raw vectors, raw text, private paths, or raw diagnostics.

## Verification

```powershell
npm.cmd run build -w @jarvis-k/memory
npx vitest run packages/memory/test/embedding-retrieval-routing-preflight.test.ts
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
npm.cmd run typecheck
npm.cmd run verify
```

Desktop smoke tests are not required because this wave does not change Core
Host composition, Desktop IPC, UI DTOs, provider visibility, or provider
execution behavior.
