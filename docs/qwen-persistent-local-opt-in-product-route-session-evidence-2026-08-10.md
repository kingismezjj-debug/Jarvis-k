# Qwen Persistent Local Opt-In Product Route Session Evidence

Recorded: 2026-08-10

## Status

`PASSED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-persistent-local-opt-in-product-route-session-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured
Security approval: captured
Release approval: captured
```

## Approved Scope

Exact Product, Security, and Release approval was provided for one bounded
developer-alpha persistent local opt-in product route session.

Executed boundary:

```text
developer-alpha local UI/IPC control only: true
explicit local developer opt-in: true
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
sanitized route request count: 3
Qwen active route source inside bounded session: true
deterministic fixture default/fallback/rollback: true
helper shutdown verified: true
rollback/stop state verified: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside bounded session: false
release behavior changed: false
telemetry changed: false
```

## Evidence Fields

Only sanitized developer-alpha evidence may be recorded.

```text
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
sanitized route request count: 3
Qwen active route source inside bounded session: true
deterministic fixture fallback/rollback: true
helper shutdown verified: true
rollback/stop state verified: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside bounded session: false
release behavior changed: false
```

## Verification

Source/schema/status tests:

```text
contracts/desktop/UI focused tests: PASS, 3 files, 64 tests
```

Runtime session:

```text
Qwen persistent local opt-in product route session: PASS
startup visible: true
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
route request count: 3
Qwen active inside bounded session: true
deterministic fixture rollback visible: true
helper shutdown verified: true
browser/URL blocked: true
VS Code blocked: true
```

Pre-start correction:

```text
initial script attempt result: stopped before helper start
reason: UI text assertion was case-sensitive for blocked status
helper started before correction: false
generation-port invoked before correction: false
route request executed before correction: false
correction: made blocked status assertion case-insensitive
rerun result: PASS
```

## Boundary Confirmation

```text
helper started outside approved UI/IPC session: false
helper retained running after stop/rollback: false
generation-port invoked outside approved UI/IPC session: false
route requests exceeded approved count: false
Qwen route source selected before gates passed: false
Qwen route source retained after rollback: false
browser/URL opened by product/runtime: false
VS Code launch allowed: false
allowlist expanded: false
shell/PowerShell/cmd/terminal/script execution by product/runtime: false
arbitrary executable path or command-line arguments by product/runtime: false
credential exposure: false
Memory write/vector retrieval: false
provider planner: false
telemetry expansion: false
installer/update/packaging/release-channel change: false
production-facing claim added: false
```

## Result

```text
decision: PASSED_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: one bounded local explicit opt-in product route session completed with retained dependency/artifact inputs, digest-before-load, one helper, one readiness probe, three sanitized route requests, verified stop/rollback, and blocked browser/VS Code status.
follow-up: any default-on Qwen routing, persistent routing outside bounded local opt-in sessions, broader route counts, release exposure, telemetry, packaging, provider planner, Memory vector retrieval, or allowlist expansion requires a fresh bounded approval.
```
