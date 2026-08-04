# Phase 8.35 Bounded Tester Expansion Dry-Run Preflight

Recorded on 2026-08-04 after Phase 8.34 produced the tester expansion
approval packet and release-readiness checklist.

## Scope

This wave adds an operator checklist and dry-run preflight for a possible
bounded small-cohort developer-alpha expansion of continuous provider-vector
retrieval.

The wave is dry-run only. It does not expand tester scope, send tester
invitations, run a real usage session, read environment values, read runtime or
model paths, access artifacts, start the helper, call helper `load` or
`embed`, execute provider-vector write/read paths, write Memory vector data,
change Desktop/UI/provider visibility/default behavior, create persistent
model caches, run SQLite migrations, batch-index historical Memory, alter
release/installer/update/model lifecycle policy, or define a product SLO.

## Operator Checklist

The generated checklist covers:

- Phase 8.32 acceptance plus Phase 8.33 and 8.34 gates;
- candidate tester roster policy without sending invitations;
- synthetic or explicitly consented minimized message policy;
- temporary or separately reviewed alpha Memory database policy;
- operator stop and exact-source rollback ownership;
- no default, UI, provider visibility, or release behavior changes.

## Env Gate Checklist

The dry-run records only gate names and does not read values. A future approved
session must configure the gate chain only during the approved test window.

The checklist covers the developer-alpha gate, Memory retrieval gates, local
embedding provider gates, and runtime/model gate names while keeping all env
reads blocked in this wave.

## Rollback Dry-Run

The rollback dry-run records only the procedure:

- record test-window source IDs without raw text;
- close the supervised child before delete in a later approved session;
- delete only exact `modelId + sourceType + sourceId` rows;
- report only deleted counts and fixed reason codes;
- verify follow-up launches omit the developer-alpha env chain.

## Sanitized Report Schema

Future reports may include only:

- status;
- fixed reason codes;
- tester and message limits;
- test window duration;
- observation count;
- recall status;
- rollback deleted count;
- cleanup status;
- unsafe flags.

Raw vectors, raw text, private paths, signed URLs, credentials, raw helper
diagnostics, artifact paths, and raw env values remain blocked.

## Stop Conditions

The dry-run preflight repeats the hard stops from Phase 8.34:

- raw vectors or raw text exposed;
- private paths, credentials, or signed URLs exposed;
- artifact digest verification failed;
- helper or retrieval degraded without no-recall fallback;
- rollback or cleanup failed;
- Desktop/UI/provider visibility/default behavior changed;
- SQLite migration or historical batch indexing requested;
- retrieval/model output connected to shell or Windows execution.

## Verification

Completed targeted local verification on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-tester-expansion-dry-run-preflight.test.ts
```

- Core Host build: PASS.
- Bounded tester expansion dry-run preflight normal, degraded, blocked,
  release, and sensitive-output tests: PASS, 5 tests.
- `npm.cmd run verify`: PASS, including 131 test files and 689 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-degraded`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not expand tester scope, send tester invitations, run a real usage session,
read runtime/model env values, access artifacts, start helpers, execute
provider-vector write/read, write real Memory vector data, enable UI controls,
change provider visibility or default behavior, create persistent model caches,
batch-index historical Memory, run SQLite migrations, change
release/installer/update/model lifecycle policy, declare a product SLO, or
route retrieval/model output into Windows or PowerShell actions without
separate product, security, and release approval.
