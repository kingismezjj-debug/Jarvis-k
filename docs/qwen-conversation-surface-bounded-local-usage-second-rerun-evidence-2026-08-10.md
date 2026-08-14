# Qwen Conversation Surface Bounded Local Usage Second Rerun Evidence

Recorded: 2026-08-10

## Status

`CLOSED_PASSED_BOUNDED_LOCAL_USAGE_SECOND_RERUN_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-bounded-local-usage-second-rerun-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured 2026-08-10
Security approval: captured 2026-08-10
Release approval: captured 2026-08-10
```

## Execution Evidence

Only sanitized developer-alpha evidence may be recorded.

```text
degraded rerun closeout reviewed: true
model.status diagnostic/remediation closeout reviewed: true
latest-result diagnostic/remediation closeout reviewed: true
retained dependency environment selected: true
retained approved artifact cache selected: true
approved artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probe count: 1
main-conversation route request count: 5
exactly five route requests completed: true
latest-result route assertions passed: true
model.status fifth route confirmed: true
Qwen selected only inside bounded second rerun session: true
direct action disabled for every route: true
route limit visible: true
route count visible: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
helper shutdown verified: true
rollback/stop state verified: true
deterministic fixture rollback verified: true
post-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
second attempt after route request: false
default-on Qwen routing: false
persistent Qwen routing outside this window: false
release behavior changed: false
```

## Pre-Run Verification

```text
npm.cmd run build -w @jarvis-k/inference-adapter-qwen-router: PASS
npm.cmd run build:ui: PASS
npm.cmd run build:desktop: PASS
node --check tests/qwen-conversation-surface-bounded-local-usage.mjs: PASS
pre-run helper check: NO_HELPER_PROCESS_OBSERVED
```

The UI build emitted the existing Vite chunk-size warning only.

## Runtime Verification

```text
second rerun status: PASS
startup readiness observed: true
retained dependency environment selected: true
retained approved artifact cache selected: true
digest-before-load: passed
helper start count: 1
generation-port readiness probe count: 1
main-conversation route request count: 5
Qwen selected only inside bounded session: true
direct action disabled: true
browser/URL blocked: true
VS Code blocked: true
helper shutdown verified: true
deterministic fixture rollback verified: true
second attempt after route request: false
```

## Boundary Verification

```text
route-count extension changed: false
allowlist expansion: false
provider planner used: false
Memory write/vector retrieval used: false
default-on behavior changed: false
persistent product routing changed: false
telemetry changed: false
installer/update/packaging/release-channel changed: false
production-facing claim changed: false
```
