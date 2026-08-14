# Qwen Conversation Surface Clean Rerun Evidence

Recorded: 2026-08-10

## Status

`PASSED_CLEAN_SINGLE_SEQUENCE_DEVELOPER_ALPHA_EVIDENCE_ONLY`

Related approval request:

```text
docs/qwen-conversation-surface-clean-rerun-approval-request-2026-08-10.md
```

## Approval Capture

```text
Product approval: captured
Security approval: captured
Release approval: captured
```

## Clean Rerun Evidence

Only sanitized developer-alpha evidence may be recorded.

```text
single clean sequence executed: true
rerun attempts after route request sent: 0
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
main-conversation route request count: 3
Qwen selected for exactly three conversation routes: true
direct action disabled for all three routes: true
deterministic fixture fallback/rollback: true
helper shutdown verified: true
rollback/stop state verified: true
browser/URL remains blocked: true
VS Code remains blocked: true
Notepad/Calculator allowlist unchanged: true
default-on Qwen routing: false
persistent Qwen routing outside clean rerun window: false
release behavior changed: false
```

## Verification

Clean rerun:

```text
Qwen conversation-surface local opt-in route acceptance clean rerun: PASS
startup visible: true
retained dependency env selected: true
retained approved artifact cache selected: true
artifact count: 7
digest-before-load: passed
helper start count: 1
generation-port readiness probes: 1
main-conversation route request count: 3
Qwen selected for conversation routes: true
direct action disabled: true
route count visible: true
deterministic fixture rollback: true
helper shutdown verified: true
browser/URL blocked: true
VS Code blocked: true
post-run helper cleanup check: NO_HELPER_PROCESS_OBSERVED
```

Harness pre-route adjustment:

```text
change made before any clean-rerun route request: true
reason: avoid an extra best-effort Stop after a successful Stop/Rollback sequence
route requests sent before adjustment: 0
```

## Boundary Confirmation

```text
second rerun after route request sent: false
default-on Qwen routing: false
Qwen persistent product routing outside bounded window: false
direct action attempted by Qwen route: false
browser/URL opened by product/runtime: false
VS Code launch allowed: false
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
decision: PASSED_CLEAN_SINGLE_SEQUENCE_DEVELOPER_ALPHA_EVIDENCE_ONLY
reason: exactly one clean single-sequence rerun completed with one helper, one readiness probe, exactly three sanitized main-conversation Qwen route requests, direct action disabled, verified stop/rollback, and no observed helper process after cleanup.
follow-up: any persistent/default conversation-surface Qwen routing, broader session duration/counts, release exposure, telemetry, planner, Memory vector retrieval, or allowlist expansion requires a fresh bounded approval.
```
