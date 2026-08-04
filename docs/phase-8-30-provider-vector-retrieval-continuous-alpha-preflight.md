# Phase 8.30 Provider Vector Retrieval Continuous Alpha Preflight

Recorded on 2026-08-04 after the Phase 8.29 one-shot developer-alpha usage
session passed as sanitized diagnostic evidence.

## Scope

This wave adds a Core Host preflight guard for moving provider-vector retrieval
from one-shot usage evidence toward a controlled continuous developer-alpha
usage decision.

The guard is preflight only. It reviews observation, disable, rollback,
bounded usage, source minimization, sanitized telemetry, degraded no-recall
fallback, stop conditions, fixture fallback, release scope, and clean
verification evidence. A passing result means only:

```text
ready_for_continuous_alpha_usage_approval
```

It does not enable continuous alpha execution, read environment values, start
the Python helper, access model artifacts, write or query provider vectors,
change UI/Desktop/provider visibility/default behavior, or change release
policy.

## Observation Policy

The preflight records a sanitized observation policy:

- telemetry scope: sanitized counts, statuses, and fixed reason codes only;
- disable action: unset the developer-alpha env chain;
- rollback action: delete exact test-window provider vectors only;
- fallback mode: fail closed to no-recall;
- tester scope: single local developer-alpha;
- message scope: newly accepted minimized test-window messages only;
- recall bound: maximum five matches.

The policy explicitly disallows raw vector telemetry, raw text telemetry,
private path telemetry, SQLite migrations, historical batch indexing, UI
controls, provider visibility changes, and shell execution.

## Safety Boundary

This wave blocks continuous execution, env reads, runtime Python reads, model
artifact path reads, artifact access, downloads, helper startup/load/embed,
provider execution, provider-vector write/read execution, real Memory vector
writes, persistent model caches, SQLite schema/index migrations, historical
batch indexing, Desktop IPC changes, UI behavior changes, provider visibility
changes, default opt-in changes, raw vector/text/diagnostic exposure, private
path exposure, signed URL or credential persistence, and model-output shell
execution.

The report exposes only booleans, checked areas, policy names, prerequisite
env key names, and fixed reason codes. It does not include raw messages, raw
vectors, private paths, artifact paths, digests, URLs, credentials, signed
URLs, or helper diagnostics.

## Verification

Completed locally on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-continuous-alpha-preflight.test.ts
```

- Core Host build: PASS.
- Continuous alpha preflight normal, blocked, degraded, observation-policy,
  and sensitive-output tests: PASS, 5 tests.

Full required verification is also recorded in `docs/phase-7-progress.md`.

Completed full local verification on 2026-08-04:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

- `npm.cmd run verify`: PASS, including 127 test files and 667 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.

## Next Hard Pause

Do not enable continuous developer-alpha retrieval, run another real usage
session, access artifacts, create a persistent model cache, broaden tester
scope, expose UI/provider controls, batch-index historical Memory, run SQLite
migrations, expose raw vectors/text/private paths/raw diagnostics, or connect
retrieval/model output to Windows or PowerShell execution without separate
product, security, and release approval.
