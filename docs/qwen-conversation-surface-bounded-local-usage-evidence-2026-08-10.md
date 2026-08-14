# Qwen Conversation Surface Bounded Local Usage Evidence

Recorded: 2026-08-10

## Status

`DEGRADED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-bounded-local-usage-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured
Security approval: captured
Release approval: captured
```

## Evidence Fields

Only sanitized developer-alpha evidence may be recorded.

```text
bounded local usage session completed: false
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
main-conversation route request count before stop: 4
Qwen selected only inside bounded local usage session: true before stop
direct action disabled before stop: true
deterministic fixture fallback/rollback: not fully verified
helper shutdown verified: cleanup check only
rollback/stop state verified: false
browser/URL remains blocked: true before stop
VS Code remains blocked: true before stop
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside bounded local usage window: false
release behavior changed: false
```

## Verification

Pre-runtime verification:

```text
build:contracts: PASS
build:desktop: PASS
build:ui: PASS, existing Vite chunk-size warning only
build:core: PASS
focused contracts/desktop/UI tests: PASS, 3 files, 64 tests
```

Runtime attempt:

```text
Qwen conversation-surface bounded local usage: DEGRADED
route request upper bound: 5
route requests attempted before stop: 4
first route expected browser.open: passed
second route expected localApp.open: passed
third route expected localApp.open: passed
fourth route expected observability.status: timeout waiting for expected intent
fifth route attempted: false
rerun attempted after route request sent: false
post-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
```

## Boundary Confirmation

```text
default-on Qwen routing: false
Qwen persistent product routing outside bounded window: false
route request count above approved limit: false
direct action attempted by Qwen route: false before stop
browser/URL opened by product/runtime: false before stop
VS Code launch allowed: false before stop
allowlist expansion: false
provider planner: false
Memory write/vector retrieval: false
credential exposure: false
raw prompt/model output/helper diagnostic/private path/token/URL/vector/stack/benchmark evidence recorded: false
telemetry expansion: false
installer/update/packaging/release-channel change: false
production-facing claim added: false
```

## Result

```text
decision: DEGRADED_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: bounded local usage did not complete because the fourth sanitized main-conversation request did not show the expected observability.status intent before timeout.
follow-up: open a fresh bounded diagnostic/remediation approval window before retrying bounded local usage.
```
