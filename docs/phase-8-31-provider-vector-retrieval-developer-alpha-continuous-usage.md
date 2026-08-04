# Phase 8.31 Provider Vector Retrieval Developer-Alpha Continuous Usage

Recorded on 2026-08-04 after separate product, security, and release approval
for a controlled local developer-alpha usage implementation.

## Scope

This wave implements a bounded continuous developer-alpha session API inside
the Core Host boundary. The session keeps one supervised Core Host child alive
while the operator sends newly accepted, minimized test-window messages. It
collects only sanitized recall observations and performs exact-source rollback
when the operator stops or disables the session.

The implementation is available through:

```text
startMemoryProviderVectorDeveloperAlphaContinuousSession(...)
runMemoryProviderVectorDeveloperAlphaContinuousUsage(...)
```

The bounded example command is:

```powershell
npm.cmd run usage:memory-retrieval:developer-alpha:continuous
```

This command is not run as part of the implementation wave. A real local
session requires the approved runtime/model environment and a separately
approved acceptance run.

## Session Controls

The session:

- requires the Phase 8.30 preflight evidence flag and all existing explicit
  retrieval/provider/runtime gates;
- verifies the approved local model artifact before starting the Core Host
  child;
- allows at most five bounded messages per session;
- sanitizes input before sending it through the private Core Host child;
- keeps only source IDs in process memory for rollback;
- exposes only bounded status, counts, dimensions, recall mode, and fixed
  reason codes;
- stops on degraded recall by default;
- supports `disable()` for operator shutdown and `stop()` for normal session
  close;
- stops and rolls back if any required provider gate is revoked mid-session;
- closes the child before deleting exact test-window provider vectors.

The operator disable action is to call `disable()` and unset the developer-alpha
env chain for subsequent launches. The rollback action is limited to exact
`modelId + sourceType + sourceId` rows created by the current session.

## Safety Boundary

The session does not change Desktop IPC, UI behavior, provider visibility,
default opt-in, fixture fallback, release policy, installer/update policy, or
SQLite schema/indexes. It does not batch-index historical Memory and does not
persist raw text, raw vectors, private paths, signed URLs, credentials, helper
diagnostics, or model output.

Missing approvals, missing gates, invalid usage windows, unsafe side effects,
artifact verification failures, helper startup failures, message failures,
degraded retrieval, gate revocation, cleanup failures, and rollback failures
fail closed or produce a sanitized degraded report.

## Verification

Targeted verification completed locally on 2026-08-04:

```powershell
npm.cmd run build:core-host
npx vitest run apps/core-host/test/memory-provider-vector-retrieval-developer-alpha-continuous-usage.test.ts
```

- Core Host build: PASS.
- Continuous session normal, blocked, degraded, disable, gate-revocation,
  bounded-window, rollback, and sensitive-output tests: PASS, 7 tests.

Completed full local verification on 2026-08-04:

```powershell
npm.cmd run verify
npm.cmd run check:boundaries
npm.cmd run check:sensitive-artifacts
```

- `npm.cmd run verify`: PASS, including 128 test files and 674 tests.
- `npm.cmd run check:boundaries`: PASS.
- `npm.cmd run check:sensitive-artifacts`: PASS.
- `npm.cmd run smoke:desktop`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-env-wiring`: PASS.
- `npm.cmd run smoke:desktop:memory-retrieval-provider-query-vector`: PASS.

The bounded command was not executed, and no real helper, artifact, model
vector, or persistent Memory vector was accessed during this implementation
wave.

## Next Hard Pause

Do not run the bounded command against a real Python runtime/model artifact,
start a real continuous alpha session, broaden tester scope, expose UI/provider
controls, persist model caches, batch-index historical Memory, run SQLite
migrations, expose raw vectors/text/private paths/raw diagnostics, or connect
retrieval/model output to Windows or PowerShell execution without a separate
acceptance approval.
