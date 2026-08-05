# Phase 8.38 Memory Alpha Implementation

Recorded on 2026-08-05 after Product, Security, and Release approved the
developer-alpha implementation scope.

## Outcome

Memory alpha implementation is complete as a Core Host composition layer. It
reuses the existing provider-neutral Core retrieval and turn-assembly
contract, provider-vector write/read wiring, SQLite exact-source rollback, and
sanitized failure classification.

The implementation is developer-alpha only and remains default-disabled.

## Runtime Contract

- The provider-vector path requires the existing explicit gate chain,
  including the developer-alpha opt-in.
- Missing or revoked gates fail closed: provider-vector writes stop and
  provider-vector reads stop without blocking ordinary accepted message
  persistence.
- Core receives only the existing bounded `memoryRecall` metadata. Raw text,
  raw vectors, helper diagnostics, private paths, credentials, and signed URLs
  are not returned or persisted by this layer.
- Core remains provider-neutral. Concrete provider composition lives in
  `apps/core-host`.
- Existing fixture-only retrieval remains available when only the base
  retrieval routing gate is enabled.

## Retention, Disable, And Rollback

The alpha retention scope is `new_accepted_user_messages`. Provider-vector
retention is bounded to five newly accepted source messages per session by
default. The ordinary Memory message rows remain under the existing Memory
repository behavior; the alpha session owns only the provider-vector rows it
successfully writes.

`disable()`:

1. stops further provider-vector writes and provider-vector reads;
2. deletes only the exact `modelId + sourceType + sourceId` rows tracked by
   the current session;
3. returns sanitized state, counts, rollback status, and fixed reason codes;
4. reports `degraded` if any exact-source deletion does not complete.

No SQLite schema/index migration, historical re-indexing, persistent model
cache, installer/update policy, or new IPC/UI control was added.

## Implementation Surfaces

- `apps/core-host/src/memory-alpha-implementation.ts`
- `apps/core-host/src/memory-provider-vector-write-wiring.ts`
- `apps/core-host/src/index.ts`
- `apps/core-host/test/memory-alpha-implementation.test.ts`

The write wrapper records a source ID only after SQLite accepts the vector.
The alpha composition supplies dynamic gate checks and a bounded retention
callback, then passes the existing retrieval port and routing options into
`CoreRuntime`.

## Verification

Focused Memory alpha and retrieval regression coverage passed:

```text
6 test files
89 tests
```

Full verification passed on 2026-08-05:

```text
135 test files
718 tests
dependency boundaries: PASS
sensitive artifact guard: PASS
workspace typecheck and build: PASS
```

No real model artifact was materialized, no Python helper was started, no real
provider inference was run, and no Memory alpha acceptance session was
started by this implementation wave.

## Next Hard Pause

Before any real local Memory alpha usage session, re-materialization,
helper/provider execution, tester expansion, default opt-in, UI/IPC change,
model lifecycle change, or release packaging, obtain the separate approval
required by the Phase 8 closeout decision.
