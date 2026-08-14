# Qwen Conversation Surface Product Route Policy Refresh Packet

Recorded: 2026-08-10

## Status

`PREPARED_POLICY_REFRESH_ONLY`

## Scope

This packet refreshes the default-off explicit opt-in product-route enablement
policy using the passed conversation-surface product readiness packet. It is
policy evidence only. It does not implement or execute product route enablement.

## Baseline

```text
conversation-surface readiness packet: prepared
bounded local usage second rerun: passed
existing activation policy: prepared
activation implementation plumbing: existing
UI/IPC runtime control path: existing
Core selection/fallback contracts: existing
Command Router safety gates: existing
active route source by default: intent-router.deterministic.fixture
fallback/rollback route source: intent-router.deterministic.fixture
Qwen product routing by default: false
release/production exposure: false
```

## Refreshed Gates

All gates must pass before a later approved window may select Qwen as the
conversation-surface product route source:

```text
fresh Product/Security/Release approval captured
default-off state verified before opt-in
explicit local developer opt-in captured
retained bounded dependency environment selected
retained approved seven-file Qwen3-0.6B artifact cache selected
digest-before-load passed
supervised helper start within approved count
bounded generation-port readiness passed
Core selection/fallback contract active
Command Router safety gates active
direct action disabled unless separately approved
Browser/URL blocked
VS Code blocked
Notepad/Calculator-only allowlist preserved
deterministic fixture fallback/rollback available
sanitized status projection active
sanitized evidence contract active
rollback/stop path verified
```

Any false gate keeps the active route source at deterministic fixture.

## UI/IPC Status Projection

Required sanitized states for a later implementation/execution window:

```text
disabled: default state; deterministic fixture active
ready: readiness evidence exists; no active runtime route source selected
prepared: explicit opt-in accepted; runtime gates are being checked
armed: runtime gates passed; deterministic fixture remains active until route window starts
active: Qwen selected only inside approved bounded window
fallback: deterministic fixture selected after route/runtime confidence/safety failure
rollback: deterministic fixture restored after stop or manual rollback
blocked: safety/evidence/approval/cleanup invariant failed
```

Required projection fields:

```text
status
activeRouteSource
fallbackRouteSource
explicitOptInRequired
explicitOptInEnabled
helperLifecycle
helperStartCount
generationPortReadinessProbeCount
routeRequestCount
routeRequestLimit
directActionEnabled
browserUrlOpeningEnabled
vsCodeBlocked
allowlistTargets
defaultBehaviorChanged
releaseBehaviorChanged
reasonCodes
```

## Acceptance Criteria

```text
default route source before opt-in is deterministic fixture
Qwen route source appears only after explicit opt-in and all gates pass
route request count stays within the approved bound
direct action remains disabled for every Qwen route
Browser/URL remains blocked
VS Code remains blocked
Notepad/Calculator allowlist remains unchanged
fallback/rollback returns to deterministic fixture
helper shutdown and cleanup are verified
no raw prompt/model/helper/path/token/vector/stack/benchmark evidence recorded
default-on behavior remains false
release behavior remains false
```

## Rollback Criteria

```text
digest-before-load fails
helper startup fails or exceeds approved count
generation-port readiness fails or exceeds approved count
route count exceeds approved bound
Qwen selected before all gates pass
direct action becomes enabled unexpectedly
Browser/URL opening is allowed
VS Code is allowed
allowlist expands beyond Notepad and Calculator
provider planner is invoked
Memory write/vector retrieval is invoked
raw evidence would be recorded
rollback/stop cannot be verified
helper cleanup cannot be verified without separate retention approval
```

## Stop Criteria

```text
stop immediately on any rollback criterion
do not retry after a route request is sent unless separately approved
record degraded evidence on any post-route stop
do not convert degraded evidence to passed evidence through same-window retry
```

## Future Evidence Requirements

```text
approval text captured
baseline readiness packet listed
pre-run helper cleanup check
artifact count and digest-before-load result
dependency/cache selection decision
helper start count
generation-port readiness probe count
route request count and approved limit
Qwen-selected-only-inside-window result
direct-action-disabled result
Browser/URL blocked result
VS Code blocked result
Notepad/Calculator allowlist result
fallback/rollback route source result
helper shutdown and cleanup result
default-on behavior result
persistent routing result
telemetry/release/production-claim result
```

## Decision

```text
policy decision: refreshed
implementation approved: false
product route enablement execution approved: false
Qwen default-on approved: false
persistent product routing approved: false
release exposure approved: false
next approval required: bounded implementation or execution window
```
