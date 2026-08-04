# Phase 8.34 Tester Expansion Approval Packet

Recorded on 2026-08-04 after Phase 8.33 produced the continuous alpha
operator runbook and promotion gate.

## Scope

This wave prepares the next approval packet and release-readiness checklist for
possible bounded tester expansion of continuous developer-alpha provider-vector
retrieval.

The wave is packet-only. It does not approve expansion, add testers, run a real
usage session, read environment values, access artifacts, start the helper,
call helper `load` or `embed`, execute provider-vector write/read paths, write
Memory vectors, change Desktop/UI/provider visibility/default behavior, create
persistent model caches, run SQLite migrations, batch-index historical Memory,
alter installer/update/model lifecycle policy, or define a product SLO.

## Approval Packet

The generated packet is limited to:

- current scope: single local developer-alpha;
- requested next scope: bounded small-cohort developer-alpha;
- tester limit: at most 3 testers;
- message limit: at most 5 minimized messages per tester;
- time window: at most 2 hours;
- message policy: synthetic or explicitly consented minimized messages only;
- Memory database policy: temporary database or separately reviewed alpha
  database only;
- rollback policy: delete exact test-window provider vectors only;
- observation policy: sanitized counts, statuses, dimensions, and fixed reason
  codes only;
- stop policy: stop on any safety, runtime, retrieval, cleanup, or rollback
  regression.

The packet requires a separate product, security, and release approval before
any tester expansion or longer usage window can happen.

## Release-Readiness Checklist

The release checklist keeps the feature in developer-alpha evidence scope only.
It explicitly excludes:

- installer inclusion;
- automatic updates;
- default configuration;
- public user documentation as an enabled feature;
- product SLOs;
- model lifecycle policy changes;
- persistent model cache policy changes;
- upgrade or rollback policy changes.

The required evidence for a later expansion approval is:

- Phase 8.32 acceptance passed;
- Phase 8.33 promotion gate passed;
- local verify, boundary, and sensitive-artifact checks passed;
- GitHub Actions CI passed;
- bounded tester cohort and time window reviewed;
- Memory database and source minimization policy reviewed;
- sanitized observation, stop, and rollback plan reviewed.

## Hard Stops

A future expansion approval must stop immediately if any of these are true:

- raw vectors or raw text are exposed;
- private paths, credentials, or signed URLs are exposed;
- artifact digest verification fails;
- helper or retrieval degrades without safe no-recall fallback;
- rollback or cleanup fails;
- Desktop/UI/provider visibility/default behavior changes;
- SQLite migration or historical batch indexing is requested;
- retrieval/model output is connected to shell or Windows execution.

## Verification

Completed targeted local verification on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-tester-expansion-approval-packet.test.ts
```

- Core Host build: PASS.
- Tester expansion approval packet normal, degraded, blocked, release, and
  sensitive-output tests: PASS, 5 tests.
- `npm.cmd run verify`: PASS, including 130 test files and 684 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-degraded`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not expand tester scope, run a real usage session, read runtime/model env
values, access artifacts, start the helper, execute provider-vector write/read,
write real Memory vector data, enable UI controls, change provider visibility
or default behavior, create persistent model caches, batch-index historical
Memory, run SQLite migrations, change release/installer/update/model lifecycle
policy, declare a product SLO, or route retrieval/model output into Windows or
PowerShell actions without separate product, security, and release approval.
