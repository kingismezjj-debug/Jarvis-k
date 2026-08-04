# Phase 8.33 Continuous Alpha Operator Runbook and Promotion Gate

Recorded on 2026-08-04 after Phase 8.32 continuous alpha acceptance passed as
sanitized developer-alpha evidence.

## Scope

This wave adds an operator runbook and promotion gate for continuous
developer-alpha provider-vector retrieval. It defines how to observe, stop,
disable, roll back, and decide whether a later tester expansion or longer
usage window can be requested.

This wave is preflight and documentation only. It does not expand tester
scope, run another real usage session, access artifacts, start the helper,
execute provider-vector write/read paths, change UI/Desktop/provider
visibility/default behavior, batch-index historical Memory, create persistent
model caches, run SQLite migrations, or define a product SLO.

## Operator Runbook

Before any future continuous alpha session, the operator must confirm:

- Phase 8.30 preflight, Phase 8.31 implementation, and Phase 8.32 acceptance
  evidence are complete.
- The full explicit gate chain is intentionally configured only for the
  approved test window.
- Runtime and model artifact handling uses approved local paths or approved
  temporary materialization only.
- SHA-256 digest verification completes before helper load/embed.
- The Memory database policy is explicit: either a temporary test-window
  database or a separately reviewed alpha database.
- Source text is minimized to newly accepted, explicitly approved test-window
  messages.
- Sanitized telemetry records only status, counts, dimensions, recall mode,
  cleanup state, rollback counts, and fixed reason codes.
- Raw vectors, raw text, private paths, signed URLs, credentials, and raw
  diagnostics are never printed, copied, committed, or persisted.

## Stop Conditions

Stop the session and keep the workspace verifiable if any of these occur:

- artifact digest verification fails;
- helper startup, load, embed, timeout, cancellation, or cleanup degrades;
- retrieval fails to degrade to no-recall safely;
- rollback delete fails or deletes outside the exact test-window source IDs;
- provider vectors are written outside the approved source selection rules;
- raw vectors, raw text, raw diagnostics, credentials, signed URLs, or private
  paths appear in reports, logs, screenshots, commits, or chat;
- Desktop/UI/provider visibility/default behavior changes;
- historical Memory batch indexing is requested or observed;
- SQLite schema/index migration is requested or observed;
- retrieval/model output is connected to Windows or PowerShell execution.

## Rollback Checklist

For a future approved session, rollback must:

- unset or omit the developer-alpha env chain for subsequent launches;
- close the supervised Core Host child before deleting vector rows;
- delete only exact `modelId + sourceType + sourceId` provider-vector rows
  created during the approved test window;
- report only aggregate deleted counts and fixed reason codes;
- verify cleanup without printing raw source text, raw vectors, private paths,
  signed URLs, credentials, or helper diagnostics.

## Promotion Gate

A later tester expansion or longer usage window requires separate product,
security, and release approval. The next approval packet must include:

- Phase 8.32 acceptance evidence;
- clean local verification and CI;
- bounded tester cohort and time window;
- reviewed Memory database policy;
- reviewed source minimization policy;
- sanitized observation checklist;
- incident stop and rollback process;
- explicit release boundary stating that the feature remains developer-alpha
  only unless a later release gate says otherwise.

The promotion gate can only reach:

```text
ready_for_tester_expansion_approval
```

It does not itself grant tester expansion, default enablement, UI controls,
provider visibility changes, installer/update policy, product SLO, persistent
cache policy, or broader release behavior.

## Verification

Completed targeted local verification on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-continuous-alpha-promotion-gate.test.ts
```

- Core Host build: PASS.
- Promotion gate normal, degraded, blocked, policy-schema, and
  sensitive-output tests: PASS, 5 tests.
- `npm.cmd run verify`: PASS, including 129 test files and 679 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-degraded`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.
- `npm.cmd run smoke:desktop:fixture-inference`: PASS.
- `npm.cmd run smoke:desktop:local-embedding-composition`: PASS.

## Next Hard Pause

Do not expand tester scope, run longer continuous sessions, enable UI controls,
change provider visibility/default behavior, create persistent model caches,
batch-index historical Memory, run SQLite migrations, change release policy,
or route retrieval/model output into Windows or PowerShell actions without a
separate product, security, and release approval.
