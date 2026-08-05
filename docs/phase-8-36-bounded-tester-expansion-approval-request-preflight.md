# Phase 8.36 Bounded Tester Expansion Approval Request Preflight

Recorded on 2026-08-04 after Phase 8.35 completed the bounded tester
expansion operator checklist and dry-run preflight.

## Scope

This wave adds a Core Host approval-request preflight for a possible bounded
small-cohort developer-alpha provider-vector retrieval execution run.

The wave is approval-request only. It does not approve expansion by itself,
expand tester scope, send tester invitations, run a real usage session, read
environment values, read runtime or model paths, access artifacts, start the
helper, call helper `load` or `embed`, execute provider-vector write/read
paths, write Memory vector data, change Desktop/UI/provider visibility/default
behavior, create persistent model caches, run SQLite migrations, batch-index
historical Memory, alter release/installer/update/model lifecycle policy, or
define a product SLO.

## Approval Request Packet

The generated packet contains three separate request texts for a later
execution run:

- product approval request for at most 3 testers, 5 minimized synthetic or
  explicitly consented messages per tester, and a 2 hour window;
- security approval request requiring the existing gate chain, SHA-256
  verification, source minimization, sanitized telemetry, timeout/cancellation
  and release handling, exact-source rollback, and fail-closed no-recall
  degradation;
- release approval request keeping the run developer-alpha evidence only and
  excluding installer, automatic update, default configuration, public user
  docs, release channel, lifecycle policy, cache policy, upgrade/rollback
  policy, and product SLO changes.

## Guarded Boundaries

The preflight keeps all execution boundaries false:

- no tester invitation or tester expansion in this phase;
- no real usage session;
- no env value reads;
- no runtime Python or model artifact path reads;
- no artifact access;
- no helper startup, load, or embed;
- no provider execution or provider-vector write/read;
- no Memory vector writes;
- no persistent model cache;
- no SQLite migration or historical batch indexing;
- no Desktop/UI/provider visibility/default opt-in change;
- no raw vectors, raw text, raw diagnostics, private paths, signed URLs, or
  credentials exposed or persisted;
- no shell or Windows operation from retrieval/model output;
- no release policy or product SLO change.

## Verification

Completed targeted local verification on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-bounded-tester-expansion-approval-request-preflight.test.ts
```

- Core Host build: PASS.
- Bounded tester expansion approval-request preflight normal, degraded,
  blocked, release, and sensitive-output tests: PASS, 5 tests.
- `npm.cmd run verify`: PASS, including 132 test files and 694 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-degraded`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

Push and GitHub Actions CI must pass before this wave can be marked complete.

## Next Hard Pause

Do not expand tester scope, send tester invitations, run a real usage session,
read runtime/model env values, access artifacts, start helpers, execute
provider-vector write/read, write real Memory vector data, enable UI controls,
change provider visibility or default behavior, create persistent model caches,
batch-index historical Memory, run SQLite migrations, change
release/installer/update/model lifecycle policy, declare a product SLO, or
route retrieval/model output into Windows or PowerShell actions without
separate product, security, and release approval for the execution run.
