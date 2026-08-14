# Qwen Conversation Surface Bounded Local Usage Rerun Evidence

Recorded: 2026-08-10

## Status

`DEGRADED_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-bounded-local-usage-rerun-approval-request-2026-08-10.md
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
baseline degraded closeout reviewed: true
diagnostic/remediation closeout reviewed: true
retained dependency environment selected: true
retained approved artifact cache selected: true
digest-before-load: passed before helper start
helper start count: 1
generation-port readiness probe count: 1
main-conversation route requests attempted: 5
main-conversation route requests completed before failure: 4
failure point: fifth sanitized main-conversation route request
expected fifth intent: model.status
observed failure: latest-result route assertion timed out before expected model.status result was confirmed
latest-result route assertions passed before failure: 4
Qwen selected only inside bounded rerun session before failure: true
direct action disabled before failure: true
browser/URL final verification reached: false
VS Code final verification reached: false
Notepad/Calculator allowlist changed: false
helper shutdown/cleanup path executed: true
helper cleanup check: NO_HELPER_PROCESS_OBSERVED
rollback/stop state fully verified: false
second rerun attempted: false
default-on Qwen routing: false
persistent Qwen routing outside this window: false
release behavior changed: false
```

The rerun stopped at the first failure and no second rerun was attempted after
route requests were sent.

## Pre-Run Verification

```text
npm.cmd run build:ui: PASS
npm.cmd run build:desktop: PASS
node --check tests/qwen-conversation-surface-bounded-local-usage.mjs: PASS
pre-run helper check: NO_HELPER_PROCESS_OBSERVED
```

The UI build emitted the existing Vite chunk-size warning only.

## Degraded Classification

The rerun did not complete the approved five-route acceptance sequence. The
degraded point moved from the prior fourth-route `observability.status` timeout
to the fifth-route `model.status` latest-result assertion.

A separate bounded diagnostic/remediation approval is required before changing
route calibration, route assertions, or rerunning the bounded usage session.
